'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { echo } from '@/echo';
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from '@tanstack/react-table';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
import axios from 'axios';
import { DownloadIcon, FileUp, FilterIcon, MoreVertical, PlusIcon, Trash2Icon, Upload, Users } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { AlumniForm } from './AlumniForm';

export type Alumni = {
    id?: number;
    student_number: string;
    email: string;
    program_id: { id: number; name: string } | number | string;
    last_name: string;
    given_name: string;
    middle_initial?: string;
    present_address: string;
    contact_number: string;
    graduation_year: number;
    college?: string;
    sex?: string;
    employment_status: string;
    further_studies?: string;
    sector: string;
    work_location: string;
    employer_classification: string;
    consent: boolean;
    company_name?: string;
    related_to_course?: string;
    instruction_rating?: number;
};

export function AlumniTable() {
    const [alumniData, setAlumniData] = React.useState<Alumni[]>([]);
    const [programs, setPrograms] = React.useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [editingAlumni, setEditingAlumni] = React.useState<Alumni | null>(null);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
        middle_initial: false,
        present_address: false,
        company_name: false,
        further_studies: false,
        work_location: false,
        employer_classification: false,
    });
    const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
    const [sendEmailOpen, setSendEmailOpen] = React.useState(false);
    const [importOpen, setImportOpen] = React.useState(false);
    const [importFile, setImportFile] = React.useState<File | null>(null);
    const [filter, setFilter] = React.useState<string>();
    const [pageSize, setPageSize] = React.useState(10);
    const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
    const [pendingDeleteAlumni, setPendingDeleteAlumni] = React.useState<Alumni | null>(null);
    const [globalFilter, setGlobalFilter] = React.useState<string>('');
    const [viewingAlumni, setViewingAlumni] = React.useState<Alumni | null>(null);

    // Loading states for all actions
    const [deleteLoading, setDeleteLoading] = React.useState<number | null>(null);
    const [bulkDeleteLoading, setBulkDeleteLoading] = React.useState(false);
    const [sendEmailLoading, setSendEmailLoading] = React.useState(false);
    const [importLoading, setImportLoading] = React.useState(false);
    const [exportLoading, setExportLoading] = React.useState(false);

    const currentYear = new Date().getFullYear();
    const graduationYears = React.useMemo(() => {
        const years = [];
        for (let y = currentYear; y >= 2022; y--) {
            years.push(y.toString());
        }
        return years;
    }, [currentYear]);

    const fetchAlumni = () => {
        setLoading(true);
        axios
            .get('/alumni-data')
            .then((response) => {
                setAlumniData([...response.data]);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    };

    const fetchPrograms = () => {
        axios
            .get('/api/programs')
            .then((res) => setPrograms(res.data))
            .catch(() => {
                // Failed to fetch programs
            });
    };

    const handleDelete = (id?: number) => {
        if (!id) return;

        setDeleteLoading(id);

        axios
            .delete(`/alumni/${id}`)
            .then(() => {
                setAlumniData((prev) => prev.filter((a) => a.id !== id));
                toast.success('Deleted successfully');
            })
            .catch(() => {
                toast.error('Delete failed.');
            })
            .finally(() => {
                setDeleteLoading(null);
            });
    };

    const openDeleteConfirm = (alumni: Alumni) => {
        setPendingDeleteAlumni(alumni);
        setDeleteConfirmOpen(true);
    };

    const confirmSingleDelete = () => {
        if (!pendingDeleteAlumni?.id) return;

        handleDelete(pendingDeleteAlumni.id);
        setDeleteConfirmOpen(false);
        setPendingDeleteAlumni(null);
    };

    const handleBulkDelete = async () => {
        const selectedIds = Object.keys(rowSelection)
            .filter((key) => rowSelection[key as keyof typeof rowSelection])
            .map((key) => alumniData[parseInt(key)].id)
            .filter((id): id is number => id !== undefined);

        if (selectedIds.length === 0) {
            toast.error('No records selected');
            return;
        }

        setBulkDeleteLoading(true);

        try {
            await axios.post('/alumni/bulk-delete', { ids: selectedIds });
            setAlumniData((prev) => prev.filter((a) => !selectedIds.includes(a.id!)));
            setRowSelection({});
            setBulkDeleteOpen(false);
            toast.success(`Deleted ${selectedIds.length} records successfully`);
        } catch {
            toast.error('Bulk delete failed.');
        } finally {
            setBulkDeleteLoading(false);
        }
    };

    const handleSendEmails = async () => {
        const selectedIds = Object.keys(rowSelection)
            .filter((key) => rowSelection[key as keyof typeof rowSelection])
            .map((key) => alumniData[parseInt(key)].id)
            .filter((id): id is number => id !== undefined);

        if (selectedIds.length === 0) {
            toast.error('No alumni selected ❌');
            return;
        }

        setSendEmailLoading(true);

        try {
            const response = await axios.post('/send-email-to-selected-alumni', { ids: selectedIds });
            const { sent, failed } = response.data;

            if (failed?.length) {
                toast.warning('Some emails failed ❗', {
                    description: failed.join(', '),
                });
            } else {
                toast.success(`Emails sent successfully 📧`, {
                    description: `Total sent: ${sent.length}`,
                });
            }

            setSendEmailOpen(false);
            setRowSelection({});
        } catch (error: unknown) {
            const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message : 'Something went wrong.';
            toast.error('Failed to send emails', {
                description: errorMessage,
            });
        } finally {
            setSendEmailLoading(false);
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
            const totalRows = Number(response.data?.total_rows ?? response.data?.totalRows ?? 0);
            const errors = Array.isArray(response.data?.errors) ? response.data.errors : [];
            const hasErrors = errors.length > 0;

            if (imported > 0) {
                toast.success(`${imported} of ${totalRows} row(s) imported`);
                fetchAlumni();
                setImportOpen(false);
                setImportFile(null);
            } else if (!hasErrors) {
                toast.warning('Import completed, no rows were processed');
            }

            if (hasErrors) {
                const sample = errors
                    .slice(0, 3)
                    .map((item: { row: number; reason: string }) => `Row ${item.row}: ${item.reason}`)
                    .join('\n');

                const skippedMessage = skipped > 0 ? `${skipped} rows were skipped.` : 'Some rows were skipped.';
                const warningMessage = sample ? `${skippedMessage} Example: ${sample}` : skippedMessage;

                if (imported > 0) {
                    toast.warning('Some rows were skipped', {
                        description: warningMessage,
                    });
                } else {
                    toast.error('Import completed with skipped rows', {
                        description: warningMessage,
                    });
                }
            }
        } catch (error: unknown) {
            const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || error.response?.data?.error : 'Something went wrong.';
            const validationErrors = axios.isAxiosError(error) ? error.response?.data?.errors : null;
            if (validationErrors && typeof validationErrors === 'object') {
                const validationMessage = Object.values(validationErrors)
                    .flat()
                    .join(' ');
                toast.error('Import failed', {
                    description: validationMessage || errorMessage,
                });
            } else {
                toast.error('Import failed ❌', {
                    description: errorMessage,
                });
            }
        } finally {
            setImportLoading(false);
        }
    };

    React.useEffect(() => {
        fetchAlumni();
        fetchPrograms();
    }, []);

    // WebSocket connection for real-time updates
    React.useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined') {
            return;
        }

        if (!echo) {
            return;
        }

        // Add a small delay to ensure everything is loaded
        const connectionTimeout = setTimeout(() => {
            try {
                // Subscribe to the alumni channel
                const channel = echo.channel('alumni');

                interface AlumniEvent {
                    given_name: string;
                    last_name: string;
                }

                const listener = (e: AlumniEvent) => {
                    // Refresh the data from server
                    fetchAlumni();

                    toast.success(`${e.given_name} ${e.last_name} submitted form!`);
                };

                // Listen for the event
                channel.listen('.AlumniCreated', listener);
            } catch {
                // Error setting up WebSocket connection
            }
        }, 1000); // 1 second delay

        // Cleanup function
        return () => {
            clearTimeout(connectionTimeout);
            try {
                if (echo) {
                    echo.leaveChannel('alumni');
                }
            } catch {
                // Error leaving channel
            }
        };
    }, []); // Empty dependency array

    const resolveProgramName = (programValue: Alumni['program_id']) => {
        const programId =
            programValue && typeof programValue === 'object' && 'id' in programValue && programValue.id != null
                ? (programValue as { id: number }).id
                : Number(programValue);

        const prog = programs.find((p) => p.id === programId);
        if (prog) return prog.name;

        if (programValue && typeof programValue === 'object' && 'name' in programValue) {
            return (programValue as { name?: string }).name || 'N/A';
        }

        return 'N/A';
    };

    const columns: ColumnDef<Alumni>[] = [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        { accessorKey: 'student_number', header: 'Student No.', cell: ({ getValue }) => getValue() || 'N/A' },
        { accessorKey: 'email', header: 'Email', cell: ({ getValue }) => getValue() || 'N/A' },
        {
            accessorKey: 'program_id',
            header: 'Program',
            cell: ({ row }) => {
                const programValue = row.original.program_id;
                const programId =
                    programValue && typeof programValue === 'object' && 'id' in programValue && programValue.id != null
                        ? (programValue as { id: number }).id
                        : Number(programValue);

                const prog = programs.find((p) => p.id === programId);
                return prog ? prog.name : '—';
            },
            filterFn: (row, columnId, filterValue) => {
                const programValue = row.getValue(columnId);
                const programId =
                    programValue && typeof programValue === 'object' && 'id' in programValue && programValue.id != null
                        ? (programValue as { id: number }).id
                        : Number(programValue);

                return programId === Number(filterValue);
            },
        },
        { accessorKey: 'last_name', header: 'Last Name', cell: ({ getValue }) => getValue() || 'N/A' },
        { accessorKey: 'given_name', header: 'Given Name', cell: ({ getValue }) => getValue() || 'N/A' },
        { accessorKey: 'middle_initial', header: 'M.I.', cell: ({ getValue }) => getValue() || 'N/A' },
        { accessorKey: 'present_address', header: 'Present address.', cell: ({ getValue }) => getValue() || 'N/A' },
        { accessorKey: 'sex', header: 'Sex', cell: ({ getValue }) => { const v = getValue() as string | undefined; return v ? <span className="capitalize">{v}</span> : 'N/A'; }, filterFn: (row, columnId, filterValue) => ((row.getValue(columnId) as string || '').toLowerCase() === filterValue.toLowerCase()), },
        { accessorKey: 'graduation_year', header: 'Grad Year', cell: ({ getValue }) => getValue() || 'N/A' },
        { accessorKey: 'employment_status', header: 'Employment', filterFn: 'equals', cell: ({ getValue }) => getValue() || 'N/A' },
        { accessorKey: 'company_name', header: 'Company', filterFn: 'equals', cell: ({ getValue }) => getValue() || 'N/A' },
        { accessorKey: 'further_studies', header: 'Further Studies', cell: ({ getValue }) => getValue() || 'N/A' },
        { accessorKey: 'work_location', header: 'Work Location', cell: ({ getValue }) => getValue() || 'N/A' },
        { accessorKey: 'employer_classification', header: 'Employer Type', cell: ({ getValue }) => getValue() || 'N/A' },
        {
            id: 'actions',
            header: 'Action',
            enableHiding: false,
            cell: ({ row }) => {
                const alumni = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="p-1">
                                <MoreVertical className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingAlumni(alumni)}>View more details</DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600 hover:text-red-500"
                                onClick={() => openDeleteConfirm(alumni)}
                                disabled={deleteLoading === alumni.id}
                            >
                                {deleteLoading === alumni.id ? 'Deleting...' : 'Delete'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const table = useReactTable({
        data: alumniData,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
        initialState: {
            pagination: {
                pageSize: pageSize,
            },
        },
    });

    const handleExport = async () => {
        setExportLoading(true);

        try {
            // Get currently filtered alumni IDs
            const filteredAlumni = table.getFilteredRowModel().rows;
            const filteredIds = filteredAlumni.map((row) => row.original.id).filter((id): id is number => id !== undefined);

            if (filteredIds.length === 0) {
                toast.error('No alumni to export ❌');
                setExportLoading(false);
                return;
            }

            // Send filtered IDs to backend
            const response = await axios.post(
                '/export-alumni',
                { selectedIds: filteredIds },
                {
                    responseType: 'blob',
                },
            );

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'alumni-list.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Filtered alumni exported ✅');
        } catch (error: unknown) {
            const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message : 'Something went wrong.';
            toast.error('Export failed ❌', {
                description: errorMessage,
            });
        } finally {
            setExportLoading(false);
        }
    };

    const selectedCount = Object.keys(rowSelection).length;

    return (
        <div className="w-full">

            <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Alumni List</h1>
                <p className="mt-1 text-sm text-muted-foreground">List of all registered alumni records.</p>
            </div>
            {/* Filters and Actions */}
            <div className="flex flex-col gap-4 py-4">
                <div className="flex items-center gap-3">
                    <Input
                        placeholder="Search alumni..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="max-w-sm"
                    />

                    {/* Advanced Filters */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <FilterIcon className="h-4 w-4" />
                                Filters
                                {Object.keys(columnFilters).length > 0 && (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                        {Object.keys(columnFilters).length}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 space-y-2 p-4" align="start">
                            <h4 className="font-medium">Advanced Filters</h4>

                            {/* Year Filter */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Graduation Year</label>
                                <Select
                                    onValueChange={(val) => {
                                        if (val === '__clear__') {
                                            table.getColumn('graduation_year')?.setFilterValue('');
                                        } else {
                                            table.getColumn('graduation_year')?.setFilterValue(val);
                                        }
                                    }}
                                    value={(table.getColumn('graduation_year')?.getFilterValue() as string) || ''}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem className="bg-red-500/10" value="__clear__">
                                            Clear filter
                                        </SelectItem>
                                        {graduationYears.map((year) => (
                                            <SelectItem key={year} value={year}>
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Program Filter */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Program</label>
                                <Select
                                    onValueChange={(val) => {
                                        if (val === '__clear__') {
                                            table.getColumn('program_id')?.setFilterValue('');
                                        } else {
                                            table.getColumn('program_id')?.setFilterValue(Number(val));
                                        }
                                    }}
                                    value={String(table.getColumn('program_id')?.getFilterValue() || '')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select program" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem className="bg-red-500/10" value="__clear__">
                                            Clear filter
                                        </SelectItem>
                                        {programs.map((prog) => (
                                            <SelectItem key={prog.id} value={String(prog.id)}>
                                                {prog.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Employment Status Filter */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Employment Status</label>
                                <Select
                                    onValueChange={(val) => {
                                        if (val === '__clear__') {
                                            table.getColumn('employment_status')?.setFilterValue('');
                                        } else {
                                            table.getColumn('employment_status')?.setFilterValue(val);
                                        }
                                    }}
                                    value={(table.getColumn('employment_status')?.getFilterValue() as string) || ''}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem className="bg-red-500/10" value="__clear__">
                                            Clear filter
                                        </SelectItem>
                                        <SelectItem value="Employed">Employed</SelectItem>
                                        <SelectItem value="Unemployed">Unemployed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* work location filter */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Work Location</label>
                                <Select
                                    onValueChange={(val) => {
                                        if (val === '__clear__') {
                                            table.getColumn('work_location')?.setFilterValue('');
                                        } else {
                                            table.getColumn('work_location')?.setFilterValue(val);
                                        }
                                    }}
                                    value={(table.getColumn('work_location')?.getFilterValue() as string) || ''}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Work Location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem className="bg-red-500/10" value="__clear__">
                                            Clear filter
                                        </SelectItem>
                                        <SelectItem value="Local">Local</SelectItem>
                                        <SelectItem value="Abroad">Abroad</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* gender filter */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Sex</label>
                                <Select
                                    onValueChange={(val) => {
                                        if (val === '__clear__') {
                                            table.getColumn('sex')?.setFilterValue('');
                                        } else {
                                            table.getColumn('sex')?.setFilterValue(val);
                                        }
                                    }}
                                    value={(table.getColumn('sex')?.getFilterValue() as string) || ''}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem className="bg-red-500/10" value="__clear__">
                                            Clear filter
                                        </SelectItem>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button variant="outline" size="sm" className="w-full bg-red-300/20" onClick={() => setColumnFilters([])}>
                                Clear all filters
                            </Button>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Action Buttons */}
                <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-3">

                        <div className="flex gap-2">
                            <Button size="sm"
                                variant="outline"
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 text-primary hover:bg-primary/20"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Add New
                            </Button>

                        </div>

                        {/* Bulk actions */}
                        {selectedCount > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">{selectedCount} selected</span>
                                <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                                    <Trash2Icon className="h-4" />
                                    Delete
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Right side actions */}
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Left section - Add/Send Email */}
                        <div className="flex items-center gap-3">
                            {/* Send Email */}
                            <Dialog open={sendEmailOpen} onOpenChange={setSendEmailOpen}>
                                <DialogTrigger asChild>
                                    {/* <Button 
                  variant="outline" 
                  className="flex items-center"
                  disabled={selectedCount === 0}
                >
                  <UsersRound className="mr-2 h-4 w-4" />
                  Send Email
                </Button> */}
                                </DialogTrigger>

                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Send Email to Selected Alumni</DialogTitle>
                                        <DialogDescription>
                                            This will send email to <b>{selectedCount}</b> selected alumni.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <DialogFooter className="pt-4">
                                        <Button onClick={handleSendEmails} disabled={sendEmailLoading}>
                                            {sendEmailLoading ? 'Sending...' : 'Send Now'}
                                        </Button>
                                        <Button variant="ghost" onClick={() => setSendEmailOpen(false)} disabled={sendEmailLoading}>
                                            Cancel
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Right section - Import/Export/Rows */}
                        <div className="flex flex-wrap items-center justify-end gap-3">
                            {/* Import */}
                            <Button variant="outline" onClick={() => setImportOpen(true)} className="flex items-center gap-2">
                                <DownloadIcon className="mr-2 h-4 w-4 text-green-500" />
                                Import
                            </Button>

                            {/* Export */}
                            <Button variant="outline" onClick={handleExport} disabled={exportLoading}>
                                <Upload className="mr-2 h-4 w-4 text-blue-500" />
                                {exportLoading ? 'Exporting...' : 'Export'}
                            </Button>

                            {/* Rows per page */}
                            <Select
                                value={pageSize.toString()}
                                onValueChange={(value) => {
                                    setPageSize(Number(value));
                                    table.setPageSize(Number(value));
                                }}
                            >
                                <SelectTrigger className="w-20">
                                    <SelectValue placeholder={pageSize} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bulk Delete Confirmation */}
            <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedCount} selected records? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleteLoading}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleteLoading}>
                            {bulkDeleteLoading ? 'Deleting...' : `Delete`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Alumni Modal */}
            <Dialog
                open={showAddModal}
                onOpenChange={(open) => {
                    setShowAddModal(open);
                    if (!open) setEditingAlumni(null);
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingAlumni ? 'Edit Alumni' : 'Add New Alumni'}</DialogTitle>
                        <DialogDescription>
                            {editingAlumni
                                ? 'Update the alumni information and submit to save changes.'
                                : 'Fill out the form and submit to add a new record.'}
                        </DialogDescription>
                    </DialogHeader>

                    <AlumniForm
                        key={editingAlumni?.student_number || 'create'}
                        mode={editingAlumni ? 'edit' : 'create'}
                        id={editingAlumni?.id}
                        student_number={editingAlumni?.student_number}
                        email={editingAlumni?.email}
                        program_id={typeof editingAlumni?.program_id === 'object' ? editingAlumni.program_id.id : editingAlumni?.program_id}
                        last_name={editingAlumni?.last_name}
                        given_name={editingAlumni?.given_name}
                        middle_initial={editingAlumni?.middle_initial}
                        present_address={editingAlumni?.present_address}
                        contact_number={editingAlumni?.contact_number}
                        graduation_year={editingAlumni?.graduation_year?.toString()}
                        employment_status={editingAlumni?.employment_status}
                        company_name={editingAlumni?.company_name}
                        further_studies={editingAlumni?.further_studies}
                        sector={editingAlumni?.sector}
                        work_location={editingAlumni?.work_location}
                        employer_classification={editingAlumni?.employer_classification}
                        related_to_course={editingAlumni?.related_to_course}
                        consent={editingAlumni?.consent ?? false}
                        sex={editingAlumni?.sex}
                        instruction_rating={editingAlumni?.instruction_rating}
                        onSuccess={() => {
                            fetchAlumni();
                            setShowAddModal(false);
                            setEditingAlumni(null);
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* View Alumni Modal */}
            <Dialog
                open={Boolean(viewingAlumni)}
                onOpenChange={(open) => {
                    if (!open) setViewingAlumni(null);
                }}
            >
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
                                ['Program', resolveProgramName(viewingAlumni.program_id)],
                                ['Last Name', viewingAlumni.last_name || 'N/A'],
                                ['Given Name', viewingAlumni.given_name || 'N/A'],
                                ['Middle Initial', viewingAlumni.middle_initial || 'N/A'],
                                ['Present Address', viewingAlumni.present_address || 'N/A'],
                                ['Contact Number', viewingAlumni.contact_number || 'N/A'],
                                ['Graduation Year', viewingAlumni.graduation_year?.toString() || 'N/A'],
                                ['Sex', viewingAlumni.sex || 'N/A'],
                                ['Employment Status', viewingAlumni.employment_status || 'N/A'],
                                ['Company Name', viewingAlumni.company_name || 'N/A'],
                                ['Related to Course', viewingAlumni.related_to_course || 'N/A'],
                                ['Further Studies', viewingAlumni.further_studies || 'N/A'],
                                ['Work Location', viewingAlumni.work_location || 'N/A'],
                                ['Employer Type', viewingAlumni.employer_classification || 'N/A'],
                                ['Sector', viewingAlumni.sector || 'N/A'],
                                ['Consent', viewingAlumni.consent ? 'Yes' : 'No'],
                                ['Instruction Rating', viewingAlumni.instruction_rating?.toString() || 'N/A'],
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

            {/* Single Delete Confirmation */}
            <Dialog
                open={deleteConfirmOpen}
                onOpenChange={(open) => {
                    setDeleteConfirmOpen(open);
                    if (!open) setPendingDeleteAlumni(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <b>
                                {pendingDeleteAlumni?.given_name} {pendingDeleteAlumni?.last_name}
                            </b>
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setDeleteConfirmOpen(false);
                                setPendingDeleteAlumni(null);
                            }}
                            disabled={deleteLoading === pendingDeleteAlumni?.id}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmSingleDelete}
                            disabled={deleteLoading === pendingDeleteAlumni?.id}
                        >
                            {deleteLoading === pendingDeleteAlumni?.id ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Import Alumni Modal */}
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Import Alumni</DialogTitle>
                        <DialogDescription>Upload an Excel/CSV file containing alumni data.</DialogDescription>
                        <DialogFooter className="flex flex-col items-center space-y-2 text-center">
                            <p className="text-sm text-muted-foreground">Please ensure your Excel file matches the required format. You can&nbsp;</p>
                            <Button
                                className="cursor-pointer text-blue-600 underline"
                                variant="link"
                                onClick={() => (window.location.href = route('alumni.template.download'))}
                            >
                                Download Excel Template
                            </Button>
                        </DialogFooter>
                    </DialogHeader>
                    <input
                        className="w-full rounded-md border border-gray-300 p-3 file:mr-4 file:rounded file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    />
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setImportOpen(false)} disabled={importLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleImport} disabled={!importFile || importLoading}>
                            <FileUp className="h-4 w-4" /> {importLoading ? 'Importing...' : 'Import'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Table */}
            {loading ? (
                <div className="py-10 text-center text-muted-foreground">Loading alumni data...</div>
            ) : (
                <div className="rounded-md border">
                    <Table className="w-full">
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            className={`font-semibold ${header.column.id === 'select' ? 'w-10 px-2' : header.column.id === 'actions' ? 'w-16 px-2' : ''
                                                }`}
                                        >
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>

                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell
                                                key={cell.id}
                                                className={
                                                    cell.column.id === 'select'
                                                        ? 'w-10 px-2 align-top'
                                                        : cell.column.id === 'actions'
                                                            ? 'w-16 px-2 align-top'
                                                            : 'max-w-[220px] truncate align-top'
                                                }
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        <Empty>
                                            <EmptyHeader>
                                                <EmptyMedia variant="icon">
                                                    <Users />
                                                </EmptyMedia>
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
            )}

            {/* Pagination Controls */}
            <div className="flex items-center justify-between py-4">
                <div className="text-sm text-muted-foreground">
                    Showing {table.getState().pagination.pageIndex * pageSize + 1} to{' '}
                    {Math.min((table.getState().pagination.pageIndex + 1) * pageSize, alumniData.length)} of {alumniData.length} entries
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
