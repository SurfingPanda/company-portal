<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Document METADATA only. Files are not stored in the database; `storage_disk`/`storage_path` reserve a future location. */
    public function up(): void
    {
        Schema::create('document_categories', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 60)->unique();
            $table->string('name');
            $table->string('description')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->foreignId('document_category_id')->constrained()->restrictOnDelete();
            $table->string('department', 80)->nullable();
            $table->string('original_filename')->nullable();
            $table->string('mime_type', 120)->nullable();
            $table->string('file_type', 10)->nullable(); // PDF, DOCX …
            $table->unsignedBigInteger('file_size')->nullable(); // bytes
            $table->string('version', 20)->nullable();
            $table->string('owner')->nullable();
            $table->string('access_level', 20)->default('all'); // all | department | manager | restricted (enforced server-side)
            $table->string('status', 20)->default('draft');
            $table->string('storage_disk', 30)->nullable();
            $table->string('storage_path', 500)->nullable();
            $table->timestamp('published_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_sample')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index('department');
            $table->index(['status', 'access_level']);
            $table->index('published_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
        Schema::dropIfExists('document_categories');
    }
};
