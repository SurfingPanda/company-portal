<?php

namespace Tests\Feature\Api;

use App\Enums\ContentStatus;
use App\Enums\DocumentAccessLevel;
use App\Models\Announcement;
use App\Models\Benefit;
use App\Models\CalendarEvent;
use App\Models\Document;
use App\Models\DocumentCategory;
use App\Models\EmployeeForm;
use App\Models\Resource;
use Illuminate\Support\Facades\Gate;

class ContentApiTest extends ApiTestCase
{
    private function announcement(array $attributes = []): Announcement
    {
        static $n = 0;
        $n++;

        return Announcement::query()->forceCreate([
            'title' => "Announcement {$n}", 'slug' => "announcement-{$n}", 'summary' => 'summary', 'content' => 'content', 'category' => 'training',
            'priority' => 'normal', 'status' => 'published', 'published_at' => now()->subDay(), ...$attributes,
        ]);
    }

    // --- Announcements ---------------------------------------------------------------------------------------------

    public function test_employees_only_see_published_announcements_inside_their_window(): void
    {
        $visible = $this->announcement(['title' => 'Visible training']);
        $this->announcement(['title' => 'Draft one', 'status' => 'draft']);
        $this->announcement(['title' => 'Archived one', 'status' => 'archived']);
        $this->announcement(['title' => 'Scheduled one', 'published_at' => now()->addDay()]);
        $this->announcement(['title' => 'Expired one', 'expires_at' => now()->subHour()]);
        $this->signIn();

        $response = $this->getJson('/api/announcements')->assertOk();

        $this->assertSame(['Visible training'], collect($response->json('data'))->pluck('title')->all());
        $response->assertJsonStructure(['data', 'meta' => ['current_page', 'last_page', 'per_page', 'total']])->assertJsonPath('meta.per_page', 20);
        $this->assertArrayNotHasKey('status', $response->json('data.0'), 'workflow state is for managers only');
        $this->getJson('/api/announcements/'.Announcement::where('title', 'Draft one')->value('id'))->assertStatus(404);
        $this->getJson("/api/announcements/{$visible->id}")->assertOk()->assertJsonPath('data.title', 'Visible training');
    }

    public function test_announcement_filters_search_pagination_and_pinning(): void
    {
        $this->announcement(['title' => 'Safety drill', 'category' => 'safety', 'priority' => 'urgent']);
        $this->announcement(['title' => 'Training day', 'category' => 'training', 'is_pinned' => true]);
        $this->announcement(['title' => 'Other news', 'category' => 'training']);
        $this->signIn();

        $this->assertSame(['Safety drill'], collect($this->getJson('/api/announcements?category=safety')->json('data'))->pluck('title')->all());
        $this->assertSame(['Safety drill'], collect($this->getJson('/api/announcements?priority=urgent')->json('data'))->pluck('title')->all());
        $this->assertSame(['Training day'], collect($this->getJson('/api/announcements?search=training')->json('data'))->pluck('title')->all());
        $this->assertSame('Training day', $this->getJson('/api/announcements')->json('data.0.title'), 'pinned first');
        $this->assertSame(['Training day'], collect($this->getJson('/api/announcements?pinned=true')->json('data'))->pluck('title')->all());
        $this->getJson('/api/announcements?per_page=2&page=2')->assertOk()->assertJsonPath('meta.total', 3)->assertJsonCount(1, 'data');
    }

    public function test_pagination_and_filter_values_are_validated(): void
    {
        $this->signIn();

        $this->getJson('/api/announcements?per_page=1000')->assertStatus(422)->assertJsonValidationErrors('per_page');
        $this->getJson('/api/announcements?per_page=0')->assertStatus(422);
        $this->getJson('/api/announcements?sort=password;drop')->assertStatus(422)->assertJsonValidationErrors('sort');
        $this->getJson('/api/announcements?category=not-a-category')->assertStatus(422);
        $this->getJson('/api/announcements?from=2026-10-10&to=2026-10-01')->assertStatus(422);
    }

