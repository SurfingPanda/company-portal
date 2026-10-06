<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Definitions of requests an employee may submit (not the requests themselves).
        Schema::create('request_types', function (Blueprint $table) {
            $table->id();
            $table->string('request_code', 40)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category', 30)->default('other');
            $table->string('status', 20)->default('available');
            $table->string('reference_prefix', 8)->nullable(); // e.g. LV -> LV-2026-0001
            $table->boolean('requires_attachment')->default(false);
            $table->boolean('requires_approval')->default(false);
            $table->boolean('is_active')->default(true);
            // The React portal drives its dynamic forms from a field list; kept as JSON so new types need no schema change.
            $table->json('fields')->nullable();
            $table->boolean('is_sample')->default(false);
            $table->timestamps();

            $table->index(['category', 'is_active']);
        });

        // A downloadable form (metadata lives in `documents`) or an online form (starts a request type).
        Schema::create('employee_forms', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category', 30)->default('other');
            $table->string('form_type', 20)->default('download');
            $table->foreignId('document_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->foreignId('request_type_id')->nullable()->constrained('request_types')->nullOnDelete();
            $table->string('status', 20)->default('published');
            $table->text('instructions')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_sample')->default(false);
            $table->timestamps();

            $table->index(['category', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_forms');
        Schema::dropIfExists('request_types');
    }
};
