'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Label } from './ui/label';
import { FilePenLine, Trash, Trash2, Eye, Send, Filter, ChevronLeft, ChevronRight, PlusIcon, MapPin, LinkIcon, Loader2, BriefcaseBusiness } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InputError from '@/components/input-error';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"

// Types
interface Job {
    id: number;
    title: string;
    description: string;
    company_name: string;
    location?: string;
    location_link?: string;
    requirements?: string;
    responsibilities?: string;
    apply_link?: string;
    status: 'active' | 'inactive';
    posted_date: string;
    application_deadline: string;
}

interface Program {
    id: number;
    name: string;
}

type FilterStatus = 'all' | 'active' | 'inactive';

interface PageProps extends InertiaPageProps {
    jobs?: Job[];
    programs?: Program[];
    filters?: {
        start_date?: string;
        status?: string;
        show_expired?: boolean;
        show_active?: boolean;
        show_upcoming?: boolean;
    };
}

export default function JobPost() {
    const { jobs = [], programs = [], filters = {} } = usePage<PageProps>().props;

    const [open, setOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<number | ''>('');
    const [selectedJobs, setSelectedJobs] = useState<number[]>([]);
    const [viewJob, setViewJob] = useState<Job | null>(null);
    const [dateFilterOpen, setDateFilterOpen] = useState(false);
    const [dateFilter, setDateFilter] = useState({
        start_date: filters.start_date || '',
        status: (filters.status === 'active' || filters.status === 'inactive' ? filters.status : 'all') as FilterStatus,
        show_expired: filters.show_expired || false,
        show_active: filters.show_active || false,
        show_upcoming: filters.show_upcoming || false,
    });

    // Confirmation modals state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailJobId, setEmailJobId] = useState<number | null>(null);
    const [showAllEmployedModal, setShowAllEmployedModal] = useState(false);

    // Loading states
    const [isDeleting, setIsDeleting] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [isSendingToAllEmployed, setIsSendingToAllEmployed] = useState(false);
    const [isApplyingFilters, setIsApplyingFilters] = useState(false);

    // Location input state - simplified approach
    const [locationInputType, setLocationInputType] = useState<'text' | 'link'>('text');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Calculate pagination data
    const totalPages = Math.ceil(jobs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentJobs = jobs.slice(startIndex, endIndex);
    const allCurrentPageSelected = currentJobs.length > 0 && currentJobs.every((job) => selectedJobs.includes(job.id));

    // Pagination controls
    const goToPage = (page: number) => {
        setCurrentPage(page);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const toggleSelectJob = (id: number) => {
        setSelectedJobs((prev) =>
            prev.includes(id) ? prev.filter((jobId) => jobId !== id) : [...prev, id]
        );
    };

    const toggleSelectAllCurrentPage = () => {
        const currentPageIds = currentJobs.map((job) => job.id);

        if (allCurrentPageSelected) {
            setSelectedJobs((prev) => prev.filter((id) => !currentPageIds.includes(id)));
            return;
        }

        setSelectedJobs((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    };

    // Bulk delete
    const handleBulkDelete = async () => {
        if (selectedJobs.length === 0) {
            toast.error('No jobs selected');
            return;
        }

        setIsBulkDeleting(true);

        try {
            await Promise.all(
                selectedJobs.map((id) =>
                    axios.delete(route('job-posts.destroy', { job_post: id }))
                )
            );

            toast.success(`${selectedJobs.length} job(s) deleted successfully`);
            setSelectedJobs([]);
            setShowBulkDeleteModal(false);

            get(route('job-posts.index'), {
                preserveState: true,
                preserveScroll: true,
            });
        } catch {
            toast.error('Failed to delete some jobs');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        reset,
        get,
        errors,
        clearErrors,
    } = useForm({
        title: '',
        description: '',
        company_name: '',
        location: '',
        location_link: '',
        requirements: '',
        responsibilities: '',
        apply_link: '',
        status: 'active' as 'active' | 'inactive',
        posted_date: '',
        application_deadline: '',
    });

    // Clear the other location field when switching input types
    useEffect(() => {
        if (locationInputType === 'text') {
            setData('location_link', '');
        } else {
            setData('location', '');
        }
    }, [locationInputType, setData]);

    useEffect(() => {
        setSelectedJobs((prev) => prev.filter((id) => jobs.some((job) => job.id === id)));
    }, [jobs]);

    useEffect(() => {
        if (totalPages === 0 && currentPage !== 1) {
            setCurrentPage(1);
            return;
        }

        if (totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // Apply date filters
    const applyFilters = () => {
        const params: Record<string, string | boolean> = {};

        if (dateFilter.start_date) {
            params.start_date = dateFilter.start_date;
            params.end_date = dateFilter.start_date;
        }
        if (dateFilter.status !== 'all') params.status = dateFilter.status;
        if (dateFilter.show_expired) params.show_expired = true;
        if (dateFilter.show_active) params.show_active = true;
        if (dateFilter.show_upcoming) params.show_upcoming = true;

        setIsApplyingFilters(true);
        get(route('job-posts.index', params), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onFinish: () => {
                setIsApplyingFilters(false);
                setDateFilterOpen(false);
                setCurrentPage(1); // Reset to first page when filters change
            }
        });
    };

    // Clear all filters
    const clearFilters = () => {
        setDateFilter({
            start_date: '',
            status: 'all',
            show_expired: false,
            show_active: false,
            show_upcoming: false,
        });
        setIsApplyingFilters(true);
        get(route('job-posts.index'), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onFinish: () => {
                setIsApplyingFilters(false);
                setDateFilterOpen(false);
                setCurrentPage(1); // Reset to first page when filters are cleared
            }
        });
    };

    // Open add modal
    const openAdd = () => {
        reset();
        clearErrors();
        setData('posted_date', new Date().toISOString().slice(0, 10));
        setEditId(null);
        setLocationInputType('text');
        setOpen(true);
    };

    // Open edit modal
    const openEdit = (job: Job) => {
        clearErrors();
        setData({
            title: job.title,
            description: job.description,
            company_name: job.company_name,
            location: job.location || '',
            location_link: job.location_link || '',
            requirements: job.requirements || '',
            responsibilities: job.responsibilities || '',
            apply_link: job.apply_link || '',
            status: job.status || 'active',
            posted_date: job.posted_date || '',
            application_deadline: job.application_deadline || '',
        });

        // Set the appropriate input type based on existing data
        if (job.location_link) {
            setLocationInputType('link');
        } else {
            setLocationInputType('text');
        }

        setEditId(job.id);
        setOpen(true);
    };

    // Open view modal
    const openView = (job: Job) => {
        setViewJob(job);
        setViewOpen(true);
    };

    // Handle form submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editId) {
            put(route('job-posts.update', { job_post: editId }), {
                onSuccess: () => {
                    toast.success('Job post updated');
                    reset();
                    setOpen(false);
                },
            });
        } else {
            post(route('job-posts.store'), {
                onSuccess: () => {
                    toast.success('Job post created');
                    reset();
                    setOpen(false);
                },
            });
        }
    };

    // Handle delete
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
            }
        });
    };

    // Send email to unemployed alumni by selected program
    const sendEmail = () => {
        if (!selectedProgram) {
            toast.error('Please select a program first.');
            return;
        }

        if (!emailJobId) return;

        setIsSendingEmail(true);
        axios
            .post(route('job-posts.send-email'), {
                job_id: emailJobId,
                program_id: selectedProgram,
            })
            .then(() => {
                toast.success('Emails sent successfully');
                setShowEmailModal(false);
                setEmailJobId(null);
            })
            .catch(() => {
                toast.error('No unemployed alumni found for the selected program.');
                setShowEmailModal(false);
                setEmailJobId(null);
            })
            .finally(() => {
                setIsSendingEmail(false);
            });
    };

    // Send email to all employed alumni
    const sendEmailToAllEmployed = () => {
        setIsSendingToAllEmployed(true);
        axios
            .post(route('job-posts.send-email-to-all-employed'))
            .then(() => {
                toast.success('Emails sent to all employed alumni!');
                setShowAllEmployedModal(false);
            })
            .catch(() => {
                toast.error('Failed to send emails.');
                setShowAllEmployedModal(false);
            })
            .finally(() => {
                setIsSendingToAllEmployed(false);
            });
    };

    // Check if job is currently active based on date range and status
    const isJobActive = (job: Job) => {
        const now = new Date();
        const applicationDeadline = job.application_deadline ? parseDateString(job.application_deadline) : null;

        // If no deadline set, use status field
        if (!applicationDeadline) {
            return job.status === 'active';
        }

        // Check if current date is before deadline and status is active
        const isBeforeDeadline = now <= applicationDeadline;

        return isBeforeDeadline && job.status === 'active';
    };

    // Parse date string from backend
    const parseDateString = (dateString: string): Date | null => {
        if (!dateString) return null;

        try {
            if (dateString.includes('T')) {
                return parseISO(dateString);
            }

            if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return new Date(dateString + 'T00:00:00');
            }

            return new Date(dateString);
        } catch (e) {
            console.error('Error parsing date:', e, dateString);
            return null;
        }
    };

    // Format date for display
    const formatDate = (dateString: string): string => {
        if (!dateString) return 'Not set';

        const date = parseDateString(dateString);
        if (!date || !isValid(date)) return 'Invalid date';

        return format(date, 'MMM dd, yyyy');
    };

    // Check if a job is expired based on application deadline
    const isJobExpired = (job: Job) => {
        if (!job.application_deadline) return false;

        const deadline = parseDateString(job.application_deadline);
        if (!deadline || !isValid(deadline)) return false;

        return new Date() > deadline;
    };

    // Extract coordinates from Google Maps link
    const extractCoordinatesFromLink = (link: string) => {
        try {
            const url = new URL(link);
            if (url.hostname.includes('google.com') || url.hostname.includes('goo.gl')) {
                // Handle different Google Maps URL formats
                const match = url.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                if (match) {
                    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
                }

                // Try query parameters
                const queryCoords = url.searchParams.get('q');
                if (queryCoords) {
                    const coords = queryCoords.split(',');
                    if (coords.length === 2) {
                        return { lat: parseFloat(coords[0]), lng: parseFloat(coords[1]) };
                    }
                }
            }
        } catch (e) {
            console.error('Error parsing Google Maps link:', e);
        }
        return null;
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Job Post Management</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Create and manage job postings for alumni</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" size="sm" onClick={openAdd} className="sm:w-auto  text-primary hover:bg-primary/20">
                        <PlusIcon className="mr-2 h-4 w-4 " /> Add Job Post
                    </Button>

                    <Popover open={dateFilterOpen} onOpenChange={setDateFilterOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="sm:w-auto">
                                <Filter className="mr-2 h-4 w-4" />
                                Filter Jobs
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="space-y-4">
                                <h4 className="font-medium">Filter Jobs</h4>

                                <div className="space-y-2">
                                    <Label className="text-xs">Start Date</Label>
                                    <Input
                                        type="date"
                                        value={dateFilter.start_date}
                                        onChange={(e) => setDateFilter({ ...dateFilter, start_date: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">Uses one date only.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs">Status</Label>
                                    <Select
                                        value={dateFilter.status}
                                        onValueChange={(val) => setDateFilter({ ...dateFilter, status: val as FilterStatus })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs">Quick Filters</Label>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="show_active"
                                                checked={dateFilter.show_active}
                                                onChange={(e) => setDateFilter({ ...dateFilter, show_active: e.target.checked })}
                                                className="w-4 h-4"
                                            />
                                            <Label htmlFor="show_active" className="text-sm">Show Active Only</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="show_expired"
                                                checked={dateFilter.show_expired}
                                                onChange={(e) => setDateFilter({ ...dateFilter, show_expired: e.target.checked })}
                                                className="w-4 h-4"
                                            />
                                            <Label htmlFor="show_expired" className="text-sm">Show Expired</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="show_upcoming"
                                                checked={dateFilter.show_upcoming}
                                                onChange={(e) => setDateFilter({ ...dateFilter, show_upcoming: e.target.checked })}
                                                className="w-4 h-4"
                                            />
                                            <Label htmlFor="show_upcoming" className="text-sm">Show Upcoming</Label>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button onClick={applyFilters} size="sm" className="flex-1" disabled={isApplyingFilters}>
                                        {isApplyingFilters ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : null}
                                        Apply Filters
                                    </Button>
                                    <Button onClick={clearFilters} variant="outline" size="sm" disabled={isApplyingFilters}>
                                        Clear
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Dialog
                open={open}
                onOpenChange={(nextOpen) => {
                    setOpen(nextOpen);
                    if (!nextOpen) clearErrors();
                }}
            >
                <DialogContent className="sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader className="px-2 sm:px-0">
                        <DialogTitle className="text-lg sm:text-xl">
                            {editId ? 'Edit Job Post' : 'Add Job Post'}
                        </DialogTitle>
                        <DialogDescription className="text-sm sm:text-base">
                            {editId ? 'Update the job post details' : 'Create a new job post for alumni'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm sm:text-base">Job Title *</Label>
                                <Input
                                    placeholder="Job Title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    required
                                    className="w-full"
                                />
                                <InputError message={errors.title} />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm sm:text-base">Company Name *</Label>
                                <Input
                                    placeholder="Company Name"
                                    value={data.company_name}
                                    onChange={(e) => setData('company_name', e.target.value)}
                                    required
                                    className="w-full"
                                />
                                <InputError message={errors.company_name} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm sm:text-base">Job Description *</Label>
                            <Textarea
                                placeholder="Job Description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                required
                                rows={4}
                                className="w-full min-h-[120px]"
                            />
                            <InputError message={errors.description} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm sm:text-base">Application Deadline *</Label>
                                <Input
                                    type="date"
                                    value={data.application_deadline}
                                    onChange={(e) => setData('application_deadline', e.target.value)}
                                    className="w-full"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Deadline for applications.</p>
                                <InputError message={errors.application_deadline} />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm sm:text-base block font-medium">Status *</Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(val: 'active' | 'inactive') => setData('status', val)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.status} />
                            </div>
                        </div>

                        {/* Location Input */}
                        <div className="space-y-2">
                            <Label className="text-sm sm:text-base">Location</Label>
                            <Tabs
                                value={locationInputType}
                                onValueChange={(val) => setLocationInputType(val as 'text' | 'link')}
                                className="w-full"
                            >
                                <TabsList className="grid w-full grid-cols-2 mb-2 h-10">
                                    <TabsTrigger value="text" className="text-xs sm:text-sm py-1">
                                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                        Type Location
                                    </TabsTrigger>
                                    <TabsTrigger value="link" className="text-xs sm:text-sm py-1">
                                        <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                        Google Maps Link
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="text" className="space-y-1">
                                    <Input
                                        placeholder="Enter location manually (e.g., pamsu, sta. catalina, lubao, pamp.. )"
                                        value={data.location}
                                        onChange={(e) => setData('location', e.target.value)}
                                        className="w-full"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Enter the physical location of the job
                                    </p>
                                    <InputError message={errors.location} />
                                </TabsContent>

                                <TabsContent value="link" className="space-y-1">
                                    <Input
                                        type="url"
                                        placeholder="Paste Google Maps link (e.g., https://goo.gl/maps/...)"
                                        value={data.location_link}
                                        onChange={(e) => setData('location_link', e.target.value)}
                                        className="w-full"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Use a full URL (for example, https://maps.google.com/...).
                                    </p>
                                    <InputError message={errors.location_link} />
                                </TabsContent>
                            </Tabs>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm sm:text-base">Requirements</Label>
                                <Textarea
                                    placeholder="Requirements"
                                    value={data.requirements}
                                    onChange={(e) => setData('requirements', e.target.value)}
                                    rows={3}
                                    className="w-full min-h-[100px]"
                                />
                                <InputError message={errors.requirements} />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm sm:text-base">Responsibilities</Label>
                                <Textarea
                                    placeholder="Responsibilities"
                                    value={data.responsibilities}
                                    onChange={(e) => setData('responsibilities', e.target.value)}
                                    rows={3}
                                    className="w-full min-h-[100px]"
                                />
                                <InputError message={errors.responsibilities} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm sm:text-base">Apply Link <span className='text-sm text-muted-foreground'>(Optional if company doesn't have link )</span></Label>
                            <Input
                                type="url"
                                placeholder="Apply Link"
                                value={data.apply_link}
                                onChange={(e) => setData('apply_link', e.target.value)}
                                className="w-full"
                            />
                            <p className="text-xs text-muted-foreground">Use a full URL (for example, https://company.com/jobs).</p>
                            <InputError message={errors.apply_link} />
                        </div>

                        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-6 px-2 sm:px-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="w-full sm:w-auto order-2 sm:order-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full sm:w-auto order-1 sm:order-2 mb-2 sm:mb-0 sm:ml-2"
                            >
                                {processing ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                {editId ? 'Update' : 'Create'} Job Post
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Job Details Modal */}
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Job Post Details</DialogTitle>
                        <DialogDescription>
                            Complete information about the job posting
                        </DialogDescription>
                    </DialogHeader>

                    {viewJob && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="font-semibold">Job Title</Label>
                                    <p>{viewJob.title}</p>
                                </div>

                                <div>
                                    <Label className="font-semibold">Company</Label>
                                    <p>{viewJob.company_name}</p>
                                </div>
                            </div>

                            <div>
                                <Label className="font-semibold">Description</Label>
                                <p className="whitespace-pre-line break-all">{viewJob.description}</p>
                            </div>

                            {(viewJob.location || viewJob.location_link) && (
                                <div>
                                    <Label className="font-semibold">Location</Label>
                                    {viewJob.location_link ? (
                                        <div className="mt-1">
                                            <a
                                                href={viewJob.location_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline inline-flex items-center"
                                            >
                                                <MapPin className="h-4 w-4 mr-1" />
                                                View on Google Maps
                                            </a>
                                            {viewJob.location && (
                                                <p className="text-sm text-muted-foreground mt-1">{viewJob.location}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p>{viewJob.location}</p>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {viewJob.requirements && (
                                    <div>
                                        <Label className="font-semibold">Requirements</Label>
                                        <p className="whitespace-pre-line">{viewJob.requirements}</p>
                                    </div>
                                )}

                                {viewJob.responsibilities && (
                                    <div>
                                        <Label className="font-semibold">Responsibilities</Label>
                                        <p className="whitespace-pre-line">{viewJob.responsibilities}</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="font-semibold">Application Deadline</Label>
                                    <p>{formatDate(viewJob.application_deadline)}</p>
                                    {isJobExpired(viewJob) && (
                                        <span className="text-xs text-red-500">(Expired)</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label className="font-semibold">Status</Label>
                                <div className="mt-1">
                                    <Badge variant={isJobActive(viewJob) ? "default" : "secondary"} className={
                                        isJobActive(viewJob)
                                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                                            : "bg-red-100 text-red-800 hover:bg-red-100"
                                    }>
                                        {isJobActive(viewJob) ? 'ACTIVE' : 'INACTIVE'}
                                        {isJobExpired(viewJob) && ' (EXPIRED)'}
                                    </Badge>
                                </div>
                            </div>

                            {viewJob.apply_link && (
                                <div>
                                    <Label className="font-semibold">Apply Link</Label>
                                    <a
                                        href={viewJob.apply_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline block mt-1 break-all"
                                    >
                                        {viewJob.apply_link}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button onClick={() => setViewOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation Modals */}
            {/* Delete Confirmation Modal */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this job post? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Delete Confirmation Modal */}
            <Dialog open={showBulkDeleteModal} onOpenChange={setShowBulkDeleteModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedJobs.length} selected job posts? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBulkDeleteModal(false)} disabled={isBulkDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleBulkDelete} disabled={isBulkDeleting}>
                            {isBulkDeleting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Delete {selectedJobs.length} Jobs
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Email Confirmation Modal */}
            <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Send Job to Unemployed Alumni</DialogTitle>
                        <DialogDescription>
                            Send this job posting to unemployed alumni in the selected program?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEmailModal(false)} disabled={isSendingEmail}>
                            Cancel
                        </Button>
                        <Button onClick={sendEmail} disabled={isSendingEmail || !selectedProgram}>
                            {isSendingEmail ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Send Email
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* All Employed Email Confirmation Modal */}
            <Dialog open={showAllEmployedModal} onOpenChange={setShowAllEmployedModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Send to All Employed Alumni</DialogTitle>
                        <DialogDescription>
                            Send email to ALL employed alumni? This will notify them about available job postings.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAllEmployedModal(false)} disabled={isSendingToAllEmployed}>
                            Cancel
                        </Button>
                        <Button onClick={sendEmailToAllEmployed} disabled={isSendingToAllEmployed}>
                            {isSendingToAllEmployed ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Send to All Unemployed
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Program Selector Card */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Email Settings</CardTitle>
                    <CardDescription>
                        Choose which program should receive unemployed job alerts
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                        <div className="flex-1">
                            <Label className="mb-1 block font-medium">Program Target</Label>
                            <Select
                                value={selectedProgram ? selectedProgram.toString() : ''}
                                onValueChange={(val) => setSelectedProgram(val ? Number(val) : '')}
                            >
                                <SelectTrigger className="w-full lg:max-w-sm">
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
                            <p className="mt-1 text-xs text-muted-foreground">
                                Row-level Send uses this selected program.
                            </p>
                        </div>

                        <Button variant="outline" onClick={() => setShowAllEmployedModal(true)} className="sm:w-auto">
                            <Send className="mr-2 h-4 w-4" />
                            Send to All Employed
                        </Button>

                        {selectedJobs.length > 0 && (
                            <Button variant="destructive" onClick={() => setShowBulkDeleteModal(true)} className="sm:w-auto">
                                <Trash className="mr-2 h-4 w-4" />
                                Delete Selected ({selectedJobs.length})
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Job Posts Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Job Posts</CardTitle>
                    <CardDescription>
                        {jobs.length} job postings found. {selectedJobs.length > 0 && `${selectedJobs.length} selected.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4"
                                        checked={allCurrentPageSelected}
                                        onChange={toggleSelectAllCurrentPage}
                                        aria-label="Select all jobs on current page"
                                    />
                                </TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Deadline</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentJobs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">
                                        <Empty>
                                            <EmptyHeader>
                                                <EmptyMedia variant="icon">
                                                    <BriefcaseBusiness />
                                                </EmptyMedia>
                                                <EmptyTitle>No Jobs</EmptyTitle>
                                                <EmptyDescription>No data found</EmptyDescription>
                                            </EmptyHeader>
                                        </Empty>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentJobs.map((job) => {
                                    const isActive = isJobActive(job);
                                    const isExpired = isJobExpired(job);

                                    return (
                                        <TableRow key={job.id} className={!isActive ? 'opacity-70 bg-muted/30' : ''}>
                                            <TableCell>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedJobs.includes(job.id)}
                                                    onChange={() => toggleSelectJob(job.id)}
                                                    className="h-4 w-4"
                                                    aria-label={`Select ${job.title}`}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{job.title}</TableCell>
                                            <TableCell>{job.company_name}</TableCell>
                                            <TableCell>
                                                {job.location_link ? (
                                                    <a
                                                        href={job.location_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline inline-flex items-center text-sm"
                                                    >
                                                        <MapPin className="h-3 w-3 mr-1" />
                                                        Map Link
                                                    </a>
                                                ) : (
                                                    <span className="text-sm">{job.location || 'Not specified'}</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{formatDate(job.application_deadline)}</span>

                                                    {isExpired && (
                                                        <span className="text-xs text-red-500">Expired</span>
                                                    )}
                                                    {!isExpired && (
                                                        <span className="text-xs text-emerald-600">Open for applications</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={isActive ? "default" : "secondary"} className={
                                                    isActive
                                                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                        : "bg-red-100 text-red-800 hover:bg-red-100"
                                                }>
                                                    {isActive ? 'ACTIVE' : 'INACTIVE'}
                                                    {isExpired && ' (EXPIRED)'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => openView(job)} title="View details">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(job)} title="Edit">
                                                        <FilePenLine className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => {
                                                        setDeleteId(job.id);
                                                        setShowDeleteModal(true);
                                                    }} title="Delete">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setEmailJobId(job.id);
                                                            setShowEmailModal(true);
                                                        }}
                                                        disabled={!isActive || !selectedProgram}
                                                        title={!selectedProgram ? "Select a program first" : "Send to unemployed alumni"}
                                                        className="gap-1"
                                                    >
                                                        <Send className="h-3 w-3" />
                                                        Send to Unemployed
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                                Showing {startIndex + 1} to {Math.min(endIndex, jobs.length)} of {jobs.length} jobs
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={goToPrevPage}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                {/* Page numbers */}
                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => goToPage(page)}
                                            className="h-8 w-8 p-0"
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
