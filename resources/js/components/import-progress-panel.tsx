import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Loader2, Upload } from 'lucide-react';

export type ImportProgressPhase = 'idle' | 'uploading' | 'processing';

export type ImportProgressState = {
    phase: ImportProgressPhase;
    importId: string | null;
    uploadPercent: number | null;
    uploadedBytes: number | null;
    totalBytes: number | null;
    processingPercent: number | null;
    processedRows: number | null;
    totalRows: number | null;
    processingMessage: string | null;
    selectedFileName: string | null;
};

type ImportProgressPanelProps = {
    progress: ImportProgressState;
};

export function createIdleImportProgressState(): ImportProgressState {
    return {
        phase: 'idle',
        importId: null,
        uploadPercent: null,
        uploadedBytes: null,
        totalBytes: null,
        processingPercent: null,
        processedRows: null,
        totalRows: null,
        processingMessage: null,
        selectedFileName: null,
    };
}

function clampFiniteNumber(value: number | null) {
    if (value === null || !Number.isFinite(value)) {
        return null;
    }

    return Math.max(0, Math.min(value, 100));
}

function finiteWholeNumber(value: number | null) {
    if (value === null || !Number.isFinite(value)) {
        return null;
    }

    return Math.max(0, Math.round(value));
}

function formatBytes(bytes: number | null) {
    if (!bytes || !Number.isFinite(bytes) || bytes <= 0) {
        return null;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImportProgressPanel({ progress }: ImportProgressPanelProps) {
    if (progress.phase === 'idle') {
        return null;
    }

    const uploadProgressValue = clampFiniteNumber(progress.uploadPercent);
    const processingProgressValue = clampFiniteNumber(progress.processingPercent);
    const processedRows = finiteWholeNumber(progress.processedRows);
    const totalRows = finiteWholeNumber(progress.totalRows);
    const fileLabel = progress.selectedFileName ?? 'your file';
    const uploadedSize = formatBytes(progress.uploadedBytes);
    const totalSize = formatBytes(progress.totalBytes);
    const uploadStatusLabel =
        progress.phase === 'processing'
            ? totalSize
                ? `${totalSize} uploaded`
                : 'Upload complete'
            : uploadedSize && totalSize
              ? `${uploadedSize} of ${totalSize} uploaded`
              : uploadProgressValue !== null
                ? `${uploadProgressValue}% uploaded`
                : 'Uploading to the server';
    const processingStatusLabel =
        progress.phase === 'processing'
            ? processedRows !== null && totalRows !== null && totalRows > 0
                ? `${processedRows} of ${totalRows} rows processed`
                : (progress.processingMessage ?? 'Preparing processing progress...')
            : 'Starts after the upload reaches the server';
    const progressValue = progress.phase === 'processing' ? processingProgressValue : uploadProgressValue;
    const activeStatusLabel =
        progress.phase === 'processing'
            ? processingProgressValue !== null && totalRows !== null && totalRows > 0
                ? `${processingProgressValue}% complete`
                : (progress.processingMessage ?? 'Preparing progress...')
            : uploadStatusLabel;

    return (
        <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                    {progress.phase === 'processing' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium text-foreground">
                        {progress.phase === 'uploading' ? `Step 1 of 2: Uploading ${fileLabel}` : `Step 2 of 2: Importing ${fileLabel}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {progress.phase === 'uploading'
                            ? 'This bar reflects file transfer only. Row processing begins after the upload finishes.'
                            : 'This bar now reflects how many rows the server has already finished processing.'}
                    </p>
                </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-primary/25 bg-background/90 p-3">
                    <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Upload</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{uploadStatusLabel}</p>
                </div>
                <div
                    className={cn(
                        'rounded-lg border p-3',
                        progress.phase === 'processing' ? 'border-primary/25 bg-background/90' : 'border-dashed border-border/70 bg-background/60',
                    )}
                >
                    <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Processing</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{processingStatusLabel}</p>
                </div>
            </div>

            {progressValue !== null ? (
                <Progress value={progressValue} className="h-2.5" />
            ) : (
                <div className="relative h-2.5 overflow-hidden rounded-full bg-secondary">
                    <div
                        className={cn(
                            'absolute inset-y-0 left-0 w-1/3 rounded-full bg-primary/85',
                            'animate-[processing-bar_1.25s_ease-in-out_infinite]',
                        )}
                    />
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="truncate">{fileLabel}</span>
                <span>{activeStatusLabel}</span>
            </div>
        </div>
    );
}
