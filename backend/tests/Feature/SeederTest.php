<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Benefit;
use App\Models\CalendarEvent;
use App\Models\Document;
use App\Models\EmployeeForm;
use App\Models\EmployeeRequest;
use App\Models\RecruitmentJob;
use App\Models\RequestType;
use App\Models\Resource;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_seeders_run_and_everything_is_marked_sample(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(5, Role::count());
        $this->assertSame(5, User::count());
        foreach ([Announcement::class, CalendarEvent::class, Document::class, EmployeeForm::class, RequestType::class, EmployeeRequest::class, Benefit::class, RecruitmentJob::class, Resource::class] as $model) {
            $this->assertGreaterThan(0, $model::count(), "{$model} should be seeded");
            $this->assertSame(0, $model::where('is_sample', false)->count(), "{$model} rows must all be flagged is_sample");
        }
        $this->assertSame(0, User::where('is_sample', false)->count());
    }

    public function test_seeding_twice_does_not_duplicate_rows(): void
    {
        $this->seed(DatabaseSeeder::class);
        $counts = [User::count(), Announcement::count(), RequestType::count(), EmployeeRequest::count()];

        $this->seed(DatabaseSeeder::class);

        $this->assertSame($counts, [User::count(), Announcement::count(), RequestType::count(), EmployeeRequest::count()]);
    }

    public function test_demo_users_have_hashed_passwords_and_one_role_each(): void
    {
        $this->seed(DatabaseSeeder::class);

        $user = User::where('employee_id', 'EMP-0003')->firstOrFail();
        $this->assertNotSame('DemoOnly123!', $user->password);
        $this->assertTrue(Hash::check('DemoOnly123!', $user->password));
        $this->assertSame(['hr'], $user->roleNames());
        $this->assertSame(['admin'], User::where('employee_id', 'EMP-0005')->firstOrFail()->roleNames());
        $this->assertNotNull($user->preferences);
    }

    public function test_sample_content_is_clearly_labelled(): void
    {
        $this->seed(DatabaseSeeder::class);

        foreach (Announcement::all() as $announcement) {
            $this->assertStringContainsString('Sample', $announcement->title);
        }
        $this->assertStringContainsString('SAMPLE', Announcement::first()->content);
    }

    public function test_production_never_seeds_demo_accounts(): void
    {
        $this->app['env'] = 'production';

        // Run the seeder directly: `db:seed` itself would stop to ask for confirmation in production.
        (new DatabaseSeeder)->setContainer($this->app)->run();

        $this->assertSame(5, Role::count(), 'roles are still seeded');
        $this->assertSame(0, User::count(), 'demo users must not be created in production');
        $this->assertSame(0, Announcement::count());
    }
}
