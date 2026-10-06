<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('calendar_events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category', 30)->default('other');
            $table->string('status', 20)->default('scheduled');
            $table->string('visibility', 20)->default('all');
            $table->string('location')->nullable();
            $table->timestamp('starts_at');
            $table->timestamp('ends_at')->nullable();
            $table->boolean('is_all_day')->default(false);
            $table->foreignId('author_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_sample')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index('starts_at');
            $table->index(['status', 'starts_at']);
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calendar_events');
    }
};
