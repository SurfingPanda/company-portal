<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Wrong guesses of a short emailed code are counted so the code cannot be brute-forced. */
    public function up(): void
    {
        Schema::table('password_links', function (Blueprint $table) {
            $table->unsignedTinyInteger('attempts')->default(0)->after('expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('password_links', function (Blueprint $table) {
            $table->dropColumn('attempts');
        });
    }
};
