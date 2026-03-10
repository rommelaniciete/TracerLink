import { Head } from '@inertiajs/react';
import { AlumniBarChart } from '@/components/alumni-bar-chart';
import { SectionCards } from '@/components/card';
import AlumniRatingBarChart from '@/components/dashboard/AlumniRatingBarChart';
import GenderChart from '@/components/GenderChart';
import { GraduatesLineChart } from '@/components/OverviewGrar';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

type Program = {
  id: number;
  name: string;
  alumni_count: number;
};

type AlumniPerYear = {
  year: string;
  employed: number;
  unemployed: number;
  notTracked: number;
  total: number;
};

type RatingCount = {
  star: number;
  total: number;
};

type DashboardProps = {
  programs: Program[];
  alumniPerYear: AlumniPerYear[];
  ratingCounts: RatingCount[];
};

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
];

export default function dashboard({ programs, alumniPerYear, ratingCounts }: DashboardProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />

      <div className="px-5">
        <SectionCards programs={programs} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-7 mb-5">
            <GraduatesLineChart />
            <AlumniRatingBarChart ratingCounts={ratingCounts} />
          </div>

          <div className="space-y-1 mb-5">
            <GenderChart />
            <AlumniBarChart alumniPerYear={alumniPerYear} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}