<?php

namespace App\Policies;

use App\Enums\ContentStatus;
use App\Enums\DocumentAccessLevel;
use App\Models\Document;
use App\Models\User;

/**
 * Document access by level. Knowing a document's id grants nothing.
 *  - all:        any employee with `documents.view`
 *  - department: only employees whose directory-entry department matches the document's (no linked entry = denied)
 *  - manager:    managers (and administrators)
 *  - restricted: only document managers (`documents.manage`, `documents.hr-manage`, `documents.it-manage`)
 * Unpublished documents are visible to managers of documents only.
 */
class DocumentPolicy
{
    public function view(User $user, Document $document): bool
    {
        if ($this->manages($user)) {
            return true;
        }
        if (! $user->hasPermission('documents.view') || $document->status !== ContentStatus::Published) {
            return false;
        }

        return match ($document->access_level) {
            DocumentAccessLevel::All => true,
            DocumentAccessLevel::Department => $this->sameDepartment($user, $document),
            DocumentAccessLevel::Manager => $user->hasRole('manager', 'admin'),
            DocumentAccessLevel::Restricted => false,
        };
    }

    private function manages(User $user): bool
    {
        return $user->hasPermission('documents.manage') || $user->hasPermission('documents.hr-manage') || $user->hasPermission('documents.it-manage');
    }

    private function sameDepartment(User $user, Document $document): bool
    {
        $department = $user->directoryEntry?->department?->name;

        return $department !== null && $document->department !== null && strcasecmp($department, $document->department) === 0;
    }
}
