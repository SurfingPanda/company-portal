<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** One audit entry. Contains no secrets by construction (see App\Services\Audit). @mixin \App\Models\AuditLog */
class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'created_at' => $this->created_at->toIso8601String(),
            'actor' => $this->actor_label,
            'action' => $this->action,
            'module' => $this->module,
            'target' => $this->target_label,
            'target_type' => $this->target_type,
            'target_id' => $this->target_id,
            'result' => $this->result,
            'ip_address' => $this->ip_address,
            'details' => $this->details,
        ];
    }
}
