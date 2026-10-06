<?php

namespace App\Services;

use App\Contracts\AccountActivation;
use App\Enums\RoleName;
use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Portal account administration: create accounts, change status, assign roles. Every rule that protects the system lives
 * here, on the server:
 *   - an administrator cannot change their OWN status or roles (no self-lockout, no self-escalation);
 *   - the last ACTIVE administrator can never be disabled or lose the admin role;
 *   - roles come from the fixed RoleName list (no arbitrary role strings);
 *   - the HR-owned facts (kept on the directory entry) (name, department, title, manager) are not stored here and cannot be edited.
 * Each change is audited in the same transaction.
 */
final class UserAdminService
{
    public function __construct(private readonly AccountActivation $activation) {}

    /** @param  array{employee_id: string, email: string, role: string, status: string}  $data */
    public function create(User $actor, array $data): User
    {
        $user = DB::transaction(function () use ($actor, $data) {
            $user = new User(['email' => strtolower($data['email'])]);
            // Mass-assignment safe: identity, status and password are set explicitly. The password is random and never shown
            // or stored anywhere else, so the account cannot be signed into until an activation step sets a real one.
            $user->forceFill([
                'employee_id' => $data['employee_id'],
                'status' => $data['status'],
                'password' => Hash::make(Str::random(64)),
                'is_sample' => false,
            ])->save();
            $user->roles()->sync([$this->role($data['role'])->getKey()]);
            Audit::record($actor, 'USER_CREATED', 'users', $user, $user->employee_id, 'success', ['status' => $data['status'], 'role' => $data['role']]);

            return $user;
        });
        $this->activation->accountCreated($user);

        return $user->load('roles');
    }

    /**
     * HR marked the employee Inactive: disable the login now and end every session. The status the account had is remembered so
     * `reinstate()` can restore it. Accounts that are not active/pending (already disabled by an administrator) are left alone.
     * Refused for your own account, and for the last active administrator (nobody could administer the portal afterwards).
     */
    public function offboard(User $actor, User $target): User
    {
        if (! in_array($target->status, [UserStatus::Active, UserStatus::Pending], true)) {
            return $target;
        }
        if ($actor->is($target)) {
            $this->fail('employment_status', 'You cannot make your own record inactive: that would disable your own login. Ask another administrator.');
        }
        $this->assertNotLastAdmin($target, 'made inactive', 'employment_status');

        DB::transaction(function () use ($actor, $target) {
            $from = $target->status->value;
            $target->forceFill(['status' => UserStatus::Inactive->value, 'offboarded_from_status' => $from, 'remember_token' => null])->save();
            DB::table('sessions')->where('user_id', $target->getKey())->delete();
            \App\Models\PasswordLink::query()->where('user_id', $target->getKey())->delete();
            Audit::record($actor, 'USER_OFFBOARDED', 'users', $target, $target->employee_id, 'success', ['status_from' => $from, 'via' => 'employment status']);
        });

        return $target->refresh();
    }

    /** The employee is back: restore the status the login had before it was disabled automatically (and only that case). */
    public function reinstate(User $actor, User $target): User
    {
        if ($target->offboarded_from_status === null || $target->status !== UserStatus::Inactive) {
            return $target;
        }
        DB::transaction(function () use ($actor, $target) {
            $to = $target->offboarded_from_status === UserStatus::Pending->value ? UserStatus::Pending->value : UserStatus::Active->value;
            $target->forceFill(['status' => $to, 'offboarded_from_status' => null])->save();
            Audit::record($actor, 'USER_REINSTATED', 'users', $target, $target->employee_id, 'success', ['status_to' => $to, 'via' => 'employment status']);
        });

        return $target->refresh();
    }

    /** @param  array{email?: string}  $data */
    public function updateEmail(User $actor, User $target, array $data): User
    {
        if (isset($data['email']) && strtolower($data['email']) !== $target->email) {
            DB::transaction(function () use ($actor, $target, $data) {
                $target->forceFill(['email' => strtolower($data['email'])])->save();
                Audit::record($actor, 'USER_UPDATED', 'users', $target, $target->employee_id, 'success', ['field' => 'email']);
            });
        }

        return $target->load('roles');
    }

