<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('summary');
            $table->longText('content');
            $table->string('category', 30)->default('other');
            $table->string('priority', 20)->default('normal');
            $table->string('status', 20)->default('draft');
            $table->boolean('is_pinned')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->foreignId('author_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_sample')->default(false);
            $table->timestamps();
            $table->softDeletes(); // announcements can be withdrawn and restored

            $table->index('status');
            $table->index('published_at');
            $table->index(['status', 'published_at']); // "published, newest first"
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
