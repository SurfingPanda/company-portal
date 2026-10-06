<?php

namespace Tests\Feature\Api;

use App\Models\AuditLog;
use App\Models\CompanyHistoryEntry;
use App\Models\CompanyLocation;
use App\Models\CompanyPage;
use App\Models\Department;
use App\Models\DirectoryEntry;
use App\Models\LeadershipProfile;
use App\Models\User;

/** Phase 31: HR management of the directory and company content, and what employees see of it. */
class HrManagementApiTest extends ApiTestCase
{
    private function hr(): User
    {
        $user = $this->makeUser('hr');
        $this->actingAs($user);

        return $user;
    }

    private function department(string $name = 'Finance', string $status = 'published'): Department
    {
        return Department::query()->forceCreate(['name' => $name, 'status' => $status]);
    }

    private function entry(array $attributes = []): DirectoryEntry
    {
        static $n = 0;
        $n++;

        return DirectoryEntry::query()->forceCreate([
            'employee_id' => 'EMP-'.str_pad((string) (5000 + $n), 4, '0', STR_PAD_LEFT), 'display_name' => "Sample Person {$n}", 'is_visible' => true, 'source' => 'manual', 'verification' => 'unverified', ...$attributes,
        ]);
    }

    // --- Authorization ----------------------------------------------------------------------------------------------------

    public function test_only_hr_and_admin_reach_hr_management_endpoints(): void
    {
        $paths = ['dashboard', 'employees', 'departments', 'company', 'company/history', 'company/leadership', 'company/locations', 'employees/unlinked-users'];

        foreach ($paths as $path) {
            $this->getJson("/api/admin/hr/{$path}")->assertStatus(401);
        }
        foreach (['employee', 'manager', 'it'] as $role) {
            $this->actingAs($this->makeUser($role));
            foreach ($paths as $path) {
                $this->getJson("/api/admin/hr/{$path}")->assertStatus(403);
            }
            $this->postJson('/api/admin/hr/employees', ['employee_id' => 'EMP-9001', 'display_name' => 'X'])->assertStatus(403);
            $this->postJson('/api/admin/hr/departments', ['name' => 'X'])->assertStatus(403);
            $this->putJson('/api/admin/hr/company', ['mission' => 'x'])->assertStatus(403);
            $this->patchJson('/api/admin/hr/employees/1/visibility', ['is_visible' => false])->assertStatus(403);
        }
        foreach (['hr', 'admin'] as $role) {
            $this->actingAs($this->makeUser($role));
            foreach ($paths as $path) {
                $this->getJson("/api/admin/hr/{$path}")->assertOk();
            }
        }
        // HR stays out of the user-management and system areas.
        $this->actingAs($this->makeUser('hr'));
        $this->getJson('/api/admin/users')->assertStatus(403);
        $this->getJson('/api/admin/settings')->assertStatus(403);
    }

