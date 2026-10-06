<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('helpdesk_tickets', function (Blueprint $table) {
            $table->string('external_id', 60)->nullable()->after('ticket_number');   // the work order number in Hubly
            $table->string('external_status', 40)->nullable();                        // Hubly's own status wording (e.g. In progress)
            $table->string('external_assignee', 120)->nullable();                     // who is handling it in Hubly
        });
        Schema::table('helpdesk_replies', function (Blueprint $table) {
            $table->string('source', 10)->default('portal')->after('message');       // portal | hubly
            $table->string('author_name', 120)->nullable()->after('source');         // the Hubly technician's name
        });
        // Calls to Hubly waiting to be delivered (or retried). A failed delivery never loses the ticket.
        Schema::create('hubly_outbox', function (Blueprint $table) {
            $table->id();
            $table->foreignId('helpdesk_ticket_id')->constrained('helpdesk_tickets')->cascadeOnDelete();
            $table->string('event', 30);
            $table->json('payload');
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->string('last_error', 255)->nullable();
            $table->timestamp('next_attempt_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            $table->index(['sent_at', 'next_attempt_at']);
        });
        // Calls received from Hubly, by their unique id, so a repeated delivery is applied once.
        Schema::create('hubly_events', function (Blueprint $table) {
            $table->id();
            $table->string('event_id', 100)->unique();
            $table->foreignId('helpdesk_ticket_id')->nullable()->constrained('helpdesk_tickets')->nullOnDelete();
            $table->string('type', 30);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hubly_events');
        Schema::dropIfExists('hubly_outbox');
        Schema::table('helpdesk_replies', fn (Blueprint $t) => $t->dropColumn(['source', 'author_name']));
        Schema::table('helpdesk_tickets', fn (Blueprint $t) => $t->dropColumn(['external_id', 'external_status', 'external_assignee']));
    }
};
