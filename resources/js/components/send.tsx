'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageProps } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable, } from '@tanstack/react-table';
import axios from 'axios';
import { ChevronDown, ChevronsUpDown, ChevronUp, DownloadIcon, FileUp, Loader2, Menu, MoreHorizontal, PlusIcon, Search, Trash, Upload, Users, X, } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { SendEmailToSelected } from './SendEmailToProgram';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
export type Student = {
    id: number;
    student_number: string;
    student_name: string;
    email?: string;
    year: number;
};

export default function StudentIndex() {
    const { props } = usePage<PageProps>();
    const students = props.students as unknown as Student[];
    const [addLoading, setAddLoading] = React.useState(false);
    const [studentList, setStudentList] = React.useState<Student[]>(students);
    const [showModal, setShowModal] = React.useState(false);
    const [editId, setEditId] = React.useState<number | null>(null);
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [showUploadModal, setShowUploadModal] = React.useState(false);
    const [excelFile, setExcelFile] = React.useState<File | null>(null);
    const [rowSelection, setRowSelection] = React.useState({});
    const [yearFilter, setYearFilter] = React.useState<string>('');
    const [showDeleteModal, setShowDeleteModal] = React.useState(false);
    const [deleteId, setDeleteId] = React.useState<number | null>(null);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = React.useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [importLoading, setImportLoading] = React.useState(false);
    const [deleteLoading, setDeleteLoading] = React.useState(false);
    const [bulkDeleteLoading, setBulkDeleteLoading] = React.useState(false);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const handleDownloadTemplate = async () => {
        try {
            const response = await axios.get('/students/download-template', {
                responseType: 'blob', // important for binary files
            });

            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            saveAs(blob, 'student_template.xlsx'); // force download
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Failed to download template ❌');
        }
    };
    const { data, setData, reset, processing } = useForm({
        id: '',
        student_number: '',
        student_name: '',
        email: '',
        year: '',
    });
    //what happened to my code
    React.useEffect(() => {
        const sortedStudents = [...students].sort((a, b) => (b.id || 0) - (a.id || 0));
        setStudentList(sortedStudents);
    }, [students]);

    // Memoized export function
    const exportToExcel = React.useCallback((data: Student[]) => {
        if (!data.length) {
            toast.error('No data to export!');
            return;
        }

        const exportData = data.map((student) => ({
            'Student Number': student.student_number,
            'Student Name': student.student_name,
            Email: student.email || '',
            Year: student.year,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const headerRange = XLSX.utils.decode_range(ws['!ref'] || '');

        for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
            if (!ws[cellAddress]) continue;

            ws[cellAddress].s = {
                font: { bold: true, color: { rgb: 'FFFFFF' } },
                fill: { fgColor: { rgb: '4F46E5' } },
                alignment: { horizontal: 'center', vertical: 'center' },
            };
        }

        ws['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 10 }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

        saveAs(blob, `students_${new Date().toISOString().split('T')[0]}.xlsx`);
    }, []);

    // Handle Excel Upload
    const handleExcelUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!excelFile) return;

        setImportLoading(true);
        const formData = new FormData();
        formData.append('file', excelFile);

        try {
            const res = await axios.post('/students/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success(res.data.message || 'Import successful!');
            setShowUploadModal(false);
            router.reload();
            setExcelFile(null);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Import failed!';
        } finally {
            setImportLoading(false);
        }
    };

    // Add/Edit Student
    const handleSubmitStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (addLoading) return;
        setAddLoading(true);

        try {
            const url = editId ? `/students/${editId}` : '/students';
            const method = editId ? 'put' : 'post';
            const submitData = { ...data, year: data.year ? Number(data.year) : '' };

            const response = await axios[method](url, submitData);
            const studentData = response.data;

            setStudentList((prev) => {
                if (editId) {
                    return prev.map((s) => (s.id === editId ? studentData : s));
                } else {
                    // Add to beginning and maintain sort order
                    const newList = [studentData, ...prev];
                    return newList.sort((a, b) => (b.id || 0) - (a.id || 0));
                }
            });

            toast.success(`Student ${editId ? 'updated' : 'added'}!`, {
                description: `${studentData.student_number} – ${studentData.student_name}`,
            });

            reset();
            setEditId(null);
            setShowModal(false);
        } catch (err: any) {
            console.error('Student operation error:', err);
            toast.error(err.response?.data?.message || 'Email or Student number already exists.');
        } finally {
            setAddLoading(false);
        }
    };

    // Single delete
    // Single delete
    const handleDelete = async () => {
        if (!deleteId || deleteLoading) return;

        setDeleteLoading(true);

        try {
            await axios.delete(`/students/${deleteId}`);
            setStudentList((prev) => prev.filter((s) => s.id !== deleteId));
            toast.success('Student deleted!');
            setShowDeleteModal(false);
            setDeleteId(null);
        } catch (error: unknown) {
            const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message : 'Failed to delete student ❌';
            toast.error(errorMessage);
        } finally {
            setDeleteLoading(false);
        }
    };

    // Bulk delete
    // Bulk delete
    const handleBulkDelete = async () => {
        const selectedIds = table
            .getSelectedRowModel()
            .rows.map((r) => r.original.id)
            .filter(Boolean) as number[];

        if (!selectedIds.length || bulkDeleteLoading) return;

        setBulkDeleteLoading(true);

        try {
            await axios.post('/students/bulk-delete', { ids: selectedIds });
            setStudentList((prev) => prev.filter((s) => !selectedIds.includes(s.id!)));
            toast.success('Selected students deleted!');
            setRowSelection({});
            setShowBulkDeleteModal(false);
        } catch (error: unknown) {
            const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message : 'Failed to delete selected students ❌';
            toast.error(errorMessage);
        } finally {
            setBulkDeleteLoading(false);
        }
    };

    // Table columns
    const columns: ColumnDef<Student>[] = React.useMemo(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={table.getIsAllPageRowsSelected()}
                        onChange={table.getToggleAllPageRowsSelectedHandler()}
                    />
                ),
                cell: ({ row }) => (
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                    />
                ),
                enableSorting: false, // Disable sorting for select column
            },
            {
                accessorKey: 'student_number',
                header: 'STUDENT NUMBER',
                // Enable sorting for this column
            },
            {
                accessorKey: 'student_name',
                header: 'STUDENT FULL NAME',
                // Enable sorting for this column
            },
            {
                accessorKey: 'email',
                header: 'EMAIL',
                // Enable sorting for this column
            },
            {
                accessorKey: 'year',
                header: 'YEAR',
                // Enable sorting for this column
            },
            {
                id: 'actions',
                header: 'Action',
                enableHiding: false,
                enableSorting: false, // Disable sorting for actions column
                cell: ({ row }) => {
                    const student = row.original;

                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => {
                                        setEditId(student.id!);
                                        setData({
                                            id: student.id?.toString() || '',
                                            student_number: student.student_number,
                                            student_name: student.student_name,
                                            email: student.email || '',
                                            year: student.year?.toString() || '',
                                        });
                                        setShowModal(true);
                                    }}
                                >
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="cursor-pointer text-red-600"
                                    onClick={() => {
                                        setDeleteId(student.id!);
                                        setShowDeleteModal(true);
                                    }}
                                >
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
            },
        ],
        [],
    );

    const columnFilters = React.useMemo(() => {
        if (yearFilter && yearFilter !== 'all' && yearFilter !== 'unknown') {
            return [{ id: 'year', value: Number(yearFilter) }];
        }
        return [];
    }, [yearFilter]);

    // React Table setup
    const table = useReactTable({
        data: studentList,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        enableRowSelection: true,
        state: {
            rowSelection,
            globalFilter,
            columnFilters,
            sorting,
        },

        globalFilterFn: (row, columnId, filterValue) => {
            const search = filterValue.toLowerCase();
            const student = row.original;

            return (
                student.student_number.toLowerCase().includes(search) ||
                student.student_name.toLowerCase().includes(search) ||
                (student.email?.toLowerCase().includes(search) ?? false)
            );
        },
    });

    // ✅ Extract years dynamically
    const years = React.useMemo(() => {
        const uniqueYears = Array.from(new Set(studentList.map((s) => s.year).filter((y) => y != null))).sort((a, b) => Number(b) - Number(a));
        return uniqueYears;
    }, [studentList]);

    const selectedCount = table.getSelectedRowModel().rows.length;
    const currentData = React.useMemo(() => {
        if (selectedCount > 0) {
            return table.getSelectedRowModel().rows.map((r) => r.original);
        }

        if (yearFilter && yearFilter !== 'all' && yearFilter !== 'unknown') {
            return table.getFilteredRowModel().rows.map((r) => r.original);
        }

        return studentList;
    }, [selectedCount, table, yearFilter, studentList]);

    const clearAllSelections = () => {
        setRowSelection({});
    };

    return (
        <div className="w-full p-6">

            {/* Mobile Menu Button */}
            <div className="mb-4 block md:hidden">
                <Button variant="outline" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden">
                    {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
            </div>

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Alumni Management</h1>
                <p className="mt-1 text-sm text-muted-foreground">Manage your alumni records and communications</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-start justify-between gap-4 py-4 md:flex-row md:items-center">
                {/* Left controls */}
                <div className={`flex w-full flex-wrap items-center gap-3 md:w-auto ${isMobileMenuOpen ? 'block' : 'hidden md:flex'}`}>
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                        <Input
                            placeholder="Search students..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="w-full pl-10 md:max-w-xs"
                        />
                    </div>

                    {/* Year Filter */}
                    <div className="flex w-full items-center gap-2 md:w-auto">
                        <Select value={yearFilter} onValueChange={setYearFilter}>
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue placeholder="Filter by Year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Years</SelectItem>
                                {years.map((y) => (
                                    <SelectItem key={y ?? 'unknown'} value={y ? y.toString() : 'unknown'}>
                                        {y ?? 'Unknown'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                        {/* <Button
                            onClick={() => {
                                reset();
                                setEditId(null);
                                setShowModal(true);
                            }}
                            className="w-full gap-2 md:w-auto"
                        >
                            <PlusIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Add New</span>
                        </Button> */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                reset()
                                setEditId(null)
                                setShowModal(true)
                            }}
                            className="w-full gap-2 md:w-auto"
                        >
                            <PlusIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Add New</span>
                        </Button>

                    </div>

                    {selectedCount > 0 && (
                        <Button variant="destructive" onClick={() => setShowBulkDeleteModal(true)} className="w-full gap-2 md:w-auto">
                            <Trash className="h-4 w-4" />
                            Delete
                        </Button>
                    )}
                </div>

                {/* Right controls */}
                <div
                    className={`mt-4 flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center md:mt-0 md:w-auto ${isMobileMenuOpen ? 'block' : 'hidden md:flex'}`}
                >
                    <Button onClick={() => setShowUploadModal(true)} className="w-full gap-2 md:w-auto" variant="outline">
                        <DownloadIcon className="h-4 w-4 text-green-500" />
                        <span className="">Import Excel</span>
                    </Button>
                    <Button variant="outline" onClick={() => exportToExcel(currentData)} className="w-full gap-2 sm:w-auto">
                        <Upload className="h-4 w-4 text-blue-500" />
                        <span className="hidden sm:inline">Export Excel</span>
                        <span className="sm:hidden">Export</span>
                    </Button>

                    <div className="w-full sm:w-auto">
                        <SendEmailToSelected selectedStudents={currentData} onEmailSent={clearAllSelections} />
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const isNameColumn = header.column.columnDef.header === 'STUDENT FULL NAME';

                                    return (
                                        <TableHead
                                            key={header.id}
                                            className={`font-semibold whitespace-nowrap ${isNameColumn ? 'cursor-pointer' : ''}`}
                                            onClick={isNameColumn ? header.column.getToggleSortingHandler() : undefined}
                                        >
                                            <div className="flex items-center gap-1">
                                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                {/* Only show sorting indicators for name column */}
                                                {isNameColumn && (
                                                    <>
                                                        {header.column.getIsSorted() === 'asc' ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : header.column.getIsSorted() === 'desc' ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronsUpDown className="h-4 w-4 text-gray-300" />
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="whitespace-nowrap">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="py-8 text-center text-gray-500">
                                    <Empty>
                                        <EmptyHeader>
                                            <EmptyMedia variant="icon">
                                                <Users />
                                            </EmptyMedia>
                                            <EmptyTitle>No Student</EmptyTitle>
                                            <EmptyDescription>No data found</EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center justify-between gap-4 py-4 sm:flex-row">
                <div className="text-sm text-gray-600">
                    Showing {table.getRowModel().rows.length} of {studentList.length} students
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="gap-1">
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="gap-1">
                        Next
                    </Button>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl">{editId ? 'Edit Student' : 'Add New Alumni'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitStudent} className="space-y-4">
                        <Input type="hidden" value={data.id} onChange={(e) => setData('id', e.target.value)} />
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Student Number</label>
                            <Input
                                placeholder="e.g. 1234567890"
                                value={data.student_number}
                                onChange={(e) => setData('student_number', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Student Full Name</label>
                            <Input
                                placeholder="e.g. Dela Cruz, Juan T."
                                value={data.student_name}
                                onChange={(e) => setData('student_name', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email (Optional)</label>
                            <Input
                                type="email"
                                placeholder="e.g. email@gmail.com"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Year Graduated</label>
                            <Input
                                type="number"
                                min="2022"
                                max={new Date().getFullYear()}
                                value={data.year}
                                placeholder="e.g.  2022"
                                onChange={(e) => setData('year', e.target.value)}
                                required
                            />
                        </div>

                        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    reset();
                                    setEditId(null);
                                    setShowModal(false);
                                }}
                                className="w-full sm:w-auto"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing || addLoading} className="w-full sm:w-auto">
                                {addLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {editId ? 'Edit' : 'Add'}
                                {addLoading ? 'ing...' : ''}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Excel Upload Modal */}
            <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Import Students from Excel</DialogTitle>
                        <DialogFooter className="flex flex-col items-start gap-2">
                            <p className="text-sm text-muted-foreground">Please ensure your Excel file matches the required format. You can&nbsp;</p>
                            <Button
                                onClick={handleDownloadTemplate} // ✅ blob download function
                                className="w-full gap-2 font-medium md:w-auto"
                                variant="link"
                            >
                                <span className="text-blue-700 underline cursor-pointer">Download Excel Template</span>
                            </Button>
                        </DialogFooter>
                    </DialogHeader>
                    <form onSubmit={handleExcelUpload} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Excel File</label>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                                required
                                className="w-full rounded-md border border-gray-300 p-3 file:mr-4 file:rounded file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <p className="text-sm text-gray-500">Supported formats: .xlsx, .xls</p>
                        </div>
                        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                            <Button type="button" variant="ghost" onClick={() => setShowUploadModal(false)} className="w-full sm:w-auto">
                                Cancel
                            </Button>

                            <Button type="submit" disabled={!excelFile || importLoading} className="w-full sm:w-auto">
                                {importLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className=" h-4 w-4" />}
                                {importLoading ? 'Importing...' : 'Import'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Single Delete Confirmation Modal */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Confirm Deletion</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this student? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-0">
                        <div className='space-x-2'>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleteLoading}
                                className="w-full sm:w-auto"
                            >
                                Cancel
                            </Button>
                            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteLoading} className="w-full sm:w-auto">
                                {deleteLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete'
                                )}
                            </Button>
                        </div>

                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Delete Confirmation Modal */}
            <Dialog open={showBulkDeleteModal} onOpenChange={setShowBulkDeleteModal}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedCount} selected students? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowBulkDeleteModal(false)}
                            disabled={bulkDeleteLoading}
                            className="w-full space-x-0.5 sm:w-auto"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleBulkDelete}
                            disabled={bulkDeleteLoading}
                            className="w-full sm:w-auto"
                        >
                            {bulkDeleteLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                `Delete`
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
