<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** When the person finished the first-sign-in setup. NULL means they still have to do it. */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('onboarded_at')->nullable()->after('last_login_at');
        });
        // Everyone who already exists is treated as set up; only accounts created from now on go through onboarding.
        DB::table('users')->update(['onboarded_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('onboarded_at');
        });
    }
};
