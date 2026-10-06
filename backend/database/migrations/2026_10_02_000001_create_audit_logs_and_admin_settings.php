<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `audit_logs`: append-only record of ADMINISTRATIVE actions (who did what to which record). It is separate from
     * `activity_logs`, which is each employee's own lightweight feed. `admin_settings`: the few portal-level settings
     * administrators may change (never secrets).
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_label', 120)->nullable();      // employee ID at the time, kept even if the account is later removed
            $table->string('action', 60);                        // USER_CREATED, ROLE_ASSIGNED …
            $table->string('module', 40);                        // users, announcements, requests …
            $table->string('target_type', 60)->nullable();
            $table->unsignedBigInteger('target_id')->nullable();
            $table->string('target_label', 255)->nullable();     // human label, never a secret
            $table->string('result', 20)->default('success');    // success | denied | failed
            $table->string('ip_address', 45)->nullable();
            $table->json('details')->nullable();                 // small non-sensitive context (e.g. old/new status)
            $table->timestamp('created_at')->useCurrent();
            $table->index('created_at');
            $table->index(['module', 'created_at']);
            $table->index('action');
            $table->index('actor_user_id');
        });

        Schema::create('admin_settings', function (Blueprint $table) {
            $table->string('key', 80)->primary();
            $table->text('value')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_settings');
        Schema::dropIfExists('audit_logs');
    }
};
