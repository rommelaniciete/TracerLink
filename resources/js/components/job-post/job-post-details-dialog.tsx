import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { JobRecord } from '@/types/records';

import { formatDate, getJobStatusMeta } from './helpers';
import { DetailField, SectionPanel } from './section-panel';

type JobPostDetailsDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    job: JobRecord | null;
};

export function JobPostDetailsDialog({ open, onOpenChange, job }: JobPostDetailsDialogProps) {
    const statusMeta = job ? getJobStatusMeta(job) : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Job Post Details</DialogTitle>
                    <DialogDescription>Review the same information structure admins use while editing the post.</DialogDescription>
                </DialogHeader>

                {job && statusMeta && (
                    <div className="space-y-4">
                        <SectionPanel title="Basic information" description="The headline content alumni see first." className="bg-background">
                            <div className="grid gap-4 md:grid-cols-2">
                                <DetailField label="Job title">{job.title}</DetailField>
                                <DetailField label="Company">{job.company_name}</DetailField>
                            </div>

                            <DetailField label="Description">
                                <p className="text-sm leading-6 whitespace-pre-line">{job.description}</p>
                            </DetailField>
                        </SectionPanel>

                        <SectionPanel
                            title="Application settings"
                            description="Current availability and how applicants can respond."
                            className="bg-background"
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <DetailField label="Status">
                                    <div className="space-y-2">
                                        <Badge variant="outline" className={statusMeta.className}>
                                            {statusMeta.label}
                                        </Badge>
                                        <p className="text-xs text-muted-foreground">{statusMeta.description}</p>
                                    </div>
                                </DetailField>
                                <DetailField label="Application deadline">{formatDate(job.application_deadline)}</DetailField>
                                <DetailField label="Posted date">{formatDate(job.posted_date)}</DetailField>
                                {job.start_date && <DetailField label="Start date">{formatDate(job.start_date)}</DetailField>}
                            </div>

                            <DetailField label="Apply link">
                                {job.apply_link ? (
                                    <a
                                        href={job.apply_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="break-all text-primary hover:underline"
                                    >
                                        {job.apply_link}
                                    </a>
                                ) : (
                                    <span className="text-muted-foreground">No external application link provided.</span>
                                )}
                            </DetailField>
                        </SectionPanel>

                        <SectionPanel
                            title="Location"
                            description="Where the opportunity is based or how admins can open the map."
                            className="bg-background"
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <DetailField label="Typed location">
                                    {job.location ? (
                                        <span>{job.location}</span>
                                    ) : (
                                        <span className="text-muted-foreground">No manual location added.</span>
                                    )}
                                </DetailField>
                                <DetailField label="Map link">
                                    {job.location_link ? (
                                        <a
                                            href={job.location_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="break-all text-primary hover:underline"
                                        >
                                            Open Google Maps
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground">No map link provided.</span>
                                    )}
                                </DetailField>
                            </div>
                        </SectionPanel>

                        <SectionPanel
                            title="Optional details"
                            description="Extra requirements and responsibilities added for context."
                            className="bg-background"
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <DetailField label="Requirements">
                                    {job.requirements ? (
                                        <p className="text-sm leading-6 whitespace-pre-line">{job.requirements}</p>
                                    ) : (
                                        <span className="text-muted-foreground">No requirements listed.</span>
                                    )}
                                </DetailField>

                                <DetailField label="Responsibilities">
                                    {job.responsibilities ? (
                                        <p className="text-sm leading-6 whitespace-pre-line">{job.responsibilities}</p>
                                    ) : (
                                        <span className="text-muted-foreground">No responsibilities listed.</span>
                                    )}
                                </DetailField>
                            </div>
                        </SectionPanel>
                    </div>
                )}

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
