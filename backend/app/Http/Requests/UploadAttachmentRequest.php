<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

/**
 * Attachment upload for a request or ticket. Allow-list only (documents, spreadsheets, plain images, text, zip-free), a
 * size cap, and the extension AND detected MIME type must both be on the list, so a renamed executable is rejected.
 * Ownership of the parent record is checked by the controller through the policy.
 */
class UploadAttachmentRequest extends FormRequest
{
    public const EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'txt'];

    public const MAX_KILOBYTES = 5120;

    /** Detected (content-based) MIME types that may be stored; anything else is refused whatever its name says. */
    public const MIME_TYPES = [
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip', // .docx/.xlsx are zip containers; the extension allow-list still applies
        'image/jpeg', 'image/png', 'text/plain',
    ];

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'file' => [
                'required',
                File::types(self::EXTENSIONS)->max(self::MAX_KILOBYTES),
                // Content-based check: a renamed executable keeps its .pdf name but not its content.
                function (string $attribute, mixed $value, \Closure $fail) {
                    if ($value instanceof \Illuminate\Http\UploadedFile && ! in_array($value->getMimeType(), self::MIME_TYPES, true)) {
                        $fail('This file type is not allowed. Use PDF, Word, Excel, JPG, PNG or text files.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Choose a file to attach.',
            'file.max' => 'The file must be 5 MB or smaller.',
            'file.mimes' => 'This file type is not allowed. Use PDF, Word, Excel, JPG, PNG or text files.',
        ];
    }
}
