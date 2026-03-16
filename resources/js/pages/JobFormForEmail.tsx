'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/lib/toast';
import { useForm } from '@inertiajs/react';
import React, { useState } from 'react';

interface JobFormProps {
    alumni: {
        id: number;
        given_name: string;
        email: string;
    };
    onSuccess?: () => void;
}

export default function JobFormForEmail({ alumni, onSuccess }: JobFormProps) {
    const [open, setOpen] = useState(true); // Auto-open if accessed from email link

    const { data, setData, post, processing, reset } = useForm({
        title: '',
        description: '',
        company_name: '',
        location: '',
        requirements: '',
        responsibilities: '',
        apply_link: '',
        status: 'active', // default active
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('job-posts.store'), {
            onSuccess: () => {
                toast.success('Job post created successfully');
                reset();
                setOpen(false);
                if (onSuccess) onSuccess();
            },
            onError: () => toast.error('Failed to create job post'),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Hello, {alumni.given_name}!</DialogTitle>
                </DialogHeader>
                <p className="mb-4 text-sm text-gray-600">Please fill out the job post details below.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input placeholder="Job Title" value={data.title} onChange={(e) => setData('title', e.target.value)} required />
                    <Textarea
                        placeholder="Job Description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        required
                    />
                    <Input placeholder="Company Name" value={data.company_name} onChange={(e) => setData('company_name', e.target.value)} required />
                    <Input placeholder="Location (optional)" value={data.location} onChange={(e) => setData('location', e.target.value)} />
                    <Textarea
                        placeholder="Requirements (optional)"
                        value={data.requirements}
                        onChange={(e) => setData('requirements', e.target.value)}
                    />
                    <Textarea
                        placeholder="Responsibilities (optional)"
                        value={data.responsibilities}
                        onChange={(e) => setData('responsibilities', e.target.value)}
                    />
                    <Input placeholder="Apply Link (optional)" value={data.apply_link} onChange={(e) => setData('apply_link', e.target.value)} />
                    <DialogFooter>
                        <Button type="submit" disabled={processing}>
                            Save Job
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
