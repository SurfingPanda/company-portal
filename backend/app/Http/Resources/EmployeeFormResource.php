<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;

/**
 * A form points at its document (document_id) instead of repeating its metadata. The id is withheld when the viewer is not
 * allowed to open that document, so a form cannot be used to discover a restricted one.
 *
 * @mixin \App\Models\EmployeeForm
 */
class EmployeeFormResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $document = $this->document;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'category' => $this->category->value,
            'form_type' => $this->form_type->value,
            'status' => $this->status->value,
            'instructions' => $this->instructions,
            'document_id' => $document !== null && Gate::allows('view', $document) ? $document->id : null,
            'request_type_id' => $this->request_type_id,
            'is_sample' => $this->is_sample,
        ];
    }
}
