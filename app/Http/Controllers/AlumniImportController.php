<?php

namespace App\Http\Controllers;

use App\Jobs\ImportAlumniJob;
use App\Services\ImportProgressService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AlumniImportController extends Controller
{
    /**
     * Import alumni from uploaded Excel file
     */
    public function import(Request $request, ImportProgressService $importProgress)
    {
        // Validate uploaded file
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls,csv|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Please upload a valid Excel or CSV file no larger than 2 MB.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $importId = trim((string) $request->input('import_id', '')) ?: (string) str()->uuid();
        $storedPath = $request->file('file')->store('imports/alumni');

        $importProgress->queue($importId);
        ImportAlumniJob::dispatch($importId, $storedPath);

        return response()->json([
            'import_id' => $importId,
            'message' => 'Upload complete. Import started.',
        ], 202);
    }
}
