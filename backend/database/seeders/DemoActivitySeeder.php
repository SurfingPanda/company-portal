<?php

namespace Database\Seeders;

use App\Enums\RequestStatus;
use App\Models\ActivityLog;
use App\Models\EmployeeRequest;
use App\Models\HelpdeskTicket;
use App\Models\PortalNotification;
use App\Models\RequestType;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * SAMPLE / DEMO / MOCK DATA. DEVELOPMENT ONLY. A few fictional requests, a ticket, notifications and activity for the demo
 * employee (EMP-0001), so the portal has something to show. Nothing here is a real record.
 */
class DemoActivitySeeder extends Seeder
{
    public function run(): void
    {
        $employee = User::query()->where('employee_id', 'EMP-0001')->first();
        if (! $employee) {
            return;
        }

        $leave = RequestType::query()->where('request_code', 'rt-leave')->first();
        $hr = RequestType::query()->where('request_code', 'rt-hr-inquiry')->first();

        $leaveRequest = EmployeeRequest::query()->firstOrNew(['reference_number' => 'LV-2026-0001']);
        if (! $leaveRequest->exists) {
            $leaveRequest->forceFill([
                'request_type_id' => $leave->getKey(), 'user_id' => $employee->getKey(), 'subject' => 'Sample leave request', 'description' => 'Sample request.',
                'form_data' => ['leave-type' => 'Vacation Leave', 'start-date' => '2026-10-26', 'end-date' => '2026-10-30', 'reason' => 'Sample reason'],
                'priority' => 'normal', 'is_sample' => true, 'status' => RequestStatus::Draft,
            ])->save();
            $leaveRequest->changeStatus(RequestStatus::Submitted, $employee);
            $leaveRequest->changeStatus(RequestStatus::UnderReview, null, 'Sample review step.');
        }

        $inquiry = EmployeeRequest::query()->firstOrNew(['reference_number' => 'REQ-2026-0001']);
        if (! $inquiry->exists) {
            $inquiry->forceFill([
                'request_type_id' => $hr->getKey(), 'user_id' => $employee->getKey(), 'subject' => 'Sample HR inquiry', 'description' => 'Sample request.',
                'priority' => 'normal', 'is_sample' => true, 'status' => RequestStatus::Draft,
            ])->save();
            $inquiry->changeStatus(RequestStatus::Submitted, $employee);
        }

        foreach ([['request', 'Sample request update', '/requests/LV-2026-0001'], ['announcement', 'Sample announcement', '/announcements'], ['system', 'Sample system notice', null]] as [$type, $title, $link]) {
            PortalNotification::query()->firstOrCreate(['user_id' => $employee->getKey(), 'title' => $title], ['type' => $type, 'message' => 'Sample notification for development.', 'link' => $link, 'is_sample' => true]);
        }

        foreach ([['request_submitted', 'Submitted a sample leave request', 'employee_requests'], ['document_viewed', 'Viewed a sample document', 'documents']] as [$type, $description, $entity]) {
            ActivityLog::query()->firstOrCreate(['user_id' => $employee->getKey(), 'activity_type' => $type], ['description' => $description, 'entity_type' => $entity]);
        }

        $ticket = HelpdeskTicket::query()->firstOrNew(['ticket_number' => 'TKT-2026-0001']);
        if (! $ticket->exists) {
            $ticket->forceFill([
                'user_id' => $employee->getKey(), 'category' => 'hardware', 'type' => 'incident', 'subject' => 'Sample ticket', 'description' => 'Sample ticket for development.',
                'priority' => 'normal', 'status' => 'open', 'is_sample' => true,
            ])->save();
            $ticket->replies()->forceCreate(['helpdesk_ticket_id' => $ticket->getKey(), 'user_id' => $employee->getKey(), 'message' => 'Sample reply.']);
        }
    }
}
