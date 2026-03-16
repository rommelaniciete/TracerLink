import { JobPageProps, JobRecord } from '@/types/records';
import { format, isValid, parseISO } from 'date-fns';

export type FilterStatus = 'all' | 'active' | 'inactive';
export type FilterView = 'all' | 'open' | 'expired';

export type JobStatusMeta = {
    label: string;
    description: string;
    className: string;
};

export type JobPostFormData = {
    title: string;
    description: string;
    company_name: string;
    location: string;
    location_link: string;
    requirements: string;
    responsibilities: string;
    apply_link: string;
    status: 'active' | 'inactive';
    posted_date: string;
    application_deadline: string;
};

export const filterViewOptions: Array<{ value: FilterView; label: string }> = [
    { value: 'all', label: 'All posts' },
    { value: 'open', label: 'Open now' },
    { value: 'expired', label: 'Expired' },
];

export function getFilterViewFromFilters(filters: JobPageProps['filters']): FilterView {
    if (filters.show_active || filters.status === 'active') {
        return 'open';
    }

    if (filters.show_expired) {
        return 'expired';
    }

    return 'all';
}

export function getQueryFiltersFromView(view: FilterView) {
    switch (view) {
        case 'open':
            return { status: 'all' as FilterStatus, show_expired: false, show_active: true, show_upcoming: false };
        case 'expired':
            return { status: 'all' as FilterStatus, show_expired: true, show_active: false, show_upcoming: false };
        case 'all':
        default:
            return { status: 'all' as FilterStatus, show_expired: false, show_active: false, show_upcoming: false };
    }
}

export function parseDateString(dateString?: string | null): Date | null {
    if (!dateString) return null;

    try {
        if (dateString.includes('T')) {
            return parseISO(dateString);
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return new Date(`${dateString}T00:00:00`);
        }

        return new Date(dateString);
    } catch {
        return null;
    }
}

export function formatDate(dateString?: string | null): string {
    if (!dateString) return 'Not set';

    const date = parseDateString(dateString);
    if (!date || !isValid(date)) return 'Invalid date';

    return format(date, 'MMM dd, yyyy');
}

export function isJobExpired(job: JobRecord): boolean {
    if (!job.application_deadline) return false;

    const deadline = parseDateString(job.application_deadline);
    if (!deadline || !isValid(deadline)) return false;

    return new Date() > deadline;
}

export function isJobUpcoming(job: JobRecord): boolean {
    if (!job.start_date) return false;

    const startDate = parseDateString(job.start_date);
    if (!startDate || !isValid(startDate)) return false;

    return startDate > new Date();
}

export function isJobActive(job: JobRecord): boolean {
    const applicationDeadline = job.application_deadline ? parseDateString(job.application_deadline) : null;

    if (!applicationDeadline) {
        return job.status === 'active';
    }

    return new Date() <= applicationDeadline && job.status === 'active';
}

export function getJobStatusMeta(job: JobRecord): JobStatusMeta {
    if (job.status === 'inactive') {
        return {
            label: 'Inactive',
            description: 'Hidden from active outreach.',
            className: 'border-slate-200 bg-slate-100 text-slate-700',
        };
    }

    if (isJobExpired(job)) {
        return {
            label: 'Expired',
            description: 'Application deadline has passed.',
            className: 'border-rose-200 bg-rose-50 text-rose-700',
        };
    }

    if (isJobUpcoming(job)) {
        return {
            label: 'Upcoming',
            description: job.start_date ? `Starts ${formatDate(job.start_date)}.` : 'Scheduled for a future start.',
            className: 'border-sky-200 bg-sky-50 text-sky-700',
        };
    }

    return {
        label: 'Active',
        description: 'Open for applications and alerts.',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
}
