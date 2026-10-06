<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Portal notifications. Model: App\Models\PortalNotification. The table keeps the spec's name `notifications`;
        // the User model does NOT use Laravel's Notifiable trait, so there is no clash with Laravel's own notification tables.
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 20)->default('system');
            $table->string('title');
            $table->text('message');
            $table->string('link', 500)->nullable(); // an in-portal route, e.g. /requests/REQ-2026-0001
            $table->timestamp('read_at')->nullable();
            $table->boolean('is_sample')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'read_at']);
            $table->index(['user_id', 'created_at']);
        });

        // Lightweight activity feed. Not an audit system; never put sensitive data in `description`.
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('activity_type', 50); // request_submitted, document_viewed, …
            $table->string('description');
            $table->string('entity_type', 60)->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'created_at']);
            $table->index(['entity_type', 'entity_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('notifications');
    }
};
