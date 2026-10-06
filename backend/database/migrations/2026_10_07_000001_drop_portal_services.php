<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** The Employee Services directory was removed (IT requests go through the helpdesk). Its table goes with it. */
    public function up(): void
    {
        Schema::dropIfExists('portal_services');
    }

    public function down(): void
    {
        Schema::create('portal_services', function (Blueprint $table) {
            $table->id();
            $table->string('name', 160);
            $table->text('description')->nullable();
            $table->string('category', 20)->default('hr');
            $table->string('icon', 40)->default('info');
            $table->string('destination_type', 20)->default('portal');
            $table->string('route')->nullable();
            $table->string('url', 500)->nullable();
            $table->string('availability', 20)->default('available');
            $table->boolean('is_featured')->default(false);
            $table->integer('sort_order')->default(0);
            $table->string('required_permission')->nullable();
            $table->string('status', 20)->default('draft')->index();
            $table->boolean('is_sample')->default(false);
            $table->timestamps();
        });
    }
};
