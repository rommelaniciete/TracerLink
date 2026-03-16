'use client';

import { DataPagination } from '@/components/data-pagination';
import {
    FilterStatus,
    JobPostFormData,
    filterViewOptions,
    formatDate,
    getFilterViewFromFilters,
    getJobStatusMeta,
    getQueryFiltersFromView,
    isJobActive,
    isJobExpired,
    parseDateString,
} from '@/components/job-post/helpers';
import { JobPostDetailsDialog } from '@/components/job-post/job-post-details-dialog';
import { JobPostEditorDialog } from '@/components/job-post/job-post-editor-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { toast } from '@/lib/toast';
import { JobPageProps, JobRecord } from '@/types/records';
import { router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { isValid } from 'date-fns';
import { BriefcaseBusiness, Building2, Eye, FilePenLine, MapPin, MoreHorizontal, PlusIcon, Search, Send, Trash, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export default function JobPost() {
    const page = usePage<JobPageProps>();
    const { jobs, programs, filters } = page.props;
    const currentPath = React.useMemo(() => page.url.split('?')[0], [page.url]);
    const currentJobs = jobs?.data ?? [];

    const [open, setOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<number | ''>('');
    const [selectedJobs, setSelectedJobs] = useState<number[]>([]);
    const [viewJob, setViewJob] = useState<JobRecord | null>(null);
    const [emailJob, setEmailJob] = useState<JobRecord | null>(null);
    const [search, setSearch] = useState(filters.search || '');
    const [perPage, setPerPage] = useState(String(filters.per_page ?? jobs?.per_page ?? 10));
    const [filterState, setFilterState] = useState({
        view: getFilterViewFromFilters(filters),
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);

    const [isDeleting, setIsDeleting] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [isApplyingFilters, setIsApplyingFilters] = useState(false);
    const debouncedSearch = useDebouncedValue(search);

    const [locationInputType, setLocationInputType] = useState<'text' | 'link'>('text');
    const [deadlinePickerOpen, setDeadlinePickerOpen] = useState(false);

    const selectedProgramName = React.useMemo(() => {
        if (selectedProgram === '') {
            return null;
        }

        return programs.find((program) => program.id === selectedProgram)?.name ?? null;
    }, [programs, selectedProgram]);

    const allCurrentPageSelected = currentJobs.length > 0 && currentJobs.every((job) => selectedJobs.includes(job.id));
    const currentViewFilters = getQueryFiltersFromView(filterState.view);

    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm<JobPostFormData>({
        title: '',
        description: '',
        company_name: '',
        location: '',
        location_link: '',
        requirements: '',
        responsibilities: '',
        apply_link: '',
        status: 'active',
        posted_date: '',
        application_deadline: '',
    });

    const toggleSelectAllCurrentPage = (checked: boolean) => {
        const currentPageIds = currentJobs.map((job) => job.id);

        if (!checked) {
            setSelectedJobs((prev) => prev.filter((id) => !currentPageIds.includes(id)));
            return;
        }

        setSelectedJobs((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    };

    const visitJobs = React.useCallback(
        (
            overrides: Partial<{
                page: number;
                search: string;
                per_page: number;
                status: FilterStatus;
                show_expired: boolean;
                show_active: boolean;
                show_upcoming: boolean;
            }> = {},
            options?: { clearSelection?: boolean },
        ) => {
            const params: Record<string, string | boolean | number> = {
                page: overrides.page ?? jobs.current_page,
                per_page: overrides.per_page ?? Number(perPage),
            };

            const searchValue = overrides.search ?? debouncedSearch;
            const status = overrides.status ?? currentViewFilters.status;
            const showExpired = overrides.show_expired ?? currentViewFilters.show_expired;
            const showActive = overrides.show_active ?? currentViewFilters.show_active;
            const showUpcoming = overrides.show_upcoming ?? currentViewFilters.show_upcoming;

            if (searchValue) params.search = searchValue;
            if (status !== 'all') params.status = status;
            if (showExpired) params.show_expired = true;
            if (showActive) params.show_active = true;
            if (showUpcoming) params.show_upcoming = true;

            if (options?.clearSelection) {
                setSelectedJobs([]);
            }

            router.get(currentPath, params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['jobs', 'filters'],
                onStart: () => setIsApplyingFilters(true),
                onFinish: () => setIsApplyingFilters(false),
            });
        },
        [
            currentPath,
            currentViewFilters.show_active,
            currentViewFilters.show_expired,
            currentViewFilters.show_upcoming,
            currentViewFilters.status,
            debouncedSearch,
            jobs.current_page,
            perPage,
        ],
    );

    useEffect(() => {
        if (locationInputType === 'text') {
            setData('location_link', '');
        } else {
            setData('location', '');
        }
    }, [locationInputType, setData]);

    useEffect(() => {
        setSearch(filters.search || '');
        setPerPage(String(filters.per_page ?? jobs.per_page ?? 10));
        setFilterState({
            view: getFilterViewFromFilters(filters),
        });
    }, [filters, jobs.per_page]);

    useEffect(() => {
        if (debouncedSearch === (filters.search || '') && perPage === String(filters.per_page ?? jobs.per_page ?? 10)) {
            return;
        }

        visitJobs(
            {
                page: 1,
                search: debouncedSearch,
                per_page: Number(perPage),
            },
            { clearSelection: true },
        );
    }, [debouncedSearch, filters.per_page, filters.search, jobs.per_page, perPage, visitJobs]);

    useEffect(() => {
        if (filterState.view === getFilterViewFromFilters(filters)) {
            return;
        }

        visitJobs(
            {
                page: 1,
                ...getQueryFiltersFromView(filterState.view),
            },
            { clearSelection: true },
        );
    }, [filterState.view, filters, visitJobs]);

    const resetEditorState = () => {
        clearErrors();
        setDeadlinePickerOpen(false);
    };

    const openAdd = () => {
        reset();
        resetEditorState();
        setData('posted_date', new Date().toISOString().slice(0, 10));
        setData('status', 'active');
        setEditId(null);
        setLocationInputType('text');
        setOpen(true);
    };

    const openEdit = (job: JobRecord) => {
        resetEditorState();
        setData({
            title: job.title,
            description: job.description,
            company_name: job.company_name,
            location: job.location || '',
            location_link: job.location_link || '',
            requirements: job.requirements || '',
            responsibilities: job.responsibilities || '',
            apply_link: job.apply_link || '',
            status: job.status,
            posted_date: job.posted_date || '',
            application_deadline: job.application_deadline || '',
        });

        setLocationInputType(job.location_link ? 'link' : 'text');
        setEditId(job.id);
        setOpen(true);
    };

    const openView = (job: JobRecord) => {
        setViewJob(job);
        setViewOpen(true);
    };

    const openEmailModal = (job: JobRecord) => {
        setEmailJob(job);
        setShowEmailModal(true);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (editId) {
            put(route('job-posts.update', { job_post: editId }), {
                onSuccess: () => {
                    toast.success('Job post updated');
                    reset();
                    setOpen(false);
                    setEditId(null);
                },
            });
            return;
        }

        post(route('job-posts.store'), {
            onSuccess: () => {
                toast.success('Job post created');
                reset();
                setOpen(false);
                setEditId(null);
            },
        });
    };

    const handleDelete = () => {
        if (!deleteId) return;

        setIsDeleting(true);
        destroy(route('job-posts.destroy', { job_post: deleteId }), {
            onSuccess: () => {
                toast.success('Job post deleted');
                setShowDeleteModal(false);
                setDeleteId(null);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const handleBulkDelete = async () => {
        if (selectedJobs.length === 0) {
            toast.error('No jobs selected');
            return;
        }

        setIsBulkDeleting(true);

        try {
            await Promise.all(selectedJobs.map((id) => axios.delete(route('job-posts.destroy', { job_post: id }))));

            toast.success(`${selectedJobs.length} job(s) deleted successfully`);
            setSelectedJobs([]);
            setShowBulkDeleteModal(false);
            visitJobs();
        } catch {
            toast.error('Failed to delete some jobs');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const sendEmail = () => {
        if (!selectedProgram) {
            toast.error('Please select a program first.');
            return;
        }

        if (!emailJob) return;

        setIsSendingEmail(true);
        axios
            .post(route('job-posts.send-email'), {
                job_id: emailJob.id,
                program_id: selectedProgram,
            })
            .then(() => {
                toast.success('Emails sent successfully');
                setShowEmailModal(false);
                setEmailJob(null);
            })
            .catch(() => {
                toast.error('No unemployed alumni found for the selected program.');
                setShowEmailModal(false);
                setEmailJob(null);
            })
            .finally(() => {
                setIsSendingEmail(false);
            });
    };

    const selectedDeadlineDate = (() => {
        if (!data.application_deadline) return null;
        const parsed = parseDateString(data.application_deadline);
        return parsed && isValid(parsed) ? parsed : null;
    })();

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm md:flex-row md:items-end md:justify-between">
                <div className="space-y-3">
                    <Badge variant="outline" className="px-3 py-1 text-[11px] tracking-[0.18em] uppercase">
                        Internal admin
                    </Badge>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Job Posts</h1>
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                            Keep job opportunities readable, choose the alumni program for alerts, and manage the full posting lifecycle from one
                            workspace.
                        </p>
                    </div>
                </div>

                <Button onClick={openAdd} className="sm:w-auto">
                    <PlusIcon className="h-4 w-4" />
                    Add Job Post
                </Button>
            </div>

            <Card>
                <CardHeader className="gap-2 pb-4">
                    <CardTitle>Filter Toolbar</CardTitle>
                    <CardDescription>Search updates live. Switch between all posts, open posts, and expired posts here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="job-search">Search jobs</Label>
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="job-search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search title, company, description, or location..."
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="w-full max-w-xs space-y-2">
                            <div className="space-y-2">
                                <Label>View</Label>
                                <Select
                                    value={filterState.view}
                                    onValueChange={(value) => setFilterState((current) => ({ ...current, view: value as typeof current.view }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a view" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filterViewOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground">The view filter applies immediately when you change it.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="gap-4 border-b pb-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-2">
                            <CardTitle>Job Posts Workspace</CardTitle>
                            <CardDescription>Review postings, choose who receives alerts, and handle bulk actions from one place.</CardDescription>
                        </div>

                        <div className="w-full max-w-sm space-y-2">
                            <Label className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Alert target</Label>
                            <Select
                                value={selectedProgram ? selectedProgram.toString() : ''}
                                onValueChange={(value) => setSelectedProgram(value ? Number(value) : '')}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a program" />
                                </SelectTrigger>
                                <SelectContent>
                                    {programs.map((program) => (
                                        <SelectItem key={program.id} value={program.id.toString()}>
                                            {program.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {selectedProgramName
                                    ? `Row-level send actions will target unemployed alumni in ${selectedProgramName}.`
                                    : 'Select a program to enable send actions from each row.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">
                            {jobs.from && jobs.to ? `Showing ${jobs.from}-${jobs.to} of ${jobs.total}` : `${jobs.total} total`}
                        </Badge>
                        {selectedJobs.length > 0 && <Badge variant="outline">{selectedJobs.length} selected</Badge>}
                        {selectedProgramName && <Badge variant="outline">Alerts: {selectedProgramName}</Badge>}
                        {selectedJobs.length > 0 && (
                            <Button variant="destructive" size="sm" onClick={() => setShowBulkDeleteModal(true)} className="ml-auto">
                                <Trash className="h-4 w-4" />
                                Delete Selected
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="pt-0">
                    <Table className="min-w-[760px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={allCurrentPageSelected}
                                        onCheckedChange={(checked) => toggleSelectAllCurrentPage(Boolean(checked))}
                                        aria-label="Select all jobs on current page"
                                    />
                                </TableHead>
                                <TableHead>Job</TableHead>
                                <TableHead>Deadline</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isApplyingFilters ? (
                                Array.from({ length: Math.min(jobs.per_page, 5) }).map((_, index) => (
                                    <TableRow key={index}>
                                        {Array.from({ length: 5 }).map((__, cellIndex) => (
                                            <TableCell key={cellIndex}>
                                                <Skeleton className="h-5 w-full" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : currentJobs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-36 text-center">
                                        <Empty>
                                            <EmptyHeader>
                                                <EmptyMedia variant="icon">
                                                    <BriefcaseBusiness />
                                                </EmptyMedia>
                                                <EmptyTitle>No job posts found</EmptyTitle>
                                                <EmptyDescription>Try a different search or clear the current filters.</EmptyDescription>
                                            </EmptyHeader>
                                        </Empty>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentJobs.map((job) => {
                                    const statusMeta = getJobStatusMeta(job);
                                    const canSend = isJobActive(job) && Boolean(selectedProgramName);
                                    const sendDisabledReason = !selectedProgramName
                                        ? 'Select an alert target first.'
                                        : !isJobActive(job)
                                          ? 'Only active job posts can be sent.'
                                          : null;

                                    return (
                                        <TableRow key={job.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedJobs.includes(job.id)}
                                                    onCheckedChange={(checked) => {
                                                        const isChecked = Boolean(checked);
                                                        setSelectedJobs((prev) =>
                                                            isChecked
                                                                ? prev.includes(job.id)
                                                                    ? prev
                                                                    : [...prev, job.id]
                                                                : prev.filter((id) => id !== job.id),
                                                        );
                                                    }}
                                                    aria-label={`Select ${job.title}`}
                                                />
                                            </TableCell>
                                            <TableCell className="min-w-[320px] py-4 whitespace-normal">
                                                <div className="space-y-2">
                                                    <div className="space-y-1">
                                                        <p className="font-medium text-foreground">{job.title}</p>
                                                        <p className="line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
                                                    </div>

                                                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <Building2 className="h-3.5 w-3.5" />
                                                            {job.company_name}
                                                        </span>

                                                        {job.location_link ? (
                                                            <a
                                                                href={job.location_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 text-primary hover:underline"
                                                            >
                                                                <MapPin className="h-3.5 w-3.5" />
                                                                {job.location ? job.location : 'Open map'}
                                                            </a>
                                                        ) : job.location ? (
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <MapPin className="h-3.5 w-3.5" />
                                                                {job.location}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 whitespace-normal">
                                                <div className="min-w-[150px] space-y-1">
                                                    <p className="font-medium text-foreground">{formatDate(job.application_deadline)}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {isJobExpired(job) ? 'Applications closed.' : 'Deadline still open.'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 whitespace-normal">
                                                <div className="min-w-[190px] space-y-2">
                                                    <Badge variant="outline" className={statusMeta.className}>
                                                        {statusMeta.label}
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground">{statusMeta.description}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant={canSend ? 'default' : 'outline'}
                                                        onClick={() => openEmailModal(job)}
                                                        disabled={!canSend}
                                                        title={sendDisabledReason ?? `Send alert to ${selectedProgramName}`}
                                                    >
                                                        <Send className="h-3.5 w-3.5" />
                                                        Send Alert
                                                    </Button>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" aria-label={`Open actions for ${job.title}`}>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onSelect={() => openView(job)}>
                                                                <Eye className="h-4 w-4" />
                                                                View details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => openEdit(job)}>
                                                                <FilePenLine className="h-4 w-4" />
                                                                Edit post
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                variant="destructive"
                                                                onSelect={() => {
                                                                    setDeleteId(job.id);
                                                                    setShowDeleteModal(true);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                Delete post
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>

                    <div className="mt-4">
                        <DataPagination
                            pagination={jobs}
                            itemLabel="jobs"
                            disabled={isApplyingFilters}
                            onPageChange={(nextPage) => visitJobs({ page: nextPage })}
                            onPerPageChange={(value) => setPerPage(String(value))}
                        />
                    </div>
                </CardContent>
            </Card>

            <JobPostEditorDialog
                open={open}
                editId={editId}
                processing={processing}
                data={data}
                errors={errors}
                setData={setData}
                handleSubmit={handleSubmit}
                onOpenChange={(nextOpen) => {
                    setOpen(nextOpen);
                    if (!nextOpen) {
                        resetEditorState();
                    }
                }}
                locationInputType={locationInputType}
                setLocationInputType={setLocationInputType}
                deadlinePickerOpen={deadlinePickerOpen}
                setDeadlinePickerOpen={setDeadlinePickerOpen}
                selectedDeadlineDate={selectedDeadlineDate}
            />

            <JobPostDetailsDialog open={viewOpen} onOpenChange={setViewOpen} job={viewJob} />

            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Job Post</DialogTitle>
                        <DialogDescription>This action cannot be undone. The selected job post will be removed immediately.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showBulkDeleteModal} onOpenChange={setShowBulkDeleteModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Selected Job Posts</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedJobs.length} selected job posts? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBulkDeleteModal(false)} disabled={isBulkDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleBulkDelete} disabled={isBulkDeleting}>
                            Delete {selectedJobs.length} Posts
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showEmailModal}
                onOpenChange={(nextOpen) => {
                    setShowEmailModal(nextOpen);
                    if (!nextOpen) {
                        setEmailJob(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Send Job Alert</DialogTitle>
                        <DialogDescription>Confirm the post and target program before sending unemployment alerts.</DialogDescription>
                    </DialogHeader>

                    <div className="rounded-xl border bg-muted/20 p-4">
                        <div className="space-y-4 text-sm">
                            <div className="space-y-1">
                                <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Job post</p>
                                <p>{emailJob?.title ?? 'No job selected'}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Target program</p>
                                <p>{selectedProgramName ?? 'Select a program in the workspace first.'}</p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEmailModal(false)} disabled={isSendingEmail}>
                            Cancel
                        </Button>
                        <Button onClick={sendEmail} disabled={isSendingEmail || !selectedProgram || !emailJob}>
                            Send Alert
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
