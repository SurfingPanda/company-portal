<?php

namespace App\Http\Controllers\Api\Admin\Hr;

use App\Http\Controllers\Api\ApiController;
use App\Models\ApprovalFallback;
use App\Models\DirectoryEntry;
use App\Services\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * The company-wide fallback approver (primary and optional secondary) for requests whose department has no usable head or route.
 * HR chooses directory entries; the approver still needs a linked, active account holding `requests.team-review`, which this
 * endpoint reports as `can_act` but never grants.
 */
class AdminApprovalFallbackController extends ApiController
{
    public function show(): JsonResponse
    {
        return response()->json(['data' => $this->present()]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'primary_directory_entry_id' => ['present', 'nullable', 'integer', Rule::exists('directory_entries', 'id')],
            'secondary_directory_entry_id' => ['sometimes', 'nullable', 'integer', Rule::exists('directory_entries', 'id')],
        ]);
        $primary = $data['primary_directory_entry_id'];
        $secondary = $data['secondary_directory_entry_id'] ?? null;

        if ($secondary !== null && $primary === null) {
            throw ValidationException::withMessages(['secondary_directory_entry_id' => ['Choose a primary fallback approver first.']]);
        }
        if ($primary !== null && $primary === $secondary) {
            throw ValidationException::withMessages(['secondary_directory_entry_id' => ['The secondary approver must be a different person.']]);
        }
        foreach (['primary_directory_entry_id' => $primary, 'secondary_directory_entry_id' => $secondary] as $field => $entryId) {
            if ($entryId !== null && DirectoryEntry::query()->whereKey($entryId)->whereNull('user_id')->exists()) {
                throw ValidationException::withMessages([$field => ['The approver must be linked to a portal account. Link the account on the directory entry first.']]);
            }
        }

        DB::transaction(function () use ($primary, $secondary, $request) {
            ApprovalFallback::query()->delete();
            foreach ([1 => $primary, 2 => $secondary] as $priority => $entryId) {
                if ($entryId !== null) {
                    ApprovalFallback::query()->create(['priority' => $priority, 'approver_directory_entry_id' => $entryId]);
                }
            }
            Audit::record($request->user(), 'APPROVAL_FALLBACK_UPDATED', 'hr', null, 'Fallback approver', 'success', ['primary' => $primary, 'secondary' => $secondary]);
        });

        return response()->json(['data' => $this->present()]);
    }

    /** @return array<string, mixed> */
    private function present(): array
    {
        $rows = ApprovalFallback::query()->with('approver.user')->orderBy('priority')->get()->keyBy('priority');
        $one = fn (?ApprovalFallback $f) => $f === null ? null : [
            'directory_entry_id' => $f->approver_directory_entry_id, 'name' => $f->approver?->display_name, 'employee_id' => $f->approver?->employee_id,
            'can_act' => $f->approver?->user !== null && $f->approver->user->hasPermission('requests.team-review'),
        ];

        return ['primary' => $one($rows->get(1)), 'secondary' => $one($rows->get(2))];
    }
}
