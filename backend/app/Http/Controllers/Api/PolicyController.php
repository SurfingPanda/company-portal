<?php

namespace App\Http\Controllers\Api;

use App\Models\Policy;
use App\Models\PolicyAcknowledgement;
use App\Services\PortalEvents;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;

/**
 * Policies for the signed-in employee. Only PUBLISHED policies whose audience includes them exist as far as this endpoint is
 * concerned (anything else answers 404). Acknowledging records who read which VERSION and when; it can be done once per version.
 */
class PolicyController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $input = $this->listInput($request, ['status' => ['sometimes', Rule::in(['pending', 'acknowledged'])]]);
        $user = $request->user();

        $policies = Policy::query()->for($user)->orderByDesc('version_published_at')->orderBy('id')->get();
        $acks = PolicyAcknowledgement::query()->where('user_id', $user->getKey())->whereIn('policy_id', $policies->pluck('id'))->get()->groupBy('policy_id');
        $rows = $policies->map(fn (Policy $p) => $this->summary($p, $acks->get($p->id, collect())))->values();

        $pending = $rows->where('status', '!=', 'acknowledged')->count();
        $wanted = $input['status'] ?? null;
        if ($wanted !== null) {
            $rows = $rows->filter(fn (array $r) => ($wanted === 'acknowledged') === ($r['status'] === 'acknowledged'))->values();
        }
        // What needs doing comes first: overdue, then pending, then the ones already read.
        $order = ['overdue' => 0, 'pending' => 1, 'acknowledged' => 2];
        $rows = $rows->sortBy(fn (array $r) => $order[$r['status']])->values();

        return response()->json(['data' => $rows, 'meta' => ['pending' => $pending, 'total' => $policies->count()]]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        return response()->json(['data' => $this->detail($request, $id)]);
    }

    /** Confirm the policy was read. The version sent must be the current one, so nobody confirms text they did not see. */
    public function acknowledge(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['version' => ['required', 'integer'], 'confirm' => ['required', 'accepted']]);
        $user = $request->user();
        $policy = Policy::query()->for($user)->findOrFail($id);

        if ((int) $data['version'] !== $policy->version) {
            return response()->json(['message' => 'This policy was updated. Please read the new version before confirming.', 'errors' => ['version' => ['This policy was updated. Please read the new version before confirming.']]], 409);
        }
        $inserted = PolicyAcknowledgement::query()->insertOrIgnore([['policy_id' => $policy->getKey(), 'user_id' => $user->getKey(), 'version' => $policy->version, 'acknowledged_at' => now()]]);
        if ($inserted > 0) {
            PortalEvents::activity($user, 'policy_acknowledged', "Confirmed reading the policy \"{$policy->title}\" (version {$policy->version})", 'policy', $policy->getKey());
        }

        return response()->json(['data' => $this->detail($request, $id)]);
    }

    /** @return array<string, mixed> */
    private function detail(Request $request, int $id): array
    {
        $policy = Policy::query()->for($request->user())->findOrFail($id);
        $acks = PolicyAcknowledgement::query()->where('policy_id', $policy->getKey())->where('user_id', $request->user()->getKey())->get();

        return $this->summary($policy, $acks) + ['body' => $policy->body];
    }

    /**
     * @param  Collection<int, PolicyAcknowledgement>  $acks  this person's acknowledgements of this policy (any version)
     * @return array<string, mixed>
     */
    private function summary(Policy $policy, Collection $acks): array
    {
        $current = $acks->firstWhere('version', $policy->version);
        $status = $current !== null ? 'acknowledged' : ($policy->due_date !== null && $policy->due_date->isBefore(today()) ? 'overdue' : 'pending');
        $earlier = $acks->where('version', '<', $policy->version)->max('version');

        return [
            'id' => $policy->id, 'title' => $policy->title, 'summary' => $policy->summary, 'version' => $policy->version, 'status' => $status,
            'effective_date' => $policy->effective_date?->toDateString(), 'due_date' => $policy->due_date?->toDateString(),
            'updated_at' => $policy->version_published_at?->toIso8601String(), 'acknowledged_at' => $current?->acknowledged_at->toIso8601String(),
            // Set when they read an older version: the policy changed since, so it is asked again.
            'previously_acknowledged_version' => $earlier,
        ];
    }
}
