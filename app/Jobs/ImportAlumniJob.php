<?php

namespace App\Jobs;

use App\Services\AlumniImportService;
use App\Services\ImportProgressService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;

class ImportAlumniJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public function __construct(
        private readonly string $importId,
        private readonly string $storedPath,
    ) {
    }

    public function handle(AlumniImportService $alumniImportService, ImportProgressService $importProgress): void
    {
        try {
            $alumniImportService->import(Storage::disk('local')->path($this->storedPath), $this->importId);
        } catch (InvalidArgumentException $exception) {
            $importProgress->fail($this->importId, $exception->getMessage(), [
                'errors' => [
                    [
                        'row' => null,
                        'reason' => $exception->getMessage(),
                    ],
                ],
            ]);

            throw $exception;
        } catch (\Throwable $exception) {
            $importProgress->fail($this->importId, 'Import failed.');

            throw $exception;
        } finally {
            Storage::disk('local')->delete($this->storedPath);
        }
    }
}
