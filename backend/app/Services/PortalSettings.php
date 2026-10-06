<?php

namespace App\Services;

use App\Models\AdminSetting;
use App\Models\User;

/**
 * The few portal-level settings administrators may change. The key list is fixed here: the API can neither create other
 * keys nor store secrets (no passwords, API keys or encryption keys belong in this table). Links to company systems live
 * here instead of being hard-coded in components.
 */
final class PortalSettings
{
    /** @var array<string, array{default: string|null, rule: list<string>, label: string, group: string}> */
    public const DEFINITIONS = [
        'portal_name' => ['default' => 'ELJIN Employee Portal', 'rule' => ['string', 'max:80'], 'label' => 'Portal name', 'group' => 'General'],
        'portal_description' => ['default' => null, 'rule' => ['string', 'max:300'], 'label' => 'Portal description', 'group' => 'General'],
        'support_contact_name' => ['default' => null, 'rule' => ['string', 'max:120'], 'label' => 'Support contact name', 'group' => 'General'],
        'support_email' => ['default' => null, 'rule' => ['email:rfc', 'max:255'], 'label' => 'Support email', 'group' => 'General'],
        'support_phone' => ['default' => null, 'rule' => ['string', 'max:40', 'regex:/^[0-9+()\-\s]{5,40}$/'], 'label' => 'Support phone', 'group' => 'General'],
        'erp_url' => ['default' => null, 'rule' => ['url:https', 'max:500'], 'label' => 'ERP address', 'group' => 'Links'],
        'ticketing_url' => ['default' => null, 'rule' => ['url:https', 'max:500'], 'label' => 'Ticketing system address', 'group' => 'Links'],
        'default_page_size' => ['default' => '20', 'rule' => ['integer', 'min:5', 'max:100'], 'label' => 'Default page size', 'group' => 'Portal behaviour'],
        'remember_search_history_default' => ['default' => 'true', 'rule' => ['in:true,false,1,0'], 'label' => 'Search history on by default', 'group' => 'Portal behaviour'],
    ];

    /** @return array<string, string|null> */
    public static function all(): array
    {
        $stored = AdminSetting::query()->pluck('value', 'key')->all();
        $result = [];
        foreach (self::DEFINITIONS as $key => $definition) {
            $result[$key] = array_key_exists($key, $stored) ? $stored[$key] : $definition['default'];
        }

        return $result;
    }

    /** @return array<string, list<string>> validation rules keyed by setting name (all optional + nullable) */
    public static function rules(): array
    {
        return collect(self::DEFINITIONS)->map(fn ($d) => ['sometimes', 'nullable', ...$d['rule']])->all();
    }

    /**
     * @param  array<string, mixed>  $values  already validated
     * @return array<string, array{from: string|null, to: string|null}> what changed (keys only, values truncated; no secrets exist here)
     */
    public static function update(array $values, User $by): array
    {
        $changes = [];
        $current = self::all();
        foreach (array_intersect_key($values, self::DEFINITIONS) as $key => $value) {
            $new = $value === null || $value === '' ? null : (is_bool($value) ? ($value ? 'true' : 'false') : (string) $value);
            if (($current[$key] ?? null) === $new) {
                continue;
            }
            AdminSetting::query()->updateOrCreate(['key' => $key], ['value' => $new, 'updated_by' => $by->getKey()]);
            $changes[$key] = ['from' => $current[$key] === null ? null : mb_substr($current[$key], 0, 80), 'to' => $new === null ? null : mb_substr($new, 0, 80)];
        }

        return $changes;
    }
}
