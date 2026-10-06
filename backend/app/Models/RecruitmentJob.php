<?php

namespace App\Models;

use App\Enums\JobStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A job posting. Postings are public to signed-in employees; applications and referrals are private to their owners. */
class RecruitmentJob extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'department', 'location', 'employment_type', 'work_arrangement', 'summary', 'description', 'requirements', 'closing_at'];

    protected function casts(): array
    {
        return [
            'status' => JobStatus::class,
            'application_enabled' => 'boolean',
            'referral_enabled' => 'boolean',
            'published_at' => 'datetime',
            'closing_at' => 'datetime',
            'is_sample' => 'boolean',
        ];
    }

    /** Postings that have been published (not scheduled for later). Closed and filled ones stay listed so employees see the outcome. */
    public function scopeListed(Builder $query): Builder
    {
        return $query->where(fn (Builder $q) => $q->whereNull('published_at')->orWhere('published_at', '<=', now()));
    }

    /** Whether new applications or referrals may still be submitted. */
    public function acceptsSubmissions(): bool
    {
        return in_array($this->status, [JobStatus::Open, JobStatus::ClosingSoon], true)
            && ($this->closing_at === null || $this->closing_at->isFuture());
    }

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class, 'job_id');
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(JobReferral::class, 'job_id');
    }
}
