<?php

namespace Database\Factories;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\HelpdeskTicket;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<HelpdeskTicket> */
class HelpdeskTicketFactory extends Factory
{
    public function definition(): array
    {
        return [
            'ticket_number' => 'TKT-2026-'.fake()->unique()->numerify('####'),
            'user_id' => User::factory(),
            'category' => 'hardware',
            'type' => 'incident',
            'subject' => 'Sample ticket',
            'description' => 'Sample ticket for development.',
            'priority' => TicketPriority::Normal,
            'status' => TicketStatus::New,
            'is_sample' => true,
        ];
    }

    public function forUser(User $user): static
    {
        return $this->state(['user_id' => $user->getKey()]);
    }
}
