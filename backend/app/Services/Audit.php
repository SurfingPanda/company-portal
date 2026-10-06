<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * Records administrative actions. Call it from the controller or service that performs the action (inside its transaction
 * when there is one). Never pass passwords, tokens or personal contact data in `$details`.
 */
final class Audit
{
    /**
     * @param  array<string, scalar|null>  $details  small, non-sensitive context
     */
    public static function record(?User $actor, string $action, string $module, ?Model $target = null, ?string $targetLabel = null, string $result = 'success', array $details = []): AuditLog
    {
        return AuditLog::query()->create([
            'actor_user_id' => $actor?->getKey(),
            'actor_label' => $actor?->employee_id,
            'action' => $action,
            'module' => $module,
            'target_type' => $target ? class_basename($target) : null,
            'target_id' => $target?->getKey(),
            'target_label' => $targetLabel !== null ? mb_substr($targetLabel, 0, 255) : null,
            'result' => $result,
            'ip_address' => request()?->ip(),
            'details' => $details === [] ? null : $details,
        ]);
    }
}
