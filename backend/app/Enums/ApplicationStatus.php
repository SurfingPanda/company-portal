<?php

namespace App\Enums;

/** Stored as a plain string column (portable across MySQL/SQLite); values match the React portal's slugs. */
enum ApplicationStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case UnderReview = 'under-review';
    case Shortlisted = 'shortlisted';
    case Interview = 'interview';
    case ForAssessment = 'for-assessment';
    case Offer = 'offer';
    case Rejected = 'rejected';
    case Withdrawn = 'withdrawn';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
