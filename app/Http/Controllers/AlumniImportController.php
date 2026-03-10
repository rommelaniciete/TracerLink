<?php

namespace App\Http\Controllers;

use App\Services\AlumniImportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AlumniImportController extends Controller
{
    /**
     * Import alumni from uploaded Excel file
     */
    public function import(Request $request, AlumniImportService $importService)
    {
        // Validate uploaded file
        $validator = Validator::make($request->all(), [
            'file' => 'required|mimes:xlsx,xls,csv|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $result = $importService->import($request->file('file'));
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Import failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
