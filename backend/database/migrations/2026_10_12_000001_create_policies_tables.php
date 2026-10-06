<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Company policies that employees must confirm they have read.
     *  - `version` rises when HR publishes a new version; an acknowledgement belongs to ONE version, so a new version asks everyone again;
     *  - `audience` says who must read it: everyone, managers, or the people of chosen departments (`policy_department`);
     *  - acknowledgements are never edited or deleted: they are the record of who read what, and when.
     */
    public function up(): void
    {
        Schema::create('policies', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->text('summary')->nullable();
            $table->longText('body');
            $table->unsignedInteger('version')->default(1);
            $table->string('status', 20)->default('draft')->index();       // draft | published | archived
            $table->string('audience', 20)->default('all');                // all | managers | departments
            $table->date('effective_date')->nullable();
            $table->date('due_date')->nullable();                          // acknowledge by this date
            $table->timestamp('published_at')->nullable();
            $table->timestamp('version_published_at')->nullable();         // when the CURRENT version went live
            $table->timestamp('last_reminded_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('policy_department', function (Blueprint $table) {
            $table->foreignId('policy_id')->constrained()->cascadeOnDelete();
            $table->foreignId('department_id')->constrained()->cascadeOnDelete();
            $table->primary(['policy_id', 'department_id']);
        });

        Schema::create('policy_acknowledgements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('policy_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version');
            $table->timestamp('acknowledged_at');
            $table->unique(['policy_id', 'user_id', 'version']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('policy_acknowledgements');
        Schema::dropIfExists('policy_department');
        Schema::dropIfExists('policies');
    }
};