    public function test_search_input_is_never_treated_as_sql_or_wildcards(): void
    {
        $this->announcement(['title' => '100% Sample']);
        $this->announcement(['title' => 'Plain announcement']);
        $this->signIn();

        $this->assertSame(['100% Sample'], collect($this->getJson('/api/announcements?search='.urlencode('100%'))->json('data'))->pluck('title')->all());
        $this->assertCount(0, $this->getJson('/api/announcements?search='.urlencode("' OR 1=1 --"))->json('data'));
        $this->assertSame(['100% Sample'], collect($this->getJson('/api/announcements?search=%25')->json('data'))->pluck('title')->all(), 'a lone % is a literal, not "match everything"');
    }

    public function test_employees_cannot_manage_announcements_but_hr_can(): void
    {
        $payload = ['title' => 'New policy', 'summary' => 'Short', 'content' => 'Body', 'category' => 'policy', 'status' => 'published'];

        $this->signIn('employee');
        $this->postJson('/api/announcements', $payload)->assertStatus(403);
        $this->putJson('/api/announcements/'.$this->announcement()->id, ['title' => 'x'])->assertStatus(403);
        $this->deleteJson('/api/announcements/'.$this->announcement()->id)->assertStatus(403);

        $this->actingAs($this->makeUser('hr'));
        $created = $this->postJson('/api/announcements', $payload)->assertCreated()->assertJsonPath('data.status', 'published');
        $id = $created->json('data.id');
        $this->putJson("/api/announcements/{$id}", ['title' => 'New policy v2'])->assertOk()->assertJsonPath('data.title', 'New policy v2');
        $this->postJson('/api/announcements', [])->assertStatus(422)->assertJsonValidationErrors(['title', 'summary', 'content']);
        $this->deleteJson("/api/announcements/{$id}")->assertNoContent();
        $this->assertSoftDeleted('announcements', ['id' => $id]);
    }

    // --- Calendar ----------------------------------------------------------------------------------------------------

    public function test_calendar_events_filter_by_range_category_and_visibility(): void
    {
        $make = fn (array $a) => CalendarEvent::query()->forceCreate(['title' => 'Event', 'category' => 'meeting', 'status' => 'scheduled', 'visibility' => 'all', ...$a]);
        $make(['title' => 'October town hall', 'starts_at' => '2026-10-15 09:00:00', 'category' => 'company-event']);
        $make(['title' => 'September meeting', 'starts_at' => '2026-09-10 09:00:00']);
        $make(['title' => 'Private review', 'starts_at' => '2026-10-16 09:00:00', 'visibility' => 'private']);
        $make(['title' => 'Spans into october', 'starts_at' => '2026-09-30 09:00:00', 'ends_at' => '2026-10-02 17:00:00']);
        $this->signIn();

        $titles = fn (string $q) => collect($this->getJson("/api/calendar/events{$q}")->assertOk()->json('data'))->pluck('title')->all();

        $this->assertSame(['Spans into october', 'October town hall'], $titles('?from=2026-10-01&to=2026-10-31'));
        $this->assertSame(['October town hall'], $titles('?category=company-event'));
        $this->assertSame(['October town hall'], $titles('?search=town'));
        $this->assertNotContains('Private review', $titles(''), 'private events are not shown to ordinary employees');
        $this->getJson('/api/calendar/events/'.CalendarEvent::where('title', 'Private review')->value('id'))->assertStatus(404);
    }

    public function test_only_calendar_managers_can_write_events(): void
    {
        $payload = ['title' => 'Planning day', 'starts_at' => '2026-11-03 09:00:00', 'category' => 'meeting'];

        $this->signIn('hr');
        $this->postJson('/api/calendar/events', $payload)->assertStatus(403);

        $this->actingAs($this->makeUser('admin'));
        $id = $this->postJson('/api/calendar/events', $payload)->assertCreated()->json('data.id');
        $this->putJson("/api/calendar/events/{$id}", ['status' => 'cancelled'])->assertOk()->assertJsonPath('data.status', 'cancelled');
        $this->postJson('/api/calendar/events', ['title' => 'Bad', 'starts_at' => '2026-11-03 09:00:00', 'ends_at' => '2026-11-02 09:00:00'])->assertStatus(422);
    }

