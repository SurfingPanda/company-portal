<?php

namespace App\Http\Controllers\Api;

use App\Enums\ApplicationStatus;
use App\Enums\JobStatus;
use App\Enums\NotificationType;
use App\Http\Requests\CreateJobApplicationRequest;
use App\Http\Requests\CreateJobReferralRequest;
use App\Http\Resources\JobApplicationResource;
use App\Http\Resources\JobOpeningResource;
use App\Http\Resources\JobReferralResource;
use App\Models\JobApplication;
use App\Models\JobReferral;
use App\Models\RecruitmentJob;
use App\Services\AttachmentStorage;
use App\Services\PortalEvents;
use App\Services\ReferenceNumbers;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Internal job postings, applications and referrals. Employees see only their own applications and referrals (another
 * person's id is a 404). No applicant scoring, ranking, interview scheduling or recruiter workflow exists here.
 */
class RecruitmentController extends ApiController
{
    public function jobs(Request $request): AnonymousResourceCollection
    {
        $input = $this->listInput($request, [
            'department' => ['sometimes', 'string', 'max:80'],
            'employment_type' => ['sometimes', 'string', 'max:30'],
            'status' => ['sometimes', Rule::enum(JobStatus::class)],
        ], ['published_at', 'title']);

        $query = RecruitmentJob::query()->listed()
            ->when($input['department'] ?? null, fn (Builder $q, $v) => $q->where('department', $v))
            ->when($input['employment_type'] ?? null, fn (Builder $q, $v) => $q->where('employment_type', $v))
            ->when($input['status'] ?? null, fn (Builder $q, $v) => $q->where('status', $v));
        $this->searched($query, $input['search'] ?? null, ['title', 'department', 'location', 'summary']);

        return $this->paginated($this->sorted($query, $request, ['published_at' => 'published_at', 'title' => 'title'], 'published_at'), $request, JobOpeningResource::class);
    }

    public function job(int $job): JobOpeningResource
    {
        return new JobOpeningResource(RecruitmentJob::query()->listed()->findOrFail($job));
    }

    public function apply(CreateJobApplicationRequest $request, int $job): JsonResponse
    {
        $opening = RecruitmentJob::query()->listed()->findOrFail($job);
        // Closed, filled or application-disabled postings cannot receive applications.
        abort_unless($opening->application_enabled && $opening->acceptsSubmissions(), 409);
        $user = $request->user();

        // Stored on the private disk under a server-generated name; the path is never returned to the browser.
        $resume = $request->file('resume') ? AttachmentStorage::store($request->file('resume'), 'resumes/'.$user->getKey()) : null;

        try {
            $application = $this->createApplication($request, $opening, $user, $resume);
        } catch (\Throwable $e) {
            if ($resume !== null) {
                AttachmentStorage::delete($resume['disk'], $resume['storage_path']); // no orphan file when the submission fails
            }
            throw $e;
        }

        return $this->created(new JobApplicationResource($application->load('job')));
    }

    /** @param  array{storage_path: string}|null  $resume */
    private function createApplication(CreateJobApplicationRequest $request, RecruitmentJob $opening, \App\Models\User $user, ?array $resume): JobApplication
    {
        return ReferenceNumbers::create('job_applications', 'application_number', 'APP', 4, function (string $number) use ($user, $opening, $request, $resume) {
            $application = new JobApplication($request->safe()->only(['applicant_name', 'email', 'mobile', 'cover_letter', 'skills', 'experience_summary']));
            $application->forceFill([
                'resume_path' => $resume['storage_path'] ?? null,
                'application_number' => $number,
                'job_id' => $opening->getKey(),
                'user_id' => $user->getKey(),
                'status' => ApplicationStatus::Submitted,
                'submitted_at' => now(),
            ])->save();

            PortalEvents::activity($user, 'application_submitted', "Applied for {$opening->title} ({$number})", 'job_application', $application->getKey());
            PortalEvents::notify($user, NotificationType::Hr, 'Application received', "Your application {$number} for {$opening->title} was received.", '/recruitment/applications/'.$number);

            return $application;
        });
    }

    public function refer(CreateJobReferralRequest $request, int $job): JsonResponse
    {
        $opening = RecruitmentJob::query()->listed()->findOrFail($job);
        abort_unless($opening->referral_enabled && $opening->acceptsSubmissions(), 409);
        $user = $request->user();

        $referral = ReferenceNumbers::create('job_referrals', 'referral_number', 'REF', 4, function (string $number) use ($user, $opening, $request) {
            $referral = new JobReferral($request->safe()->only(['referred_name', 'referred_email', 'referred_mobile', 'relationship', 'notes']));
            $referral->forceFill([
                'referral_number' => $number,
                'job_id' => $opening->getKey(),
                'referring_user_id' => $user->getKey(),
                'status' => 'submitted',
            ])->save();

            PortalEvents::activity($user, 'referral_submitted', "Referred a candidate for {$opening->title} ({$number})", 'job_referral', $referral->getKey());
            PortalEvents::notify($user, NotificationType::Hr, 'Referral received', "Your referral {$number} for {$opening->title} was received.", '/recruitment/referrals/'.$number);

            return $referral;
        });

        return $this->created(new JobReferralResource($referral->load('job')));
    }

    public function applications(Request $request): AnonymousResourceCollection
    {
        $input = $this->listInput($request, ['status' => ['sometimes', Rule::enum(ApplicationStatus::class)]], ['submitted_at']);

        $query = $request->user()->applications()->getQuery()->with('job')
            ->when($input['status'] ?? null, fn (Builder $q, $v) => $q->where('status', $v));
        $this->searched($query, $input['search'] ?? null, ['application_number', 'applicant_name']);

        return $this->paginated($this->sorted($query, $request, ['submitted_at' => 'submitted_at'], 'submitted_at'), $request, JobApplicationResource::class);
    }

    public function application(Request $request, int $application): JobApplicationResource
    {
        $model = JobApplication::query()->with('job')->findOrFail($application);

        return new JobApplicationResource($this->mustView($model));
    }

    public function referrals(Request $request): AnonymousResourceCollection
    {
        $input = $this->listInput($request, [], ['created_at']);

        $query = $request->user()->referrals()->getQuery()->with('job');
        $this->searched($query, $input['search'] ?? null, ['referral_number', 'referred_name']);

        return $this->paginated($this->sorted($query, $request, ['created_at' => 'created_at'], 'created_at'), $request, JobReferralResource::class);
    }

    public function referral(Request $request, int $referral): JobReferralResource
    {
        $model = JobReferral::query()->with('job')->findOrFail($referral);

        return new JobReferralResource($this->mustView($model));
    }
}
