<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Named sets of permissions an administrator applies to a person with one click (see the Access screen). A template is only a
     * shortcut for ticking boxes: applying it fills the check boxes, and the grants themselves are still saved per person.
     */
    public function up(): void
    {
        Schema::create('access_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80)->unique();
            $table->string('description', 255)->nullable();
            $table->json('permissions');
            $table->timestamps();
        });

        $starters = [
            ['Team Lead', 'Reviews their team\'s requests and sees team reports.', ['requests.team-review', 'reports.team-view', 'directory.team-view']],
            ['HR Staff', 'Runs HR records, policies, HR content and HR requests.', ['hr.manage', 'hr.directory.view', 'hr.directory.manage', 'hr.departments.manage', 'hr.approvals.manage', 'hr.company.manage', 'hr.company.publish', 'policies.manage', 'documents.hr-manage', 'announcements.hr-manage', 'requests.hr-review', 'benefits.manage', 'recruitment.manage', 'reports.view']],
            ['Recruiter', 'Manages job postings and applications.', ['recruitment.manage', 'reports.view']],
            ['Policy Officer', 'Writes and publishes policies, sees who has not acknowledged them.', ['policies.manage']],
            ['IT Support', 'Works helpdesk tickets and IT requests, manages IT documents and resources.', ['helpdesk.manage', 'requests.it-review', 'documents.it-manage', 'resources.it-manage']],
            ['Content Editor', 'Posts announcements, calendar events, documents and resources (for example Marketing).', ['announcements.hr-manage', 'calendar.manage', 'documents.hr-manage', 'resources.manage']],
            ['Reports Viewer', 'Reads company reports only (for example Finance).', ['reports.view']],
        ];
        $now = now();
        foreach ($starters as [$name, $description, $permissions]) {
            DB::table('access_templates')->insert(['name' => $name, 'description' => $description, 'permissions' => json_encode($permissions), 'created_at' => $now, 'updated_at' => $now]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('access_templates');
    }
};
