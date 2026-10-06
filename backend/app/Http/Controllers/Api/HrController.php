<?php

namespace App\Http\Controllers\Api;

use App\Enums\RequestCategory;
use App\Http\Requests\CreateRequestRequest;
use App\Http\Resources\EmployeeRequestResource;
use App\Http\Resources\RequestTypeResource;
use App\Models\RequestType;
use App\Services\RequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

/**
 * The HR boundary. The portal offers HR SERVICES as request types and files HR requests. Employee information is what HR
 * entered in the portal directory; it is never invented. No payroll, attendance or leave balances.
 */
class HrController extends ApiController
{
    private const HR_CATEGORIES = [RequestCategory::Hr, RequestCategory::Benefits];

    public function __construct(private readonly RequestService $requests) {}

    /** HR services currently available to employees: the active HR and benefits request types. */
    public function services(): AnonymousResourceCollection
    {
        return RequestTypeResource::collection(
            RequestType::query()->where('is_active', true)->whereIn('category', array_map(fn ($c) => $c->value, self::HR_CATEGORIES))->orderBy('name')->get(),
        );
    }

    /**
     * Employee facts about the signed-in employee, from the directory entry HR linked to the account.
     * `employee: null` until HR links one.
     */
    public function employeeInformation(Request $request): JsonResponse
    {
        $employee = $request->user()->directoryEntry?->load('department', 'location', 'manager');

        return response()->json([
            'data' => [
                'employee_id' => $request->user()->employee_id,
                'employee' => $employee === null ? null : [
                    'full_name' => $employee->display_name,
                    'job_title' => $employee->job_title,
                    'department' => $employee->department?->name,
                    'location' => $employee->location?->name,
                    'company_email' => $employee->company_email,
                    'status' => $employee->employment_status,
                    'employment_type' => $employee->employment_type,
                    'date_joined' => $employee->date_joined?->toDateString(),
                    'manager' => $employee->manager?->display_name,
                ],
            ],
            'meta' => [
                'source' => 'portal',
                'connected' => $employee !== null,
                'message' => $employee !== null ? null : 'HR has not added your employee record yet.',
            ],
        ]);
    }

    /** File a request for an HR service. Same rules and tables as POST /api/requests, limited to HR-type request types. */
    public function createRequest(CreateRequestRequest $request): JsonResponse
    {
        $type = RequestType::query()->where('is_active', true)->findOrFail($request->integer('request_type_id'));
        if (! in_array($type->category, self::HR_CATEGORIES, true)) {
            throw ValidationException::withMessages(['request_type_id' => ['This request type is not an HR service.']]);
        }

        $created = $this->requests->create($request->user(), $type, $request->validated(), $request->boolean('save_as_draft'));

        return $this->created(new EmployeeRequestResource($created->load('requestType', 'history')));
    }
}