    // --- Documents ---------------------------------------------------------------------------------------------------

    private function document(array $attributes = []): Document
    {
        return Document::factory()->create($attributes);
    }

    public function test_documents_are_filtered_by_access_level_on_the_server(): void
    {
        $open = $this->document(['title' => 'Open policy']);
        $managerOnly = $this->document(['title' => 'Manager guide', 'access_level' => DocumentAccessLevel::Manager]);
        $restricted = $this->document(['title' => 'Restricted memo', 'access_level' => DocumentAccessLevel::Restricted]);
        $draft = $this->document(['title' => 'Draft policy', 'status' => ContentStatus::Draft]);

        $this->signIn('employee');
        $titles = fn () => collect($this->getJson('/api/documents')->assertOk()->json('data'))->pluck('title')->all();
        $this->assertSame(['Open policy'], $titles());
        foreach ([$managerOnly, $restricted, $draft] as $hidden) {
            $this->getJson("/api/documents/{$hidden->id}")->assertStatus(404);
            $this->getJson("/api/documents/{$hidden->id}/download")->assertStatus(404);
        }
        $this->getJson("/api/documents/{$open->id}")->assertOk();
        $response = $this->getJson("/api/documents/{$open->id}")->assertOk();
        $this->assertArrayNotHasKey('storage_path', $response->json('data'));
        $this->assertArrayNotHasKey('storage_disk', $response->json('data'));

        $this->actingAs($this->makeUser('manager'));
        $this->assertEqualsCanonicalizing(['Open policy', 'Manager guide'], $titles());

        $this->actingAs($this->makeUser('hr'));
        $this->assertCount(4, $this->getJson('/api/documents')->json('data'), 'document managers see everything');
    }

    public function test_the_sql_scope_and_the_policy_agree_for_every_role_and_level(): void
    {
        $documents = collect(DocumentAccessLevel::cases())->flatMap(fn ($level) => [
            $this->document(['access_level' => $level, 'department' => 'Finance']),
            $this->document(['access_level' => $level, 'department' => 'Finance', 'status' => ContentStatus::Draft]),
        ]);

        foreach (['employee', 'manager', 'hr', 'it', 'admin'] as $role) {
            $user = $this->makeUser($role);
            $viaScope = Document::query()->accessibleTo($user)->pluck('id')->sort()->values()->all();
            $viaPolicy = $documents->filter(fn ($d) => Gate::forUser($user)->allows('view', $d))->pluck('id')->sort()->values()->all();
            $this->assertSame($viaPolicy, $viaScope, "scope and policy disagree for {$role}");
        }
    }

    public function test_department_documents_follow_the_directory_department(): void
    {
        $finance = $this->document(['title' => 'Finance only', 'access_level' => DocumentAccessLevel::Department, 'department' => 'Finance']);
        $this->signIn();

        $this->assertCount(0, $this->getJson('/api/documents')->json('data'), 'no directory entry: department unknown, so denied');

        $user = auth()->user();
        $dept = \App\Models\Department::query()->forceCreate(['name' => 'Finance', 'status' => 'published']);
        \App\Models\DirectoryEntry::query()->forceCreate(['employee_id' => $user->employee_id, 'user_id' => $user->id, 'display_name' => 'Sample Person', 'department_id' => $dept->id, 'source' => 'manual', 'verification' => 'unverified']);
        $user->unsetRelation('directoryEntry');
        $this->assertCount(1, $this->getJson('/api/documents')->json('data'));
        $this->getJson("/api/documents/{$finance->id}")->assertOk();
    }

