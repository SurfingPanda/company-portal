<?php

namespace App\Http\Controllers\Api;

use App\Enums\RequestStatus;
use App\Http\Requests\CreateRequestRequest;
use App\Http\Requests\ReviewRequestStatusRequest;
use App\Http\Requests\UpdateRequestRequest;
use App\Http\Resources\EmployeeRequestResource;
use App\Http\Resources\RequestHistoryResource;
use App\Models\EmployeeRequest;
use App\Models\RequestType;
use App\Services\RequestFormData;
use App\Services\RequestService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * Employee requests. IDOR rules: a request is always looked up through {@see find()} (own requests, or the ones the
 * user's role may review), so another employee's request id answers 404 exactly like an unknown id. Employees can only save
 * drafts, submit and cancel; Approved/Completed/Rejected come only from `review()`, which the policy limits to staff.
 */
class EmployeeRequestController extends ApiController
{
    private const SORTS = ['created_at' => 'created_at', 'submitted_at' => 'submitted_at', 'reference_number' => 'reference_number', 'status' => 'status'];

    public function __construct(private readonly RequestService $requests) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $input = $this->listInput($request, [
            'status' => ['sometimes', Rule::enum(RequestStatus::class)],
            'request_type_id' => ['sometimes', 'integer'],
            'scope' => ['sometimes', Rule::in(['own', 'review'])],
            'category' => ['sometimes', Rule::enum(\App\Enums\RequestCategory::class)],
            'requester' => ['sometimes', 'string', 'max:32'],
        ], array_keys(self::SORTS));

        $query = ($input['scope'] ?? 'own') === 'review' ? $this->reviewQuery($request) : EmployeeRequest::query()->ownedBy($request->user());
        $query->with('requestType', 'user')
            ->when($input['category'] ?? null, fn (Builder $q, $v) => $q->whereHas('requestType', fn (Builder $t) => $t->where('category', $v)))
            // Only meaningful (and only allowed) in the review scope; in the own scope it can only ever match the caller.
            ->when($input['requester'] ?? null, fn (Builder $q, $v) => $q->whereHas('user', fn (Builder $u) => $u->where('employee_id', $v)))
            ->when($input['status'] ?? null, fn (Builder $q, $v) => $q->where('status', $v))
            ->when($input['request_type_id'] ?? null, fn (Builder $q, $v) => $q->where('request_type_id', $v))
            ->when($input['from'] ?? null, fn (Builder $q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($input['to'] ?? null, fn (Builder $q, $v) => $q->whereDate('created_at', '<=', $v));
        $this->searched($query, $input['search'] ?? null, ['reference_number', 'subject']);

        return $this->paginated($this->sorted($query, $request, self::SORTS, 'created_at'), $request, EmployeeRequestResource::class);
    }

    public function show(Request $request, int $requestId): EmployeeRequestResource
    {
        $model = $this->find($request, $requestId);

        return new EmployeeRequestResource($model->load('requestType', 'attachments')->setRelation('history', $this->history($request, $model)));
    }

    public function store(CreateRequestRequest $request): JsonResponse
    {
        $type = RequestType::query()->where('is_active', true)->findOrFail($request->integer('request_type_id'));
        $created = $this->requests->create($request->user(), $type, $request->validated(), $request->boolean('save_as_draft'));

        return $this->created(new EmployeeRequestResource($created->load('requestType', 'history')));
    }

    /** Edit a DRAFT (owner only). `submit: true` submits it afterwards. */
    public function update(UpdateRequestRequest $request, int $requestId): EmployeeRequestResource
    {
        $model = $this->find($request, $requestId);
        Gate::authorize('update', $model);

        $data = $request->validated();
        $model->fill(collect($data)->only(['subject', 'description', 'priority'])->all());
        if (array_key_exists('form_data', $data)) {
            $model->form_data = RequestFormData::only($model->requestType, $data['form_data']);
        }
        $model->save();

        if ($request->boolean('submit')) {
            $this->requests->submit($request->user(), $model);
        }

        return new EmployeeRequestResource($model->load('requestType')->setRelation('history', $this->history($request, $model)));
    }

    public function cancel(Request $request, int $requestId): EmployeeRequestResource
    {
        $model = $this->find($request, $requestId);
        Gate::authorize('cancel', $model);
        $this->requests->cancel($request->user(), $model);

        return new EmployeeRequestResource($model->load('requestType')->setRelation('history', $this->history($request, $model)));
    }

    public function historyIndex(Request $request, int $requestId): AnonymousResourceCollection
    {
        return RequestHistoryResource::collection($this->history($request, $this->find($request, $requestId)));
    }

    /** Staff only (HR for HR-type requests, administrators for all): move a request to under-review, approved, rejected or completed. */
    public function review(ReviewRequestStatusRequest $request, int $requestId): EmployeeRequestResource
    {
        $model = $this->find($request, $requestId);
        Gate::authorize('review', $model);
        $status = RequestStatus::from($request->validated('status'));
        if (($error = $this->requests->moveError($request->user(), $model, $status)) !== null) {
            throw \Illuminate\Validation\ValidationException::withMessages(['status' => [$error]]);
        }
        $this->requests->review($request->user(), $model, $status, $request->validated('comment'), $request->boolean('internal'));

        return new EmployeeRequestResource($model->load('requestType')->setRelation('history', $this->history($request, $model)));
    }

    private function hrOwns(EmployeeRequest $model): bool
    {
        return in_array($model->requestType?->category, [\App\Enums\RequestCategory::Hr, \App\Enums\RequestCategory::Benefits, \App\Enums\RequestCategory::Recruitment], true);
    }

    /** The record, or 404 when it does not exist OR the user may not view it. */
    private function find(Request $request, int $id): EmployeeRequest
    {
        $model = EmployeeRequest::query()->with('requestType')->findOrFail($id);
        $this->mustView($model);

        return $model;
    }

    /** Staff-only (internal) entries never reach the requesting employee, nor staff reading as the owner. */
    private function history(Request $request, EmployeeRequest $model)
    {
        $query = $model->history();
        $staff = $request->user()->getKey() !== $model->user_id && Gate::allows('review', $model);

        return $staff ? $query->get() : $query->visibleToEmployee()->get();
    }

    private function reviewQuery(Request $request): Builder
    {
        $user = $request->user();
        if ($user->hasPermission('requests.manage')) {
            return EmployeeRequest::query();
        }
        $categories = [];
        if ($user->hasPermission('requests.hr-review')) {
            array_push($categories, 'hr', 'benefits', 'recruitment');
        }
        if ($user->hasPermission('requests.it-review')) {
            $categories[] = 'it';
        }
        $team = $user->hasPermission('requests.team-review');
        abort_unless($categories !== [] || $team, 403);

        // Own-category queues (HR: HR-type, IT: IT-type, never their own requests) plus anything routed to them as a department approver.
        return EmployeeRequest::query()->where(function (Builder $q) use ($categories, $team, $user) {
            if ($categories !== []) {
                $q->where(fn (Builder $c) => $c->where('user_id', '!=', $user->getKey())->whereHas('requestType', fn (Builder $t) => $t->whereIn('category', $categories)));
            }
            if ($team) {
                $routed = app(\App\Services\ApprovalRouting::class)->scopeFor(EmployeeRequest::query(), $user)->select('employee_requests.id');
                $q->orWhereIn('id', $routed);
            }
            if ($categories === [] && ! $team) {
                $q->whereRaw('1 = 0');
            }
        });
    }
}
