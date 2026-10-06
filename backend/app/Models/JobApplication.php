<?php

namespace App\Models;

use App\Enums\ApplicationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** An application. Visible only to the applicant (and recruitment staff via policy). No scoring, ranking or recruiter notes. */
class JobApplication extends Model
{
    use HasFactory;

    protected $fillable = ['job_id', 'applicant_name', 'email', 'mobile', 'cover_letter', 'skills', 'experience_summary'];

    protected $hidden = ['resume_path'];

    protected function casts(): array
    {
        return [
            'status' => ApplicationStatus::class,
            'submitted_at' => 'datetime',
            'is_sample' => 'boolean',
        ];
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(RecruitmentJob::class, 'job_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