    public function setStatus(User $actor, User $target, UserStatus $status): User
    {
        $this->assertNotSelf($actor, $target, 'status');
        if ($status !== UserStatus::Active) {
            $this->assertNotLastAdmin($target, 'disabled');
        }
        if ($target->status !== $status) {
            $from = $target->status->value;
            DB::transaction(function () use ($actor, $target, $status, $from) {
                $target->forceFill(['status' => $status->value, 'offboarded_from_status' => null])->save();
                Audit::record($actor, $status === UserStatus::Active ? 'USER_UPDATED' : 'USER_DISABLED', 'users', $target, $target->employee_id, 'success', ['status_from' => $from, 'status_to' => $status->value]);
                if ($status !== UserStatus::Active) {
                    // End any sessions the account has: a disabled account must stop working immediately.
                    DB::table('sessions')->where('user_id', $target->getKey())->delete();
                }
            });
        }

        return $target->load('roles');
    }

    public function addRole(User $actor, User $target, string $roleName): User
    {
        $this->assertNotSelf($actor, $target, 'roles');
        $role = $this->role($roleName);
        if (! $target->roles()->whereKey($role->getKey())->exists()) {
            DB::transaction(function () use ($actor, $target, $role) {
                $target->roles()->attach($role->getKey());
                Audit::record($actor, 'ROLE_ASSIGNED', 'users', $target, $target->employee_id, 'success', ['role' => $role->name]);
            });
        }

        return $target->load('roles');
    }

    public function removeRole(User $actor, User $target, string $roleName): User
    {
        $this->assertNotSelf($actor, $target, 'roles');
        $role = $this->role($roleName);
        if (! $target->roles()->whereKey($role->getKey())->exists()) {
            return $target->load('roles');
        }
        if ($role->name === RoleName::Admin->value) {
            $this->assertNotLastAdmin($target, 'stripped of the administrator role');
        }
        if ($target->roles()->count() === 1) {
            $this->fail('roles', 'A user must keep at least one role. Assign another role first (employee is the baseline).');
        }
        DB::transaction(function () use ($actor, $target, $role) {
            $target->roles()->detach($role->getKey());
            Audit::record($actor, 'ROLE_REMOVED', 'users', $target, $target->employee_id, 'success', ['role' => $role->name]);
        });

        return $target->load('roles');
    }

    /**
     * Replace the extra permissions granted to one person. Only permissions from the grantable list are accepted (never the
     * administration powers), and nobody can change their own access.
     *
     * @param  list<string>  $permissions
     */
    public function setAccess(User $actor, User $target, array $permissions): User
    {
        $this->assertNotSelf($actor, $target, 'permissions');
        $wanted = array_values(array_unique($permissions));
        if (array_diff($wanted, \App\Authorization\RolePermissions::grantable()) !== []) {
            $this->fail('permissions', 'One of the selected permissions cannot be granted to an individual.');
        }
        $current = $target->grantedPermissions()->pluck('permission')->all();
        $added = array_values(array_diff($wanted, $current));
        $removed = array_values(array_diff($current, $wanted));
        if ($added || $removed) {
            DB::transaction(function () use ($actor, $target, $added, $removed) {
                $target->grantedPermissions()->whereIn('permission', $removed)->delete();
                foreach ($added as $permission) {
                    $target->grantedPermissions()->create(['permission' => $permission, 'granted_by' => $actor->getKey()]);
                }
                Audit::record($actor, 'ACCESS_UPDATED', 'users', $target, $target->employee_id, 'success', ['granted' => $added, 'revoked' => $removed]);
            });
        }

        return $target->unsetRelation('grantedPermissions')->load('roles', 'grantedPermissions');
    }

    private function role(string $name): Role
    {
        return Role::query()->where('name', $name)->firstOrFail();
    }

    private function assertNotSelf(User $actor, User $target, string $field): void
    {
        if ($actor->is($target)) {
            $this->fail($field, 'You cannot change your own roles or account status. Ask another administrator.');
        }
    }

    /** The last active administrator must always remain: otherwise nobody could administer the portal. */
    private function assertNotLastAdmin(User $target, string $verb, string $field = 'status'): void
    {
        $isActiveAdmin = $target->isActive() && $target->roles()->where('name', RoleName::Admin->value)->exists();
        if (! $isActiveAdmin) {
            return;
        }
        $others = User::query()->where('status', UserStatus::Active->value)->whereKeyNot($target->getKey())
            ->whereHas('roles', fn ($q) => $q->where('name', RoleName::Admin->value))->count();
        if ($others === 0) {
            $this->fail($field, "This is the last active administrator and cannot be {$verb}.");
        }
    }

    private function fail(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => [$message]]);
    }
}
