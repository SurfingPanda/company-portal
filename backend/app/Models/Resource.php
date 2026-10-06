<?php

namespace App\Models;

use App\Enums\ContentStatus;
use App\Enums\ResourceType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Points at a document, form, benefit or route; never copies their content. */
class Resource extends Model
{
    protected $fillable = ['title', 'description', 'category', 'resource_type', 'target_url', 'document_id', 'form_id', 'service_key', 'benefit_id', 'is_featured'];

    protected function casts(): array
    {
        return [
            'resource_type' => ResourceType::class,
            'status' => ContentStatus::class,
            'is_featured' => 'boolean',
            'is_sample' => 'boolean',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function form(): BelongsTo
    {
        return $this->belongsTo(EmployeeForm::class, 'form_id');
    }

    public function benefit(): BelongsTo
    {
        return $this->belongsTo(Benefit::class);
    }
}
