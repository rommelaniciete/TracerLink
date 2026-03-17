<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class ImportProgressService
{
    public function queue(string $importId, string $message = 'Upload complete. Waiting to start...'): void
    {
        $this->put($importId, [
            'status' => 'queued',
            'progress' => 0,
            'processed_rows' => 0,
            'total_rows' => 0,
            'message' => $message,
            'imported' => 0,
            'skipped' => 0,
            'errors' => [],
        ]);
    }

    public function startProcessing(string $importId, int $totalRows): void
    {
        $this->put($importId, [
            'status' => 'processing',
            'progress' => $totalRows > 0 ? 0 : 100,
            'processed_rows' => 0,
            'total_rows' => $totalRows,
            'message' => 'Processing rows...',
            'imported' => 0,
            'skipped' => 0,
            'errors' => [],
        ]);
    }

    public function advance(string $importId, int $processedRows, int $totalRows): void
    {
        $progress = $totalRows > 0
            ? (int) min(100, max(0, round(($processedRows / $totalRows) * 100)))
            : 100;

        $this->put($importId, [
            'status' => 'processing',
            'progress' => $progress,
            'processed_rows' => min($processedRows, $totalRows),
            'total_rows' => $totalRows,
            'message' => 'Processing rows...',
        ]);
    }

    public function complete(string $importId, string $message, ?int $totalRows = null, array $result = []): void
    {
        $current = $this->get($importId) ?? [];
        $resolvedTotalRows = $totalRows ?? (int) ($current['total_rows'] ?? 0);

        $this->put($importId, [
            'status' => 'completed',
            'progress' => 100,
            'processed_rows' => $resolvedTotalRows,
            'total_rows' => $resolvedTotalRows,
            'message' => $message,
        ] + $result);
    }

    public function fail(string $importId, string $message, array $result = []): void
    {
        $current = $this->get($importId) ?? [];

        $this->put($importId, [
            'status' => 'failed',
            'progress' => (int) ($current['progress'] ?? 0),
            'processed_rows' => (int) ($current['processed_rows'] ?? 0),
            'total_rows' => (int) ($current['total_rows'] ?? 0),
            'message' => $message,
        ] + $result);
    }

    public function get(string $importId): ?array
    {
        $progress = Cache::get($this->cacheKey($importId));

        return is_array($progress) ? $progress : null;
    }

    private function put(string $importId, array $payload): void
    {
        Cache::put(
            $this->cacheKey($importId),
            array_merge([
                'status' => 'processing',
                'progress' => 0,
                'processed_rows' => 0,
                'total_rows' => 0,
                'message' => null,
                'imported' => 0,
                'skipped' => 0,
                'errors' => [],
                'updated_at' => now()->toISOString(),
            ], $payload, [
                'updated_at' => now()->toISOString(),
            ]),
            now()->addMinutes(30),
        );
    }

    private function cacheKey(string $importId): string
    {
        return 'import-progress:' . $importId;
    }
}
