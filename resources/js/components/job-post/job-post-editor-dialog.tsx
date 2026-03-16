import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { InertiaFormProps } from '@inertiajs/react';
import { format } from 'date-fns';
import { CalendarDays, LinkIcon, Loader2, MapPin } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

import { Label } from '../ui/label';
import { JobPostFormData } from './helpers';
import { SectionPanel } from './section-panel';

type JobPostEditorDialogProps = {
    open: boolean;
    editId: number | null;
    processing: boolean;
    data: JobPostFormData;
    errors: InertiaFormProps<JobPostFormData>['errors'];
    setData: InertiaFormProps<JobPostFormData>['setData'];
    handleSubmit: (event: React.FormEvent) => void;
    onOpenChange: (open: boolean) => void;
    locationInputType: 'text' | 'link';
    setLocationInputType: (value: 'text' | 'link') => void;
    deadlinePickerOpen: boolean;
    setDeadlinePickerOpen: Dispatch<SetStateAction<boolean>>;
    selectedDeadlineDate: Date | null;
};

export function JobPostEditorDialog({
    open,
    editId,
    processing,
    data,
    errors,
    setData,
    handleSubmit,
    onOpenChange,
    locationInputType,
    setLocationInputType,
    deadlinePickerOpen,
    setDeadlinePickerOpen,
    selectedDeadlineDate,
}: JobPostEditorDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto p-4 sm:max-w-3xl sm:p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl">{editId ? 'Edit Job Post' : 'Add Job Post'}</DialogTitle>
                    <DialogDescription>
                        {editId
                            ? 'Update the content, visibility, and alert settings for this posting.'
                            : 'Create a clear job post and make sure it is ready for alumni outreach.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <SectionPanel title="Basic information" description="Capture the main information alumni need to understand the role.">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="job-title">Job title *</Label>
                                <Input
                                    id="job-title"
                                    placeholder="Job title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    required
                                />
                                <InputError message={errors.title} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="company-name">Company name *</Label>
                                <Input
                                    id="company-name"
                                    placeholder="Company name"
                                    value={data.company_name}
                                    onChange={(e) => setData('company_name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.company_name} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="job-description">Description *</Label>
                            <Textarea
                                id="job-description"
                                placeholder="Summarize the role, key expectations, and who should apply."
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                required
                                rows={5}
                                className="min-h-[140px]"
                            />
                            <InputError message={errors.description} />
                        </div>
                    </SectionPanel>

                    <SectionPanel title="Application settings" description="Set how the post behaves in the table, filters, and email alerts.">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={data.status} onValueChange={(value) => setData('status', value as 'active' | 'inactive')}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Inactive posts remain visible to admins but will not be treated as active.
                                </p>
                                <InputError message={errors.status} />
                            </div>

                            <div className="space-y-2">
                                <Label>Application deadline</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDeadlinePickerOpen((prev) => !prev)}
                                    className={cn('w-full justify-start text-left font-normal', !selectedDeadlineDate && 'text-muted-foreground')}
                                >
                                    <CalendarDays className="h-4 w-4" />
                                    {selectedDeadlineDate ? format(selectedDeadlineDate, 'MMM dd, yyyy') : 'Pick a deadline'}
                                </Button>
                                {deadlinePickerOpen && (
                                    <div className="w-fit rounded-md border bg-background p-2">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDeadlineDate ?? undefined}
                                            onSelect={(selectedDate) => {
                                                if (!selectedDate) return;
                                                setData('application_deadline', format(selectedDate, 'yyyy-MM-dd'));
                                                setDeadlinePickerOpen(false);
                                            }}
                                            initialFocus
                                        />
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground">Use this to mark when applications should stop appearing as open.</p>
                                <InputError message={errors.application_deadline} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="apply-link">Apply link</Label>
                            <Input
                                id="apply-link"
                                type="url"
                                placeholder="https://company.com/jobs/apply"
                                value={data.apply_link}
                                onChange={(e) => setData('apply_link', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Optional. Use a full URL if applicants should leave the platform.</p>
                            <InputError message={errors.apply_link} />
                        </div>
                    </SectionPanel>

                    <SectionPanel title="Location" description="Choose whether the location should be typed directly or linked from Google Maps.">
                        <div className="space-y-2">
                            <Label>Location format</Label>
                            <Tabs
                                value={locationInputType}
                                onValueChange={(value) => setLocationInputType(value as 'text' | 'link')}
                                className="w-full"
                            >
                                <TabsList className="grid h-10 w-full grid-cols-2">
                                    <TabsTrigger value="text" className="text-xs sm:text-sm">
                                        <MapPin className="h-4 w-4" />
                                        Type location
                                    </TabsTrigger>
                                    <TabsTrigger value="link" className="text-xs sm:text-sm">
                                        <LinkIcon className="h-4 w-4" />
                                        Google Maps link
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="text" className="mt-3 space-y-2">
                                    <Input
                                        placeholder="Ex. San Fernando, Pampanga"
                                        value={data.location}
                                        onChange={(e) => setData('location', e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">Use a simple place name when a map link is not available.</p>
                                    <InputError message={errors.location} />
                                </TabsContent>

                                <TabsContent value="link" className="mt-3 space-y-2">
                                    <Input
                                        type="url"
                                        placeholder="https://maps.google.com/..."
                                        value={data.location_link}
                                        onChange={(e) => setData('location_link', e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Paste a full Google Maps URL if you want admins and alumni to open the map directly.
                                    </p>
                                    <InputError message={errors.location_link} />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </SectionPanel>

                    <SectionPanel title="Optional details" description="Add extra context for alumni without making the main post harder to scan.">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="requirements">Requirements</Label>
                                <Textarea
                                    id="requirements"
                                    placeholder="Preferred skills, experience, or credentials"
                                    value={data.requirements}
                                    onChange={(e) => setData('requirements', e.target.value)}
                                    rows={4}
                                    className="min-h-[120px]"
                                />
                                <InputError message={errors.requirements} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="responsibilities">Responsibilities</Label>
                                <Textarea
                                    id="responsibilities"
                                    placeholder="Key tasks or day-to-day expectations"
                                    value={data.responsibilities}
                                    onChange={(e) => setData('responsibilities', e.target.value)}
                                    rows={4}
                                    className="min-h-[120px]"
                                />
                                <InputError message={errors.responsibilities} />
                            </div>
                        </div>
                    </SectionPanel>

                    <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {editId ? 'Update Job Post' : 'Create Job Post'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
