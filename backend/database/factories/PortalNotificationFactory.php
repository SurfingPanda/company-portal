<?php

namespace Database\Factories;

use App\Enums\NotificationType;
use App\Models\PortalNotification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<PortalNotification> */
class PortalNotificationFactory extends Factory
{
    protected $model = PortalNotification::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => NotificationType::System,
            'title' => 'Sample notification',
            'message' => 'Sample notification for development.',
            'link' => null,
            'read_at' => null,
            'is_sample' => true,
        ];
    }

    public function forUser(User $user): static
    {
        return $this->state(['user_id' => $user->getKey()]);
    }
}