    public function test_document_filters_categories_recent_and_popular(): void
    {
        $policies = DocumentCategory::query()->create(['slug' => 'policies-x', 'name' => 'Policies & Guidelines X']);
        $forms = DocumentCategory::query()->create(['slug' => 'forms-x', 'name' => 'Forms X']);
        $a = $this->document(['title' => 'Leave policy', 'document_category_id' => $policies->id, 'department' => 'HR', 'file_type' => 'PDF', 'published_at' => now()->subDays(5)]);
        $b = $this->document(['title' => 'Expense form', 'document_category_id' => $forms->id, 'file_type' => 'DOCX', 'published_at' => now()->subDays(1)]);
        $restrictedCategory = DocumentCategory::query()->create(['slug' => 'secret-x', 'name' => 'Secret X']);
        $this->document(['document_category_id' => $restrictedCategory->id, 'access_level' => DocumentAccessLevel::Restricted]);
        $this->signIn();

        $this->assertSame(['Leave policy'], collect($this->getJson('/api/documents?search=policy&category=policies-x')->json('data'))->pluck('title')->all());
        $this->assertSame(['Expense form'], collect($this->getJson('/api/documents?file_type=docx')->json('data'))->pluck('title')->all());
        $this->assertSame(['Leave policy'], collect($this->getJson('/api/documents?department=HR')->json('data'))->pluck('title')->all());
        $this->assertSame(['Expense form', 'Leave policy'], collect($this->getJson('/api/documents?sort=title&direction=asc')->json('data'))->pluck('title')->all());

        $categories = $this->getJson('/api/documents/categories')->assertOk()->json('data');
        $this->assertEqualsCanonicalizing(['Policies & Guidelines X', 'Forms X'], collect($categories)->pluck('name')->all(), 'a category holding only restricted documents is not listed');
        $this->assertArrayHasKey('id', $categories[0]);

        $this->assertSame(['Expense form', 'Leave policy'], collect($this->getJson('/api/documents/recent')->json('data'))->pluck('title')->all());

        // Opening a document records a view; popularity follows views.
        $this->getJson("/api/documents/{$a->id}")->assertOk();
        $this->getJson("/api/documents/{$a->id}")->assertOk();
        $this->assertSame(1, \App\Models\ActivityLog::where('activity_type', 'document_viewed')->count(), 'one view entry per user, document and day');
        $this->assertSame('Leave policy', $this->getJson('/api/documents/popular')->json('data.0.title'));
    }

    // --- Forms -------------------------------------------------------------------------------------------------------

    public function test_forms_reference_their_document_without_duplicating_it_and_hide_inaccessible_documents(): void
    {
        $open = $this->document(['title' => 'Open form file']);
        $restricted = $this->document(['access_level' => DocumentAccessLevel::Restricted]);
        EmployeeForm::query()->forceCreate(['title' => 'Leave form', 'category' => 'hr', 'form_type' => 'download', 'document_id' => $open->id, 'status' => 'published']);
        EmployeeForm::query()->forceCreate(['title' => 'Secret form', 'category' => 'hr', 'form_type' => 'download', 'document_id' => $restricted->id, 'status' => 'published']);
        EmployeeForm::query()->forceCreate(['title' => 'Draft form', 'category' => 'hr', 'status' => 'draft']);
        $this->signIn();

        $data = collect($this->getJson('/api/forms?category=hr')->assertOk()->json('data'))->keyBy('title');

        $this->assertSame(['Leave form', 'Secret form'], $data->keys()->sort()->values()->all());
        $this->assertSame($open->id, $data['Leave form']['document_id']);
        $this->assertNull($data['Secret form']['document_id'], 'a restricted document id is never revealed through a form');
        $this->assertArrayNotHasKey('storage_path', $data['Leave form']);
        $this->assertSame(['Leave form'], collect($this->getJson('/api/forms?search=leave')->json('data'))->pluck('title')->all());
        $this->getJson('/api/forms/'.EmployeeForm::where('title', 'Draft form')->value('id'))->assertStatus(404);
    }

    // --- Benefits / resources / search -------------------------------------------------------------------------------

