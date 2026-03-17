<?php

namespace App\Http\Controllers;

use App\Services\ImportProgressService;

class ImportProgressController extends Controller
{
    public function show(string $importId, ImportProgressService $importProgress)
    {
        $progress = $importProgress->get($importId);

        if ($progress === null) {
            abort(404);
        }

        return response()->json($progress);
    }
}
