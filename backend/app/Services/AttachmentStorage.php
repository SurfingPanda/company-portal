<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Stores uploaded attachments on a PRIVATE disk (never `public`) under a server-generated name. The client's filename is
 * kept only as display metadata after being cleaned; it is never part of the stored path, and no path is ever returned
 * to the browser. Type and size are validated by UploadAttachmentRequest before this runs.
 */
final class AttachmentStorage
{
    public const DISK = 'local';

    /** @return array{original_filename: string, storage_path: string, disk: string, mime_type: string, file_size: int} */
    public static function store(UploadedFile $file, string $folder): array
    {
        $extension = strtolower($file->guessExtension() ?: $file->getClientOriginalExtension());
        $path = Storage::disk(self::DISK)->putFileAs($folder, $file, Str::uuid()->toString().'.'.$extension);

        return [
            'original_filename' => self::cleanName($file->getClientOriginalName()),
            'storage_path' => $path,
            'disk' => self::DISK,
            'mime_type' => (string) $file->getMimeType(),
            'file_size' => (int) $file->getSize(),
        ];
    }

    public static function delete(string $disk, string $path): void
    {
        Storage::disk($disk)->delete($path);
    }

    private static function cleanName(string $name): string
    {
        $name = basename(str_replace('\\', '/', $name));
        $name = preg_replace('/[\x00-\x1F\x7F<>:"|?*]/u', '', $name) ?? '';

        return Str::limit($name !== '' ? $name : 'attachment', 150, '');
    }
}
