<?php

namespace Database\Seeders;

use App\Models\CompanyHistoryEntry;
use App\Models\CompanyLocation;
use App\Models\CompanyPage;
use App\Models\Department;
use App\Models\DirectoryEntry;
use App\Models\LeadershipProfile;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * SAMPLE / DEMO DATA, DEVELOPMENT ONLY (DatabaseSeeder refuses to call this in production). It loads the same fictional
 * placeholder content the React portal ships (database/seeders/data/hr_content.json) so API mode looks like mock mode:
 * placeholder company text, placeholder departments/locations/leadership, fictional directory people.
 * Every row is flagged `is_sample`. None of it is official ELJIN information; HR replaces it through the admin area.
 */
class DemoHrContentSeeder extends Seeder
{
    public function run(): void
    {
        $data = json_decode(file_get_contents(database_path('seeders/data/hr_content.json')), true);
        $sample = ['is_sample' => true];

        $names = collect($data['departments'])->pluck('name')->merge(collect($data['employees'])->pluck('department'))->unique()->values();
        $departments = [];
        foreach ($names as $i => $name) {
            $source = collect($data['departments'])->firstWhere('name', $name);
            $departments[$name] = Department::query()->updateOrCreate(['name' => $name], [
                'description' => $source['description'] ?? 'Sample department. Description to be confirmed by HR.', 'sort_order' => $i, 'status' => 'published', ...$sample,
            ]);
        }

        $locNames = collect($data['locations'])->pluck('name')->merge(collect($data['employees'])->pluck('location'))->unique()->values();
        $locations = [];
        foreach ($locNames as $i => $name) {
            $source = collect($data['locations'])->firstWhere('name', $name);
            $locations[$name] = CompanyLocation::query()->updateOrCreate(['name' => $name], [
                'address' => $source['address'] ?? null, 'phone' => null, 'description' => 'Sample location. Details to be provided by HR.', 'sort_order' => $i, 'status' => 'published', ...$sample,
            ]);
        }

        foreach ($data['employees'] as $employee) {
            $entry = DirectoryEntry::query()->firstOrNew(['employee_id' => $employee['employeeId']]);
            $entry->fill([
                'display_name' => $employee['firstName'].' '.$employee['lastName'], 'job_title' => $employee['position'],
                'department_id' => $departments[$employee['department']]->getKey(), 'location_id' => $locations[$employee['location']]->getKey(),
                'company_email' => $employee['email'], 'phone' => $employee['phone'] ?? null,
            ]);
            $entry->forceFill(['source' => 'manual', 'verification' => 'unverified', 'is_visible' => true, 'user_id' => User::query()->where('email', $employee['email'])->value('id'), ...$sample])->save();
        }

        // Demo routing: the MIS head is the demo manager (matched by email), so requests from MIS staff reach that manager.
        $head = DirectoryEntry::query()->where('company_email', 'ramon.aquino@eljin.example')->first();
        if ($head !== null && isset($departments['MIS'])) {
            $departments['MIS']->forceFill(['head_directory_entry_id' => $head->getKey()])->save();
        }

        $profile = $data['companyProfile'];
        $page = CompanyPage::query()->firstOrNew(['page_key' => CompanyPage::OVERVIEW]);
        $page->fill([
            'display_name' => $profile['name'], 'introduction_title' => $profile['introductionTitle'], 'introduction' => $profile['introduction']['text'],
            'mission' => $profile['mission']['text'], 'vision' => $profile['vision']['text'],
            'core_values' => array_map(fn ($v) => ['title' => $v['title'], 'description' => $v['description'] ?? null], $profile['values']),
        ]);
        $page->forceFill(['status' => 'published', 'published_at' => now(), ...$sample])->save();

        foreach ($data['companyMilestones'] as $i => $m) {
            CompanyHistoryEntry::query()->updateOrCreate(['title' => $m['title'], 'description' => $m['description'] ?? null], ['year' => $m['year'] ?? null, 'sort_order' => $i, 'status' => 'published', ...$sample]);
        }
        foreach ($data['leadershipMembers'] as $i => $l) {
            LeadershipProfile::query()->updateOrCreate(['name' => $l['name'], 'title' => $l['position']], ['area' => $l['department'] ?? null, 'biography' => $l['biography'] ?? null, 'sort_order' => $i, 'status' => 'published', ...$sample]);
        }
    }
}
