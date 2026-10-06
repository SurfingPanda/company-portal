<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** A discovery layer: a resource points at a document, form, benefit or route. It never copies their content. */
    public function up(): void
    {
        Schema::create('resources', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category', 30)->default('company');
            $table->string('resource_type', 20)->default('page');
            $table->string('target_url', 500)->nullable(); // in-portal route, or an external address set by HR
            $table->foreignId('document_id')->nullable()->constrained('documents')->nullOnDelete();
            $table->foreignId('form_id')->nullable()->constrained('employee_forms')->nullOnDelete();
            $table->string('service_key', 60)->nullable(); // key in the portal's service directory
            $table->foreignId('benefit_id')->nullable()->constrained('benefits')->nullOnDelete();
            $table->boolean('is_featured')->default(false);
            $table->string('status', 20)->default('published');
            $table->boolean('is_sample')->default(false);
            $table->timestamps();

            $table->index(['status', 'is_featured']);
            $table->index('category');
        });

        Schema::create('resource_faqs', function (Blueprint $table) {
            $table->id();
            $table->string('question');
            $table->text('answer');
            $table->string('category', 30)->default('general');
            $table->string('related_route', 255)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_sample')->default(false);
            $table->timestamps();

            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resource_faqs');
        Schema::dropIfExists('resources');
    }
};
