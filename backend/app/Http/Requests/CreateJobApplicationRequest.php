<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

/** Apply for a job. Application number, status and the applicant user are set by the server. No resume file in this phase. */
class CreateJobApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('recruitment.apply') === true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'applicant_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255'],
            'mobile' => ['sometimes', 'nullable', 'string', 'max:40', 'regex:/^[0-9+()\-\s]{7,40}$/'],
            'cover_letter' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'skills' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'experience_summary' => ['sometimes', 'nullable', 'string', 'max:5000'],
            // Resume: documents only (no images, scripts or executables), 5 MB, and the detected content type must match.
            'resume' => [
                'sometimes', 'nullable',
                File::types(['pdf', 'doc', 'docx'])->max(5120),
                function (string $attribute, mixed $value, \Closure $fail) {
                    $allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'];
                    if ($value instanceof \Illuminate\Http\UploadedFile && ! in_array($value->getMimeType(), $allowed, true)) {
                        $fail('The resume must be a PDF, DOC or DOCX file.');
                    }
                },
            ],
        ];
    }
}
