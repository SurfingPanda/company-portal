<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Personal details the EMPLOYEE enters about themselves, and the people to call in an emergency. Deliberately limited: no
     * government ID, bank, medical or salary data. Only the employee edits them; HR can read them (every read is audited).
     */
    public function up(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->date('date_of_birth')->nullable()->after('avatar_url');
            $table->string('civil_status', 20)->nullable()->after('date_of_birth');
            $table->string('address_line', 255)->nullable()->after('civil_status');
            $table->string('city', 100)->nullable()->after('address_line');
            $table->string('province', 100)->nullable()->after('city');
            $table->string('postal_code', 20)->nullable()->after('province');
        });

        Schema::create('emergency_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('relationship', 60);
            $table->string('phone', 30);
            $table->string('alternate_phone', 30)->nullable();
            $table->string('email')->nullable();
            $table->unsignedTinyInteger('sort_order')->default(0);   // 0 = the first person to call
            $table->timestamps();
            $table->index(['user_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emergency_contacts');
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->dropColumn(['date_of_birth', 'civil_status', 'address_line', 'city', 'province', 'postal_code']);
        });
    }
};
