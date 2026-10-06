<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Attachment metadata. No file storage exists yet; the storage reference is never serialised. */
class RequestAttachment extends Model
{
    protected $fillable = ['original_filename', 'mime_type', 'file_size'];

    protected $hidden = ['storage_path', 'disk'];

    protected function casts(): array
    {
        return ['file_size' => 'integer'];
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(EmployeeRequest::class, 'employee_request_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
