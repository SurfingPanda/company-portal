<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BenefitFaq extends Model
{
    protected $fillable = ['benefit_id', 'question', 'answer', 'category', 'sort_order'];

    protected function casts(): array
    {
        return ['is_sample' => 'boolean'];
    }

    public function benefit(): BelongsTo
    {
        return $this->belongsTo(Benefit::class);
    }
}
