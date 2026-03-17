'use client';

import * as React from 'react';

import { DataPagination } from '@/components/data-pagination';
import { ImportProgressPanel, createIdleImportProgressState } from '@/components/import-progress-panel';
import { ImportResultPanel, createIdleImportResultState, extractImportIssues, extractImportMessage } from '@/components/import-result-panel';
import { SendEmailToSelected } from '@/components/SendEmailToProgram';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { toast } from '@/lib/toast';
import { StudentPageProps, StudentRecord } from '@/types/records';
import { router, useForm, usePage } from '@inertiajs/react';
import axios, { type AxiosProgressEvent } from 'axios';
import { saveAs } from 'file-saver';
import { ArrowDownAZ, ArrowUpAZ, DownloadIcon, FileUp, Loader2, MoreHorizontal, PlusIcon, Search, Trash, Upload, Users } from 'lucide-react';

function createImportRequestId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toFiniteNumber(value: unknown) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}

export default function StudentIndex() {
    const page = usePage<StudentPageProps>();
    const { props, url } = page;
    const students = props.students.data;
    const currentPath = React.useMemo(() => url.split('?')[0], [url]);

    const [search, setSearch] = React.useState(props.filters.search ?? '');
    const [yearFilter, setYearFilter] = React.useState(props.filters.year || 'all');
    const [perPage, setPerPage] = React.useState(String(props.filters.per_page ?? props.students.per_page ?? 10));
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(props.filters.direction ?? 'desc');
    const [selectedStudents, setSelectedStudents] = React.useState<Record<number, StudentRecord>>({});
    const [showModal, setShowModal] = React.useState(false);
    const [showUploadModal, setShowUploadModal] = React.useState(false);
    const [showDeleteModal, setShowDeleteModal] = React.useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = React.useState(false);
    const [deleteTarget, setDeleteTarget] = React.useState<StudentRecord | null>(null);
    const [excelFile, setExcelFile] = React.useState<File | null>(null);
    const [editStudent, setEditStudent] = React.useState<StudentRecord | null>(null);
    const [isFiltering, setIsFiltering] = React.useState(false);
    const [importProgress, setImportProgress] = React.useState(createIdleImportProgressState);
    const [importResult, setImportResult] = React.useState(createIdleImportResultState);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
    const [isExporting, setIsExporting] = React.useState(false);
    const [uploadInputKey, setUploadInputKey] = React.useState(0);
    const debouncedSearch = useDebouncedValue(search);
    const isImportBusy = importProgress.phase !== 'idle';
    const importPollerRef = React.useRef<number | null>(null);
    const activeImportIdRef = React.useRef<string | null>(null);

    const { data, setData, reset } = useForm({
        id: '',
        student_number: '',
        student_name: '',
        email: '',
        year: '',
    });

    React.useEffect(() => {
        setSearch(props.filters.search ?? '');
        setYearFilter(props.filters.year || 'all');
        setPerPage(String(props.filters.per_page ?? props.students.per_page ?? 10));
        setSortDirection(props.filters.direction ?? 'desc');
    }, [props.filters, props.students.per_page]);

    const selectedList = React.useMemo(() => Object.values(selectedStudents), [selectedStudents]);
    const currentPageSelected = students.filter((student) => Boolean(selectedStudents[student.id]));
    const allCurrentPageSelected = students.length > 0 && currentPageSelected.length === students.length;

    const navigate = React.useCallback(
        (
            next: Partial<{
                page: number;
                search: string;
                year: string;
                per_page: number;
                direction: 'asc' | 'desc';
            }>,
            options?: { clearSelection?: boolean },
        ) => {
            const params = {
                search: next.search ?? debouncedSearch,
                year: next.year ?? yearFilter,
                per_page: next.per_page ?? Number(perPage),
                page: next.page ?? props.students.current_page,
                sort: 'student_name',
                direction: next.direction ?? sortDirection,
            };

            if (options?.clearSelection) {
                setSelectedStudents({});
            }

            router.get(
                currentPath,
                {
                    search: params.search || undefined,
                    year: params.year !== 'all' ? params.year : undefined,
                    per_page: params.per_page,
                    page: params.page,
                    sort: params.sort,
                    direction: params.direction,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['students', 'filters', 'years'],
                    onStart: () => setIsFiltering(true),
                    onFinish: () => setIsFiltering(false),
                },
            );
        },
        [currentPath, debouncedSearch, perPage, props.students.current_page, sortDirection, yearFilter],
    );

    React.useEffect(() => {
        const currentSearch = props.filters.search ?? '';
        const currentYear = props.filters.year || 'all';
        const currentPerPage = String(props.filters.per_page ?? props.students.per_page ?? 10);
        const currentDirection = props.filters.direction ?? 'desc';

        if (debouncedSearch === currentSearch && yearFilter === currentYear && perPage === currentPerPage && sortDirection === currentDirection) {
            return;
        }

        navigate(
            {
                page: 1,
                search: debouncedSearch,
                year: yearFilter,
                per_page: Number(perPage),
                direction: sortDirection,
            },
            { clearSelection: true },
        );
    }, [
        debouncedSearch,
        navigate,
        perPage,
        props.filters.direction,
        props.filters.per_page,
        props.filters.search,
        props.filters.year,
        props.students.per_page,
        sortDirection,
        yearFilter,
    ]);

    const refreshCurrentPage = React.useCallback(() => {
        navigate({});
    }, [navigate]);

    const stopImportProgressPolling = React.useCallback(() => {
        if (importPollerRef.current !== null) {
            window.clearInterval(importPollerRef.current);
            importPollerRef.current = null;
        }

        activeImportIdRef.current = null;
    }, []);

    const pollImportProgress = React.useCallback(
        async (importId: string) => {
            try {
                const response = await axios.get(`/imports/progress/${importId}`);
                const nextProgress = toFiniteNumber(response.data?.progress);
                const nextProcessedRows = toFiniteNumber(response.data?.processed_rows);
                const nextTotalRows = toFiniteNumber(response.data?.total_rows);

                setImportProgress((current) => {
                    if (current.importId !== importId) {
                        return current;
                    }

                    return {
                        ...current,
                        phase: 'processing',
                        processingPercent: nextProgress ?? current.processingPercent,
                        processedRows: nextProcessedRows ?? current.processedRows,
                        totalRows: nextTotalRows ?? current.totalRows,
                        processingMessage: typeof response.data?.message === 'string' ? response.data.message : current.processingMessage,
                    };
                });

                if (response.data?.status === 'completed' || response.data?.status === 'failed') {
                    stopImportProgressPolling();
                    finalizeImport(response.data, response.data.status);
                }
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 404) {
                    return;
                }

                stopImportProgressPolling();
            }
        },
        [finalizeImport, stopImportProgressPolling],
    );

    const startImportProgressPolling = React.useCallback(
        (importId: string) => {
            if (activeImportIdRef.current === importId) {
                return;
            }

            stopImportProgressPolling();
            activeImportIdRef.current = importId;
            void pollImportProgress(importId);
            importPollerRef.current = window.setInterval(() => {
                void pollImportProgress(importId);
            }, 500);
        },
        [pollImportProgress, stopImportProgressPolling],
    );

    React.useEffect(() => {
        if (importProgress.phase === 'processing' && importProgress.importId) {
            startImportProgressPolling(importProgress.importId);
            return;
        }

        if (importProgress.phase === 'idle') {
            stopImportProgressPolling();
        }
    }, [importProgress.importId, importProgress.phase, startImportProgressPolling, stopImportProgressPolling]);

    React.useEffect(() => {
        return () => {
            stopImportProgressPolling();
        };
    }, [stopImportProgressPolling]);

    const openCreateModal = () => {
        setEditStudent(null);
        reset();
        setShowModal(true);
    };

    const openEditModal = (student: StudentRecord) => {
        setEditStudent(student);
        setData({
            id: String(student.id),
            student_number: student.student_number,
            student_name: student.student_name,
            email: student.email ?? '',
            year: String(student.year),
        });
        setShowModal(true);
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await axios.get('/students/download-template', {
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            saveAs(blob, 'student_template.xlsx');
        } catch (error) {
            toast.error('Failed to download template.');
        }
    };

    const resetImportProgress = React.useCallback(() => {
        stopImportProgressPolling();
        setImportProgress(createIdleImportProgressState());
    }, [stopImportProgressPolling]);

    const resetImportResult = React.useCallback(() => {
        setImportResult(createIdleImportResultState());
    }, []);

    const resetUploadDialog = React.useCallback(
        (options?: { clearFile?: boolean; clearResult?: boolean }) => {
            resetImportProgress();

            if (options?.clearResult !== false) {
                resetImportResult();
            }

            if (options?.clearFile) {
                setExcelFile(null);
                setUploadInputKey((current) => current + 1);
            }
        },
        [resetImportProgress, resetImportResult],
    );

    function finalizeImport(payload: unknown, status: string) {
        const imported = toFiniteNumber((payload as { imported?: unknown } | null)?.imported) ?? 0;
        const skipped = toFiniteNumber((payload as { skipped?: unknown } | null)?.skipped) ?? 0;
        const totalRows = toFiniteNumber((payload as { total_rows?: unknown } | null)?.total_rows) ?? imported + skipped;
        const issues = extractImportIssues((payload as { errors?: unknown } | null)?.errors);
        const message = extractImportMessage(payload, status === 'failed' ? 'Import failed.' : 'Import complete.');

        if (status === 'failed') {
            setImportResult({
                status: 'error',
                title: 'Import failed',
                summary: message,
                issues,
            });
            resetUploadDialog({ clearFile: true, clearResult: false });
            toast.error(message);
            return;
        }

        const hasIssues = skipped > 0 || issues.length > 0;

        if (imported > 0) {
            toast.success(imported === totalRows ? message : `${imported} row(s) imported successfully.`);
            refreshCurrentPage();
        }

        if (hasIssues) {
            toast.warning(`${skipped || issues.length} row(s) need attention.`);
            setImportResult({
                status: imported > 0 ? 'warning' : 'error',
                title: imported > 0 ? 'Import finished with issues' : 'Import could not complete',
                summary:
                    imported > 0
                        ? `${imported} of ${totalRows} student row(s) were imported. Review the problem rows below before trying again.`
                        : 'No student rows were imported. Review the problem rows below and correct the file before trying again.',
                issues:
                    issues.length > 0
                        ? issues
                        : [
                              {
                                  row: null,
                                  reason: 'Some rows were skipped, but the import did not provide row-level details.',
                              },
                          ],
            });
            resetUploadDialog({ clearFile: true, clearResult: false });
            return;
        }

        setShowUploadModal(false);
        resetUploadDialog({ clearFile: true });
    }

    const handleUploadModalOpenChange = React.useCallback(
        (nextOpen: boolean) => {
            if (!nextOpen && isImportBusy) {
                return;
            }

            setShowUploadModal(nextOpen);

            if (!nextOpen) {
                resetUploadDialog({ clearFile: true });
            }
        },
        [isImportBusy, resetUploadDialog],
    );

    const handleExcelFileChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const nextFile = event.target.files?.[0] ?? null;
            setExcelFile(nextFile);
            resetImportResult();
            setImportProgress({
                phase: 'idle',
                importId: null,
                uploadPercent: null,
                uploadedBytes: null,
                totalBytes: null,
                processingPercent: null,
                processedRows: null,
                totalRows: null,
                processingMessage: null,
                selectedFileName: nextFile?.name ?? null,
            });
        },
        [resetImportResult],
    );

    const handleExcelUpload = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!excelFile) return;

        resetImportResult();
        const importId = createImportRequestId();
        setImportProgress({
            phase: 'uploading',
            importId,
            uploadPercent: 0,
            uploadedBytes: 0,
            totalBytes: excelFile.size || null,
            processingPercent: null,
            processedRows: null,
            totalRows: null,
            processingMessage: null,
            selectedFileName: excelFile.name,
        });
        const formData = new FormData();
        formData.append('file', excelFile);
        formData.append('import_id', importId);

        try {
            const response = await axios.post('/students/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                    const totalBytes = typeof progressEvent.total === 'number' && progressEvent.total > 0 ? progressEvent.total : null;
                    const uploadedBytes = typeof progressEvent.loaded === 'number' ? progressEvent.loaded : null;
                    const nextPercent =
                        totalBytes && uploadedBytes !== null && Number.isFinite(uploadedBytes)
                            ? Math.min(100, Math.round((uploadedBytes * 100) / totalBytes))
                            : null;

                    setImportProgress((current) => ({
                        ...current,
                        phase: 'uploading',
                        uploadPercent: nextPercent,
                        uploadedBytes: uploadedBytes ?? current.uploadedBytes,
                        totalBytes: totalBytes ?? current.totalBytes,
                    }));
                },
            });

            setImportProgress((current) => ({
                ...current,
                phase: 'processing',
                importId: typeof response.data?.import_id === 'string' ? response.data.import_id : importId,
                uploadPercent: 100,
                processingPercent: 0,
                processedRows: 0,
                totalRows: current.totalRows,
                processingMessage: typeof response.data?.message === 'string' ? response.data.message : 'Upload complete. Waiting to start...',
            }));
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const responseData = error.response?.data;
                const message = extractImportMessage(responseData, 'Import failed.');
                const issues = extractImportIssues(responseData?.errors);

                setImportResult({
                    status: 'error',
                    title: 'Import failed',
                    summary: message,
                    issues,
                });
                resetUploadDialog({ clearFile: true, clearResult: false });
                toast.error(message);
            } else {
                setImportResult({
                    status: 'error',
                    title: 'Import failed',
                    summary: 'Something went wrong while importing the file.',
                    issues: [],
                });
                resetUploadDialog({ clearFile: true, clearResult: false });
                toast.error('Import failed.');
            }
        }
    };

    const handleSubmitStudent = async (event: React.FormEvent) => {
        event.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            const submitUrl = editStudent ? `/students/${editStudent.id}` : '/students';
            const method = editStudent ? 'put' : 'post';
            const response = await axios[method](submitUrl, {
                ...data,
                year: Number(data.year),
            });

            const studentLabel = `${response.data.student_number} - ${response.data.student_name}`;
            toast.success(`Student ${editStudent ? 'updated' : 'added'}!`, {
                description: studentLabel,
            });
            setShowModal(false);
            setEditStudent(null);
            reset();
            refreshCurrentPage();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const validationErrors = error.response?.data?.errors;

                if (validationErrors && typeof validationErrors === 'object') {
                    const message = Object.values(validationErrors).flat().join(' ');
                    toast.error(message || 'Failed to save student.');
                } else {
                    toast.error(error.response?.data?.message || 'Failed to save student.');
                }
            } else {
                toast.error('Failed to save student.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget || isDeleting) return;

        setIsDeleting(true);
        try {
            await axios.delete(`/students/${deleteTarget.id}`);
            toast.success('Student deleted!');
            setShowDeleteModal(false);
            setDeleteTarget(null);
            setSelectedStudents((current) => {
                const next = { ...current };
                delete next[deleteTarget.id];
                return next;
            });
            refreshCurrentPage();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to delete student.');
            } else {
                toast.error('Failed to delete student.');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkDelete = async () => {
        const ids = selectedList.map((student) => student.id);

        if (ids.length === 0 || isBulkDeleting) {
            return;
        }

        setIsBulkDeleting(true);

        try {
            await axios.post('/students/bulk-delete', { ids });
            toast.success('Selected students deleted!');
            setSelectedStudents({});
            setShowBulkDeleteModal(false);
            refreshCurrentPage();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to delete selected students.');
            } else {
                toast.error('Failed to delete selected students.');
            }
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);

        try {
            const response = await axios.post(
                '/students/export',
                {
                    search: debouncedSearch,
                    year: yearFilter !== 'all' ? yearFilter : '',
                    sort: 'student_name',
                    direction: sortDirection,
                },
                { responseType: 'blob' },
            );

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            saveAs(blob, 'students.xlsx');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to export students.');
            } else {
                toast.error('Failed to export students.');
            }
        } finally {
            setIsExporting(false);
        }
    };

    const toggleStudent = (student: StudentRecord, checked: boolean) => {
        setSelectedStudents((current) => {
            const next = { ...current };

            if (checked) {
                next[student.id] = student;
            } else {
                delete next[student.id];
            }

            return next;
        });
    };

    const toggleAllCurrentPage = (checked: boolean) => {
        setSelectedStudents((current) => {
            const next = { ...current };

            for (const student of students) {
                if (checked) {
                    next[student.id] = student;
                } else {
                    delete next[student.id];
                }
            }

            return next;
        });
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Student Management</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Manage student records, imports, exports, and form delivery.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={openCreateModal} className="gap-2">
                        <PlusIcon className="h-4 w-4" />
                        Add Student
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowUploadModal(true)} className="gap-2">
                        <DownloadIcon className="h-4 w-4 text-green-500" />
                        Import Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting} className="gap-2">
                        <Upload className="h-4 w-4 text-blue-500" />
                        {isExporting ? 'Exporting...' : 'Export Excel'}
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                        <div className="relative w-full sm:max-w-sm">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search students..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={yearFilter} onValueChange={setYearFilter}>
                            <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="Filter by Year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Years</SelectItem>
                                {props.years.map((year) => (
                                    <SelectItem key={year} value={String(year)}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))}
                        className="gap-2"
                    >
                        {sortDirection === 'asc' ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
                        Sort Name
                    </Button>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    {selectedList.length > 0 ? (
                        <Button variant="destructive" onClick={() => setShowBulkDeleteModal(true)} className="gap-2">
                            <Trash className="h-4 w-4" />
                            Delete Selected ({selectedList.length})
                        </Button>
                    ) : (
                        <span className="text-sm text-muted-foreground">Select students to send form links or delete in bulk.</span>
                    )}

                    <div className="w-full lg:w-auto">
                        <SendEmailToSelected selectedStudents={selectedList} onEmailSent={() => setSelectedStudents({})} />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox checked={allCurrentPageSelected} onCheckedChange={(value) => toggleAllCurrentPage(Boolean(value))} />
                            </TableHead>
                            <TableHead>STUDENT NUMBER</TableHead>
                            <TableHead>
                                <button
                                    type="button"
                                    onClick={() => setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))}
                                    className="inline-flex items-center gap-2 font-semibold"
                                >
                                    STUDENT FULL NAME
                                    {sortDirection === 'asc' ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
                                </button>
                            </TableHead>
                            <TableHead>EMAIL</TableHead>
                            <TableHead>YEAR</TableHead>
                            <TableHead className="text-right">ACTIONS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isFiltering ? (
                            Array.from({ length: Math.min(props.students.per_page, 5) }).map((_, index) => (
                                <TableRow key={index}>
                                    {Array.from({ length: 6 }).map((__, cellIndex) => (
                                        <TableCell key={cellIndex}>
                                            <Skeleton className="h-5 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : students.length > 0 ? (
                            students.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={Boolean(selectedStudents[student.id])}
                                            onCheckedChange={(value) => toggleStudent(student, Boolean(value))}
                                        />
                                    </TableCell>
                                    <TableCell>{student.student_number}</TableCell>
                                    <TableCell>{student.student_name}</TableCell>
                                    <TableCell>{student.email || 'N/A'}</TableCell>
                                    <TableCell>{student.year}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem className="cursor-pointer" onClick={() => openEditModal(student)}>
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="cursor-pointer text-red-600"
                                                    onClick={() => {
                                                        setDeleteTarget(student);
                                                        setShowDeleteModal(true);
                                                    }}
                                                >
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="py-10">
                                    <Empty>
                                        <EmptyHeader>
                                            <EmptyMedia variant="icon">
                                                <Users />
                                            </EmptyMedia>
                                            <EmptyTitle>No Students</EmptyTitle>
                                            <EmptyDescription>No data found</EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <DataPagination
                pagination={props.students}
                itemLabel="students"
                disabled={isFiltering}
                onPageChange={(pageNumber) => navigate({ page: pageNumber })}
                onPerPageChange={(value) => setPerPage(String(value))}
            />

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl">{editStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitStudent} className="space-y-4">
                        <Input type="hidden" value={data.id} onChange={(event) => setData('id', event.target.value)} />

                        <Field label="Student Number">
                            <Input
                                placeholder="e.g. 1234567890"
                                value={data.student_number}
                                onChange={(event) => setData('student_number', event.target.value)}
                                required
                            />
                        </Field>

                        <Field label="Student Full Name">
                            <Input
                                placeholder="e.g. Dela Cruz, Juan T."
                                value={data.student_name}
                                onChange={(event) => setData('student_name', event.target.value)}
                                required
                            />
                        </Field>

                        <Field label="Email (Optional)">
                            <Input
                                type="email"
                                placeholder="e.g. email@gmail.com"
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                            />
                        </Field>

                        <Field label="Year Graduated">
                            <Input
                                type="number"
                                min="2022"
                                max={new Date().getFullYear()}
                                value={data.year}
                                placeholder="e.g. 2024"
                                onChange={(event) => setData('year', event.target.value)}
                                required
                            />
                        </Field>

                        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    reset();
                                    setEditStudent(null);
                                    setShowModal(false);
                                }}
                                className="w-full sm:w-auto"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {editStudent ? 'Save Changes' : 'Add Student'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={showUploadModal} onOpenChange={handleUploadModalOpenChange}>
                <DialogContent
                    className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]"
                    closeButtonDisabled={isImportBusy}
                    onEscapeKeyDown={(event) => {
                        if (isImportBusy) {
                            event.preventDefault();
                        }
                    }}
                    onInteractOutside={(event) => {
                        if (isImportBusy) {
                            event.preventDefault();
                        }
                    }}
                >
                    <DialogHeader>
                        <DialogTitle className="text-xl">Import Students from Excel</DialogTitle>
                        <DialogDescription>Please ensure your Excel file matches the required format before importing.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleExcelUpload} className="space-y-4">
                        <Button type="button" variant="link" className="px-0" onClick={handleDownloadTemplate} disabled={isImportBusy}>
                            Download Excel Template
                        </Button>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Excel File</label>
                            <input
                                key={uploadInputKey}
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleExcelFileChange}
                                required
                                disabled={isImportBusy}
                                className="w-full rounded-md border border-input p-3 file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-4 file:py-2 file:text-sm file:font-semibold"
                            />
                            <p className="text-sm text-muted-foreground">Supported formats: .xlsx, .xls</p>
                        </div>

                        <ImportProgressPanel progress={importProgress} />
                        <ImportResultPanel result={importResult} />

                        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => handleUploadModalOpenChange(false)}
                                disabled={isImportBusy}
                                className="w-full sm:w-auto"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!excelFile || isImportBusy} className="w-full sm:w-auto">
                                {isImportBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                                {importProgress.phase === 'processing' ? 'Processing...' : isImportBusy ? 'Importing...' : 'Import'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Confirm Deletion</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this student? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showBulkDeleteModal} onOpenChange={setShowBulkDeleteModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedList.length} selected students? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-0">
                        <Button type="button" variant="ghost" onClick={() => setShowBulkDeleteModal(false)} disabled={isBulkDeleting}>
                            Cancel
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleBulkDelete} disabled={isBulkDeleting}>
                            {isBulkDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">{label}</label>
            {children}
        </div>
    );
}
