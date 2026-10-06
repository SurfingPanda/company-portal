<?php

namespace App\Authorization;

use App\Enums\RoleName;

/**
 * Role -> permission map for the portal backend. Mirrors the React portal's src/auth/permissions.ts so the UI and the API
 * agree; THIS copy is the one that enforces access (the frontend only shapes the UI).
 *
 * `admin` means portal administration only. It grants nothing in payroll, attendance or other external systems.
 * `hr.view` / `it.view` are the employee-facing HR and IT pages (everyone); `*.manage` are future administration.
 */
final class RolePermissions
{
    /** What every employee can do. Other roles add to this. */
    private const EMPLOYEE = [
        'portal.view', 'directory.view', 'documents.view', 'forms.view', 'forms.submit', 'requests.view-own', 'requests.submit',
        'announcements.view', 'calendar.view', 'benefits.view', 'recruitment.view', 'recruitment.apply', 'helpdesk.view',
        'helpdesk.create', 'resources.view', 'profile.view', 'profile.edit', 'hr.view', 'it.view', 'policies.view',
    ];

    /** @return array<string, list<string>> */
    public static function map(): array
    {
        return [
            RoleName::Employee->value => self::EMPLOYEE,
            RoleName::Manager->value => [...self::EMPLOYEE, 'requests.team-view', 'requests.team-review', 'directory.team-view', 'reports.team-view'],
            RoleName::Hr->value => [...self::EMPLOYEE, 'hr.directory.view', 'hr.directory.manage', 'hr.directory.visibility', 'hr.departments.manage', 'hr.company.manage', 'hr.company.publish', 'hr.approvals.manage', 'hr.manage', 'policies.manage', 'requests.hr-review', 'benefits.manage', 'recruitment.manage', 'documents.hr-manage', 'announcements.hr-manage', 'reports.view'],
            RoleName::It->value => [...self::EMPLOYEE, 'it.manage', 'helpdesk.manage', 'requests.it-review', 'documents.it-manage', 'resources.it-manage'],
            RoleName::Admin->value => [
                ...self::EMPLOYEE,
                'documents.manage', 'forms.manage', 'requests.manage', 'announcements.manage', 'calendar.manage', 'benefits.manage',
                'recruitment.manage', 'helpdesk.manage', 'resources.manage', 'hr.manage', 'it.manage', 'reports.view', 'admin.access',
                'users.manage', 'roles.view', 'audit.view', 'settings.manage', 'notifications.manage', 'policies.manage',
                'hr.directory.view', 'hr.directory.manage', 'hr.directory.visibility', 'hr.departments.manage', 'hr.company.manage', 'hr.company.publish', 'hr.approvals.manage',
            ],
        ];
    }

    /**
     * @param  iterable<string>  $roles  role names
     * @return list<string>
     */
    public static function forRoles(iterable $roles): array
    {
        $map = self::map();
        $permissions = [];
        foreach ($roles as $role) {
            foreach ($map[$role] ?? [] as $permission) {
                $permissions[$permission] = true;
            }
        }

        return array_keys($permissions);
    }

    /** What each system role is for. Roles are defined in code (not editable in the UI) so permissions cannot be silently widened. */
    public const DESCRIPTIONS = [
        'employee' => 'Every portal user. Uses the employee-facing portal: own requests, tickets, applications and preferences.',
        'manager' => 'Employee access plus the team-level permissions reserved for managers (team access follows the department heads and approval routes HR maintains).',
        'hr' => 'Employee access plus HR content and HR-type requests, benefits and recruitment management. No user or system administration.',
        'it' => 'Employee access plus helpdesk, IT documents and IT resources management. No user or system administration.',
        'admin' => 'Portal administration: users, roles, content, settings and the audit log. Grants nothing in payroll, attendance or other external systems.',
    ];

    /** Modules (the part before the dot) in display order, with their labels. */
    private const MODULES = [
        'portal' => 'Portal', 'admin' => 'Administration', 'users' => 'Users', 'roles' => 'Roles', 'documents' => 'Documents', 'forms' => 'Forms',
        'requests' => 'Requests', 'announcements' => 'Announcements', 'calendar' => 'Calendar', 'benefits' => 'Benefits',
        'recruitment' => 'Recruitment', 'helpdesk' => 'Helpdesk', 'resources' => 'Resources', 'notifications' => 'Notifications',
        'audit' => 'Audit log', 'settings' => 'Settings', 'reports' => 'Reports', 'directory' => 'Directory', 'profile' => 'Profile',
        'hr' => 'HR services', 'it' => 'IT services', 'policies' => 'Policies',
    ];

