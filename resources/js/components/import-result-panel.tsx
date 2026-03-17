import * as React from 'react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, TriangleAlert } from 'lucide-react';

export type ImportIssue = {
    row: number | null;
    reason: string;
};

export type ImportResultStatus = 'idle' | 'success' | 'warning' | 'error';

export type ImportResultState = {
    status: ImportResultStatus;
    title: string;
    summary: string;
    issues: ImportIssue[];
};

type ImportResultPanelProps = {
    result: ImportResultState;
};

export function createIdleImportResultState(): ImportResultState {
    return {
        status: 'idle',
        title: '',
        summary: '',
        issues: [],
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function normalizeMessages(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.flatMap((entry) => normalizeMessages(entry));
    }

    if (typeof value !== 'string') {
        return [];
    }

    const message = value.trim();
    return message ? [message] : [];
}

function normalizeRow(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}

function humanizeField(field: string) {
    const normalized = field.replaceAll('.', ' ').replaceAll('_', ' ').trim();

    if (!normalized) {
        return 'Import';
    }

    return normalized.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function extractImportIssues(value: unknown): ImportIssue[] {
    if (Array.isArray(value)) {
        return value.flatMap((entry) => {
            if (typeof entry === 'string') {
                return [{ row: null, reason: entry }];
            }

            if (!isRecord(entry)) {
                return [];
            }

            const row = normalizeRow(entry.row);
            const reasons = normalizeMessages(entry.reason ?? entry.message ?? entry.error);

            return reasons.map((reason) => ({
                row,
                reason,
            }));
        });
    }

    if (isRecord(value)) {
        return Object.entries(value).flatMap(([field, messages]) =>
            normalizeMessages(messages).map((reason) => ({
                row: null,
                reason: field === 'file' ? reason : `${humanizeField(field)}: ${reason}`,
            })),
        );
    }

    return [];
}

export function extractImportMessage(value: unknown, fallback: string) {
    if (!isRecord(value)) {
        return fallback;
    }

    const candidate = value.message ?? value.error;

    if (typeof candidate !== 'string') {
        return fallback;
    }

    const trimmed = candidate.trim();
    return trimmed || fallback;
}

export function ImportResultPanel({ result }: ImportResultPanelProps) {
    const [isOpen, setIsOpen] = React.useState(result.status !== 'success');

    React.useEffect(() => {
        setIsOpen(result.status !== 'success');
    }, [result.issues.length, result.status, result.summary, result.title]);

    if (result.status === 'idle') {
        return null;
    }

    const Icon = result.status === 'success' ? CheckCircle2 : result.status === 'warning' ? TriangleAlert : AlertCircle;

    return (
        <div className={cn('space-y-3 rounded-lg p-4')}>
            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        'rounded-full p-2',
                        result.status === 'success' && 'bg-emerald-100 text-emerald-700',
                        result.status === 'warning' && 'bg-amber-100 text-amber-700',
                        result.status === 'error' && 'bg-red-100 text-red-700',
                    )}
                >
                    <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-semibold text-foreground">{result.title}</p>
                    <p className="text-sm text-muted-foreground">{result.summary}</p>
                </div>
            </div>

            {result.issues.length > 0 && (
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <CollapsibleTrigger asChild>
                        <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/30"
                        >
                            <span>{result.issues.length} issue(s) found</span>
                            {isOpen ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                        </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="pt-3">
                        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                            {result.issues.map((issue, index) => (
                                <div key={`${issue.row ?? 'file'}-${index}`} className="rounded-md px-3 py-2">
                                    <p className="text-sm font-medium text-foreground">{issue.row ? `Row ${issue.row}` : 'File issue'}</p>
                                    <p className="text-sm text-muted-foreground">{issue.reason}</p>
                                </div>
                            ))}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            )}
        </div>
    );
}
