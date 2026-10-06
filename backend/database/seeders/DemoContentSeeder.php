<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\Benefit;
use App\Models\BenefitFaq;
use App\Models\CalendarEvent;
use App\Models\Document;
use App\Models\DocumentCategory;
use App\Models\EmployeeForm;
use App\Models\RecruitmentJob;
use App\Models\RequestType;
use App\Models\Resource;
use App\Models\ResourceFaq;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * SAMPLE / DEMO / MOCK DATA. DEVELOPMENT ONLY.
 * Every row is fictional placeholder content flagged `is_sample` and labelled "(Sample)". Nothing here is an official
 * ELJIN announcement, policy, event, benefit or vacancy, and no company address, executive, salary or contact is invented.
 */
class DemoContentSeeder extends Seeder
{
    public function run(): void
    {
        $author = User::query()->where('employee_id', 'EMP-0003')->first();
        $sample = ['is_sample' => true];

        // Announcements
        foreach ([
            ['sample-company-update', 'Sample Company Update', 'company-news', 'normal', true],
            ['sample-hr-reminder', 'Sample HR Reminder', 'hr', 'important', false],
            ['sample-it-maintenance', 'Sample IT Maintenance Notice', 'it', 'normal', false],
        ] as [$slug, $title, $category, $priority, $pinned]) {
            Announcement::query()->updateOrCreate(['slug' => $slug], [
                'title' => $title, 'summary' => 'Sample summary. Not an official announcement.', 'content' => 'SAMPLE / DEMO content. Replace with approved announcements.',
                'category' => $category, 'priority' => $priority, 'status' => 'published', 'is_pinned' => $pinned,
                'published_at' => now()->subDays(2), 'author_user_id' => $author?->getKey(), ...$sample,
            ]);
        }

        // Calendar events
        foreach ([
            ['Sample Training Session', 'training', 7], ['Sample Department Meeting', 'meeting', 3], ['Sample Holiday Placeholder', 'holiday', 21],
        ] as [$title, $category, $days]) {
            CalendarEvent::query()->updateOrCreate(['title' => $title], [
                'description' => 'Sample event. Not a real company event.', 'category' => $category, 'status' => 'scheduled', 'visibility' => 'all',
                'location' => 'Sample Location', 'starts_at' => now()->addDays($days)->setTime(9, 0), 'ends_at' => now()->addDays($days)->setTime(10, 0),
                'author_user_id' => $author?->getKey(), ...$sample,
            ]);
        }

        // Document categories and sample document metadata (no files exist)
        $categories = [];
        foreach ([['policies', 'Policies & Guidelines'], ['forms', 'Forms'], ['hr', 'HR Resources'], ['it', 'IT Resources']] as $i => [$slug, $name]) {
            $categories[$slug] = DocumentCategory::query()->updateOrCreate(['slug' => $slug], ['name' => $name, 'sort_order' => $i]);
        }
        $documents = [];
        foreach ([
            ['sample-employee-handbook', 'Sample Employee Handbook', 'hr', 'all'],
            ['sample-leave-request-form', 'Sample Leave Request Form', 'forms', 'all'],
            ['sample-password-guide', 'Sample Password Guide', 'it', 'all'],
            ['sample-manager-guide', 'Sample Manager Guide', 'hr', 'manager'],
        ] as [$slug, $title, $category, $access]) {
            $documents[$slug] = Document::query()->updateOrCreate(['slug' => $slug], [
                'title' => $title, 'description' => 'Sample document record. No file exists.', 'document_category_id' => $categories[$category]->getKey(),
                'department' => 'Human Resources', 'file_type' => 'PDF', 'version' => '1.0', 'owner' => 'Sample Department', 'access_level' => $access,
                'status' => 'published', 'published_at' => now()->subDays(10), 'created_by' => $author?->getKey(), ...$sample,
            ]);
        }

        // Request types and forms
        // The same catalog the React portal ships (database/seeders/data/request_types.json, `code` = the React request type id),
        // so API mode resolves every request type the UI offers. Wording is sample text.
        $types = [];
        foreach (json_decode(file_get_contents(database_path('seeders/data/request_types.json')), true) as $row) {
            $types[$row['code']] = RequestType::query()->updateOrCreate(['request_code' => $row['code']], [
                'name' => $row['name'], 'description' => $row['description'], 'category' => $row['category'], 'reference_prefix' => $row['prefix'],
                'requires_attachment' => $row['requires_attachment'], 'requires_approval' => $row['requires_approval'],
                'status' => $row['status'], 'is_active' => $row['status'] === 'available', 'fields' => $row['fields'], ...$sample,
            ]);
        }
        EmployeeForm::query()->updateOrCreate(['title' => 'Sample Leave Request Form'], [
            'description' => 'Sample downloadable form.', 'category' => 'hr', 'form_type' => 'download', 'document_id' => $documents['sample-leave-request-form']->getKey(), ...$sample,
        ]);
        EmployeeForm::query()->updateOrCreate(['title' => 'Sample HR Inquiry (Online)'], [
            'description' => 'Sample online form.', 'category' => 'hr', 'form_type' => 'online', 'request_type_id' => $types['rt-hr-inquiry']->getKey(), ...$sample,
        ]);

        // Benefits (information only: no coverage, amounts, providers or eligibility)
        $benefit = null;
        foreach ([['sample-health', 'Sample Health & Wellness', 'health'], ['sample-insurance', 'Sample Insurance Information', 'insurance'], ['sample-programs', 'Sample Employee Programs', 'programs']] as [$slug, $name, $category]) {
            $benefit = Benefit::query()->updateOrCreate(['slug' => $slug], [
                'name' => $name, 'short_description' => 'Sample benefit information.', 'description' => 'SAMPLE / DEMO. Replace with HR-approved information.',
                'category' => $category, 'status' => 'information-only', 'is_featured' => $slug === 'sample-health', ...$sample,
            ]);
        }
        BenefitFaq::query()->updateOrCreate(['question' => 'Where can I find official benefits information? (Sample)'], [
            'benefit_id' => null, 'answer' => 'Sample answer. Official information comes from HR.', 'category' => 'Information', ...$sample,
        ]);
        BenefitFaq::query()->updateOrCreate(['question' => 'How do I ask about a benefit? (Sample)'], [
            'benefit_id' => $benefit?->getKey(), 'answer' => 'Sample answer. Submit a benefits inquiry request.', 'category' => 'Requests', ...$sample,
        ]);

        // Recruitment (fictional postings)
        foreach ([['Sample IT Support Technician', 'IT / MIS', 'full-time'], ['Sample Accounting Assistant', 'Finance', 'full-time'], ['Sample Operations Intern', 'Operations', 'internship']] as [$title, $department, $type]) {
            RecruitmentJob::query()->updateOrCreate(['title' => $title], [
                'department' => $department, 'location' => 'Sample Location A', 'employment_type' => $type, 'work_arrangement' => 'on-site',
                'summary' => 'Sample position. Not a real vacancy.', 'description' => 'SAMPLE / DEMO posting.', 'requirements' => "Sample requirement one\nSample requirement two",
                'status' => 'open', 'published_at' => now()->subDays(5), 'closing_at' => now()->addDays(30), ...$sample,
            ]);
        }

        // Resources point at existing records; they do not copy content
        Resource::query()->updateOrCreate(['title' => 'Sample Employee Handbook'], [
            'description' => 'Points at the sample handbook document.', 'category' => 'hr', 'resource_type' => 'document', 'document_id' => $documents['sample-employee-handbook']->getKey(), 'is_featured' => true, ...$sample,
        ]);
        Resource::query()->updateOrCreate(['title' => 'Sample Benefits Overview'], [
            'description' => 'Points at a sample benefit.', 'category' => 'benefits', 'resource_type' => 'page', 'benefit_id' => $benefit?->getKey(), 'target_url' => '/benefits', ...$sample,
        ]);
        Resource::query()->updateOrCreate(['title' => 'Sample IT Helpdesk'], [
            'description' => 'Points at the helpdesk page.', 'category' => 'it', 'resource_type' => 'service', 'service_key' => 'it-helpdesk', 'target_url' => '/helpdesk', ...$sample,
        ]);
        foreach ([['Where can I submit a request? (Sample)', 'hr', '/forms'], ['Where is the helpdesk? (Sample)', 'it', '/helpdesk']] as $i => [$question, $category, $route]) {
            ResourceFaq::query()->updateOrCreate(['question' => $question], ['answer' => 'Sample answer that points to the right module.', 'category' => $category, 'related_route' => $route, 'sort_order' => $i, ...$sample]);
        }
    }
}
