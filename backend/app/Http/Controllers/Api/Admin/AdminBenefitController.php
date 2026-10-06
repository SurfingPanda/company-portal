<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\BenefitStatus;
use App\Models\Benefit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Benefit INFORMATION entries published by HR. Informational only: there is no field for amounts, eligibility results,
 * claims or balances, and none will be accepted (benefit records are handled by HR outside the portal).
 */
class AdminBenefitController extends AdminCrudController
{
    protected function model(): string
    {
        return Benefit::class;
    }

    protected function module(): string
    {
        return 'benefits';
    }

    protected function entity(): string
    {
        return 'BENEFIT';
    }

    protected function label(Model $model): string
    {
        return $model->name;
    }

    protected function sorts(): array
    {
        return ['updated_at' => 'updated_at', 'name' => 'name', 'category' => 'category'];
    }

    protected function searchColumns(): array
    {
        return ['name', 'short_description', 'description'];
    }

    protected function filters(): array
    {
        return ['status' => ['sometimes', Rule::enum(BenefitStatus::class)], 'category' => ['sometimes', 'string', 'max:30']];
    }

    protected function rules(?Model $model): array
    {
        $required = $model === null ? 'required' : 'sometimes';

        return [
            'name' => [$required, 'string', 'max:255'],
            'short_description' => [$required, 'string', 'max:255'],
            'description' => [$required, 'string', 'max:5000'],
            'eligibility' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'category' => ['sometimes', 'string', 'regex:/^[a-z][a-z\-]{1,29}$/'],
            'status' => ['sometimes', Rule::enum(BenefitStatus::class)],
            'is_featured' => ['sometimes', 'boolean'],
        ];
    }

    protected function apply(Model $model, array $data, Request $request): void
    {
        /** @var Benefit $model */
        $model->fill(array_intersect_key($data, array_flip(['name', 'short_description', 'description', 'eligibility', 'category', 'is_featured'])));
        if (array_key_exists('status', $data)) {
            $model->status = $data['status'];
        }
        if (! $model->exists) {
            $base = Str::slug($data['name']) ?: 'benefit';
            $slug = $base;
            for ($i = 2; Benefit::where('slug', $slug)->exists(); $i++) {
                $slug = $base.'-'.$i;
            }
            $model->slug = $slug;
            $model->is_sample = false;
        }
    }

    protected function present(Model $model): array
    {
        /** @var Benefit $model */
        return [
            'id' => $model->id, 'name' => $model->name, 'short_description' => $model->short_description, 'description' => $model->description,
            'eligibility' => $model->eligibility, 'category' => $model->category, 'status' => $model->status->value, 'is_featured' => $model->is_featured,
            'updated_at' => $model->updated_at?->toIso8601String(), 'is_sample' => $model->is_sample,
        ];
    }
}
