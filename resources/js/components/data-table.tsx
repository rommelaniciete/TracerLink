'use client';

import * as React from 'react';

import { AlumniForm } from '@/components/AlumniForm';
import { DataPagination } from '@/components/data-pagination';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { echo } from '@/echo';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { toast } from '@/lib/toast';
import { AlumniFilters, AlumniRecord, ProgramOption } from '@/types/records';
import { PaginatedResponse } from '@/types/pagination';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { DownloadIcon, FileUp, MoreVertical, PlusIcon, Trash2Icon, Upload, Users } from 'lucide-react';

const DEFAULT_FILTERS: AlumniFilters = {
    search: '',
    graduation_year: 'all',
    program_id: 'all',
    employment_status: 'all',
    work_location: 'all',
    sex: 'all',
    per_page: 10,
};

function parseInitialFilters(): AlumniFilters {
    if (typeof window === 'undefined') {
        return DEFAULT_FILTERS;
    }

    const params = new URLSearchParams(window.location.search);

    return {
        search: params.get('search') ?? '',
        graduation_year: params.get('graduation_year') ?? 'all',
        program_id: params.get('program_id') ?? 'all',
        employment_status: params.get('employment_status') ?? 'all',
        work_location: params.get('work_location') ?? 'all',
        sex: params.get('sex') ?? 'all',
        per_page: Number(params.get('per_page') ?? 10) || 10,
    };
}

function parseInitialPage(): number {
    if (typeof window === 'undefined') {
        return 1;
    }

    const page = Number(new URLSearchParams(window.location.search).get('page') ?? 1);
    return Number.isFinite(page) && page > 0 ? page : 1;
}

