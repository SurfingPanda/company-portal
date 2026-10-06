<?php

namespace App\Models;

use App\Enums\BenefitStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Benefit INFORMATION only. No balances, claims, medical data, deductions or eligibility calculations. */
class Benefit extends Model
{
    protected $fillable = ['slug', 'name', 'short_description', 'description', 'eligibility', 'category', 'is_featured'];

    protected function casts(): array
    {
        return [
            'status' => BenefitStatus::class,
            'is_featured' => 'boolean',
            'is_sample' => 'boolean',
        ];
    }

    public function faqs(): HasMany
    {
        return $this->hasMany(BenefitFaq::class)->orderBy('sort_order');
    }
}
