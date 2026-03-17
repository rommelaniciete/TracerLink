<?php

namespace App\Jobs;

use App\Services\ImportProgressService;
use App\Services\StudentImportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ImportStudentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public function __construct(
        private readonly string $importId,
        private readonly string $storedPath,
    ) {
    }

    public function handle(StudentImportService $studentImportService, ImportProgressService $importProgress): void
    {
        try {
            $studentImportService->import(Storage::disk('local')->path($this->storedPath), $this->importId);
        } catch (ValidationException $exception) {
            $importProgress->fail($this->importId, $this->validationMessage($exception), [
                'errors' => $this->validationIssues($exception),
            ]);

            throw $exception;
        } catch (\Throwable $exception) {
            $importProgress->fail($this->importId, 'Import failed.');

            throw $exception;
        } finally {
            Storage::disk('local')->delete($this->storedPath);
        }
    }

    private function validationMessage(ValidationException $exception): string
    {
        foreach ($exception->errors() as $messages) {
            if (! empty($messages[0])) {
                return (string) $messages[0];
            }
        }

        return 'Import failed.';
    }

    private function validationIssues(ValidationException $exception): array
    {
        $issues = [];

        foreach ($exception->errors() as $messages) {
            foreach ($messages as $message) {
                $issues[] = [
                    'row' => null,
                    'reason' => (string) $message,
                ];
            }
        }

        return $issues;
    }
}
