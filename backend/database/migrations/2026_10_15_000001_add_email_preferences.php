<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * How the employee wants portal notifications by email: `instant` (one email each), `daily` (one summary each morning) or
     * `off`. `last_digest_at` stops a summary being sent twice in a day.
     */
    public function up(): void
    {
        Schema::table('portal_preferences', function (Blueprint $table) {
            $table->string('email_mode', 10)->default('daily')->after('notify_documents');
            $table->timestamp('last_digest_at')->nullable()->after('email_mode');
        });
    }

    public function down(): void
    {
        Schema::table('portal_preferences', function (Blueprint $table) {
            $table->dropColumn(['email_mode', 'last_digest_at']);
        });
    }
};
