<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Attachment metadata only. The storage disk and path are never exposed. Also used for helpdesk attachments.
 *
 * @mixin \App\Models\RequestAttachment
 */
class RequestAttachmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'filename' => $this->original_filename,
            'mime_type' => $this->mime_type,
            'file_size' => $this->file_size,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
