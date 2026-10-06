<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * INFORMATION ONLY. No employee balances, claims, medical data, deductions, contribution amounts or eligibility
     * calculations are stored here; those stay with HR and the HRIS.
     */
    public function up(): void
    {
        Schema::create('benefits', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 80)->unique();
            $table->string('name');
            $table->string('short_description');
            $table->text('description');
            $table->text('eligibility')->nullable(); // HR-published wording only; never computed
            $table->string('category', 30)->default('other');
            $table->string('status', 20)->default('information-only');
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_sample')->default(false);
            $table->timestamps();

            $table->index(['category', 'status']);
        });

        Schema::create('benefit_faqs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('benefit_id')->nullable()->constrained()->cascadeOnDelete(); // null = general benefits FAQ
            $table->string('question');
            $table->text('answer');
            $table->string('category', 60)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_sample')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('benefit_faqs');
        Schema::dropIfExists('benefits');
    }
};
