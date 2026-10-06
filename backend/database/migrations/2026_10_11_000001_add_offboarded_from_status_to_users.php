<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Set when HR marks an employee Inactive and the portal disables their login automatically: it remembers the status the
     * account had (active or pending) so it can be restored if they return. NULL for every other account, including ones an
     * administrator disabled by hand, which HR never re-enables.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('offboarded_from_status', 20)->nullable()->after('onboarded_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('offboarded_from_status');
        });
    }
};
