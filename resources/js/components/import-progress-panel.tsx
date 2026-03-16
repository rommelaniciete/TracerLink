import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Loader2, Upload } from 'lucide-react';

export type ImportProgressPhase = 'idle' | 'uploading' | 'processing';

export type ImportProgressState = {
    phase: ImportProgressPhase;
    uploadPercent: number | null;
    uploadedBytes: number | null;
    totalBytes: number | null;
    selectedFileName: string | null;
};

type ImportProgressPanelProps = {
    progress: ImportProgressState;
};

export function createIdleImportProgressState(): ImportProgressState {
    return {
        phase: 'idle',
        uploadPercent: null,
        uploadedBytes: null,
        totalBytes: null,
        selectedFileName: null,
    };
}

function formatBytes(bytes: number | null) {
    if (!bytes || bytes <= 0) {
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

    const progressValue = progress.uploadPercent === null ? null : Math.max(0, Math.min(progress.uploadPercent, 100));
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
              : progressValue !== null
                ? `${progressValue}% uploaded`
                : 'Uploading to the server';

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
                            : 'The file is already on the server. Rows are being processed now, so there is no exact percentage yet.'}
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
                    <p className="mt-1 text-sm font-medium text-foreground">
                        {progress.phase === 'processing' ? 'Rows are being imported on the server' : 'Starts after the upload reaches the server'}
                    </p>
                </div>
            </div>

            {progress.phase === 'uploading' ? (
                progressValue !== null ? (
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
                )
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
                <span>{progress.phase === 'processing' ? 'Waiting for the import result from the server' : uploadStatusLabel}</span>
            </div>
        </div>
    );
}
