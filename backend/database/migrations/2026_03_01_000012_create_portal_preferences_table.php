<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** One row per user. UI preferences only: no credentials, tokens, MFA data or HR information. Defaults mirror the React portal. */
    public function up(): void
    {
        Schema::create('portal_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('dashboard_start_page', 30)->default('dashboard');
            $table->string('resource_view', 10)->default('cards');
            $table->boolean('remember_search_history')->default(true);
            $table->boolean('notify_announcements')->default(true);
            $table->boolean('notify_hr')->default(true);
            $table->boolean('notify_it')->default(true);
            $table->boolean('notify_requests')->default(true);
            $table->boolean('notify_events')->default(true);
            $table->boolean('notify_documents')->default(true);
            $table->boolean('reduce_motion')->default(false);
            $table->string('text_size', 10)->default('default');
            $table->boolean('high_contrast')->default(false);
            $table->string('theme', 10)->default('system');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('portal_preferences');
    }
};
