<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Employee SELF-SERVICE profile fields only (the four the portal lets an employee change). Official facts (name, job
     * title, department, manager, status, date joined) are HRIS-owned and are deliberately NOT stored here.
     */
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('preferred_name', 80)->nullable();
            $table->string('personal_email')->nullable();
            $table->string('mobile_number', 30)->nullable();
            $table->string('avatar_url', 500)->nullable(); // metadata only: no avatar storage in this phase
            $table->timestamps();
        });

        // Administrative comments on a request's timeline that the requesting employee must never see.
        Schema::table('request_history', function (Blueprint $table) {
            $table->boolean('is_internal')->default(false)->after('comment');
        });
    }

    public function down(): void
    {
        Schema::table('request_history', function (Blueprint $table) {
            $table->dropColumn('is_internal');
        });
        Schema::dropIfExists('user_profiles');
    }
};
