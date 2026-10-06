<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Portal-managed company and directory content (Phase 31). Field ownership:
     *  - HRIS-owned (official): employee ID, official name, official job title, department assignment, employment status,
     *    date joined, manager. A directory entry from the HRIS (`source` = hris-import / hris-sync) is read-only in the portal.
     *    Until an HRIS integration exists every entry is `manual`: maintained by HR in the portal and `unverified`.
     *  - Portal-managed: display name, business contact details, directory description, visibility, department/location
     *    descriptions, company pages, history, leadership profiles, services.
     * There is NO employee master table here: a directory entry is a display record keyed by the HRIS employee ID.
     */
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->nullable()->unique();
            $table->string('name', 120)->unique();
            $table->text('description')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('head_display', 120)->nullable();   // display reference only, not an employee link
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->string('status', 20)->default('draft');     // draft | published | archived
            $table->boolean('is_sample')->default(false);
            $table->timestamps();
            $table->index(['status', 'sort_order']);
        });

        Schema::create('company_locations', function (Blueprint $table) {
            $table->id();
            $table->string('name', 160)->unique();
            $table->text('address')->nullable();
            $table->string('phone', 40)->nullable();
            $table->string('email')->nullable();
            $table->text('description')->nullable();
            $table->string('operating_info', 255)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->string('status', 20)->default('draft');
            $table->boolean('is_sample')->default(false);
            $table->timestamps();
            $table->index(['status', 'sort_order']);
        });

        Schema::create('directory_entries', function (Blueprint $table) {
            $table->id();
            $table->string('employee_id', 32)->unique();                  // HRIS reference (not a foreign key)
            $table->foreignId('user_id')->nullable()->unique()->constrained('users')->nullOnDelete(); // linked portal account
            $table->string('display_name', 120);
            $table->string('official_name', 160)->nullable();             // HRIS-supplied only
            $table->string('job_title', 120)->nullable();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->foreignId('location_id')->nullable()->constrained('company_locations')->nullOnDelete();
            $table->string('company_email')->nullable()->unique();
            $table->string('phone', 40)->nullable();                      // business phone / extension only
            $table->text('description')->nullable();
            $table->boolean('is_visible')->default(false);                // hidden until HR approves
            $table->string('source', 20)->default('manual');             // manual | hris-import | hris-sync
            $table->string('verification', 20)->default('unverified');   // unverified | verified (set by the HRIS side only)
            $table->boolean('is_sample')->default(false);
            $table->timestamps();
            $table->index('display_name');
            $table->index(['is_visible', 'display_name']);
        });

        Schema::create('company_pages', function (Blueprint $table) {
            $table->id();
            $table->string('page_key', 40)->unique();                     // 'overview'
            $table->string('display_name', 160)->nullable();
            $table->string('introduction_title', 160)->nullable();
            $table->text('introduction')->nullable();
            $table->text('mission')->nullable();
            $table->text('vision')->nullable();
            $table->json('core_values')->nullable();                      // [{title, description}]
            $table->string('status', 20)->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_sample')->default(false);
            $table->timestamps();
        });

        Schema::create('company_history_entries', function (Blueprint $table) {
            $table->id();
            $table->string('year', 10)->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->string('status', 20)->default('draft');
            $table->boolean('is_sample')->default(false);
            $table->timestamps();
            $table->index(['status', 'sort_order']);
        });

        Schema::create('leadership_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('name', 160);
            $table->string('title', 160);
            $table->string('area', 120)->nullable();
            $table->text('biography')->nullable();
            $table->foreignId('directory_entry_id')->nullable()->constrained('directory_entries')->nullOnDelete();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->string('status', 20)->default('draft');
            $table->boolean('is_sample')->default(false);
            $table->timestamps();
            $table->index(['status', 'sort_order']);
        });

        Schema::create('portal_services', function (Blueprint $table) {
            $table->id();
            $table->string('name', 160);
            $table->text('description')->nullable();
            $table->string('category', 20)->default('hr');                // hr | it | company | resources
            $table->string('icon', 30)->default('info');
            $table->string('destination_type', 20)->default('portal');    // portal | internal | external
            $table->string('route', 255)->nullable();                     // portal path
            $table->string('url', 500)->nullable();                       // https address
            $table->string('status', 20)->default('draft');               // publication: draft | published | archived
            $table->string('availability', 20)->default('available');     // available | coming-soon | maintenance
            $table->boolean('is_featured')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->string('required_permission', 60)->nullable();
            $table->foreignId('related_form_id')->nullable()->constrained('employee_forms')->nullOnDelete();
            $table->foreignId('related_document_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->foreignId('related_benefit_id')->nullable()->constrained('benefits')->nullOnDelete();
            $table->foreignId('related_request_type_id')->nullable()->constrained('request_types')->nullOnDelete();
            $table->boolean('is_sample')->default(false);
            $table->timestamps();
            $table->index(['status', 'category', 'sort_order']);
        });
    }

    public function down(): void
    {
        foreach (['portal_services', 'leadership_profiles', 'company_history_entries', 'company_pages', 'directory_entries', 'company_locations', 'departments'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
