<?php

use App\Http\Controllers\Api\Admin\AdminBenefitController;
use App\Http\Controllers\Api\Admin\AdminDocumentCategoryController;
use App\Http\Controllers\Api\Admin\AdminDocumentController;
use App\Http\Controllers\Api\Admin\AdminFormController;
use App\Http\Controllers\Api\Admin\AdminJobController;
use App\Http\Controllers\Api\Admin\AdminNotificationController;
use App\Http\Controllers\Api\Admin\AdminOverviewController;
use App\Http\Controllers\Api\Admin\AdminPolicyController;
use App\Http\Controllers\Api\BatchController;
use App\Http\Controllers\Api\CelebrationController;
use App\Http\Controllers\Api\EmailPreviewController;
use App\Http\Controllers\Api\PasswordChangeController;
use App\Http\Controllers\Api\PersonalInfoController;
use App\Http\Controllers\Api\PolicyController;
use App\Http\Controllers\Api\Admin\AdminRequestTypeController;
use App\Http\Controllers\Api\Admin\AdminResourceController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\Admin\AccessTemplateController;
use App\Http\Controllers\Api\Admin\Hr\AdminCompanyController;
use App\Http\Controllers\Api\Admin\Hr\AdminDepartmentController;
use App\Http\Controllers\Api\Admin\Hr\AdminDirectoryController;
use App\Http\Controllers\Api\Admin\Hr\AdminHistoryController;
use App\Http\Controllers\Api\Admin\Hr\AdminLeadershipController;
use App\Http\Controllers\Api\Admin\Hr\AdminLocationController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\DirectoryController;
use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PasswordLinkController;
use App\Http\Controllers\Api\BenefitController;
use App\Http\Controllers\Api\CalendarEventController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\EmployeeFormController;
use App\Http\Controllers\Api\EmployeeRequestController;
use App\Http\Controllers\Api\HelpdeskTicketController;
use App\Http\Controllers\Api\HrController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PreferencesController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RecruitmentController;
use App\Http\Controllers\Api\RequestAttachmentController;
use App\Http\Controllers\Api\RequestTypeController;
use App\Http\Controllers\Api\ResourceController;
use App\Http\Controllers\Api\SearchController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Employee Portal REST API  (all paths are under /api)
|--------------------------------------------------------------------------
| Authentication: Sanctum SPA session cookie (call GET /sanctum/csrf-cookie first). Every route except login requires it.
| Authorisation is enforced here and in the controllers, never left to the React UI:
|   - `permission:x` middleware = role permission (401 signed out, 403 not permitted)
|   - Policies / scoped queries = ownership (another person's record answers 404)
| Static segments (categories, featured, read-all …) are declared before `{id}` routes; ids are numeric only.
*/

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('identify', [AuthController::class, 'identify'])->middleware('throttle:login');
    Route::post('first-sign-in', [AuthController::class, 'completeSetup'])->middleware('throttle:login');
    Route::post('forgot-password', [PasswordLinkController::class, 'forgot'])->middleware('throttle:password-link');
    Route::post('set-password', [PasswordLinkController::class, 'set'])->middleware('throttle:password-link');
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('onboarding/complete', [AuthController::class, 'completeOnboarding']);
    });
});

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    // Several reads in one round trip (each path still runs through its own route middleware and policies).
    Route::get('batch', [BatchController::class, 'index']);

    // --- Account -------------------------------------------------------------------------------------------------
    Route::get('profile', [ProfileController::class, 'show'])->middleware('permission:profile.view');
    Route::put('profile', [ProfileController::class, 'update'])->middleware('permission:profile.edit');
    Route::get('profile/personal', [PersonalInfoController::class, 'show'])->middleware('permission:profile.edit');
    Route::put('profile/personal', [PersonalInfoController::class, 'update'])->middleware(['permission:profile.edit', 'throttle:writes']);
    Route::post('account/password', [PasswordChangeController::class, 'update'])->middleware(['permission:portal.view', 'throttle:password-change']);
    Route::post('account/email-preview', [EmailPreviewController::class, 'store'])->middleware(['permission:portal.view', 'throttle:email-preview']);
    Route::prefix('account/preferences')->middleware('permission:portal.view')->group(function () {
        Route::get('/', [PreferencesController::class, 'show']);
        Route::put('/', [PreferencesController::class, 'update']);
        Route::post('reset', [PreferencesController::class, 'reset']);
    });

    // --- Announcements -------------------------------------------------------------------------------------------
    Route::get('announcements', [AnnouncementController::class, 'index'])->middleware('permission:announcements.view');
    Route::get('announcements/{announcement}', [AnnouncementController::class, 'show'])->whereNumber('announcement')->middleware('permission:announcements.view');
    Route::middleware('permission:announcements.manage,announcements.hr-manage')->group(function () {
        Route::post('announcements', [AnnouncementController::class, 'store']);
        Route::put('announcements/{announcement}', [AnnouncementController::class, 'update'])->whereNumber('announcement');
        Route::delete('announcements/{announcement}', [AnnouncementController::class, 'destroy'])->whereNumber('announcement');
    });

    // --- Calendar ------------------------------------------------------------------------------------------------
    Route::get('calendar/events', [CalendarEventController::class, 'index'])->middleware('permission:calendar.view');
    Route::get('calendar/events/{event}', [CalendarEventController::class, 'show'])->whereNumber('event')->middleware('permission:calendar.view');
    Route::middleware('permission:calendar.manage')->group(function () {
        Route::post('calendar/events', [CalendarEventController::class, 'store']);
        Route::put('calendar/events/{event}', [CalendarEventController::class, 'update'])->whereNumber('event');
        Route::delete('calendar/events/{event}', [CalendarEventController::class, 'destroy'])->whereNumber('event');
    });

    // --- Documents and forms -------------------------------------------------------------------------------------
    Route::middleware('permission:documents.view')->prefix('documents')->group(function () {
        Route::get('/', [DocumentController::class, 'index']);
        Route::get('categories', [DocumentController::class, 'categories']);
        Route::get('recent', [DocumentController::class, 'recent']);
        Route::get('popular', [DocumentController::class, 'popular']);
        Route::get('{document}', [DocumentController::class, 'show'])->whereNumber('document');
        Route::get('{document}/download', [DocumentController::class, 'download'])->whereNumber('document');
    });
    Route::middleware('permission:forms.view')->prefix('forms')->group(function () {
        Route::get('/', [EmployeeFormController::class, 'index']);
        Route::get('{form}', [EmployeeFormController::class, 'show'])->whereNumber('form');
    });

    // --- Requests ------------------------------------------------------------------------------------------------
    Route::get('request-types', [RequestTypeController::class, 'index'])->middleware('permission:forms.view,requests.submit');
    Route::get('request-types/{requestType}', [RequestTypeController::class, 'show'])->whereNumber('requestType')->middleware('permission:forms.view,requests.submit');

    Route::prefix('requests')->middleware('permission:requests.view-own,requests.manage,requests.hr-review')->group(function () {
        Route::get('/', [EmployeeRequestController::class, 'index']);
        Route::post('/', [EmployeeRequestController::class, 'store'])->middleware(['permission:requests.submit', 'throttle:writes']);
        Route::get('{requestId}', [EmployeeRequestController::class, 'show'])->whereNumber('requestId');
        Route::put('{requestId}', [EmployeeRequestController::class, 'update'])->whereNumber('requestId')->middleware('throttle:writes');
        Route::post('{requestId}/cancel', [EmployeeRequestController::class, 'cancel'])->whereNumber('requestId');
        Route::get('{requestId}/history', [EmployeeRequestController::class, 'historyIndex'])->whereNumber('requestId');
        Route::post('{requestId}/status', [EmployeeRequestController::class, 'review'])->whereNumber('requestId')->middleware('permission:requests.manage,requests.hr-review,requests.team-review,requests.it-review');
        Route::get('{requestId}/attachments', [RequestAttachmentController::class, 'index'])->whereNumber('requestId');
        Route::post('{requestId}/attachments', [RequestAttachmentController::class, 'store'])->whereNumber('requestId')->middleware('throttle:uploads');
        Route::delete('{requestId}/attachments/{attachment}', [RequestAttachmentController::class, 'destroy'])->whereNumber(['requestId', 'attachment']);
    });

    // --- Notifications and activity (own only) -------------------------------------------------------------------
    Route::prefix('notifications')->middleware('permission:portal.view')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::post('read-all', [NotificationController::class, 'readAll']);
        Route::get('{notification}', [NotificationController::class, 'show'])->whereNumber('notification');
        Route::post('{notification}/read', [NotificationController::class, 'read'])->whereNumber('notification');
    });
    Route::get('activity', [ActivityController::class, 'index'])->middleware('permission:portal.view');

    // --- Helpdesk ------------------------------------------------------------------------------------------------
    Route::prefix('helpdesk/tickets')->middleware('permission:helpdesk.view')->group(function () {
        Route::get('/', [HelpdeskTicketController::class, 'index']);
        Route::post('/', [HelpdeskTicketController::class, 'store'])->middleware(['permission:helpdesk.create', 'throttle:writes']);
        Route::get('{ticket}', [HelpdeskTicketController::class, 'show'])->whereNumber('ticket');
        Route::post('{ticket}/replies', [HelpdeskTicketController::class, 'reply'])->whereNumber('ticket')->middleware('throttle:writes');
        Route::post('{ticket}/attachments', [HelpdeskTicketController::class, 'attach'])->whereNumber('ticket')->middleware('throttle:uploads');
        Route::post('{ticket}/cancel', [HelpdeskTicketController::class, 'cancel'])->whereNumber('ticket');
    });
    // Knowledge base: no table exists yet (see API.md). The frontend keeps its sample articles until it is built.

    // --- Benefits (information only) -----------------------------------------------------------------------------
    Route::middleware('permission:benefits.view')->prefix('benefits')->group(function () {
        Route::get('/', [BenefitController::class, 'index']);
        Route::get('categories', [BenefitController::class, 'categories']);
        Route::get('featured', [BenefitController::class, 'featured']);
        Route::get('faq', [BenefitController::class, 'faq']);
        Route::get('{benefit}', [BenefitController::class, 'show'])->whereNumber('benefit');
    });

    // --- Recruitment ---------------------------------------------------------------------------------------------
    Route::prefix('recruitment')->middleware('permission:recruitment.view')->group(function () {
        Route::get('jobs', [RecruitmentController::class, 'jobs']);
        Route::get('jobs/{job}', [RecruitmentController::class, 'job'])->whereNumber('job');
        Route::post('jobs/{job}/apply', [RecruitmentController::class, 'apply'])->whereNumber('job')->middleware(['permission:recruitment.apply', 'throttle:writes']);
        Route::post('jobs/{job}/refer', [RecruitmentController::class, 'refer'])->whereNumber('job')->middleware(['permission:recruitment.apply', 'throttle:writes']);
        Route::get('applications', [RecruitmentController::class, 'applications']);
        Route::get('applications/{application}', [RecruitmentController::class, 'application'])->whereNumber('application');
        Route::get('referrals', [RecruitmentController::class, 'referrals']);
        Route::get('referrals/{referral}', [RecruitmentController::class, 'referral'])->whereNumber('referral');
    });

    // --- Resources -----------------------------------------------------------------------------------------------
    Route::middleware('permission:resources.view')->prefix('resources')->group(function () {
        Route::get('/', [ResourceController::class, 'index']);
        Route::get('categories', [ResourceController::class, 'categories']);
        Route::get('featured', [ResourceController::class, 'featured']);
        Route::get('faq', [ResourceController::class, 'faq']);
        Route::get('{resource}', [ResourceController::class, 'show'])->whereNumber('resource');
    });

    // --- HR boundary (portal data only; nothing is invented) --------------------------------------------------
    Route::prefix('hr')->middleware('permission:hr.view')->group(function () {
        Route::get('services', [HrController::class, 'services']);
        Route::get('employee-information', [HrController::class, 'employeeInformation']);
        Route::post('requests', [HrController::class, 'createRequest'])->middleware(['permission:requests.submit', 'throttle:writes']);
    });

    // --- Directory, company information and services (employee-facing; published / visible content only) -------------------
    Route::prefix('directory')->middleware('permission:directory.view')->group(function () {
        Route::get('/', [DirectoryController::class, 'index']);
        Route::get('filters', [DirectoryController::class, 'filters']);
        Route::get('organization', [DirectoryController::class, 'organization']);
        Route::get('{employeeId}', [DirectoryController::class, 'show'])->where('employeeId', '[A-Za-z0-9_\-]+');
    });
    Route::get('celebrations', [CelebrationController::class, 'index'])->middleware('permission:directory.view');
    Route::prefix('policies')->middleware('permission:policies.view')->group(function () {
        Route::get('/', [PolicyController::class, 'index']);
        Route::get('{id}', [PolicyController::class, 'show'])->whereNumber('id');
        Route::post('{id}/acknowledge', [PolicyController::class, 'acknowledge'])->whereNumber('id')->middleware('throttle:writes');
    });
    Route::prefix('company')->middleware('permission:portal.view')->group(function () {
        Route::get('/', [CompanyController::class, 'overview']);
        Route::get('history', [CompanyController::class, 'history']);
        Route::get('leadership', [CompanyController::class, 'leadership']);
        Route::get('departments', [CompanyController::class, 'departments']);
        Route::get('locations', [CompanyController::class, 'locations']);
    });

    // --- Global search -------------------------------------------------------------------------------------------
    Route::get('search', [SearchController::class, 'index'])->middleware(['permission:portal.view', 'throttle:search']);

    // =====================================================================================================================
    // Administration (/api/admin/*). Every group is protected by permission middleware HERE; the React admin area is only a UI.
    // Employees (no admin permission) get 403 on all of it. Roles/permissions are a read-only catalogue; audit records have no
    // edit or delete routes.
    // =====================================================================================================================
    Route::prefix('admin')->middleware('throttle:admin')->group(function () {
        Route::get('dashboard', [AdminOverviewController::class, 'dashboard'])
            ->middleware('permission:admin.access,policies.manage,hr.manage,hr.directory.view,hr.directory.manage,hr.departments.manage,hr.approvals.manage,hr.company.manage,users.manage,requests.manage,requests.hr-review,requests.team-review,requests.it-review,helpdesk.manage,announcements.manage,announcements.hr-manage,calendar.manage,documents.manage,documents.hr-manage,documents.it-manage,recruitment.manage,benefits.manage,resources.manage,resources.it-manage,forms.manage');

        Route::middleware('permission:users.manage')->group(function () {
            Route::get('users', [AdminUserController::class, 'index']);
            Route::post('users', [AdminUserController::class, 'store'])->middleware('throttle:writes');
            Route::get('users/{user}', [AdminUserController::class, 'show'])->whereNumber('user');
            Route::put('users/{user}', [AdminUserController::class, 'update'])->whereNumber('user')->middleware('throttle:writes');
            Route::post('users/{user}/password-link', [AdminUserController::class, 'sendPasswordLink'])->whereNumber('user')->middleware('throttle:writes');
            Route::patch('users/{user}/status', [AdminUserController::class, 'status'])->whereNumber('user')->middleware('throttle:writes');
            Route::post('users/{user}/roles', [AdminUserController::class, 'addRole'])->whereNumber('user')->middleware('throttle:writes');
            Route::get('users/{user}/access', [AdminUserController::class, 'access'])->whereNumber('user');
            Route::put('users/{user}/access', [AdminUserController::class, 'updateAccess'])->whereNumber('user')->middleware('throttle:writes');
            Route::delete('users/{user}/roles/{role}', [AdminUserController::class, 'removeRole'])->whereNumber('user')->middleware('throttle:writes');
            Route::get('access-templates', [AccessTemplateController::class, 'index']);
            Route::post('access-templates', [AccessTemplateController::class, 'store'])->middleware('throttle:writes');
            Route::put('access-templates/{template}', [AccessTemplateController::class, 'update'])->whereNumber('template')->middleware('throttle:writes');
            Route::delete('access-templates/{template}', [AccessTemplateController::class, 'destroy'])->whereNumber('template')->middleware('throttle:writes');
        });

        Route::middleware('permission:roles.view,users.manage')->group(function () {
            Route::get('roles', [AdminOverviewController::class, 'roles']);
            Route::get('roles/{role}', [AdminOverviewController::class, 'role'])->whereNumber('role');
            Route::get('permissions', [AdminOverviewController::class, 'permissions']);
        });

        // --- HR Management (/api/admin/hr/*): portal-managed directory and company content. HR enters everything by hand. ---
        Route::prefix('hr')->group(function () {
            Route::get('dashboard', [AdminCompanyController::class, 'dashboard'])->middleware('permission:hr.manage');

            Route::middleware('permission:hr.directory.view,hr.directory.manage')->group(function () {
                Route::get('employees', [AdminDirectoryController::class, 'index']);
                Route::get('employees/unlinked-users', [AdminDirectoryController::class, 'unlinkedUsers'])->middleware('permission:hr.directory.manage');
                Route::get('employees/{id}', [AdminDirectoryController::class, 'show'])->whereNumber('id');
            });
            Route::post('employees', [AdminDirectoryController::class, 'store'])->middleware(['permission:hr.directory.manage', 'throttle:writes']);
            Route::put('employees/{id}', [AdminDirectoryController::class, 'update'])->whereNumber('id')->middleware(['permission:hr.directory.manage', 'throttle:writes']);
            Route::patch('employees/{id}/visibility', [AdminDirectoryController::class, 'visibility'])->whereNumber('id')->middleware(['permission:hr.directory.visibility', 'throttle:writes']);
            Route::get('employees/{id}/personal', [AdminDirectoryController::class, 'personal'])->whereNumber('id')->middleware('permission:hr.directory.manage');
            Route::post('employees/import/preview', [AdminDirectoryController::class, 'importPreview'])->middleware(['permission:hr.directory.manage', 'throttle:writes']);
            Route::post('employees/import', [AdminDirectoryController::class, 'import'])->middleware(['permission:hr.directory.manage', 'throttle:writes']);
            Route::post('employees/create-logins', [AdminDirectoryController::class, 'createLogins'])->middleware(['permission:hr.directory.manage', 'throttle:writes']);
            Route::post('employees/{id}/link-account', [AdminDirectoryController::class, 'linkAccount'])->whereNumber('id')->middleware(['permission:hr.directory.manage', 'throttle:writes']);

            $hrCrud = function (string $path, string $controller, string $permission, bool $status = true) {
                Route::middleware('permission:'.$permission)->group(function () use ($path, $controller, $status) {
                    Route::get($path, [$controller, 'index']);
                    Route::post($path, [$controller, 'store'])->middleware('throttle:writes');
                    Route::get($path.'/{id}', [$controller, 'show'])->whereNumber('id');
                    Route::put($path.'/{id}', [$controller, 'update'])->whereNumber('id')->middleware('throttle:writes');
                    if ($status) {
                        Route::patch($path.'/{id}/status', [$controller, 'status'])->whereNumber('id')->middleware('throttle:writes');
                    }
                    Route::delete($path.'/{id}', [$controller, 'destroy'])->whereNumber('id')->middleware('throttle:writes');
                });
            };
            $hrCrud('departments', AdminDepartmentController::class, 'hr.departments.manage');
            $hrCrud('company/locations', AdminLocationController::class, 'hr.company.manage');
            $hrCrud('company/history', AdminHistoryController::class, 'hr.company.manage');
            $hrCrud('company/leadership', AdminLeadershipController::class, 'hr.company.manage');
            Route::middleware('permission:hr.approvals.manage')->group(function () {
                Route::get('approval-fallback', [\App\Http\Controllers\Api\Admin\Hr\AdminApprovalFallbackController::class, 'show']);
                Route::put('approval-fallback', [\App\Http\Controllers\Api\Admin\Hr\AdminApprovalFallbackController::class, 'update'])->middleware('throttle:writes');
            });
            $hrCrud('approval-routes', \App\Http\Controllers\Api\Admin\Hr\AdminApprovalRouteController::class, 'hr.approvals.manage', false);

            Route::middleware('permission:hr.company.manage')->group(function () {
                Route::get('company', [AdminCompanyController::class, 'show']);
                Route::put('company', [AdminCompanyController::class, 'update'])->middleware('throttle:writes');
            });
        });

        Route::get('activity-log', [AdminOverviewController::class, 'activityLog'])->middleware('permission:audit.view');
        Route::middleware('permission:settings.manage')->group(function () {
            Route::get('settings', [AdminOverviewController::class, 'settings']);
            Route::put('settings', [AdminOverviewController::class, 'updateSettings'])->middleware('throttle:writes');
        });
        Route::middleware('permission:notifications.manage')->group(function () {
            Route::get('notifications', [AdminNotificationController::class, 'index']);
            Route::post('notifications', [AdminNotificationController::class, 'store'])->middleware('throttle:writes');
        });

        $crud = function (string $path, string $controller, bool $deletable = true) {
            Route::get($path, [$controller, 'index']);
            Route::post($path, [$controller, 'store'])->middleware('throttle:writes');
            Route::get($path.'/{id}', [$controller, 'show'])->whereNumber('id');
            Route::put($path.'/{id}', [$controller, 'update'])->whereNumber('id')->middleware('throttle:writes');
            if ($deletable) {
                Route::delete($path.'/{id}', [$controller, 'destroy'])->whereNumber('id')->middleware('throttle:writes');
            }
        };
        Route::middleware('permission:documents.manage,documents.hr-manage,documents.it-manage')->group(function () use ($crud) {
            $crud('documents', AdminDocumentController::class);
            Route::get('document-categories', [AdminDocumentCategoryController::class, 'index']);
            Route::post('document-categories', [AdminDocumentCategoryController::class, 'store'])->middleware('throttle:writes');
            Route::put('document-categories/{id}', [AdminDocumentCategoryController::class, 'update'])->whereNumber('id')->middleware('throttle:writes');
        });
        Route::middleware('permission:policies.manage')->group(function () use ($crud) {
            $crud('policies', AdminPolicyController::class, false);
            Route::get('policies/{id}/acknowledgements', [AdminPolicyController::class, 'acknowledgements'])->whereNumber('id');
            Route::post('policies/{id}/new-version', [AdminPolicyController::class, 'newVersion'])->whereNumber('id')->middleware('throttle:writes');
            Route::post('policies/{id}/remind', [AdminPolicyController::class, 'remind'])->whereNumber('id')->middleware('throttle:writes');
        });
        Route::middleware('permission:forms.manage')->group(fn () => $crud('forms', AdminFormController::class));
        Route::middleware('permission:requests.manage')->group(fn () => $crud('request-types', AdminRequestTypeController::class, false));
        Route::middleware('permission:benefits.manage')->group(fn () => $crud('benefits', AdminBenefitController::class));
        Route::middleware('permission:resources.manage,resources.it-manage')->group(fn () => $crud('resources', AdminResourceController::class));
        Route::middleware('permission:recruitment.manage')->group(function () use ($crud) {
            $crud('recruitment/jobs', AdminJobController::class);
            Route::get('recruitment/applications', [AdminJobController::class, 'applications']);
            Route::get('recruitment/referrals', [AdminJobController::class, 'referrals']);
        });
    });

    // Staff handling of helpdesk tickets (status, priority, assignee): IT and administrators only.
    Route::post('helpdesk/tickets/{ticket}/claim', [HelpdeskTicketController::class, 'claim'])->whereNumber('ticket')->middleware(['permission:helpdesk.manage', 'throttle:writes']);
    Route::patch('helpdesk/tickets/{ticket}', [HelpdeskTicketController::class, 'staffUpdate'])->whereNumber('ticket')->middleware(['permission:helpdesk.manage', 'throttle:writes']);
});
