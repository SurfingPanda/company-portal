<?php

namespace App\Providers;

use App\Authorization\RolePermissions;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // No activation channel yet (see App\Contracts\AccountActivation).
        $this->app->singleton(\App\Services\PasswordLinks::class);
        $this->app->singleton(\App\Contracts\AccountActivation::class, \App\Services\PasswordLinks::class);
    }

    public function boot(): void
    {
        // Rate limits (HTTP 429). Signed-in traffic is limited per user, anonymous traffic per address.
        $key = fn (Request $request) => $request->user()?->getAuthIdentifier() ?? $request->ip();
        RateLimiter::for('password-link', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(20)->by($request->ip()));
        RateLimiter::for('email-preview', fn (Request $request) => Limit::perHour(5)->by($key($request)));
        RateLimiter::for('password-change', fn (Request $request) => [Limit::perMinute(5)->by($key($request)), Limit::perHour(20)->by($key($request))]);
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(240)->by($key($request)));
        RateLimiter::for('writes', fn (Request $request) => Limit::perMinute(30)->by($key($request)));
        RateLimiter::for('uploads', fn (Request $request) => Limit::perMinute(20)->by($key($request)));
        RateLimiter::for('admin', fn (Request $request) => Limit::perMinute(300)->by($key($request)));
        RateLimiter::for('search', fn (Request $request) => Limit::perMinute(60)->by($key($request)));

        // One Gate per permission, so code can say `$user->can('documents.manage')` or `Gate::allows(...)`.
        foreach (RolePermissions::all() as $permission) {
            Gate::define($permission, fn (User $user) => $user->hasPermission($permission));
        }
    }
}
