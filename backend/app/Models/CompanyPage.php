<?php

namespace App\Models;

use App\Enums\ContentStatus;
use Illuminate\Database\Eloquent\Model;

/** A company information page (currently the `overview`). Employees see it only while it is published. */
class CompanyPage extends Model
{
    public const OVERVIEW = 'overview';

    protected $fillable = ['display_name', 'introduction_title', 'introduction', 'mission', 'vision', 'core_values'];

    protected function casts(): array
    {
        return ['status' => ContentStatus::class, 'core_values' => 'array', 'published_at' => 'datetime', 'is_sample' => 'boolean'];
    }

    public static function overview(): self
    {
        $page = static::query()->where('page_key', self::OVERVIEW)->first();
        if ($page === null) {
            $page = new static;
            $page->forceFill(['page_key' => self::OVERVIEW, 'status' => ContentStatus::Draft->value])->save();
        }

        return $page;
    }
}