    /**
     * Every permission grouped by module, for the read-only permissions page. Permissions are centrally defined here;
     * the API cannot create new ones.
     *
     * @return list<array{module: string, label: string, permissions: list<string>}>
     */
    public static function catalog(): array
    {
        $grouped = [];
        foreach (self::all() as $permission) {
            $grouped[strstr($permission, '.', true)][] = $permission;
        }
        $result = [];
        foreach (self::MODULES as $module => $label) {
            if (isset($grouped[$module])) {
                $result[] = ['module' => $module, 'label' => $label, 'permissions' => $grouped[$module]];
            }
        }

        return $result;
    }


    /**
     * What an administrator may grant to one person on top of their roles, grouped for the access screen. Deliberately excludes the
     * administration powers (admin.access, users.manage, roles.view, audit.view, settings.manage, notifications.manage): nobody can be made
     * an administrator by a check box, only by the Administrator role (which has its own last-admin and self-change protections).
     *
     * @return list<array{group: string, items: list<array{permission: string, label: string, hint: string}>}>
     */
    public static function grantableCatalog(): array
    {
        $i = fn (string $permission, string $label, string $hint = '') => compact('permission', 'label', 'hint');

        return [
            ['group' => 'Policies', 'items' => [$i('policies.manage', 'Create and publish policies', 'Write policies, publish new versions and see who has not acknowledged them.')]],
            ['group' => 'Documents and forms', 'items' => [
                $i('documents.hr-manage', 'Upload and manage HR documents'), $i('documents.it-manage', 'Upload and manage IT documents'),
                $i('documents.manage', 'Upload and manage all documents'), $i('forms.manage', 'Manage forms'),
            ]],
            ['group' => 'Announcements and calendar', 'items' => [
                $i('announcements.hr-manage', 'Post HR announcements'), $i('announcements.manage', 'Manage all announcements'), $i('calendar.manage', 'Manage company calendar events'),
            ]],
            ['group' => 'HR records', 'items' => [
                $i('hr.directory.view', 'View the HR employee directory'), $i('hr.directory.manage', 'Add and edit employee records'),
                $i('hr.directory.visibility', 'Choose what employees can see in the directory'), $i('hr.departments.manage', 'Manage departments'),
                $i('hr.approvals.manage', 'Manage approval routing'), $i('hr.company.manage', 'Edit company information'), $i('hr.company.publish', 'Publish company information'),
                $i('hr.manage', 'Open the HR dashboard'),
            ]],
            ['group' => 'Requests and helpdesk', 'items' => [
                $i('requests.hr-review', 'Review HR requests'), $i('requests.it-review', 'Review IT requests'), $i('requests.team-review', 'Review requests from their team'),
                $i('requests.manage', 'Manage request types and all requests'), $i('helpdesk.manage', 'Work helpdesk tickets'),
            ]],
            ['group' => 'Benefits, jobs and resources', 'items' => [
                $i('benefits.manage', 'Manage benefits content'), $i('recruitment.manage', 'Manage job postings and applications'),
                $i('resources.it-manage', 'Manage IT resources'), $i('resources.manage', 'Manage all resources'),
            ]],
            ['group' => 'Reports', 'items' => [$i('reports.view', 'View company reports'), $i('reports.team-view', 'View their team reports'), $i('directory.team-view', 'View their team in the directory')]],
        ];
    }

    /** @return list<string> */
    public static function grantable(): array
    {
        return array_merge(...array_map(fn (array $g) => array_column($g['items'], 'permission'), self::grantableCatalog()));
    }

    /** @return list<string> names of the roles that hold a permission (used to find who to notify). */
    public static function rolesWith(string $permission): array
    {
        return array_keys(array_filter(self::map(), fn (array $permissions) => in_array($permission, $permissions, true)));
    }

    /** @return list<string> every permission name (used to register Gates). */
    public static function all(): array
    {
        return self::forRoles(array_keys(self::map()));
    }
}
