import { AlumniTable } from '@/components/data-table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Alumni List',
        href: '/list',
    },
];

export default function AlumniList() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Alumni List" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-hidden rounded-xl p-6">
                <AlumniTable />
            </div>
        </AppLayout>
    );
}
