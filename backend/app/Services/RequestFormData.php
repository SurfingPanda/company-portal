<?php

namespace App\Services;

use App\Models\RequestType;
use Illuminate\Validation\Rule;

/**
 * Turns a request type's field definitions (the same shape the React dynamic form uses: id, type, required, options, min)
 * into Laravel validation rules, and keeps only the answers the type actually asks for.
 */
final class RequestFormData
{
    /**
     * @return array<string, list<mixed>>
     */
    public static function rules(?RequestType $type, bool $enforceRequired): array
    {
        $rules = [];
        foreach ($type?->fields ?? [] as $field) {
            $id = (string) ($field['id'] ?? '');
            if ($id === '' || ! preg_match('/^[A-Za-z0-9_-]{1,60}$/', $id)) {
                continue;
            }
            $required = ($field['required'] ?? false) === true && $enforceRequired;
            $rule = [$required ? 'required' : 'nullable'];
            $rule = array_merge($rule, match ($field['type'] ?? 'text') {
                'textarea' => ['string', 'max:5000'],
                'email' => ['email:rfc', 'max:255'],
                'date' => ['date'],
                'time' => ['date_format:H:i'],
                'number' => ['numeric', ...(isset($field['min']) ? ['min:'.(float) $field['min']] : [])],
                'checkbox' => ['boolean'],
                'select' => ['string', Rule::in(array_map('strval', $field['options'] ?? []))],
                'file' => ['string', 'max:255'], // attachment name only; the file itself goes through the attachments endpoint
                default => ['string', 'max:255'],
            });
            $rules["form_data.$id"] = $rule;
        }

        return $rules;
    }

    /**
     * Keep only the answers whose field the request type defines.
     *
     * @param  array<string, mixed>|null  $answers
     * @return array<string, mixed>
     */
    public static function only(?RequestType $type, ?array $answers): array
    {
        $known = array_filter(array_map(fn ($f) => $f['id'] ?? null, $type?->fields ?? []));

        return array_intersect_key($answers ?? [], array_flip($known));
    }
}
