<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Portal accounts only. A user is an authentication/authorization identity that points at the employee in the
     * external HRIS through `employee_id`. Name, job title, department, salary, leave, attendance and every other HR
     * fact stay in the HRIS and are fetched through App\Services\Hris when needed (never copied here).
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            // Link to the external HRIS employee identifier. Deliberately NOT a foreign key (the HRIS is another system).
            $table->string('employee_id', 32)->unique();
            $table->string('email')->unique();
            $table->string('password');
            $table->rememberToken();
            $table->string('status', 20)->default('active')->index();
            $table->timestamp('last_login_at')->nullable();
            $table->boolean('is_sample')->default(false); // true for seeded demo accounts
            $table->timestamps();
        });

        // Needed by Laravel session authentication (SESSION_DRIVER=database).
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('users');
    }
};
