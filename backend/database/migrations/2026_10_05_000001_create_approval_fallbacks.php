<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Company-wide fallback approvers (maintained by HR): who reviews a request when its department has no usable head or route
     * (for example a department without a manager). Priority 1 is the primary; priority 2 is used when the primary cannot act or
     * is the requester themselves.
     */
    public function up(): void
    {
        Schema::create('approval_fallbacks', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('priority')->unique();   // 1 = primary, 2 = secondary
            $table->foreignId('approver_directory_entry_id')->constrained('directory_entries')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_fallbacks');
    }
};
