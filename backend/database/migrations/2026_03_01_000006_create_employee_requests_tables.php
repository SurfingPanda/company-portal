<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Requests belong to the portal user who submitted them. Every read must be scoped to the owner (or authorised by
     * App\Policies\EmployeeRequestPolicy). Users are protected with restrictOnDelete so request history is never lost silently.
     */
    public function up(): void
    {
        Schema::create('employee_requests', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number', 30)->unique(); // e.g. REQ-2026-0001, LV-2026-0001
            $table->foreignId('request_type_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('subject');
            $table->text('description')->nullable();
            $table->json('form_data')->nullable(); // answers to the request type's dynamic fields
            $table->string('status', 20)->default('draft');
            $table->string('priority', 20)->default('normal');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->boolean('is_sample')->default(false);
            $table->timestamps();

            $table->index('status');
            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'submitted_at']);
        });

        // One row per status change; powers the request timeline. No workflow engine.
        Schema::create('request_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_request_id')->constrained('employee_requests')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete(); // who made the change (null = system)
            $table->string('status', 20);
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->index(['employee_request_id', 'created_at']);
        });

        // Attachment METADATA only. No file storage exists yet; uploads must be allow-listed, size-limited and authorised.
        Schema::create('request_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_request_id')->constrained('employee_requests')->cascadeOnDelete();
            $table->string('original_filename');
            $table->string('storage_path', 500);
            $table->string('disk', 30)->default('local'); // a private disk, never a public one
            $table->string('mime_type', 120);
            $table->unsignedBigInteger('file_size');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('request_attachments');
        Schema::dropIfExists('request_history');
        Schema::dropIfExists('employee_requests');
    }
};
