<?php

/**
 * Link to Hubly, the IT ticketing system. When enabled, every helpdesk ticket an employee creates is sent to Hubly, and Hubly is
 * the master: IT edits tickets there, and status changes and public notes come back here (and the employee is notified).
 * Both directions are signed with the shared secret (HMAC-SHA256 over "timestamp.body"), so neither side accepts a forged call.
 */
return [
    'enabled' => (bool) env('HUBLY_ENABLED', false),
    // Hubly endpoint that receives events from the portal (ticket.created, ticket.reply, ticket.cancelled).
    'url' => env('HUBLY_URL'),
    // Shared secret, at least 32 characters. Never sent anywhere; only used to sign.
    'secret' => env('HUBLY_SECRET'),
    // How old (seconds) a signed call from Hubly may be.
    'tolerance' => (int) env('HUBLY_TOLERANCE', 300),
    'timeout' => (int) env('HUBLY_TIMEOUT', 8),
    'max_attempts' => 10,
    // Hubly work order status => portal ticket status.
    'status_map' => [
        'open' => 'open', 'in_progress' => 'open', 'on_hold' => 'pending', 'pending' => 'pending',
        'resolved' => 'resolved', 'closed' => 'closed', 'cancelled' => 'cancelled',
    ],
];
