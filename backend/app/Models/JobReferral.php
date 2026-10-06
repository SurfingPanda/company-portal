<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobReferral extends Model
{
    protected $fillable = ['job_id', 'referred_name', 'referred_email', 'referred_mobile', 'relationship', 'notes'];

    protected function casts(): array
    {
        return ['is_sample' => 'boolean'];
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(RecruitmentJob::class, 'job_id');
    }

    public function referringUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referring_user_id');
    }
}
