<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Employee-facing helpdesk foundation only: no SLA engine, CMDB, remote desktop, chat or escalation. */
    public function up(): void
    {
        Schema::create('helpdesk_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number', 30)->unique();
            $table->foreignId('user_id')->constrained()->restrictOnDelete(); // requester (owner)
            $table->string('category', 40);
            $table->string('type', 40);
            $table->string('subject');
            $table->text('description');
            $table->string('location')->nullable();
            $table->string('device')->nullable();
            $table->string('operating_system')->nullable();
            $table->string('asset_tag', 60)->nullable();
            $table->string('priority', 20)->default('normal');
            $table->string('status', 20)->default('new');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->boolean('is_sample')->default(false);
            $table->timestamps();

            $table->index('status');
            $table->index(['user_id', 'status']);
        });

        Schema::create('helpdesk_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('helpdesk_ticket_id')->constrained('helpdesk_tickets')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('message');
            $table->timestamps();

            $table->index(['helpdesk_ticket_id', 'created_at']);
        });

        Schema::create('helpdesk_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('helpdesk_ticket_id')->constrained('helpdesk_tickets')->cascadeOnDelete();
            $table->foreignId('helpdesk_reply_id')->nullable()->constrained('helpdesk_replies')->cascadeOnDelete();
            $table->string('original_filename');
            $table->string('storage_path', 500);
            $table->string('disk', 30)->default('local');
            $table->string('mime_type', 120);
            $table->unsignedBigInteger('file_size');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('helpdesk_attachments');
        Schema::dropIfExists('helpdesk_replies');
        Schema::dropIfExists('helpdesk_tickets');
    }
};
