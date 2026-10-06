<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Approval routing maintained by HR in the portal (no HRIS involved):
     *  - a department can name its head by pointing at a directory entry;
     *  - routes say who reviews requests filed by people in a department, optionally for one request type only.
     * "Who is in a department" is the portal's own directory data (the requester's linked directory entry), so this is portal
     * routing, not an official reporting line. When the HRIS later supplies reporting lines, the same resolver can use them.
     */
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->foreignId('head_directory_entry_id')->nullable()->after('head_display')->constrained('directory_entries')->nullOnDelete();
        });

        Schema::create('request_approval_routes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
            $table->foreignId('request_type_id')->nullable()->constrained('request_types')->cascadeOnDelete(); // null = every request type
            $table->foreignId('approver_directory_entry_id')->constrained('directory_entries')->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['department_id', 'is_active']);
            $table->index('approver_directory_entry_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('request_approval_routes');
        Schema::table('departments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('head_directory_entry_id');
        });
    }
};