export function AlumniTable() {
    const page = usePage();
    const currentPath = React.useMemo(() => page.url.split('?')[0], [page.url]);
    const currentYear = new Date().getFullYear();
    const graduationYears = React.useMemo(() => {
        const years = [];
        for (let year = currentYear; year >= 2022; year -= 1) {
            years.push(String(year));
        }
        return years;
    }, [currentYear]);

    const initialFilters = React.useMemo(() => parseInitialFilters(), []);
    const [filters, setFilters] = React.useState<AlumniFilters>(initialFilters);
    const [pageNumber, setPageNumber] = React.useState(parseInitialPage);
    const [programs, setPrograms] = React.useState<ProgramOption[]>([]);
    const [alumni, setAlumni] = React.useState<PaginatedResponse<AlumniRecord> | null>(null);
    const [selectedAlumni, setSelectedAlumni] = React.useState<Record<number, AlumniRecord>>({});
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [editingAlumni, setEditingAlumni] = React.useState<AlumniRecord | null>(null);
    const [viewingAlumni, setViewingAlumni] = React.useState<AlumniRecord | null>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
    const [pendingDeleteAlumni, setPendingDeleteAlumni] = React.useState<AlumniRecord | null>(null);
    const [importOpen, setImportOpen] = React.useState(false);
    const [importFile, setImportFile] = React.useState<File | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [deleteLoading, setDeleteLoading] = React.useState<number | null>(null);
    const [bulkDeleteLoading, setBulkDeleteLoading] = React.useState(false);
    const [importLoading, setImportLoading] = React.useState(false);
    const [exportLoading, setExportLoading] = React.useState(false);
    const debouncedSearch = useDebouncedValue(filters.search);

    const selectedCount = React.useMemo(() => Object.keys(selectedAlumni).length, [selectedAlumni]);

    const syncUrl = React.useCallback(
        (nextFilters: AlumniFilters, nextPage: number) => {
            const params = new URLSearchParams();

            if (nextFilters.search) params.set('search', nextFilters.search);
            if (nextFilters.graduation_year !== 'all') params.set('graduation_year', nextFilters.graduation_year);
            if (nextFilters.program_id !== 'all') params.set('program_id', nextFilters.program_id);
            if (nextFilters.employment_status !== 'all') params.set('employment_status', nextFilters.employment_status);
            if (nextFilters.work_location !== 'all') params.set('work_location', nextFilters.work_location);
            if (nextFilters.sex !== 'all') params.set('sex', nextFilters.sex);
            params.set('per_page', String(nextFilters.per_page));
            params.set('page', String(nextPage));

            const query = params.toString();
            const nextUrl = query ? `${currentPath}?${query}` : currentPath;
            window.history.replaceState({}, '', nextUrl);
        },
        [currentPath],
    );

    const fetchPrograms = React.useCallback(async () => {
        try {
            const response = await axios.get('/api/programs');
            setPrograms(response.data);
        } catch {
            toast.error('Failed to load programs.');
        }
    }, []);

    const fetchAlumni = React.useCallback(
        async (nextFilters: AlumniFilters, nextPage: number) => {
            setLoading(true);

            try {
                const response = await axios.get('/alumni-data', {
                    params: {
                        search: nextFilters.search || undefined,
                        graduation_year: nextFilters.graduation_year !== 'all' ? nextFilters.graduation_year : undefined,
                        program_id: nextFilters.program_id !== 'all' ? nextFilters.program_id : undefined,
                        employment_status: nextFilters.employment_status !== 'all' ? nextFilters.employment_status : undefined,
                        work_location: nextFilters.work_location !== 'all' ? nextFilters.work_location : undefined,
                        sex: nextFilters.sex !== 'all' ? nextFilters.sex : undefined,
                        per_page: nextFilters.per_page,
                        page: nextPage,
                    },
                });

                setAlumni(response.data);
                syncUrl(nextFilters, response.data.current_page);
            } catch {
                toast.error('Failed to load alumni data.');
            } finally {
                setLoading(false);
            }
        },
        [syncUrl],
    );

    React.useEffect(() => {
        fetchPrograms();
    }, [fetchPrograms]);

    React.useEffect(() => {
        const nextFilters = {
            ...filters,
            search: debouncedSearch,
        };

        fetchAlumni(nextFilters, pageNumber);
    }, [debouncedSearch, fetchAlumni, filters.employment_status, filters.graduation_year, filters.per_page, filters.program_id, filters.sex, filters.work_location, pageNumber]);

    React.useEffect(() => {
        if (typeof window === 'undefined' || !echo) {
            return;
        }

        const timeout = window.setTimeout(() => {
            const channel = echo.channel('alumni');
            channel.listen('.AlumniCreated', () => {
                fetchAlumni(
                    {
                        ...filters,
                        search: debouncedSearch,
                    },
                    pageNumber,
                );
            });
        }, 1000);

        return () => {
            window.clearTimeout(timeout);
            echo.leaveChannel('alumni');
        };
    }, [debouncedSearch, fetchAlumni, filters, pageNumber]);

    const currentRows = alumni?.data ?? [];
    const allCurrentPageSelected = currentRows.length > 0 && currentRows.every((record) => Boolean(selectedAlumni[record.id]));

    const updateFilter = <K extends keyof AlumniFilters>(key: K, value: AlumniFilters[K]) => {
        setFilters((current) => ({
            ...current,
            [key]: value,
        }));
        setSelectedAlumni({});
        setPageNumber(1);
    };

    const toggleRow = (record: AlumniRecord, checked: boolean) => {
        setSelectedAlumni((current) => {
            const next = { ...current };
            if (checked) {
                next[record.id] = record;
            } else {
                delete next[record.id];
            }
            return next;
        });
    };

    const toggleCurrentPage = (checked: boolean) => {
        setSelectedAlumni((current) => {
            const next = { ...current };
            for (const record of currentRows) {
                if (checked) {
                    next[record.id] = record;
                } else {
                    delete next[record.id];
                }
            }
            return next;
        });
    };

    const openDeleteConfirm = (record: AlumniRecord) => {
        setPendingDeleteAlumni(record);
        setDeleteConfirmOpen(true);
    };

    const confirmSingleDelete = async () => {
        if (!pendingDeleteAlumni?.id) return;

        setDeleteLoading(pendingDeleteAlumni.id);
        try {
            await axios.delete(`/alumni/${pendingDeleteAlumni.id}`);
            toast.success('Deleted successfully');
            setDeleteConfirmOpen(false);
            setPendingDeleteAlumni(null);
            setSelectedAlumni((current) => {
                const next = { ...current };
                delete next[pendingDeleteAlumni.id];
                return next;
            });
            fetchAlumni({ ...filters, search: debouncedSearch }, pageNumber);
        } catch {
            toast.error('Delete failed.');
        } finally {
            setDeleteLoading(null);
        }
    };

    const handleBulkDelete = async () => {
        const ids = Object.keys(selectedAlumni).map(Number);
        if (ids.length === 0) {
            toast.error('No records selected');
            return;
        }

        setBulkDeleteLoading(true);
        try {
            await axios.post('/alumni/bulk-delete', { ids });
            toast.success(`Deleted ${ids.length} records successfully`);
            setSelectedAlumni({});
            setBulkDeleteOpen(false);
            fetchAlumni({ ...filters, search: debouncedSearch }, pageNumber);
        } catch {
            toast.error('Bulk delete failed.');
        } finally {
            setBulkDeleteLoading(false);
        }
    };

    const handleImport = async () => {
        if (!importFile) {
            toast.error('Please select a file');
            return;
        }

        setImportLoading(true);
        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const response = await axios.post('/alumni/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const imported = Number(response.data?.imported ?? 0);
            const skipped = Number(response.data?.skipped ?? 0);

            if (imported > 0) {
                toast.success(`${imported} row(s) imported`);
                setImportOpen(false);
                setImportFile(null);
                fetchAlumni({ ...filters, search: debouncedSearch }, 1);
            }

            if (skipped > 0) {
                toast.warning(`${skipped} row(s) were skipped`);
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Import failed.');
            } else {
                toast.error('Import failed.');
            }
        } finally {
            setImportLoading(false);
        }
    };

    const handleExport = async () => {
        setExportLoading(true);
        try {
            const response = await axios.post(
                '/export-alumni',
                {
                    search: debouncedSearch,
                    graduation_year: filters.graduation_year !== 'all' ? filters.graduation_year : '',
                    program_id: filters.program_id !== 'all' ? filters.program_id : '',
                    employment_status: filters.employment_status !== 'all' ? filters.employment_status : '',
                    work_location: filters.work_location !== 'all' ? filters.work_location : '',
                    sex: filters.sex !== 'all' ? filters.sex : '',
                },
                {
                    responseType: 'blob',
                },
            );

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', 'alumni-list.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
            toast.success('Filtered alumni exported');
        } catch {
            toast.error('Export failed.');
        } finally {
            setExportLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Alumni List</h1>
                        <p className="mt-1 text-sm text-muted-foreground">List of all registered alumni records.</p>
                    </div>

                    <Button variant="outline" onClick={() => setShowAddModal(true)} className="gap-2">
                        <PlusIcon className="h-4 w-4" />
                        Add Alumni
                    </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                    <Input placeholder="Search alumni..." value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} />
                    <Select value={filters.graduation_year} onValueChange={(value) => updateFilter('graduation_year', value)}>
                        <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Years</SelectItem>
                            {graduationYears.map((year) => (
                                <SelectItem key={year} value={year}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filters.program_id} onValueChange={(value) => updateFilter('program_id', value)}>
                        <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Programs</SelectItem>
                            {programs.map((program) => (
                                <SelectItem key={program.id} value={String(program.id)}>{program.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filters.employment_status} onValueChange={(value) => updateFilter('employment_status', value)}>
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Employed">Employed</SelectItem>
                            <SelectItem value="Unemployed">Unemployed</SelectItem>
                            <SelectItem value="not-tracked">No Answer</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filters.work_location} onValueChange={(value) => updateFilter('work_location', value)}>
                        <SelectTrigger><SelectValue placeholder="Select work location" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            <SelectItem value="local">Local</SelectItem>
                            <SelectItem value="abroad">Abroad</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filters.sex} onValueChange={(value) => updateFilter('sex', value)}>
                        <SelectTrigger><SelectValue placeholder="Select sex" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sex</SelectItem>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    {selectedCount > 0 ? (
                        <Button variant="destructive" onClick={() => setBulkDeleteOpen(true)} className="gap-2">
                            <Trash2Icon className="h-4 w-4" />
                            Delete Selected ({selectedCount})
                        </Button>
                    ) : (
                        <span className="text-sm text-muted-foreground">Select alumni to delete in bulk.</span>
                    )}

                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
                            <DownloadIcon className="h-4 w-4 text-green-500" />
                            Import
                        </Button>
                        <Button variant="outline" onClick={handleExport} disabled={exportLoading} className="gap-2">
                            <Upload className="h-4 w-4 text-blue-500" />
                            {exportLoading ? 'Exporting...' : 'Export'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox checked={allCurrentPageSelected} onCheckedChange={(value) => toggleCurrentPage(Boolean(value))} />
                            </TableHead>
                            <TableHead>Student No.</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Program</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Grad Year</TableHead>
                            <TableHead>Employment</TableHead>
                            <TableHead>Work Location</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: Math.min(filters.per_page, 5) }).map((_, index) => (
                                <TableRow key={index}>
                                    {Array.from({ length: 9 }).map((__, cellIndex) => (
                                        <TableCell key={cellIndex}><Skeleton className="h-5 w-full" /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : currentRows.length > 0 ? (
                            currentRows.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell>
                                        <Checkbox checked={Boolean(selectedAlumni[record.id])} onCheckedChange={(value) => toggleRow(record, Boolean(value))} />
                                    </TableCell>
                                    <TableCell>{record.student_number || 'N/A'}</TableCell>
                                    <TableCell>{record.email || 'N/A'}</TableCell>
                                    <TableCell>{record.program?.name || 'N/A'}</TableCell>
                                    <TableCell>{`${record.given_name || ''} ${record.last_name || ''}`.trim() || 'N/A'}</TableCell>
                                    <TableCell>{record.graduation_year || 'N/A'}</TableCell>
                                    <TableCell>{record.employment_status || 'N/A'}</TableCell>
                                    <TableCell>{record.work_location || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="p-1">
                                                    <MoreVertical className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setViewingAlumni(record)}>View more details</DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600 hover:text-red-500" onClick={() => openDeleteConfirm(record)}>
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
                                    <Empty>
                                        <EmptyHeader>
                                            <EmptyMedia variant="icon"><Users /></EmptyMedia>
                                            <EmptyTitle>No Alumni</EmptyTitle>
                                            <EmptyDescription>No data found</EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {alumni && (
                <DataPagination
                    pagination={alumni}
                    itemLabel="alumni"
                    disabled={loading}
                    onPageChange={(nextPage) => setPageNumber(nextPage)}
                    onPerPageChange={(value) => {
                        setFilters((current) => ({ ...current, per_page: value }));
                        setPageNumber(1);
                        setSelectedAlumni({});
                    }}
                />
            )}

            <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription>Are you sure you want to delete {selectedCount} selected records? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleteLoading}>Cancel</Button>
                        <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleteLoading}>
                            {bulkDeleteLoading ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showAddModal} onOpenChange={(open) => {
                setShowAddModal(open);
                if (!open) setEditingAlumni(null);
            }}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingAlumni ? 'Edit Alumni' : 'Add New Alumni'}</DialogTitle>
                        <DialogDescription>
                            {editingAlumni ? 'Update the alumni information and submit to save changes.' : 'Fill out the form and submit to add a new record.'}
                        </DialogDescription>
                    </DialogHeader>
                    <AlumniForm
                        key={editingAlumni?.student_number || 'create'}
                        mode={editingAlumni ? 'edit' : 'create'}
                        id={editingAlumni?.id}
                        student_number={editingAlumni?.student_number}
                        email={editingAlumni?.email}
                        program_id={editingAlumni?.program_id}
                        last_name={editingAlumni?.last_name}
                        given_name={editingAlumni?.given_name}
                        middle_initial={editingAlumni?.middle_initial ?? undefined}
                        present_address={editingAlumni?.present_address}
                        contact_number={editingAlumni?.contact_number}
                        graduation_year={editingAlumni?.graduation_year?.toString()}
                        employment_status={editingAlumni?.employment_status}
                        company_name={editingAlumni?.company_name ?? undefined}
                        work_position={editingAlumni?.work_position ?? undefined}
                        further_studies={editingAlumni?.further_studies ?? undefined}
                        sector={editingAlumni?.sector ?? undefined}
                        work_location={editingAlumni?.work_location ?? undefined}
                        employer_classification={editingAlumni?.employer_classification ?? undefined}
                        related_to_course={editingAlumni?.related_to_course ?? undefined}
                        consent={editingAlumni?.consent ?? false}
                        sex={editingAlumni?.sex ?? undefined}
                        instruction_rating={editingAlumni?.instruction_rating ?? undefined}
                        onSuccess={() => {
                            fetchAlumni({ ...filters, search: debouncedSearch }, pageNumber);
                            setShowAddModal(false);
                            setEditingAlumni(null);
                        }}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(viewingAlumni)} onOpenChange={(open) => {
                if (!open) setViewingAlumni(null);
            }}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Alumni Details</DialogTitle>
                        <DialogDescription>Complete alumni information for this record.</DialogDescription>
                    </DialogHeader>
                    {viewingAlumni && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {[
                                ['Student Number', viewingAlumni.student_number || 'N/A'],
                                ['Email', viewingAlumni.email || 'N/A'],
                                ['Program', viewingAlumni.program?.name || 'N/A'],
                                ['Last Name', viewingAlumni.last_name || 'N/A'],
                                ['Given Name', viewingAlumni.given_name || 'N/A'],
                                ['Middle Initial', viewingAlumni.middle_initial || 'N/A'],
                                ['Present Address', viewingAlumni.present_address || 'N/A'],
                                ['Contact Number', viewingAlumni.contact_number || 'N/A'],
                                ['Graduation Year', String(viewingAlumni.graduation_year || 'N/A')],
                                ['Sex', viewingAlumni.sex || 'N/A'],
                                ['Employment Status', viewingAlumni.employment_status || 'N/A'],
                                ['Company Name', viewingAlumni.company_name || 'N/A'],
                                ['Position / Work Nature', viewingAlumni.work_position || 'N/A'],
                                ['Related to Course', viewingAlumni.related_to_course || 'N/A'],
                                ['Further Studies', viewingAlumni.further_studies || 'N/A'],
                                ['Work Location', viewingAlumni.work_location || 'N/A'],
                                ['Employer Type', viewingAlumni.employer_classification || 'N/A'],
                                ['Sector', viewingAlumni.sector || 'N/A'],
                                ['Consent', viewingAlumni.consent ? 'Yes' : 'No'],
                                ['Instruction Rating', String(viewingAlumni.instruction_rating ?? 'N/A')],
                            ].map(([label, value]) => (
                                <div key={String(label)} className="space-y-1 rounded-md border p-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                                    <p className="break-words text-sm">{value}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={deleteConfirmOpen} onOpenChange={(open) => {
                setDeleteConfirmOpen(open);
                if (!open) setPendingDeleteAlumni(null);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <b>{pendingDeleteAlumni?.given_name} {pendingDeleteAlumni?.last_name}</b>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => {
                            setDeleteConfirmOpen(false);
                            setPendingDeleteAlumni(null);
                        }} disabled={deleteLoading === pendingDeleteAlumni?.id}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmSingleDelete} disabled={deleteLoading === pendingDeleteAlumni?.id}>
                            {deleteLoading === pendingDeleteAlumni?.id ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Import Alumni</DialogTitle>
                        <DialogDescription>Upload an Excel/CSV file containing alumni data.</DialogDescription>
                    </DialogHeader>
                    <Button className="w-fit px-0" variant="link" onClick={() => (window.location.href = route('alumni.template.download'))}>
                        Download Excel Template
                    </Button>
                    <input
                        className="w-full rounded-md border border-input p-3 file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-4 file:py-2 file:text-sm file:font-semibold"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(event) => setImportFile(event.target.files?.[0] || null)}
                    />
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setImportOpen(false)} disabled={importLoading}>Cancel</Button>
                        <Button onClick={handleImport} disabled={!importFile || importLoading}>
                            <FileUp className="h-4 w-4" /> {importLoading ? 'Importing...' : 'Import'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
