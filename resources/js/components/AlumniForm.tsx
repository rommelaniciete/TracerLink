'use client';

// Alumni Form Component

import { StarRating } from '@/components/StarRating';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/lib/toast';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

interface AlumniFormProps {
    mode?: 'create' | 'edit';
    id?: number;
    student_number?: string;
    email?: string;
    program_id?: string | number | null;
    last_name?: string;
    given_name?: string;
    middle_initial?: string;
    present_address?: string;
    contact_number?: string;
    graduation_year?: string;
    employment_status?: string;
    company_name?: string;
    work_position?: string;
    further_studies?: string;
    sector?: string;
    work_location?: string;
    employer_classification?: string;
    related_to_course?: string;
    consent?: boolean;
    onSuccess?: (updated: any) => void;
    onClose?: () => void;
    sex?: string;
    instruction_rating?: number;
}

// Memoized FieldWrapper to prevent unnecessary re-renders
const FieldWrapper = memo(
    ({ children, label, required = false, error }: { children: React.ReactNode; label: string; required?: boolean; error?: string }) => (
        <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1 text-sm font-medium">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {error && (
                <div className="mt-1 flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    ),
);

FieldWrapper.displayName = 'FieldWrapper';

export const AlumniForm = memo(function AlumniForm({
    mode = 'create',
    id,
    student_number = '',
    email = '',
    program_id = null,
    last_name = '',
    given_name = '',
    middle_initial = '',
    present_address = '',
    contact_number = '',
    graduation_year = '',
    employment_status = '',
    company_name = '',
    work_position = '',
    further_studies = '',
    sector = '',
    work_location = '',
    employer_classification = '',
    related_to_course = '',
    consent = false,
    onSuccess,
    onClose,
    sex = '',
    instruction_rating = 0,
}: AlumniFormProps) {
    const isEditing = mode === 'edit';
    const [programs, setPrograms] = useState<{ id: number; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [submissionComplete, setSubmissionComplete] = useState(false);

    useEffect(() => {
        axios
            .get('/api/programs')
            .then((res) => setPrograms(res.data))
            .catch(() => toast.error('Failed to load programs'))
            .finally(() => setIsLoading(false));
    }, []);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        id: id || undefined,
        student_number: isEditing ? student_number || '' : '',

        email: isEditing ? email || '' : '',
        program_id: program_id ? String(program_id) : '',
        last_name: last_name || '',
        given_name: given_name || '',
        middle_initial: middle_initial || '',
        present_address: present_address || '',
        contact_number: contact_number || '',
        graduation_year: graduation_year || '',
        employment_status: employment_status || '',
        company_name: company_name || '',
        work_position: work_position || '',
        further_studies: further_studies || '',
        sector: sector || '',
        work_location: work_location || '',
        employer_classification: employer_classification || '',
        related_to_course: related_to_course || '',
        consent: consent || false,
        instruction_rating: instruction_rating || 0,
        sex: sex || '',
    });

    // Memoized handlers to prevent recreation on every render
    const handleInputChange = useCallback(
        (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
            setData(field as any, e.target.value);
        },
        [setData],
    );

    const handleSelectChange = useCallback(
        (field: string) => (value: string) => {
            setData(field as any, value);
        },
        [setData],
    );

    const handleEmploymentStatusChange = useCallback(
        (val: string) => {
            setData('employment_status', val);
            if (val !== 'Employed') {
                // ✅ Use exact match with your SelectItem value
                // Clear employment-related fields
                setData('company_name', '');
                setData('work_position', '');
                setData('sector', '');
                setData('work_location', '');
                setData('employer_classification', '');
                setData('related_to_course', '');
            }
        },
        [setData],
    );
    const handleConsentChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setData('consent', e.target.checked);
        },
        [setData],
    );

    const handleRatingChange = useCallback(
        (val: number) => {
            setData('instruction_rating', val);
        },
        [setData],
    );

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();

            // Validate required fields
            const requiredFields = [
                'student_number',
                'email',
                'program_id',
                'last_name',
                'given_name',
                'present_address',
                'contact_number',
                'graduation_year',
                'employment_status',
                'sex',
            ];

            const missingFields = requiredFields.filter((field) => !data[field as keyof typeof data]);

            if (missingFields.length > 0) {
                toast.error(`Please fill in all required fields`);
                return;
            }

            if (!data.consent) {
                toast.error('You must consent to the processing of your data');
                return;
            }

            try {
                const isEmployed = data.employment_status === 'employed';

                // Clear fields if not employed
                if (!isEmployed) {
                    setData('company_name', '');
                    setData('work_position', '');
                    setData('sector', '');
                    setData('work_location', '');
                    setData('employer_classification', '');
                    setData('related_to_course', '');
                }

                const endpoint = isEditing ? `/alumni-update-form/${data.student_number}` : `/alumni-form/${data.student_number}/submit`;

                if (isEditing) {
                    put(endpoint, {
                        preserveScroll: true,
                        preserveState: true,
                        onSuccess: () => {
                            toast.success('✅ Record updated!');
                            setSubmissionComplete(true);
                            setTimeout(() => {
                                onSuccess?.(true);
                                onClose?.();
                                reset();
                            }, 2000);
                        },
                        onError: (errors: Record<string, string>) => {
                            const messages = Object.values(errors).filter(Boolean);
                            toast.error(messages.length ? messages.join(', ') : '❌ Submission failed.');
                        },
                    });
                } else {
                    post(endpoint, {
                        preserveScroll: true,
                        preserveState: true,
                        onSuccess: () => {
                            toast.success('🎉submitted successfully!');
                            setSubmissionComplete(true);
                            setTimeout(() => {
                                onSuccess?.(true);
                                onClose?.();
                                reset();
                            }, 2000);
                        },
                        onError: (errors: Record<string, string>) => {
                            const messages = Object.values(errors).filter(Boolean);
                            toast.error(messages.length ? messages.join(', ') : '❌ Submission failed.');
                        },
                    });
                }
            } catch (error) {
                toast.error('⚠️ Something went wrong while checking active email.');
            }
        },
        [data, isEditing, setData, put, post, onSuccess, onClose, reset],
    );

    // Memoize year options to prevent recreation
    const yearOptions = useMemo(
        () => Array.from({ length: new Date().getFullYear() - 2022 + 1 }, (_, i) => (new Date().getFullYear() - i).toString()),
        [],
    );

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading form...</span>
            </div>
        );
    }

    if (submissionComplete) {
        return (
            <div className="mx-auto max-w-2xl p-4">
                <Card className="border-0 shadow-lg">
                    <CardHeader className="rounded-t-lg bg-gradient-to-r from-green-500/10 to-green-500/5">
                        <div className="flex flex-col items-center justify-center py-6">
                            <CheckCircle className="h-16 w-16 text-green-500" />
                            <CardTitle className="mt-4 text-center text-3xl font-bold text-green-600">Thank You!</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 text-center">
                        <p className="text-lg text-muted-foreground">
                            Your {isEditing ? 'information has been updated' : 'form has been submitted successfully'}.
                        </p>
                        <p className="mt-2 text-muted-foreground">We appreciate your time and contribution.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl p-4">
            <div className="m-0 place-items-center justify-center"></div>
            <Card className="mx-w-5x7 border-0 shadow-lg">
                <CardHeader className="rounded-t-lg bg-gradient-to-r from-primary/10 to-primary/5">
                    <div className="flex items-start justify-between">
                        <div></div> {/* Empty div for spacing */}
                    </div>
                    <CardTitle className="text-center text-3xl font-bold text-primary">
                        {isEditing ? 'Update Alumni Record' : 'Pampanga State U - LC Tracerlink'}
                    </CardTitle>
                    <div className="space-y-1 text-start text-muted-foreground">
                        <p className="font-medium">{isEditing ? 'Update your information' : 'Please complete all required fields (*)'}</p>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Section: Basic Info */}
                        <div className="space-y-4">
                            <h3 className="border-b pb-2 text-xl font-semibold text-foreground">Basic Information</h3>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <FieldWrapper label="Student Number" required error={errors.student_number}>
                                    <Input
                                        className={`h-11 ${errors.student_number ? 'border-red-500' : ''}`}
                                        value={data.student_number}
                                        onChange={handleInputChange('student_number')}
                                        disabled={processing || isEditing} // ✅ disable kapag edit mode
                                        placeholder="e.g., 1234567890"
                                    />
                                </FieldWrapper>

                                <FieldWrapper label="Email" required error={errors.email}>
                                    <Input
                                        className={`h-11 ${errors.email ? 'border-red-500' : ''}`}
                                        value={data.email}
                                        onChange={handleInputChange('email')}
                                        disabled={processing} // Disable when editing
                                        placeholder="your.email@example.com"
                                        type="email"
                                    />
                                </FieldWrapper>

                                <FieldWrapper label="Last Name" required error={errors.last_name}>
                                    <Input
                                        className={`h-11 ${errors.last_name ? 'border-red-500' : ''}`}
                                        value={data.last_name || ''}
                                        onChange={handleInputChange('last_name')}
                                        disabled={processing}
                                        placeholder="Last Name"
                                    />
                                </FieldWrapper>

                                <FieldWrapper label="Given Name" required error={errors.given_name}>
                                    <Input
                                        className={`h-11 ${errors.given_name ? 'border-red-500' : ''}`}
                                        value={data.given_name || ''}
                                        onChange={handleInputChange('given_name')}
                                        disabled={processing}
                                        placeholder="Given Name"
                                    />
                                </FieldWrapper>

                                <FieldWrapper label="Middle Initial" error={errors.middle_initial}>
                                    <Input
                                        className={`h-11 ${errors.middle_initial ? 'border-red-500' : ''}`}
                                        value={data.middle_initial || ''}
                                        onChange={handleInputChange('middle_initial')}
                                        disabled={processing}
                                        placeholder="Middle Initial"
                                    />
                                </FieldWrapper>

                                <FieldWrapper label="Present Address" required error={errors.present_address}>
                                    <Input
                                        className={`h-11 ${errors.present_address ? 'border-red-500' : ''}`}
                                        value={data.present_address || ''}
                                        onChange={handleInputChange('present_address')}
                                        disabled={processing}
                                        placeholder="Present Address"
                                    />
                                </FieldWrapper>

                                <FieldWrapper label="Contact Number" required error={errors.contact_number}>
                                    <Input
                                        className={`h-11 ${errors.contact_number ? 'border-red-500' : ''}`}
                                        value={data.contact_number || ''}
                                        onChange={handleInputChange('contact_number')}
                                        disabled={processing}
                                        placeholder="Contact Number"
                                    />
                                </FieldWrapper>

                                <FieldWrapper label="Sex" required error={errors.sex}>
                                    <Select value={data.sex} onValueChange={handleSelectChange('sex')}>
                                        <SelectTrigger className={`h-11 ${errors.sex ? 'border-red-500' : ''}`}>
                                            <SelectValue placeholder="Sex" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FieldWrapper>
                            </div>
                        </div>

                        {/* Section: Academic */}
                        <div className="space-y-4">
                            <h3 className="border-b pb-2 text-xl font-semibold text-foreground">Academic Background</h3>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <FieldWrapper label="Program Taken" required error={errors.program_id}>
                                    <Select value={data.program_id || ''} onValueChange={handleSelectChange('program_id')}>
                                        <SelectTrigger className={`h-11 ${errors.program_id ? 'border-red-500' : ''}`}>
                                            <SelectValue placeholder="Select program" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {programs.map((prog) => (
                                                <SelectItem key={prog.id} value={String(prog.id)}>
                                                    {prog.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FieldWrapper>

                                <FieldWrapper label="Graduation Year" required error={errors.graduation_year}>
                                    <Select value={data.graduation_year || ''} onValueChange={handleSelectChange('graduation_year')}>
                                        <SelectTrigger className={`h-11 ${errors.graduation_year ? 'border-red-500' : ''}`}>
                                            <SelectValue placeholder="Select year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {yearOptions.map((year) => (
                                                <SelectItem key={year} value={year}>
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FieldWrapper>
                            </div>
                        </div>

                        {/* Section: Employment */}
                        <div className="space-y-4">
                            <h3 className="border-b pb-2 text-xl font-semibold text-foreground">Employment Details</h3>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <FieldWrapper label="Employment Status" required error={errors.employment_status}>
                                    <Select value={data.employment_status || ''} onValueChange={handleEmploymentStatusChange}>
                                        <SelectTrigger className={`h-11 ${errors.employment_status ? 'border-red-500' : ''}`}>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Employed">Employed</SelectItem>
                                            <SelectItem value="Unemployed">Unemployed</SelectItem>
                                            <SelectItem value="not-tracked">No Answer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FieldWrapper>

                                {data.employment_status === 'Employed' && (
                                    <>
                                        <FieldWrapper label="Company Name" error={errors.company_name}>
                                            <Input
                                                className={`h-11 ${errors.company_name ? 'border-red-500' : ''}`}
                                                value={data.company_name || ''}
                                                onChange={handleInputChange('company_name')}
                                                disabled={processing}
                                                placeholder="Company Name"
                                            />
                                        </FieldWrapper>

                                        <FieldWrapper label="Position / Nature of Work" error={errors.work_position}>
                                            <Input
                                                className={`h-11 ${errors.work_position ? 'border-red-500' : ''}`}
                                                value={data.work_position || ''}
                                                onChange={handleInputChange('work_position')}
                                                disabled={processing}
                                                placeholder="Position / Nature of Work"
                                            />
                                        </FieldWrapper>

                                        <FieldWrapper label="Sector" error={errors.sector}>
                                            <Select value={data.sector || ''} onValueChange={handleSelectChange('sector')}>
                                                <SelectTrigger className={`h-11 ${errors.sector ? 'border-red-500' : ''}`}>
                                                    <SelectValue placeholder="Select sector" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="government">Government</SelectItem>
                                                    <SelectItem value="private">Private</SelectItem>
                                                    <SelectItem value="self-employed">Self Employed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FieldWrapper>

                                        <FieldWrapper label="Work Location" error={errors.work_location}>
                                            <Select value={data.work_location || ''} onValueChange={handleSelectChange('work_location')}>
                                                <SelectTrigger className={`h-11 ${errors.work_location ? 'border-red-500' : ''}`}>
                                                    <SelectValue placeholder="Select location" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="local">Local</SelectItem>
                                                    <SelectItem value="abroad">Abroad</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FieldWrapper>

                                        <FieldWrapper label="Is you job align you've taken course?" error={errors.related_to_course}>
                                            <Select value={data.related_to_course || ''} onValueChange={handleSelectChange('related_to_course')}>
                                                <SelectTrigger className={`h-11 ${errors.related_to_course ? 'border-red-500' : ''}`}>
                                                    <SelectValue placeholder="Select location" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="yes">Yes</SelectItem>
                                                    <SelectItem value="no">No</SelectItem>
                                                    <SelectItem value="unsure">Unsure</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FieldWrapper>

                                        <FieldWrapper label="Your employment classifacation" error={errors.employer_classification}>
                                            <Select
                                                value={data.employer_classification || ''}
                                                onValueChange={handleSelectChange('employer_classification')}
                                            >
                                                <SelectTrigger className={`h-11 ${errors.employer_classification ? 'border-red-500' : ''}`}>
                                                    <SelectValue placeholder="Select option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="local">Local Company in PH</SelectItem>
                                                    <SelectItem value="foreign-ph">Foreign Company in PH</SelectItem>
                                                    <SelectItem value="foreign-abroad">Foreign Company Abroad</SelectItem>
                                                    <SelectItem value="self-employed">I Am Self Employed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FieldWrapper>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Further Studies */}
                        <div className="space-y-4">
                            <h3 className="border-b pb-2 text-xl font-semibold text-foreground">Further Studies</h3>
                            <FieldWrapper label="Pursuing Further Studies?" error={errors.further_studies}>
                                <Select value={data.further_studies || ''} onValueChange={handleSelectChange('further_studies')}>
                                    <SelectTrigger className={`h-11 ${errors.further_studies ? 'border-red-500' : ''}`}>
                                        <SelectValue placeholder="Select option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Yes">Yes</SelectItem>
                                        <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FieldWrapper>
                        </div>

                        {/* Rating */}
                        <div className="space-y-4">
                            <h3 className="border-b pb-2 text-xl font-semibold text-foreground">Feedback</h3>
                            <FieldWrapper label="Rate Your Instruction (1-5 stars)" error={errors.instruction_rating}>
                                <StarRating value={data.instruction_rating || 0} onChange={handleRatingChange} disabled={isEditing} />
                            </FieldWrapper>
                        </div>

                        {/* Consent */}
                        <div className="space-y-4 rounded-lg bg-muted p-4">
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="consent"
                                    checked={data.consent || false}
                                    onChange={handleConsentChange}
                                    required
                                    className="mt-1 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="consent" className="text-sm leading-5 text-foreground">
                                    I consent to the processing of my data for alumni tracking purposes. I understand that this information will be
                                    used in accordance with the university's privacy policy.
                                </label>
                            </div>
                            {errors.consent && (
                                <div className="mt-1 flex items-center gap-1 text-xs text-red-500">
                                    <AlertCircle className="h-3 w-3" />
                                    <span>{errors.consent}</span>
                                </div>
                            )}
                        </div>

                        <Button type="submit" disabled={processing} className="h-12 w-full text-lg font-semibold" size="lg">
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    {isEditing ? 'Updating...' : 'Submitting...'}
                                </>
                            ) : isEditing ? (
                                'Update Record'
                            ) : (
                                'Submit Form'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
});
