import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/lib/toast';
import { useForm } from '@inertiajs/react';
import * as React from 'react';

interface AlumniUpdateFormProps {
    student_number: string;
    email?: string;
    program?: string;
    last_name?: string;
    given_name?: string;
    middle_initial?: string;
    gender?: string;
    present_address?: string;
    contact_number?: string;
    graduation_year?: string;
    employment_status?: string;
    company_name?: string;
    work_position?: string; // ✅ Added
    further_studies?: string;
    sector?: string;
    work_location?: string;
    employer_classification?: string;
    related_to_course?: string;
    consent?: boolean;
    onSuccess?: (updated: any) => void;
}

export default function AlumniUpdateForm({
    student_number,
    email = '',
    program = '',
    last_name = '',
    given_name = '',
    middle_initial = '',
    gender = '',
    present_address = '',
    contact_number = '',
    graduation_year = '',
    employment_status = '',
    company_name = '',
    work_position = '', // ✅ Default
    further_studies = '',
    sector = '',
    work_location = '',
    employer_classification = '',
    related_to_course = '',
    consent = false,
    onSuccess,
}: AlumniUpdateFormProps) {
    const { data, setData, put, processing, reset } = useForm({
        student_number,
        email,
        program,
        last_name,
        given_name,
        middle_initial,
        gender,
        present_address,
        contact_number,
        graduation_year,
        employment_status,
        company_name,
        work_position, // ✅ Included in form state
        further_studies,
        sector,
        work_location,
        employer_classification,
        related_to_course,
        consent,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        put(`/alumni-update-form/${student_number}`, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                toast.success('✅ Record updated!');
                onSuccess?.(data);
                reset();
            },
            onError: (errors: Record<string, string>) => {
                const messages = Object.values(errors).filter(Boolean);
                toast.error(messages.length ? messages.join(', ') : '❌ Update failed.');
            },
        });
    };

    const graduationYears = Array.from({ length: new Date().getFullYear() - 2022 + 1 }, (_, i) => (new Date().getFullYear() - i).toString());

    return (
        <form onSubmit={handleSubmit} className="mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
            <h2 className="col-span-2 text-2xl font-semibold tracking-tight text-foreground">Update AluRecwrynrthbtord</h2>

            <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Student Number</label>
                <Input value={student_number} readOnly />
            </div>

            <Input placeholder="Email" value={data.email} onChange={(e) => setData('email', e.target.value)} />

            <Select value={data.program} onValueChange={(value) => setData('program', value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Program taken" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="BSIT">BS Information Technology</SelectItem>
                    <SelectItem value="BSBA">BS Business Administration</SelectItem>
                    <SelectItem value="BSE">BS Entrepreneurship</SelectItem>
                    <SelectItem value="BEED">Bachelor of Elementary Education</SelectItem>
                    <SelectItem value="BSTM">BS Tourism Management</SelectItem>
                    <SelectItem value="PSYC">BS Psychology</SelectItem>
                    <SelectItem value="BSCE">BS Civil Engineering</SelectItem>
                </SelectContent>
            </Select>

            <Input placeholder="Last Name" value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} />
            <Input placeholder="Given Name" value={data.given_name} onChange={(e) => setData('given_name', e.target.value)} />
            <Input placeholder="Middle Initial" value={data.middle_initial} onChange={(e) => setData('middle_initial', e.target.value)} />

            {/* ✅ Gender Select */}
            <Select value={data.gender} onValueChange={(value) => setData('gender', value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
            </Select>

            <Input placeholder="Present Address" value={data.present_address} onChange={(e) => setData('present_address', e.target.value)} />
            <Input placeholder="Contact Number" value={data.contact_number} onChange={(e) => setData('contact_number', e.target.value)} />

            <Select value={data.graduation_year} onValueChange={(value) => setData('graduation_year', value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Graduation Year" />
                </SelectTrigger>
                <SelectContent>
                    {graduationYears.map((year) => (
                        <SelectItem key={year} value={year}>
                            {year}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={data.employment_status}
                onValueChange={(value) => {
                    setData('employment_status', value);
                    if (value !== 'employed') {
                        setData('company_name', '');
                        setData('work_position', ''); // ✅ Clear if not employed
                    }
                }}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Employment Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="under-employed">Under Employed</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                    <SelectItem value="currently-looking">Currently Looking / Applying</SelectItem>
                </SelectContent>
            </Select>

            {data.employment_status === 'employed' && (
                <>
                    <Input placeholder="Company Name" value={data.company_name} onChange={(e) => setData('company_name', e.target.value)} />
                    <Input
                        placeholder="Position / Nature of Work" // ✅ Work Position Field
                        value={data.work_position}
                        onChange={(e) => setData('work_position', e.target.value)}
                    />
                </>
            )}

            <Select value={data.related_to_course} onValueChange={(value) => setData('related_to_course', value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Is job related to your course?" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="unsure">Not Sure</SelectItem>
                </SelectContent>
            </Select>

            <Select value={data.further_studies} onValueChange={(value) => setData('further_studies', value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Further Studies (optional)" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="ma">MA</SelectItem>
                    <SelectItem value="mba">MBA</SelectItem>
                    <SelectItem value="mit">MIT</SelectItem>
                    <SelectItem value="mce">MCE</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                </SelectContent>
            </Select>

            <Select value={data.sector} onValueChange={(value) => setData('sector', value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Which Sector Do You Work (optional)" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="self-employed">Self Employed</SelectItem>
                </SelectContent>
            </Select>

            <Select value={data.work_location} onValueChange={(value) => setData('work_location', value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Where is Your Work Location" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="abroad">Abroad</SelectItem>
                </SelectContent>
            </Select>

            <Select value={data.employer_classification} onValueChange={(value) => setData('employer_classification', value)}>
                <SelectTrigger>
                    <SelectValue placeholder="What's Your Employer's Classification" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="local">Local Company in the Philippines</SelectItem>
                    <SelectItem value="foreign-ph">Foreign Company in the Philippines</SelectItem>
                    <SelectItem value="foreign-abroad">Foreign Company Abroad</SelectItem>
                    <SelectItem value="self-employed">I Am Self Employed</SelectItem>
                </SelectContent>
            </Select>

            <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" checked={data.consent} onChange={(e) => setData('consent', e.target.checked)} required />
                <label className="text-sm">I consent to the processing of my data.</label>
            </div>

            <Button type="submit" disabled={processing} className="col-span-2">
                Update
            </Button>
        </form>
    );
}
