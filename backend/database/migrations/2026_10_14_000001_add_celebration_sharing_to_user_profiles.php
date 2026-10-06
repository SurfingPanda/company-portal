<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Whether the employee lets colleagues see their birthday (day and month only) and work anniversary on the dashboard.
     * A birthday is private by default and shown only when the employee agrees; an anniversary comes from HR's records, so it is
     * shown unless the employee turns it off.
     */
    public function up(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->boolean('share_birthday')->default(false)->after('date_of_birth');
            $table->boolean('share_anniversary')->default(true)->after('share_birthday');
        });
    }

    public function down(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->dropColumn(['share_birthday', 'share_anniversary']);
        });
    }
};
