<?php

namespace App\Models;

use App\Enums\ContentStatus;
use App\Enums\FormCategory;
use App\Enums\FormType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A downloadable form (points at a Document, so metadata is not duplicated) or an online form (starts a RequestType). */
class EmployeeForm extends Model
{
    protected $fillable = ['title', 'description', 'category', 'form_type', 'document_id', 'request_type_id', 'instructions'];

    protected function casts(): array
    {
        return [
            'category' => FormCategory::class,
            'form_type' => FormType::class,
            'status' => ContentStatus::class,
            'is_sample' => 'boolean',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function requestType(): BelongsTo
    {
        return $this->belongsTo(RequestType::class);
    }
}
