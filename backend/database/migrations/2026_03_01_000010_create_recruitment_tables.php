<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Not an ATS: no scoring, ranking, interview scheduling or recruiter notes. Just postings, applications and referrals. */
    public function up(): void
    {
        Schema::create('recruitment_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('department', 80);
            $table->string('location');
            $table->string('employment_type', 30); // full-time, part-time, contract, internship
            $table->string('work_arrangement', 20)->nullable(); // on-site, hybrid, remote
            $table->text('summary')->nullable();
            $table->text('description');
            $table->text('requirements')->nullable(); // one requirement per line
            $table->string('status', 20)->default('open');
            $table->boolean('application_enabled')->default(true);
            $table->boolean('referral_enabled')->default(true);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('closing_at')->nullable();
            $table->boolean('is_sample')->default(false);
            $table->timestamps();

            $table->index('status');
            $table->index(['status', 'published_at']);
            $table->index('department');
        });

        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->string('application_number', 30)->unique(); // APP-2026-0001
            $table->foreignId('job_id')->constrained('recruitment_jobs')->restrictOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete(); // the signed-in employee, if any
            $table->string('applicant_name');
            $table->string('email');
            $table->string('mobile', 40)->nullable();
            $table->string('resume_path', 500)->nullable(); // metadata only; no file storage yet (private disk later)
            $table->text('cover_letter')->nullable();
            $table->text('skills')->nullable();
            $table->text('experience_summary')->nullable();
            $table->string('status', 20)->default('submitted');
            $table->timestamp('submitted_at')->nullable();
            $table->boolean('is_sample')->default(false);
            $table->timestamps();

            $table->index('status');
            $table->index(['user_id', 'status']);
        });

        Schema::create('job_referrals', function (Blueprint $table) {
            $table->id();
            $table->string('referral_number', 30)->unique(); // REF-2026-0001
            $table->foreignId('job_id')->constrained('recruitment_jobs')->restrictOnDelete();
            $table->foreignId('referring_user_id')->constrained('users')->restrictOnDelete();
            $table->string('referred_name');
            $table->string('referred_email');
            $table->string('referred_mobile', 40)->nullable();
            $table->string('relationship', 60)->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('submitted');
            $table->boolean('is_sample')->default(false);
            $table->timestamps();

            $table->index('referring_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_referrals');
        Schema::dropIfExists('job_applications');
        Schema::dropIfExists('recruitment_jobs');
    }
};
