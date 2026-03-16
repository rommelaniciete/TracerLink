import { PageProps as InertiaPageProps } from '@inertiajs/core';

import { PaginatedResponse } from '@/types/pagination';

export type ProgramOption = {
    id: number;
    name: string;
};

export type EmployabilityRow = {
    id: number;
    program_id: number | null;
    last_name: string;
    given_name: string;
    middle_initial?: string | null;
    sex?: string | null;
    employment_status: string;
    company_name?: string | null;
    work_position?: string | null;
    program?: ProgramOption | null;
};

export type EmployabilityPageProps = InertiaPageProps & {
    alumni: PaginatedResponse<EmployabilityRow>;
    programs: ProgramOption[];
    filters: {
        search: string;
        program_id: string;
        per_page: number;
    };
};

export type StudentRecord = {
    id: number;
    student_number: string;
    student_name: string;
    email?: string | null;
    year: number;
};

export type StudentPageProps = InertiaPageProps & {
    students: PaginatedResponse<StudentRecord>;
    years: number[];
    filters: {
        search: string;
        year: string;
        per_page: number;
        sort: string;
        direction: 'asc' | 'desc';
    };
};

export type AlumniRecord = {
    id: number;
    student_number: string;
    email: string;
    program_id: number | null;
    program?: ProgramOption | null;
    last_name: string;
    given_name: string;
    middle_initial?: string | null;
    present_address: string;
    contact_number: string;
    graduation_year: number;
    sex?: string | null;
    employment_status: string;
    company_name?: string | null;
    work_position?: string | null;
    further_studies?: string | null;
    sector?: string | null;
    work_location?: string | null;
    employer_classification?: string | null;
    related_to_course?: string | null;
    instruction_rating?: number | null;
    consent: boolean;
};

export type AlumniFilters = {
    search: string;
    graduation_year: string;
    program_id: string;
    employment_status: string;
    work_location: string;
    sex: string;
    per_page: number;
};

export type JobRecord = {
    id: number;
    title: string;
    description: string;
    company_name: string;
    location?: string | null;
    location_link?: string | null;
    requirements?: string | null;
    responsibilities?: string | null;
    apply_link?: string | null;
    status: 'active' | 'inactive';
    posted_date: string | null;
    application_deadline: string | null;
    start_date?: string | null;
};

export type JobPageProps = InertiaPageProps & {
    jobs: PaginatedResponse<JobRecord>;
    programs: ProgramOption[];
    filters: {
        search: string;
        per_page: number;
        start_date: string;
        end_date: string;
        status: string;
        show_expired: boolean;
        show_active: boolean;
        show_upcoming: boolean;
    };
};