    public function test_benefits_are_informational_lists(): void
    {
        Benefit::query()->forceCreate(['slug' => 'health', 'name' => 'Health information', 'short_description' => 'Info', 'description' => 'Text', 'category' => 'health', 'is_featured' => true]);
        Benefit::query()->forceCreate(['slug' => 'programs', 'name' => 'Programs', 'short_description' => 'Info', 'description' => 'Text', 'category' => 'programs']);
        $this->signIn();

        $this->assertCount(2, $this->getJson('/api/benefits')->assertOk()->json('data'));
        $this->assertSame(['Health information'], collect($this->getJson('/api/benefits?category=health')->json('data'))->pluck('name')->all());
        $this->assertSame(['Health information'], collect($this->getJson('/api/benefits/featured')->json('data'))->pluck('name')->all());
        $this->assertEqualsCanonicalizing(['health', 'programs'], collect($this->getJson('/api/benefits/categories')->json('data'))->pluck('slug')->all());
        $this->getJson('/api/benefits/faq')->assertOk()->assertJsonStructure(['data', 'meta']);
        $show = $this->getJson('/api/benefits/'.Benefit::where('slug', 'health')->value('id'))->assertOk()->json('data');
        foreach (['amount', 'balance', 'eligible', 'claim'] as $computed) {
            $this->assertArrayNotHasKey($computed, $show, "benefits never expose a calculated {$computed}");
        }
    }

    public function test_resources_reference_other_entities_and_support_filters(): void
    {
        $document = $this->document(['title' => 'Handbook']);
        Resource::query()->forceCreate(['title' => 'Handbook link', 'category' => 'company', 'resource_type' => 'document', 'document_id' => $document->id, 'is_featured' => true, 'status' => 'published']);
        Resource::query()->forceCreate(['title' => 'Helpdesk page', 'category' => 'it', 'resource_type' => 'page', 'target_url' => '/helpdesk', 'status' => 'published']);
        Resource::query()->forceCreate(['title' => 'Hidden draft', 'category' => 'it', 'resource_type' => 'page', 'status' => 'draft']);
        $this->signIn();

        $this->assertCount(2, $this->getJson('/api/resources')->json('data'));
        $this->assertSame(['Helpdesk page'], collect($this->getJson('/api/resources?category=it')->json('data'))->pluck('title')->all());
        $this->assertSame(['Handbook link'], collect($this->getJson('/api/resources?resource_type=document')->json('data'))->pluck('title')->all());
        $this->assertSame(['Handbook link'], collect($this->getJson('/api/resources/featured')->json('data'))->pluck('title')->all());
        $this->assertSame($document->id, $this->getJson('/api/resources?featured=true')->json('data.0.document_id'));
        $this->getJson('/api/resources/categories')->assertOk();
        $this->getJson('/api/resources/faq')->assertOk();
        $this->getJson('/api/resources/'.Resource::where('title', 'Hidden draft')->value('id'))->assertStatus(404);
    }

    public function test_global_search_covers_portal_entities_and_respects_visibility(): void
    {
        $this->announcement(['title' => 'Leave filing reminder']);
        $this->announcement(['title' => 'Leave draft', 'status' => 'draft']);
        $this->document(['title' => 'Leave policy']);
        $this->document(['title' => 'Leave restricted', 'access_level' => DocumentAccessLevel::Restricted]);
        EmployeeForm::query()->forceCreate(['title' => 'Leave form', 'category' => 'hr', 'status' => 'published']);
        Benefit::query()->forceCreate(['slug' => 'l', 'name' => 'Leave credits info', 'short_description' => 's', 'description' => 'd', 'category' => 'other']);
        $this->signIn();

        $all = $this->getJson('/api/search?q=leave')->assertOk();
        $found = collect($all->json('data'))->map(fn ($r) => $r['type'].':'.$r['title'])->sort()->values()->all();
        $this->assertSame(['announcements:Leave filing reminder', 'benefits:Leave credits info', 'documents:Leave policy', 'forms:Leave form'], $found);
        $this->assertSame(1, $all->json('meta.counts.documents'));

        $typed = $this->getJson('/api/search?q=leave&type=documents&page=1')->assertOk();
        $this->assertSame(['Leave policy'], collect($typed->json('data'))->pluck('title')->all());
        $typed->assertJsonStructure(['data', 'meta' => ['current_page', 'last_page', 'per_page', 'total']]);

        $this->getJson('/api/search?q=l')->assertStatus(422);
        $this->getJson('/api/search')->assertStatus(422);
        $this->getJson('/api/search?q=leave&type=users')->assertStatus(422);
    }
}
