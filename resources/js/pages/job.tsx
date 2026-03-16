'use client';

import JobPost from '@/components/JobPost';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Job Posts',
        href: '/jobpost',
    },
];

export default function JobPostPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Job Posts" />
            <JobPost />
        </AppLayout>
    );
}
