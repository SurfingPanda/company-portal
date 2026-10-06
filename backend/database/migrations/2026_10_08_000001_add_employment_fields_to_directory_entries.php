<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** HR keeps employment details on the employee record itself (there is no external HR system). */
    public function up(): void
    {
        Schema::table('directory_entries', function (Blueprint $table) {
            $table->string('employment_status', 20)->default('active')->after('company_email');
            $table->string('employment_type', 20)->nullable()->after('employment_status');
            $table->date('date_joined')->nullable()->after('employment_type');
            $table->foreignId('manager_id')->nullable()->after('date_joined')->constrained('directory_entries')->nullOnDelete();
            $table->index('employment_status');
        });
    }

    public function down(): void
    {
        Schema::table('directory_entries', function (Blueprint $table) {
            $table->dropConstrainedForeignId('manager_id');
            $table->dropIndex(['employment_status']);
            $table->dropColumn(['employment_status', 'employment_type', 'date_joined']);
        });
    }
};
