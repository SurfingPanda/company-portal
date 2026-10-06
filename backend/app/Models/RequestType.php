<?php

namespace App\Models;

use App\Enums\RequestCategory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A definition of a request an employee can submit (not a request itself). */
class RequestType extends Model
{
    use HasFactory;

    protected $fillable = ['request_code', 'name', 'description', 'category', 'reference_prefix', 'requires_attachment', 'requires_approval', 'is_active', 'fields'];

    protected function casts(): array
    {
        return [
            'category' => RequestCategory::class,
            'requires_attachment' => 'boolean',
            'requires_approval' => 'boolean',
            'is_active' => 'boolean',
            'fields' => 'array',
            'is_sample' => 'boolean',
        ];
    }

    public function requests(): HasMany
    {
        return $this->hasMany(EmployeeRequest::class);
    }
}
