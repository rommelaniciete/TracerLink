'use client';

import * as React from 'react';

import { DataPagination } from '@/components/data-pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { toast } from '@/lib/toast';
import { EmployabilityPageProps } from '@/types/records';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { BookA, Download, RefreshCw } from 'lucide-react';

export default function EmployabilityPage() {
    const { props, url } = usePage<EmployabilityPageProps>();
    const [search, setSearch] = React.useState(props.filters.search ?? '');
    const [programId, setProgramId] = React.useState(props.filters.program_id || 'all');
    const [perPage, setPerPage] = React.useState(String(props.filters.per_page ?? props.alumni.per_page ?? 10));
    const [isFiltering, setIsFiltering] = React.useState(false);
    const [isExporting, setIsExporting] = React.useState(false);
    const debouncedSearch = useDebouncedValue(search);

    React.useEffect(() => {
        setSearch(props.filters.search ?? '');
        setProgramId(props.filters.program_id || 'all');
        setPerPage(String(props.filters.per_page ?? props.alumni.per_page ?? 10));
    }, [props.filters, props.alumni.per_page]);

    const currentPath = React.useMemo(() => url.split('?')[0], [url]);

    const navigate = React.useCallback(
        (next: { page?: number; search?: string; program_id?: string; per_page?: number }) => {
            const params = {
                search: next.search ?? debouncedSearch,
                program_id: next.program_id ?? programId,
                per_page: next.per_page ?? Number(perPage),
                page: next.page ?? props.alumni.current_page,
            };

            router.get(
                currentPath,
                {
                    search: params.search || undefined,
                    program_id: params.program_id !== 'all' ? params.program_id : undefined,
                    per_page: params.per_page,
                    page: params.page,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['alumni', 'filters'],
                    onStart: () => setIsFiltering(true),
                    onFinish: () => setIsFiltering(false),
                },
            );
        },
        [currentPath, debouncedSearch, perPage, programId, props.alumni.current_page],
    );

    React.useEffect(() => {
        const currentSearch = props.filters.search ?? '';
        const currentProgram = props.filters.program_id || 'all';
        const currentPerPage = String(props.filters.per_page ?? props.alumni.per_page ?? 10);

        if (debouncedSearch === currentSearch && programId === currentProgram && perPage === currentPerPage) {
            return;
        }

        navigate({
            page: 1,
            search: debouncedSearch,
            program_id: programId,
            per_page: Number(perPage),
        });
    }, [debouncedSearch, navigate, perPage, programId, props.alumni.per_page, props.filters.program_id, props.filters.per_page, props.filters.search]);

    const handleExport = async () => {
        setIsExporting(true);

        try {
            const response = await axios.post(
                '/employability/export',
                {
                    search: debouncedSearch,
                    program_id: programId !== 'all' ? programId : '',
                },
                { responseType: 'blob' },
            );

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = 'employability-report.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to export employability report.');
            } else {
                toast.error('Failed to export employability report.');
            }
        } finally {
            setIsExporting(false);
        }
    };

    const rows = props.alumni.data;

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Employability Report</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Generate and print a detailed report of alumni employability data.</p>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search alumni, program, or company..."
                            className="w-full sm:max-w-sm"
                        />

                        <Select value={programId} onValueChange={setProgramId}>
                            <SelectTrigger className="w-full sm:w-[220px]">
                                <SelectValue placeholder="Select program" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Programs</SelectItem>
                                {props.programs.map((program) => (
                                    <SelectItem key={program.id} value={String(program.id)}>
                                        {program.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                setSearch('');
                                setProgramId('all');
                                setPerPage('10');
                            }}
                            title="Reset filters"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" onClick={handleExport} disabled={isExporting} className="gap-2">
                            <Download className="h-4 w-4" />
                            {isExporting ? 'Exporting...' : 'Export Excel'}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="overflow-x-auto rounded-xl border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>PROGRAM NAME</TableHead>
                                <TableHead>NAME OF ALUMNI</TableHead>
                                <TableHead>STATUS</TableHead>
                                <TableHead>SEX</TableHead>
                                <TableHead>NAME OF COMPANY / TYPE OF BUSINESS</TableHead>
                                <TableHead>POSITION / NATURE OF WORK</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isFiltering ? (
                                Array.from({ length: Math.min(props.alumni.per_page, 5) }).map((_, index) => (
                                    <TableRow key={index}>
                                        {Array.from({ length: 6 }).map((__, cellIndex) => (
                                            <TableCell key={cellIndex}>
                                                <Skeleton className="h-5 w-full" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : rows.length > 0 ? (
                                rows.map((alumnus) => (
                                    <TableRow key={alumnus.id} className="hover:bg-muted/40">
                                        <TableCell>{alumnus.program?.name || 'N/A'}</TableCell>
                                        <TableCell>{`${alumnus.last_name || 'N/A'}, ${alumnus.given_name || 'N/A'} ${alumnus.middle_initial || ''}`}</TableCell>
                                        <TableCell>{alumnus.employment_status || 'N/A'}</TableCell>
                                        <TableCell>{alumnus.sex || 'N/A'}</TableCell>
                                        <TableCell>{alumnus.company_name || 'N/A'}</TableCell>
                                        <TableCell>{alumnus.work_position || 'N/A'}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-10">
                                        <Empty>
                                            <EmptyHeader>
                                                <EmptyMedia variant="icon">
                                                    <BookA />
                                                </EmptyMedia>
                                                <EmptyTitle>No Employability</EmptyTitle>
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
                    pagination={props.alumni}
                    itemLabel="records"
                    disabled={isFiltering}
                    onPageChange={(page) => navigate({ page })}
                    onPerPageChange={(value) => {
                        setPerPage(String(value));
                    }}
                />
            </CardContent>
        </Card>
    );
}