    public function test_without_the_publish_permission_only_drafts_can_be_worked_on(): void
    {
        $guard = new class extends \App\Http\Controllers\Api\Admin\Hr\AdminHistoryController
        {
            public function check(\Illuminate\Http\Request $request, ?\Illuminate\Database\Eloquent\Model $model, array $data): void
            {
                $this->guardPublication($request, $model, $data);
            }
        };
        $editor = new class extends User
        {
            public function hasPermission(string $permission): bool
            {
                return $permission === 'hr.company.manage';
            }
        };
        $request = \Illuminate\Http\Request::create('/x', 'PUT');
        $request->setUserResolver(fn () => $editor);
        $draft = new CompanyHistoryEntry(['title' => 'x']);
        $draft->status = 'draft';
        $live = new CompanyHistoryEntry(['title' => 'y']);
        $live->status = 'published';

        $guard->check($request, null, ['title' => 'new draft']);                    // may create drafts
        $guard->check($request, $draft, ['status' => 'draft']);                    // may edit drafts
        foreach ([[null, ['status' => 'published']], [$draft, ['status' => 'published']], [$draft, ['status' => 'archived']], [$live, ['title' => 'tweak']], [$live, ['status' => 'draft']]] as [$model, $data]) {
            try {
                $guard->check($request, $model, $data);
                $this->fail('a user without hr.company.publish changed live content or published');
            } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
                $this->assertSame(403, $e->getStatusCode());
            }
        }
    }

    // --- Directory ---------------------------------------------------------------------------------------------------------

    public function test_hr_creates_a_manual_unverified_hidden_directory_entry(): void
    {
        $hr = $this->hr();
        $dept = $this->department();
        $location = CompanyLocation::query()->forceCreate(['name' => 'Sample Office A', 'status' => 'published']);

        $response = $this->postJson('/api/admin/hr/employees', [
            'employee_id' => 'EMP-9100', 'display_name' => 'Sample Person', 'job_title' => 'Analyst', 'department_id' => $dept->id, 'location_id' => $location->id,
            'company_email' => 'Sample.Person@Eljin.example', 'phone' => '+63 2 000 0000', 'description' => 'Sample description.',
        ])->assertCreated();

        $response->assertJsonPath('data.employee_id', 'EMP-9100')
            ->assertJsonPath('data.is_visible', false)->assertJsonPath('data.company_email', 'sample.person@eljin.example')
            ->assertJsonPath('data.preview.department', 'Finance')->assertJsonPath('data.account.linked', true)->assertJsonPath('data.account.status', 'pending');
        $this->assertDatabaseHas('audit_logs', ['action' => 'DIRECTORY_ENTRY_CREATED', 'actor_user_id' => $hr->id, 'target_label' => 'EMP-9100 Sample Person']);
    }

    public function test_directory_validation_duplicates_and_forbidden_fields(): void
    {
        $this->hr();
        $this->entry(['employee_id' => 'EMP-9200', 'company_email' => 'taken@eljin.example']);
        $ok = ['employee_id' => 'EMP-9201', 'display_name' => 'Someone', 'company_email' => 'someone@eljin.example'];

        $this->postJson('/api/admin/hr/employees', [...$ok, 'employee_id' => 'EMP-9200'])->assertStatus(422)->assertJsonValidationErrors('employee_id');
        $this->postJson('/api/admin/hr/employees', [...$ok, 'company_email' => 'taken@eljin.example'])->assertStatus(422)->assertJsonValidationErrors('company_email');
        $this->postJson('/api/admin/hr/employees', [])->assertStatus(422)->assertJsonValidationErrors(['employee_id', 'display_name']);
        $this->postJson('/api/admin/hr/employees', [...$ok, 'company_email' => 'bad'])->assertStatus(422);
        $this->postJson('/api/admin/hr/employees', [...$ok, 'department_id' => 9999])->assertStatus(422)->assertJsonValidationErrors('department_id');
        $this->postJson('/api/admin/hr/employees', [...$ok, 'display_name' => str_repeat('a', 121)])->assertStatus(422);
        // System-managed fields are refused outright, not silently stored.
        foreach (['source' => 'hris-sync', 'verification' => 'verified', 'official_name' => 'Legal Name', 'user_id' => 1] as $field => $value) {
            $this->postJson('/api/admin/hr/employees', [...$ok, $field => $value])->assertStatus(422)->assertJsonValidationErrors($field);
        }
        // Private data has no field at all, so it is ignored.
        $this->postJson('/api/admin/hr/employees', [...$ok, 'personal_email' => 'me@gmail.test', 'salary' => 5, 'mobile' => '0999'])->assertCreated();
        $entry = DirectoryEntry::where('employee_id', 'EMP-9201')->firstOrFail();
        $this->assertArrayNotHasKey('salary', $entry->getAttributes());
        $this->assertSame(1, DirectoryEntry::where('employee_id', 'EMP-9201')->count());
    }

    public function test_portal_managed_fields_are_editable_and_the_employee_id_is_fixed(): void
    {
        $this->hr();
        $entry = $this->entry(['employee_id' => 'EMP-9300', 'display_name' => 'Old Name']);
        $location = CompanyLocation::query()->forceCreate(['name' => 'Branch X', 'status' => 'published']);

        $this->putJson("/api/admin/hr/employees/{$entry->id}", ['display_name' => 'New Name', 'job_title' => 'Lead', 'phone' => '1234', 'description' => 'Hi', 'location_id' => $location->id])->assertOk()
            ->assertJsonPath('data.display_name', 'New Name')->assertJsonPath('data.job_title', 'Lead');
        $this->putJson("/api/admin/hr/employees/{$entry->id}", ['employee_id' => 'EMP-0000'])->assertStatus(422)->assertJsonValidationErrors('employee_id');
        $this->assertSame('EMP-9300', $entry->fresh()->employee_id);
        $this->putJson('/api/admin/hr/employees/99999', ['display_name' => 'x'])->assertStatus(404);
        $this->assertDatabaseHas('audit_logs', ['action' => 'DIRECTORY_ENTRY_UPDATED']);
    }

    public function test_hr_can_edit_job_title_department_and_email_of_an_existing_entry(): void
    {
        $this->hr();
        $dept = $this->department('Operations');
        $other = $this->department('Other');
        $entry = $this->entry(['employee_id' => 'EMP-9400', 'display_name' => 'Some Person', 'job_title' => 'Old Title', 'department_id' => $dept->id, 'company_email' => 'old@eljin.example']);

        $this->putJson("/api/admin/hr/employees/{$entry->id}", ['job_title' => 'New Title', 'department_id' => $other->id, 'company_email' => 'new@eljin.example'])->assertOk()
            ->assertJsonPath('data.job_title', 'New Title')->assertJsonPath('data.department_id', $other->id)->assertJsonPath('data.company_email', 'new@eljin.example');

        // System-managed fields still cannot be sent.
        foreach (['official_name' => 'x', 'source' => 'y', 'verification' => 'verified'] as $field => $value) {
            $this->putJson("/api/admin/hr/employees/{$entry->id}", [$field => $value])->assertStatus(422)->assertJsonValidationErrors($field);
        }
    }

    public function test_employment_fields_are_saved_validated_and_shown_to_the_employee(): void
    {
        $this->hr();
        $boss = $this->entry(['employee_id' => 'EMP-9500', 'display_name' => 'The Boss']);

        $this->postJson('/api/admin/hr/employees', [
            'employee_id' => 'EMP-9501', 'display_name' => 'New Hire', 'company_email' => 'new.hire@eljin.example', 'employment_status' => 'on_leave', 'employment_type' => 'probationary',
            'date_joined' => '2025-03-17', 'manager_id' => $boss->id,
        ])->assertCreated()->assertJsonPath('data.employment_status', 'on_leave')->assertJsonPath('data.employment_type', 'probationary')
            ->assertJsonPath('data.date_joined', '2025-03-17')->assertJsonPath('data.manager_id', $boss->id)->assertJsonPath('data.manager', 'The Boss');

        $ok = ['employee_id' => 'EMP-9502', 'display_name' => 'Someone', 'company_email' => 'someone.else@eljin.example'];
        $this->postJson('/api/admin/hr/employees', $ok)->assertCreated()->assertJsonPath('data.employment_status', 'active');
        foreach ([['employment_status' => 'retired'], ['employment_type' => 'volunteer'], ['date_joined' => '17/03/2025'], ['date_joined' => '2999-01-01'], ['manager_id' => 99999]] as $bad) {
            $this->postJson('/api/admin/hr/employees', [...$ok, 'employee_id' => 'EMP-9503', 'company_email' => 'bad.case@eljin.example', ...$bad])->assertStatus(422);
        }
    }

    public function test_creating_an_entry_creates_the_login_with_the_email_and_sends_the_password_link(): void
    {
        \Illuminate\Support\Facades\Mail::fake();
        $hr = $this->hr();

        $this->postJson('/api/admin/hr/employees', ['employee_id' => 'EMP-9800', 'display_name' => 'Fresh Hire', 'company_email' => 'Fresh.Hire@Eljin.example'])
            ->assertCreated()->assertJsonPath('data.account.linked', true)->assertJsonPath('data.account.status', 'pending');

        $user = User::where('employee_id', 'EMP-9800')->firstOrFail();
        $this->assertSame('fresh.hire@eljin.example', $user->email, 'the company email is the login');
        $this->assertSame(['employee'], $user->roleNames(), 'HR cannot hand out other roles from here');
        $this->assertSame($user->id, DirectoryEntry::where('employee_id', 'EMP-9800')->value('user_id'));
        $this->assertDatabaseHas('audit_logs', ['action' => 'USER_CREATED', 'actor_user_id' => $hr->id]);
        \Illuminate\Support\Facades\Mail::assertSent(\App\Mail\PasswordLinkMail::class, fn ($m) => $m->hasTo('fresh.hire@eljin.example') && $m->purpose === 'activation');

        // The employee can now ask for the link from the sign-in page, and choosing a password activates the account.
        $this->assertTrue(app(\App\Services\PasswordLinks::class)->send($user->fresh()));
    }

    public function test_the_login_email_must_be_free_and_follows_the_entry(): void
    {
        \Illuminate\Support\Facades\Mail::fake();
        $this->hr();
        $existing = $this->makeUser('employee', ['email' => 'taken@eljin.example']);

        $this->postJson('/api/admin/hr/employees', ['employee_id' => 'EMP-9810', 'display_name' => 'Clash', 'company_email' => $existing->email])
            ->assertStatus(422)->assertJsonValidationErrors('company_email');
        $this->assertDatabaseMissing('directory_entries', ['employee_id' => 'EMP-9810']);
        $this->postJson('/api/admin/hr/employees', ['employee_id' => 'EMP-9811', 'display_name' => 'No Email'])->assertStatus(422)->assertJsonValidationErrors('company_email');

        $id = $this->postJson('/api/admin/hr/employees', ['employee_id' => 'EMP-9812', 'display_name' => 'Mover', 'company_email' => 'mover@eljin.example'])->assertCreated()->json('data.id');
        $this->putJson("/api/admin/hr/employees/{$id}", ['company_email' => 'mover.new@eljin.example'])->assertOk();
        $this->assertSame('mover.new@eljin.example', User::where('employee_id', 'EMP-9812')->value('email'), 'changing the entry email changes the login');
        $this->putJson("/api/admin/hr/employees/{$id}", ['company_email' => $existing->email])->assertStatus(422)->assertJsonValidationErrors('company_email');
        $this->putJson("/api/admin/hr/employees/{$id}", ['company_email' => null])->assertStatus(422);
    }

    public function test_a_new_employee_sets_their_own_password_from_the_emailed_link(): void
    {
        \Illuminate\Support\Facades\Mail::fake();
        $this->hr();
        $this->postJson('/api/admin/hr/employees', ['employee_id' => 'EMP-9820', 'display_name' => 'Newcomer', 'company_email' => 'newcomer@eljin.example'])->assertCreated();

        $url = null;
        \Illuminate\Support\Facades\Mail::assertSent(\App\Mail\PasswordLinkMail::class, function ($m) use (&$url) {
            $url = $m->url;

            return true;
        });
        auth()->guard('web')->logout();
        $token = substr($url, strpos($url, 'token=') + 6);

        $this->postJson('/api/auth/login', ['identifier' => 'newcomer@eljin.example', 'password' => 'whatever-123456'])->assertStatus(401);
        $this->postJson('/api/auth/set-password', ['token' => $token, 'password' => 'My-own-password-1', 'password_confirmation' => 'My-own-password-1'])->assertOk();
        $this->postJson('/api/auth/login', ['identifier' => 'newcomer@eljin.example', 'password' => 'My-own-password-1'])->assertOk()->assertJsonPath('data.email', 'newcomer@eljin.example');
    }

    public function test_bulk_create_logins_handles_every_unlinked_entry_and_reports_skips(): void
    {
        \Illuminate\Support\Facades\Mail::fake();
        $hr = $this->hr();
        $this->entry(['employee_id' => 'EMP-9900', 'company_email' => 'one@eljin.example']);
        $this->entry(['employee_id' => 'EMP-9901', 'company_email' => 'two@eljin.example']);
        $this->entry(['employee_id' => 'EMP-9902']); // no email
        $this->entry(['employee_id' => 'EMP-9903', 'company_email' => 'clash@eljin.example']);
        $this->makeUser('employee', ['employee_id' => 'EMP-0099', 'email' => 'clash@eljin.example']); // email owned by someone else
        $existing = $this->makeUser('employee', ['employee_id' => 'EMP-9904', 'email' => 'three@eljin.example']);
        $this->entry(['employee_id' => 'EMP-9904', 'company_email' => 'three@eljin.example']); // account exists: gets linked
        $already = $this->entry(['employee_id' => 'EMP-9905', 'company_email' => 'four@eljin.example', 'user_id' => $this->makeUser('employee')->id]);

        $result = $this->postJson('/api/admin/hr/employees/create-logins')->assertOk()->json('data');

        $this->assertSame([2, 1, false], [$result['created'], $result['linked'], $result['more_remaining']]);
        $this->assertEqualsCanonicalizing(['EMP-9902' => 'No company email', 'EMP-9903' => 'Another account already uses this email'], collect($result['skipped'])->pluck('reason', 'employee_id')->all());
        $this->assertSame('pending', User::where('employee_id', 'EMP-9900')->firstOrFail()->status->value);
        $this->assertSame(['employee'], User::where('employee_id', 'EMP-9901')->firstOrFail()->roleNames());
        $this->assertSame($existing->id, DirectoryEntry::where('employee_id', 'EMP-9904')->value('user_id'));
        $this->assertNotNull(DirectoryEntry::where('employee_id', 'EMP-9900')->value('user_id'));
        \Illuminate\Support\Facades\Mail::assertSent(\App\Mail\PasswordLinkMail::class, 2);
        $this->assertDatabaseHas('audit_logs', ['action' => 'DIRECTORY_LOGINS_CREATED', 'actor_user_id' => $hr->id]);

        // Running it again changes nothing.
        $again = $this->postJson('/api/admin/hr/employees/create-logins')->assertOk()->json('data');
        $this->assertSame([0, 0, 2], [$again['created'], $again['linked'], count($again['skipped'])]);
        $this->assertNotNull($already->fresh()->user_id);
    }

    public function test_bulk_create_logins_needs_the_directory_manage_permission(): void
    {
        $this->actingAs($this->makeUser('employee'));
        $this->postJson('/api/admin/hr/employees/create-logins')->assertStatus(403);
    }

    public function test_hr_picks_regular_employee_or_manager_for_the_new_login_and_nothing_higher(): void
    {
        \Illuminate\Support\Facades\Mail::fake();
        $this->hr();
        $base = ['display_name' => 'Role Test'];

        $this->postJson('/api/admin/hr/employees', [...$base, 'employee_id' => 'EMP-9830', 'company_email' => 'mgr@eljin.example', 'role' => 'manager'])
            ->assertCreated()->assertJsonPath('data.role', 'manager')->assertJsonPath('data.role_locked', false);
        $this->assertSame(['manager'], User::where('employee_id', 'EMP-9830')->firstOrFail()->roleNames());

        $this->postJson('/api/admin/hr/employees', [...$base, 'employee_id' => 'EMP-9831', 'company_email' => 'reg@eljin.example'])->assertCreated()->assertJsonPath('data.role', 'employee');
        foreach (['admin', 'hr', 'it', 'superuser'] as $role) {
            $this->postJson('/api/admin/hr/employees', [...$base, 'employee_id' => 'EMP-9832', 'company_email' => 'bad@eljin.example', 'role' => $role])->assertStatus(422)->assertJsonValidationErrors('role');
        }
        $this->assertDatabaseMissing('users', ['employee_id' => 'EMP-9832']);
    }

    public function test_hr_can_switch_a_linked_account_between_employee_and_manager_but_not_higher_roles_or_itself(): void
    {
        \Illuminate\Support\Facades\Mail::fake();
        $hr = $this->hr();
        $id = $this->postJson('/api/admin/hr/employees', ['employee_id' => 'EMP-9840', 'display_name' => 'Switcher', 'company_email' => 'switch@eljin.example'])->assertCreated()->json('data.id');
        $user = User::where('employee_id', 'EMP-9840')->firstOrFail();

        $this->putJson("/api/admin/hr/employees/{$id}", ['role' => 'manager'])->assertOk()->assertJsonPath('data.role', 'manager');
        $this->assertSame(['manager'], $user->fresh()->roleNames());
        $this->assertDatabaseHas('audit_logs', ['action' => 'ROLE_ASSIGNED', 'actor_user_id' => $hr->id, 'target_label' => 'EMP-9840']);
        $this->putJson("/api/admin/hr/employees/{$id}", ['role' => 'employee'])->assertOk()->assertJsonPath('data.role', 'employee');
        $this->putJson("/api/admin/hr/employees/{$id}", ['role' => 'admin'])->assertStatus(422)->assertJsonValidationErrors('role');
        $this->assertSame(['employee'], $user->fresh()->roleNames());

        // Someone with department or administrator access is out of HR's reach.
        foreach (['it', 'admin'] as $high) {
            $other = $this->makeUser($high);
            $entry = $this->entry(['employee_id' => $other->employee_id, 'user_id' => $other->id]);
            $this->putJson("/api/admin/hr/employees/{$entry->id}", ['role' => 'employee'])->assertStatus(422)->assertJsonValidationErrors('role');
            $this->assertSame([$high], $other->fresh()->roleNames());
            $this->getJson("/api/admin/hr/employees/{$entry->id}")->assertJsonPath('data.role_locked', true)->assertJsonPath('data.role', null);
        }

        // HR cannot change its own role from here.
        $mine = $this->entry(['employee_id' => $hr->employee_id, 'user_id' => $hr->id]);
        $this->putJson("/api/admin/hr/employees/{$mine->id}", ['role' => 'employee'])->assertStatus(422)->assertJsonValidationErrors('role');
        $this->assertSame(['hr'], $hr->fresh()->roleNames());
    }

    private function linkedEntry(string $role = 'employee', array $userAttributes = []): array
    {
        $user = $this->makeUser($role, $userAttributes);
        $entry = $this->entry(['employee_id' => $user->employee_id, 'user_id' => $user->id, 'company_email' => $user->email]);

        return [$user, $entry];
    }

    public function test_marking_an_employee_inactive_disables_the_login_at_once_and_active_again_restores_it(): void
    {
        $hr = $this->hr();
        [$user, $entry] = $this->linkedEntry('employee', ['remember_token' => 'abc']);
        \Illuminate\Support\Facades\DB::table('sessions')->insert(['id' => 'sess1', 'user_id' => $user->id, 'ip_address' => '127.0.0.1', 'user_agent' => 'x', 'payload' => '', 'last_activity' => time()]);

        $this->putJson("/api/admin/hr/employees/{$entry->id}", ['employment_status' => 'inactive'])->assertOk()
            ->assertJsonPath('data.employment_status', 'inactive')->assertJsonPath('data.account.status', 'inactive')->assertJsonPath('data.login_disabled_by_hr', true);
        $fresh = $user->fresh();
        $this->assertSame('inactive', $fresh->status->value);
        $this->assertNull($fresh->remember_token);
        $this->assertSame(0, \Illuminate\Support\Facades\DB::table('sessions')->where('user_id', $user->id)->count(), 'every session ends immediately');
        $this->assertDatabaseHas('audit_logs', ['action' => 'USER_OFFBOARDED', 'actor_user_id' => $hr->id, 'target_label' => $user->employee_id]);

        // They can no longer sign in, even with the right password.
        auth()->guard('web')->logout();
        $this->postJson('/api/auth/login', ['identifier' => $user->email, 'password' => 'DemoOnly123!'])->assertStatus(403);

        // They return: the login comes back exactly as it was.
        $this->actingAs($hr);
        $this->putJson("/api/admin/hr/employees/{$entry->id}", ['employment_status' => 'on_leave'])->assertOk()->assertJsonPath('data.login_disabled_by_hr', false);
        $this->assertSame('active', $user->fresh()->status->value);
        $this->assertNull($user->fresh()->offboarded_from_status);
        $this->assertDatabaseHas('audit_logs', ['action' => 'USER_REINSTATED', 'target_label' => $user->employee_id]);
        auth()->guard('web')->logout();
        $this->postJson('/api/auth/login', ['identifier' => $user->email, 'password' => 'DemoOnly123!'])->assertOk();
    }

    public function test_a_pending_login_goes_back_to_pending_and_its_codes_stop_working_while_inactive(): void
    {
        \Illuminate\Support\Facades\Mail::fake();
        $this->hr();
        [$user, $entry] = $this->linkedEntry('employee', ['status' => \App\Enums\UserStatus::Pending, 'onboarded_at' => null]);
        app(\App\Services\PasswordLinks::class)->sendFirstSignInCode($user);
        $this->assertSame(1, \App\Models\PasswordLink::where('user_id', $user->id)->count());

        $this->putJson("/api/admin/hr/employees/{$entry->id}", ['employment_status' => 'inactive'])->assertOk();
        $this->assertSame('inactive', $user->fresh()->status->value);
        $this->assertSame(0, \App\Models\PasswordLink::where('user_id', $user->id)->count(), 'outstanding codes and links are destroyed');
        $this->assertFalse(app(\App\Services\PasswordLinks::class)->sendFirstSignInCode($user->fresh()));
        $this->postJson('/api/auth/identify', ['identifier' => $user->email])->assertJsonPath('data.step', 'password');

        $this->putJson("/api/admin/hr/employees/{$entry->id}", ['employment_status' => 'active'])->assertOk();
        $this->assertSame('pending', $user->fresh()->status->value);
        $this->postJson('/api/auth/identify', ['identifier' => $user->email])->assertJsonPath('data.step', 'setup');
    }

    public function test_hr_never_re_enables_an_account_an_administrator_disabled(): void
    {
        $this->hr();
        [$suspended, $entry] = $this->linkedEntry('employee', ['status' => \App\Enums\UserStatus::Suspended]);

        $this->putJson("/api/admin/hr/employees/{$entry->id}", ['employment_status' => 'inactive'])->assertOk()->assertJsonPath('data.login_disabled_by_hr', false);
        $this->assertSame('suspended', $suspended->fresh()->status->value, 'an account an administrator suspended is left alone');
        $this->putJson("/api/admin/hr/employees/{$entry->id}", ['employment_status' => 'active'])->assertOk();
        $this->assertSame('suspended', $suspended->fresh()->status->value);

        // If an administrator takes over an automatically disabled account, HR no longer controls it.
        [$user, $other] = $this->linkedEntry();
        $this->putJson("/api/admin/hr/employees/{$other->id}", ['employment_status' => 'inactive'])->assertOk();
        $admin = $this->makeUser('admin');
        $this->actingAs($admin);
        $this->patchJson("/api/admin/users/{$user->id}/status", ['status' => 'suspended'])->assertOk();
        $this->assertNull($user->fresh()->offboarded_from_status);
        $this->actingAs($this->makeUser('hr'));
        $this->putJson("/api/admin/hr/employees/{$other->id}", ['employment_status' => 'active'])->assertOk();
        $this->assertSame('suspended', $user->fresh()->status->value);
    }

    public function test_offboarding_cannot_lock_out_the_last_administrator_or_the_person_doing_it(): void
    {
        $hr = $this->hr();
        [$admin, $adminEntry] = $this->linkedEntry('admin');
        $this->putJson("/api/admin/hr/employees/{$adminEntry->id}", ['employment_status' => 'inactive'])->assertStatus(422)->assertJsonValidationErrors('employment_status');
        $this->assertSame('active', $admin->fresh()->status->value);
        $this->assertSame('active', $adminEntry->fresh()->employment_status, 'the whole change is rolled back');

        $this->makeUser('admin'); // a second administrator exists, so this one may now leave
        $this->putJson("/api/admin/hr/employees/{$adminEntry->id}", ['employment_status' => 'inactive'])->assertOk();
        $this->assertSame('inactive', $admin->fresh()->status->value);

        $mine = $this->entry(['employee_id' => $hr->employee_id, 'user_id' => $hr->id, 'company_email' => $hr->email]);
        $this->putJson("/api/admin/hr/employees/{$mine->id}", ['employment_status' => 'inactive'])->assertStatus(422)->assertJsonValidationErrors('employment_status');
        $this->assertSame('active', $hr->fresh()->status->value);
    }

    public function test_inactive_employees_get_no_login_from_create_link_bulk_or_import(): void
    {
        \Illuminate\Support\Facades\Mail::fake();
        $this->hr();

        $this->postJson('/api/admin/hr/employees', ['employee_id' => 'EMP-9950', 'display_name' => 'Already Gone', 'company_email' => 'gone@eljin.example', 'employment_status' => 'inactive'])
            ->assertCreated()->assertJsonPath('data.account.linked', false);
        $this->assertSame(0, User::where('employee_id', 'EMP-9950')->count());
        $id = DirectoryEntry::where('employee_id', 'EMP-9950')->value('id');
        $this->postJson("/api/admin/hr/employees/{$id}/link-account")->assertStatus(422)->assertJsonValidationErrors('employment_status');

        $result = $this->postJson('/api/admin/hr/employees/create-logins')->assertOk()->json('data');
        $this->assertContains('Employee is inactive', array_column($result['skipped'], 'reason'));
        $this->assertSame(0, User::where('employee_id', 'EMP-9950')->count());

        $csv = \Illuminate\Http\UploadedFile::fake()->createWithContent('e.csv', "employee_id,display_name,company_email,employment_status\nEMP-9951,Left Long Ago,left@eljin.example,inactive\nEMP-9952,Still Here,here@eljin.example,active\n");
        $done = $this->post('/api/admin/hr/employees/import', ['file' => $csv, 'create_logins' => '1'])->assertOk()->json('data');
        $this->assertSame([2, 1], [$done['created'], $done['logins_created']]);
        $this->assertSame(0, User::where('employee_id', 'EMP-9951')->count());

        // Bringing them back makes the login available.
        $this->putJson("/api/admin/hr/employees/{$id}", ['employment_status' => 'active'])->assertOk();
        $this->postJson("/api/admin/hr/employees/{$id}/link-account")->assertOk()->assertJsonPath('data.account.status', 'pending');
    }

    public function test_a_manager_cannot_create_a_reporting_loop(): void
    {
        $this->hr();
        $a = $this->entry(['display_name' => 'A']);
        $b = $this->entry(['display_name' => 'B', 'manager_id' => $a->id]);
        $c = $this->entry(['display_name' => 'C', 'manager_id' => $b->id]);

        $this->putJson("/api/admin/hr/employees/{$a->id}", ['manager_id' => $a->id])->assertStatus(422)->assertJsonValidationErrors('manager_id');
        $this->putJson("/api/admin/hr/employees/{$a->id}", ['manager_id' => $c->id])->assertStatus(422)->assertJsonValidationErrors('manager_id');
        $this->putJson("/api/admin/hr/employees/{$c->id}", ['manager_id' => null])->assertOk()->assertJsonPath('data.manager_id', null);
    }

    public function test_admin_list_and_directory_filter_by_employment_status(): void
    {
        $this->hr();
        $this->entry(['display_name' => 'Working One']);
        $this->entry(['display_name' => 'Away Two', 'employment_status' => 'on_leave']);
        $this->entry(['display_name' => 'Gone Three', 'employment_status' => 'inactive']);

        $names = fn (string $url) => collect($this->getJson($url)->assertOk()->json('data'))->pluck('display_name')->all();
        $this->assertSame(['Away Two'], $names('/api/admin/hr/employees?employment_status=on_leave'));
        $this->getJson('/api/admin/hr/employees?employment_status=bogus')->assertStatus(422);
        $this->assertSame(['Gone Three'], $names('/api/directory?status=inactive'));
        $this->assertCount(3, $names('/api/directory'));
        $this->getJson('/api/directory?status=bogus')->assertStatus(422);
    }

    public function test_hiding_an_entry_removes_it_from_employee_results_but_leaves_the_account_alone(): void
    {
        $hr = $this->hr();
        $employee = $this->makeUser('employee', ['employee_id' => 'EMP-9500']);
        $entry = $this->entry(['employee_id' => 'EMP-9500', 'display_name' => 'Findable Person', 'user_id' => $employee->id, 'job_title' => 'Clerk']);

        $this->actingAs($employee);
        $this->assertCount(1, $this->getJson('/api/directory?search=Findable')->json('data'));
        $this->getJson('/api/directory/EMP-9500')->assertOk();

        $this->actingAs($hr);
        $this->patchJson("/api/admin/hr/employees/{$entry->id}/visibility", ['is_visible' => false])->assertOk()->assertJsonPath('data.is_visible', false);
        $this->assertDatabaseHas('audit_logs', ['action' => 'DIRECTORY_VISIBILITY_CHANGED']);

        $this->actingAs($employee);
        $this->assertCount(0, $this->getJson('/api/directory?search=Findable')->json('data'));
        $this->getJson('/api/directory/EMP-9500')->assertStatus(404);
        $this->getJson('/api/search?q=Findable&type=directory')->assertOk()->assertJsonPath('meta.total', 0);
        // The account is untouched: still active, still able to sign in and use the portal.
        $this->assertTrue($employee->fresh()->isActive());
        $this->assertSame(['employee'], $employee->fresh()->roleNames());
        $this->getJson('/api/auth/me')->assertOk();
        $this->postJson('/api/auth/login', ['identifier' => 'EMP-9500', 'password' => 'DemoOnly123!'])->assertOk();

        $this->actingAs($hr);
        $this->patchJson("/api/admin/hr/employees/{$entry->id}/visibility", ['is_visible' => true])->assertOk();
        $this->actingAs($employee);
        $this->getJson('/api/directory/EMP-9500')->assertOk();
        $this->actingAs($hr);
        $this->patchJson("/api/admin/hr/employees/{$entry->id}/visibility", [])->assertStatus(422);
    }

    public function test_employees_see_business_information_only_in_the_directory(): void
    {
        $dept = $this->department('Sales');
        $location = CompanyLocation::query()->forceCreate(['name' => 'Head Office', 'status' => 'published']);
        $user = $this->makeUser('employee', ['employee_id' => 'EMP-9600']);
        $this->entry(['employee_id' => 'EMP-9600', 'display_name' => 'Visible Person', 'job_title' => 'Rep', 'department_id' => $dept->id, 'location_id' => $location->id, 'company_email' => 'v@eljin.example', 'phone' => '100', 'user_id' => $user->id, 'official_name' => 'Secret Legal Name']);
        $this->actingAs($this->makeUser('employee'));

        $row = $this->getJson('/api/directory')->assertOk()->json('data.0');
        $this->assertSame(['employee_id', 'display_name', 'job_title', 'department', 'location', 'company_email', 'employment_status', 'phone', 'description'], array_keys($row));
        $body = $this->getJson('/api/directory/EMP-9600')->getContent();
        foreach (['Secret Legal Name', 'official_name', 'user_id', 'account_status', 'roles', 'password', 'personal', 'salary', 'source'] as $leak) {
            $this->assertStringNotContainsString($leak, $body);
        }
    }

    public function test_directory_filters_search_sort_and_pagination(): void
    {
        $finance = $this->department('Finance');
        $sales = $this->department('Sales');
        $this->entry(['display_name' => 'Zed Finance', 'job_title' => 'Accountant', 'department_id' => $finance->id]);
        $this->entry(['display_name' => 'Amy Sales', 'job_title' => 'Rep', 'department_id' => $sales->id]);
        $this->entry(['display_name' => 'Hidden Sales', 'department_id' => $sales->id, 'is_visible' => false]);
        $this->actingAs($this->makeUser('employee'));

        $names = fn (string $q) => collect($this->getJson("/api/directory{$q}")->assertOk()->json('data'))->pluck('display_name')->all();

        $this->assertSame(['Amy Sales', 'Zed Finance'], $names(''));
        $this->assertSame(['Amy Sales'], $names('?department=Sales'));
        $this->assertSame(['Zed Finance'], $names('?search=accountant'));
        $this->assertSame(['Amy Sales'], $names('?search=sales'), 'search covers the department name');
        $this->assertSame(['Zed Finance', 'Amy Sales'], $names('?sortBy=name&sortDir=desc'));
        $this->assertSame(['Zed Finance', 'Amy Sales'], $names('?sortBy=department&sortDir=asc'));
        $this->getJson('/api/directory?per_page=1&page=2')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('meta.total', 2);
        $this->getJson('/api/directory?sortBy=salary')->assertStatus(422);
        $this->getJson('/api/directory?per_page=101')->assertStatus(422);
        $filters = $this->getJson('/api/directory/filters')->assertOk()->json('data.departments');
        $this->assertEqualsCanonicalizing([['name' => 'Finance', 'count' => 1], ['name' => 'Sales', 'count' => 1]], $filters, 'counts never include hidden people');
    }

    public function test_admin_directory_list_filters_and_sorting(): void
    {
        $this->hr();
        $dept = $this->department();
        $user = $this->makeUser('employee');
        $this->entry(['display_name' => 'Linked One', 'department_id' => $dept->id, 'user_id' => $user->id]);
        $this->entry(['display_name' => 'Hidden Two', 'is_visible' => false]);
        $this->entry(['display_name' => 'Plain Three']);

        $names = fn (string $q) => collect($this->getJson("/api/admin/hr/employees{$q}")->assertOk()->json('data'))->pluck('display_name')->all();
        $this->assertCount(3, $names(''));
        $this->assertSame(['Hidden Two'], $names('?visibility=hidden'));
        $this->assertSame(['Linked One'], $names('?account=linked'));
        $this->assertSame(['Linked One'], $names('?department_id='.$dept->id));
        $this->assertSame(['Linked One'], $names('?search=finance'));
        $this->assertSame(['Linked One', 'Hidden Two', 'Plain Three'], $names('?sort=created_at&direction=asc'));
        $this->getJson('/api/admin/hr/employees?sort=user_id')->assertStatus(422);
        $this->getJson('/api/admin/hr/employees?visibility=maybe')->assertStatus(422);
        $this->getJson('/api/admin/hr/employees?search='.str_repeat('x', 101))->assertStatus(422);
    }

    public function test_link_account_uses_the_existing_account_or_creates_a_pending_login(): void
    {
        $hr = $this->hr();
        $account = $this->makeUser('employee', ['employee_id' => 'EMP-9700']);
        $entry = $this->entry(['employee_id' => 'EMP-9700']);
        $orphan = $this->entry(['employee_id' => 'EMP-9701', 'company_email' => 'orphan@eljin.example']);
        $noEmail = $this->entry(['employee_id' => 'EMP-9702']);
        $usersBefore = User::count();

        $this->postJson("/api/admin/hr/employees/{$entry->id}/link-account")->assertOk()->assertJsonPath('data.account.linked', true)->assertJsonPath('data.account.status', 'active');
        $this->postJson("/api/admin/hr/employees/{$entry->id}/link-account")->assertOk(); // idempotent
        $this->postJson("/api/admin/hr/employees/{$noEmail->id}/link-account")->assertStatus(422)->assertJsonValidationErrors('company_email');
        $this->assertSame($usersBefore, User::count(), 'linking an entry that already has an account creates nothing');
        $this->postJson("/api/admin/hr/employees/{$orphan->id}/link-account")->assertOk()->assertJsonPath('data.account.status', 'pending');
        $this->assertSame($usersBefore + 1, User::count(), 'an entry with an email but no account gets a pending login');
        $this->assertSame($account->id, $entry->fresh()->user_id);
        $this->assertDatabaseHas('audit_logs', ['action' => 'DIRECTORY_ACCOUNT_LINKED', 'actor_user_id' => $hr->id]);
        $this->assertStringNotContainsString('password', strtolower($this->getJson("/api/admin/hr/employees/{$entry->id}")->getContent()));

        $unlinked = $this->getJson('/api/admin/hr/employees/unlinked-users')->assertOk()->json('data');
        $ids = collect($unlinked)->pluck('employee_id')->all();
        $this->assertNotContains('EMP-9700', $ids, 'accounts that already have a directory entry are not listed');
        $this->assertSame(['employee_id', 'email', 'status'], array_keys($unlinked[0]));
    }

    // --- Departments --------------------------------------------------------------------------------------------------------

    public function test_departments_are_created_updated_archived_and_protected_when_in_use(): void
    {
        $hr = $this->hr();

        $id = $this->postJson('/api/admin/hr/departments', ['name' => 'Sample Dept', 'code' => 'SD-1', 'description' => 'D', 'contact_email' => 'd@eljin.example', 'head_display' => 'Head Name', 'sort_order' => 3])->assertCreated()->assertJsonPath('data.status', 'draft')->json('data.id');
        $this->postJson('/api/admin/hr/departments', ['name' => 'Sample Dept'])->assertStatus(422)->assertJsonValidationErrors('name');
        $this->postJson('/api/admin/hr/departments', ['name' => 'Other', 'code' => 'SD-1'])->assertStatus(422)->assertJsonValidationErrors('code');
        $this->postJson('/api/admin/hr/departments', ['name' => 'Bad', 'contact_email' => 'x'])->assertStatus(422);
        $this->putJson("/api/admin/hr/departments/{$id}", ['description' => 'Updated', 'sort_order' => 1])->assertOk()->assertJsonPath('data.description', 'Updated');
        $this->patchJson("/api/admin/hr/departments/{$id}/status", ['status' => 'published'])->assertOk()->assertJsonPath('data.status', 'published');
        $this->patchJson("/api/admin/hr/departments/{$id}/status", ['status' => 'nonsense'])->assertStatus(422);

        $employee = $this->makeUser('employee');
        $this->entry(['display_name' => 'Member', 'department_id' => $id]);
        $this->deleteJson("/api/admin/hr/departments/{$id}")->assertStatus(409);
        $this->assertNotNull(Department::find($id));

        $this->patchJson("/api/admin/hr/departments/{$id}/status", ['status' => 'archived'])->assertOk();
        $this->assertSame(1, DirectoryEntry::where('department_id', $id)->count(), 'archiving never touches employee entries');
        $this->actingAs($employee);
        $this->assertNotContains('Sample Dept', collect($this->getJson('/api/company/departments')->json('data'))->pluck('name')->all());
        $this->assertNotContains('Sample Dept', collect($this->getJson('/api/directory/filters')->json('data.departments'))->pluck('name')->all());

        $this->actingAs($hr);
        $empty = $this->postJson('/api/admin/hr/departments', ['name' => 'Unused'])->json('data.id');
        $this->deleteJson("/api/admin/hr/departments/{$empty}")->assertNoContent();
        $this->assertEqualsCanonicalizing(['DEPARTMENT_CREATED', 'DEPARTMENT_UPDATED', 'DEPARTMENT_PUBLISHED', 'DEPARTMENT_ARCHIVED', 'DEPARTMENT_DELETED'], AuditLog::distinct()->pluck('action')->all());
    }

    // --- Company content -----------------------------------------------------------------------------------------------------

    public function test_company_overview_is_hidden_until_published(): void
    {
        $hr = $this->hr();
        $this->getJson('/api/admin/hr/company')->assertOk()->assertJsonPath('data.status', 'draft');

        $this->putJson('/api/admin/hr/company', ['display_name' => 'Display Name', 'mission' => 'Draft mission', 'core_values' => [['title' => 'Integrity', 'description' => 'D'], ['title' => 'Care']]])->assertOk()
            ->assertJsonPath('data.mission', 'Draft mission')->assertJsonCount(2, 'data.core_values');
        $this->actingAs($this->makeUser('employee'));
        $this->getJson('/api/company')->assertOk()->assertJsonPath('data', null);

        $this->actingAs($hr);
        $this->putJson('/api/admin/hr/company', ['status' => 'published'])->assertOk()->assertJsonPath('data.status', 'published');
        $this->actingAs($this->makeUser('employee'));
        $this->getJson('/api/company')->assertOk()->assertJsonPath('data.mission', 'Draft mission')->assertJsonPath('data.core_values.1.title', 'Care');
        $this->assertArrayNotHasKey('status', $this->getJson('/api/company')->json('data'));

        $this->actingAs($hr);
        $this->putJson('/api/admin/hr/company', ['status' => 'archived'])->assertOk();
        $this->actingAs($this->makeUser('employee'));
        $this->getJson('/api/company')->assertJsonPath('data', null);
        $this->assertSame(['COMPANY_OVERVIEW_UPDATED', 'COMPANY_OVERVIEW_PUBLISHED', 'COMPANY_OVERVIEW_ARCHIVED'], AuditLog::orderBy('id')->pluck('action')->all());

        $this->actingAs($hr);
        $this->putJson('/api/admin/hr/company', ['mission' => str_repeat('x', 3001)])->assertStatus(422);
        $this->putJson('/api/admin/hr/company', ['core_values' => [['description' => 'no title']]])->assertStatus(422);
        $this->putJson('/api/admin/hr/company', ['status' => 'live'])->assertStatus(422);
        $this->assertSame(1, CompanyPage::count());
    }

    public function test_history_leadership_and_locations_follow_draft_publish_archive(): void
    {
        $hr = $this->hr();
        $history = $this->postJson('/api/admin/hr/company/history', ['title' => 'Milestone', 'year' => '2001', 'description' => 'D', 'sort_order' => 1])->assertCreated()->assertJsonPath('data.status', 'draft')->json('data.id');
        $leader = $this->postJson('/api/admin/hr/company/leadership', ['name' => 'Sample Leader', 'title' => 'Sample Title', 'area' => 'Area', 'biography' => 'Bio'])->assertCreated()->json('data.id');
        $loc = $this->postJson('/api/admin/hr/company/locations', ['name' => 'Sample Site', 'address' => 'Sample address', 'phone' => '+63 2 000 0000', 'email' => 'site@eljin.example', 'operating_info' => 'Hours TBD'])->assertCreated()->json('data.id');

        $this->actingAs($this->makeUser('employee'));
        foreach (['history', 'leadership', 'locations'] as $kind) {
            $this->assertCount(0, $this->getJson("/api/company/{$kind}")->json('data'), "draft {$kind} must not reach employees");
        }

        $this->actingAs($hr);
        $this->patchJson("/api/admin/hr/company/history/{$history}/status", ['status' => 'published'])->assertOk();
        $this->patchJson("/api/admin/hr/company/leadership/{$leader}/status", ['status' => 'published'])->assertOk();
        $this->patchJson("/api/admin/hr/company/locations/{$loc}/status", ['status' => 'published'])->assertOk();
        $this->actingAs($this->makeUser('employee'));
        $this->assertSame('Milestone', $this->getJson('/api/company/history')->json('data.0.title'));
        $this->assertSame('Sample Leader', $this->getJson('/api/company/leadership')->json('data.0.name'));
        $this->assertSame('Sample Site', $this->getJson('/api/company/locations')->json('data.0.name'));
        $this->assertArrayNotHasKey('status', $this->getJson('/api/company/locations')->json('data.0'));

        $this->actingAs($hr);
        $this->putJson("/api/admin/hr/company/history/{$history}", ['title' => 'Edited milestone'])->assertOk();
        $this->putJson("/api/admin/hr/company/leadership/{$leader}", ['title' => 'Edited title'])->assertOk();
        $this->putJson("/api/admin/hr/company/locations/{$loc}", ['address' => 'Edited address'])->assertOk();
        foreach (['history' => $history, 'leadership' => $leader, 'locations' => $loc] as $kind => $id) {
            $this->patchJson("/api/admin/hr/company/{$kind}/{$id}/status", ['status' => 'archived'])->assertOk();
        }
        $this->actingAs($this->makeUser('employee'));
        foreach (['history', 'leadership', 'locations'] as $kind) {
            $this->assertCount(0, $this->getJson("/api/company/{$kind}")->json('data'), "archived {$kind} must not reach employees");
        }

        $this->actingAs($hr);
        $this->postJson('/api/admin/hr/company/history', ['title' => 'x', 'year' => 'last year'])->assertStatus(422)->assertJsonValidationErrors('year');
        $this->postJson('/api/admin/hr/company/history', [])->assertStatus(422);
        $this->postJson('/api/admin/hr/company/leadership', ['name' => 'x'])->assertStatus(422)->assertJsonValidationErrors('title');
        $this->postJson('/api/admin/hr/company/locations', ['name' => 'Sample Site'])->assertStatus(422)->assertJsonValidationErrors('name');
        $this->postJson('/api/admin/hr/company/locations', ['name' => 'Y', 'email' => 'bad'])->assertStatus(422);
        $this->postJson('/api/admin/hr/company/locations', ['name' => 'Y', 'phone' => '<script>'])->assertStatus(422)->assertJsonValidationErrors('phone');
        $actions = AuditLog::pluck('action')->all();
        foreach (['HISTORY_ENTRY_PUBLISHED', 'LEADERSHIP_PUBLISHED', 'LOCATION_PUBLISHED', 'HISTORY_ENTRY_ARCHIVED', 'LEADERSHIP_UPDATED', 'LOCATION_UPDATED'] as $expected) {
            $this->assertContains($expected, $actions);
        }
        $this->assertSame(1, CompanyHistoryEntry::count() + LeadershipProfile::count() + CompanyLocation::count() - 2);
    }

    // --- Integration -------------------------------------------------------------------------------------------------------

    public function test_directory_company_and_search_share_one_source_and_hide_hidden_people(): void
    {
        $hr = $this->hr();
        $dept = $this->department('Finance');
        $this->entry(['display_name' => 'Shared Person', 'department_id' => $dept->id]);
        $this->entry(['display_name' => 'Payroll Hidden Person', 'is_visible' => false]);
        $this->actingAs($this->makeUser('employee'));

        $this->assertSame('Finance', $this->getJson('/api/directory')->json('data.0.department'));
        $this->assertContains('Finance', collect($this->getJson('/api/company/departments')->json('data'))->pluck('name')->all());
        $this->assertSame(1, collect($this->getJson('/api/company/departments')->json('data'))->firstWhere('name', 'Finance')['employee_count']);

        $found = collect($this->getJson('/api/search?q=payroll')->assertOk()->json('data'))->map(fn ($r) => $r['type'].':'.$r['title'])->all();
        $this->assertSame([], $found, 'hidden people never appear in search');
        $directory = collect($this->getJson('/api/search?q=Shared&type=directory')->json('data'))->first();
        $this->assertSame('Shared Person', $directory['title']);
        $this->assertNotNull($directory['key']);
        $this->assertNotNull($hr);
    }

    public function test_dashboard_counts_are_real(): void
    {
        $this->hr();
        $this->entry();
        $this->entry(['is_visible' => false]);
        $this->department('A', 'published');
        $this->department('B', 'draft');

        $data = $this->getJson('/api/admin/hr/dashboard')->assertOk()->json('data');

        $this->assertSame(['total' => 2, 'visible' => 1, 'hidden' => 1, 'unlinked' => 2], $data['directory']);
        $this->assertSame(['total' => 2, 'published' => 1], $data['departments']);
        $this->assertFalse($data['company']['overview_published']);
        $this->assertSame(1, $data['company']['drafts']);
    }

    public function test_unauthorized_users_cannot_modify_records_by_changing_ids(): void
    {
        $dept = $this->department();
        $entry = $this->entry();

        foreach (['employee', 'it', 'manager'] as $role) {
            $this->actingAs($this->makeUser($role));
            $this->putJson("/api/admin/hr/employees/{$entry->id}", ['display_name' => 'Hacked'])->assertStatus(403);
            $this->patchJson("/api/admin/hr/employees/{$entry->id}/visibility", ['is_visible' => false])->assertStatus(403);
            $this->postJson("/api/admin/hr/employees/{$entry->id}/link-account")->assertStatus(403);
            $this->putJson("/api/admin/hr/departments/{$dept->id}", ['name' => 'Hacked'])->assertStatus(403);
            $this->deleteJson("/api/admin/hr/departments/{$dept->id}")->assertStatus(403);
        }
        $this->assertSame('Sample Person 1', DirectoryEntry::first()->display_name === 'Hacked' ? 'Hacked' : 'Sample Person 1');
        $this->assertSame('Finance', $dept->fresh()->name);
        $this->assertTrue($entry->fresh()->is_visible);
    }
}
