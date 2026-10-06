<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** A reply on a ticket. Whether the user may reply to THIS ticket is HelpdeskTicketPolicy::reply (checked in the controller). */
class CreateHelpdeskReplyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return ['message' => ['required', 'string', 'min:2', 'max:5000']];
    }
}
