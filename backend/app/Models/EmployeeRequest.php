<?php

namespace App\Models;

use App\Enums\RequestPriority;
use App\Enums\RequestStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A request submitted by a portal user. It BELONGS to that user: always query through `$user->requests()` or authorise
 * with EmployeeRequestPolicy. `user_id`, `status` and `reference_number` are never mass-assignable.
 */
class EmployeeRequest extends Model
{
    use HasFactory;

    protected $fillable = ['request_type_id', 'subject', 'description', 'form_data', 'priority'];

    protected function casts(): array
    {
        return [
            'status' => RequestStatus::class,
            'priority' => RequestPriority::class,
            'form_data' => 'array',
            'submitted_at' => 'datetime',
            'completed_at' => 'datetime',
            'is_sample' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function requestType(): BelongsTo
    {
        return $this->belongsTo(RequestType::class);
    }

    public function history(): HasMany
    {
        return $this->hasMany(RequestHistory::class)->orderBy('created_at')->orderBy('id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(RequestAttachment::class);
    }

    public function scopeOwnedBy(Builder $query, User $user): Builder
    {
        return $query->where('user_id', $user->getKey());
    }

    /** Records a status change and the history row for the timeline together. */
    public function changeStatus(RequestStatus $status, ?User $by = null, ?string $comment = null): void
    {
        $this->status = $status;
        if ($status === RequestStatus::Submitted && $this->submitted_at === null) {
            $this->submitted_at = now();
        }
        if ($status === RequestStatus::Completed) {
            $this->completed_at = now();
        }
        $this->save();
        $this->history()->forceCreate(['status' => $status->value, 'comment' => $comment, 'user_id' => $by?->getKey()]);
    }
}
