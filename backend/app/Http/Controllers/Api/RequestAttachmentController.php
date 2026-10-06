<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\UploadAttachmentRequest;
use App\Http\Resources\RequestAttachmentResource;
use App\Models\EmployeeRequest;
use App\Services\AttachmentStorage;
use App\Services\PortalEvents;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/**
 * Attachments on a request. Only metadata is returned (never a path). The parent request is resolved through the same
 * visibility rule as the request itself, so an attachment of someone else's request is a 404.
 */
class RequestAttachmentController extends ApiController
{
    public function index(Request $request, int $requestId): AnonymousResourceCollection
    {
        return RequestAttachmentResource::collection($this->parent($requestId)->attachments()->orderBy('id')->get());
    }

    public function store(UploadAttachmentRequest $request, int $requestId): JsonResponse
    {
        $parent = $this->parent($requestId);
        Gate::authorize('attach', $parent);

        $stored = AttachmentStorage::store($request->file('file'), 'attachments/requests/'.$parent->getKey());

        try {
            $attachment = DB::transaction(function () use ($parent, $request, $stored) {
                $attachment = $parent->attachments()->make(['original_filename' => $stored['original_filename'], 'mime_type' => $stored['mime_type'], 'file_size' => $stored['file_size']]);
                $attachment->forceFill(['storage_path' => $stored['storage_path'], 'disk' => $stored['disk'], 'uploaded_by' => $request->user()->getKey()])->save();
                PortalEvents::activity($request->user(), 'request_attachment_added', "Attached a file to {$parent->reference_number}", 'request', $parent->getKey());

                return $attachment;
            });
        } catch (\Throwable $e) {
            AttachmentStorage::delete($stored['disk'], $stored['storage_path']); // do not leave an orphan file behind
            throw $e;
        }

        return $this->created(new RequestAttachmentResource($attachment));
    }

    public function destroy(int $requestId, int $attachment): JsonResponse
    {
        $parent = $this->parent($requestId);
        Gate::authorize('attach', $parent);

        $model = $parent->attachments()->findOrFail($attachment); // scoped to the parent: another request's attachment is a 404
        $disk = $model->disk;
        $path = $model->storage_path;
        $model->delete();
        AttachmentStorage::delete($disk, $path);

        return $this->noContent();
    }

    private function parent(int $requestId): EmployeeRequest
    {
        $parent = EmployeeRequest::query()->with('requestType')->findOrFail($requestId);
        $this->mustView($parent);

        return $parent;
    }
}
