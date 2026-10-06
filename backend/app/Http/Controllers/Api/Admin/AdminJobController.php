<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\ApplicationStatus;
use App\Enums\JobStatus;
use App\Http\Controllers\Api\ApiController;
use App\Models\JobApplication;
use App\Models\JobReferral;
use App\Models\RecruitmentJob;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Job postings (create, edit, publish, close) plus READ-ONLY lists of applications and referrals for recruitment staff.
 * Not an ATS: no scoring, ranking, interview scheduling or recruiter notes.
 */
class AdminJobController extends AdminCrudController
{
    protected function model(): string
    {
        return RecruitmentJob::class;
    }

    protected function module(): string
    {
        return 'recruitment';
    }

    protected function entity(): string
    {
        return 'RECRUITMENT_POSTING';
    }

    protected function sorts(): array
    {
        return ['updated_at' => 'updated_at', 'title' => 'title', 'published_at' => 'published_at', 'status' => 'status'];
    }

    protected function searchColumns(): array
    {
        return ['title', 'department', 'location'];
    }

    protected function filters(): array
    {
        return ['status' => ['sometimes', Rule::enum(JobStatus::class)], 'department' => ['sometimes', 'string', 'max:80']];
    }

    protected function rules(?Model $model): array
    {
        $required = $model === null ? 'required' : 'sometimes';

        return [
            'title' => [$required, 'string', 'max:255'],
            'department' => [$required, 'string', 'max:80'],
            'location' => [$required, 'string', 'max:255'],
            'employment_type' => [$required, Rule::in(['full-time', 'part-time', 'contract', 'internship'])],
            'work_arrangement' => ['sometimes', 'nullable', Rule::in(['on-site', 'hybrid', 'remote'])],
            'summary' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'description' => [$required, 'string', 'max:10000'],
            'requirements' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'status' => ['sometimes', Rule::enum(JobStatus::class)],
            'application_enabled' => ['sometimes', 'boolean'],
            'referral_enabled' => ['sometimes', 'boolean'],
            'published_at' => ['sometimes', 'nullable', 'date'],
            'closing_at' => ['sometimes', 'nullable', 'date', 'after_or_equal:published_at'],
        ];
    }

    protected function apply(Model $model, array $data, Request $request): void
    {
        /** @var RecruitmentJob $model */
        $model->fill(array_intersect_key($data, array_flip(['title', 'department', 'location', 'employment_type', 'work_arrangement', 'summary', 'description', 'requirements', 'closing_at'])));
        foreach (['status', 'application_enabled', 'referral_enabled', 'published_at'] as $field) {
            if (array_key_exists($field, $data)) {
                $model->{$field} = $data[$field];
            }
        }
        if (($data['status'] ?? null) === JobStatus::Open->value && $model->published_at === null) {
            $model->published_at = now();
        }
        if (! $model->exists) {
            $model->is_sample = false;
        }
    }

    protected function present(Model $model): array
    {
        /** @var RecruitmentJob $model */
        return [
            'id' => $model->id, 'title' => $model->title, 'department' => $model->department, 'location' => $model->location,
            'employment_type' => $model->employment_type, 'work_arrangement' => $model->work_arrangement, 'summary' => $model->summary,
            'description' => $model->description, 'requirements' => $model->requirements, 'status' => $model->status->value,
            'application_enabled' => $model->application_enabled, 'referral_enabled' => $model->referral_enabled,
            'published_at' => $model->published_at?->toIso8601String(), 'closing_at' => $model->closing_at?->toIso8601String(),
            'applications_count' => $model->applications()->count(), 'updated_at' => $model->updated_at?->toIso8601String(), 'is_sample' => $model->is_sample,
        ];
    }

    public function applications(Request $request): JsonResponse
    {
        $input = $this->listInput($request, ['status' => ['sometimes', Rule::enum(ApplicationStatus::class)], 'job_id' => ['sometimes', 'integer']], ['submitted_at']);
        $query = JobApplication::query()->with('job')
            ->when($input['status'] ?? null, fn (Builder $q, $v) => $q->where('status', $v))
            ->when($input['job_id'] ?? null, fn (Builder $q, $v) => $q->where('job_id', $v));
        $this->searched($query, $input['search'] ?? null, ['application_number', 'applicant_name', 'email']);
        $page = $this->sorted($query, $request, ['submitted_at' => 'submitted_at'], 'submitted_at')->paginate($this->perPage($request));

        return response()->json([
            // Applicant-provided details only. Resume paths are never exposed, and there are no scores or recruiter notes.
            'data' => $page->getCollection()->map(fn (JobApplication $a) => [
                'id' => $a->id, 'application_number' => $a->application_number, 'job' => $a->job?->title, 'applicant_name' => $a->applicant_name,
                'email' => $a->email, 'status' => $a->status->value, 'has_resume' => $a->resume_path !== null, 'submitted_at' => $a->submitted_at?->toIso8601String(),
            ])->values(),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total()],
        ]);
    }

    public function referrals(Request $request): JsonResponse
    {
        $input = $this->listInput($request, [], ['created_at']);
        $query = JobReferral::query()->with('job', 'referringUser');
        $this->searched($query, $input['search'] ?? null, ['referral_number', 'referred_name']);
        $page = $this->sorted($query, $request, ['created_at' => 'created_at'], 'created_at')->paginate($this->perPage($request));

        return response()->json([
            'data' => $page->getCollection()->map(fn (JobReferral $r) => [
                'id' => $r->id, 'referral_number' => $r->referral_number, 'job' => $r->job?->title, 'referred_name' => $r->referred_name,
                'referred_email' => $r->referred_email, 'referred_by' => $r->referringUser?->employee_id, 'status' => $r->status, 'created_at' => $r->created_at?->toIso8601String(),
            ])->values(),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total()],
        ]);
    }
}
