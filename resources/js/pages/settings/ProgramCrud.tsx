import { Head, router, useForm } from '@inertiajs/react';
import React, { useState } from 'react';

import DeleteModal from '@/components/DeleteModal';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { toast } from '@/lib/toast';
import { type BreadcrumbItem } from '@/types';
import { Edit, Loader2, Plus, Trash2 } from 'lucide-react';

type Program = {
    id: number;
    name: string;
};

type Props = {
    programs: Program[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Program settings',
        href: '/settings/program',
    },
];

export default function ProgramCrud({ programs }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingProgram, setEditingProgram] = useState<Program | null>(null);
    const [processingDelete, setProcessingDelete] = useState<number | null>(null);

    const { data, setData, post, put, reset, processing, errors } = useForm({
        name: '',
    });

    const openAddModal = () => {
        reset();
        setEditMode(false);
        setEditingProgram(null);
        setShowModal(true);
    };

    const openEditModal = (program: Program) => {
        setEditMode(true);
        setEditingProgram(program);
        setData('name', program.name);
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editMode && editingProgram) {
            put(`/program/${editingProgram.id}`, {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                    setEditingProgram(null);
                    toast.success('Program updated successfully.');
                },
                onError: (formErrors) => {
                    setShowModal(true);
                    toast.error(formErrors.name ?? 'Failed to update program.');
                },
            });
        } else {
            post('/program', {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                    toast.success('Program added successfully.');
                },
                onError: (formErrors) => {
                    setShowModal(true);
                    toast.error(formErrors.name ?? 'Failed to add program.');
                },
            });
        }
    };

    const handleDeleteProgram = (id: number) => {
        setProcessingDelete(id);

        router.delete(`/program/${id}`, {
            preserveScroll: true,
            onSuccess: (page) => {
                const flash = (page.props as { flash?: { success?: string; error?: string } }).flash;

                if (flash?.error) {
                    toast.error(flash.error);
                    return;
                }

                toast.success(flash?.success ?? 'Program deleted successfully.');
            },
            onError: () => {
                toast.error('Failed to delete program.');
            },
            onFinish: () => {
                setProcessingDelete(null);
            },
        });
    };

    const isProcessing = (programId: number) => processingDelete === programId;
    const isAnyProcessing = processing || processingDelete !== null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Program settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Manage Programs" description="Add, edit, or remove program names." />

                    <div className="flex justify-start">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={openAddModal} disabled={isAnyProcessing}>
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Adding...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Program
                                            </>
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Create a new program</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    <div className="rounded-md">
                        <Table className="w-full text-sm">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="p-3 text-left font-medium">Program Name</TableHead>
                                    <TableHead className="p-3 text-right whitespace-nowrap">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {programs.length > 0 ? (
                                    programs.map((program) => (
                                        <TableRow key={program.id} className="border-t">
                                            <TableCell className="p-3">{program.name}</TableCell>
                                            <TableCell className="space-x-2 p-3 text-right">
                                                <TooltipProvider>
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* Edit Button */}
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="secondary"
                                                                    onClick={() => openEditModal(program)}
                                                                    disabled={isAnyProcessing || isProcessing(program.id)}
                                                                >
                                                                    {isProcessing(program.id) ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <Edit className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Edit {program.name}</p>
                                                            </TooltipContent>
                                                        </Tooltip>

                                                        {/* Delete Button */}
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <DeleteModal
                                                                    onConfirm={() => handleDeleteProgram(program.id)}
                                                                    title="Delete Program"
                                                                    description={`Are you sure you want to delete this program? This wil not be undone.
Note: You cannot delete a program if it has assigned alumni or records.`}
                                                                >
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        disabled={isAnyProcessing || isProcessing(program.id)}
                                                                    >
                                                                        {isProcessing(program.id) ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <Trash2 className="h-4 w-4" />
                                                                        )}
                                                                    </Button>
                                                                </DeleteModal>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Delete {program.name}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TooltipProvider>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="p-3 text-center text-muted-foreground">
                                            No programs found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
                            <Dialog open={showModal} onOpenChange={setShowModal}>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>{editMode ? 'Edit Program' : 'Add Program'}</DialogTitle>
                                        <DialogDescription>
                                            {editMode
                                                ? 'Update the name of the selected program.'
                                                : 'Fill in the name of the new program you want to add.'}
                                        </DialogDescription>
                                    </DialogHeader>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Program Name</Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="e.g. BS Information Technology"
                                                required
                                                disabled={processing}
                                            />
                                            <InputError message={errors.name} />
                                        </div>

                                        <DialogFooter className="gap-2">
                                            <DialogClose asChild>
                                                <Button type="button" variant="ghost" disabled={processing}>
                                                    Cancel
                                                </Button>
                                            </DialogClose>
                                            <Button type="submit" disabled={processing || !data.name.trim()}>
                                                {processing ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        {editMode ? 'Updating...' : 'Saving...'}
                                                    </>
                                                ) : editMode ? (
                                                    'Update'
                                                ) : (
                                                    'Save'
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                )}
            </SettingsLayout>
        </AppLayout>
    );
}
