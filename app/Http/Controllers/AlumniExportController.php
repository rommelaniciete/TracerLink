<?php

namespace App\Http\Controllers;

use App\Services\AlumniExportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AlumniExportController extends Controller
{
    /**
     * Export selected or all alumni to Excel
     */
    public function export(Request $request, AlumniExportService $exportService)
    {
        try {
            $selectedIds = array_values(array_filter((array) $request->input('selectedIds', [])));
            $filters = [
                'search' => trim((string) $request->input('search', '')),
                'graduation_year' => (string) $request->input('graduation_year', ''),
                'program_id' => (string) $request->input('program_id', ''),
                'employment_status' => (string) $request->input('employment_status', ''),
                'work_location' => (string) $request->input('work_location', ''),
                'sex' => (string) $request->input('sex', ''),
            ];
            $excelOutput = $exportService->export($filters, $selectedIds);

            return response($excelOutput)
                ->header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                ->header('Content-Disposition', 'attachment; filename="alumni-list.xlsx"')
                ->header('Cache-Control', 'max-age=0');

        } catch (\Exception $e) {
            Log::error('Export failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Export failed',
                'error'   => $e->getMessage(),
            ], str_contains($e->getMessage(), 'No alumni found') ? 400 : 500);
        }
    }
}
