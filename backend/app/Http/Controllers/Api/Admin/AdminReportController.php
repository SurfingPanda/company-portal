<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Services\Audit;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Company reports and CSV exports (`reports.view`). Read-only; every export is written to the audit log. */
class AdminReportController extends ApiController
{
    public function __construct(private readonly ReportService $reports) {}

    public function overview(Request $request): JsonResponse
    {
        $data = $request->validate(['months' => ['sometimes', 'integer', 'min:3', 'max:36']]);

        return response()->json(['data' => $this->reports->overview((int) ($data['months'] ?? 12))]);
    }

    public function export(Request $request, string $type): StreamedResponse
    {
        $rows = $this->reports->exportRows($type);
        Audit::record($request->user(), 'REPORT_EXPORTED', 'reports', null, $type, 'success', ['rows' => count($rows) - 1]);

        return response()->streamDownload(function () use ($rows) {
            echo "\xEF\xBB\xBF"; // byte-order mark so Excel reads accents correctly
            foreach ($rows as $row) {
                echo implode(',', array_map([ReportService::class, 'cell'], $row))."\r\n";
            }
        }, "{$type}-".now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8', 'Cache-Control' => 'no-store']);
    }
}
