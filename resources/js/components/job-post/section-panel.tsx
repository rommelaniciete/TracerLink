import { FormSection } from '@/components/ui/form-section';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type DetailFieldProps = {
    label: string;
    children: ReactNode;
    className?: string;
};

type SectionPanelProps = {
    title: string;
    description: string;
    children: ReactNode;
    className?: string;
};

export function DetailField({ label, children, className }: DetailFieldProps) {
    return (
        <div className={cn('space-y-1', className)}>
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">{label}</p>
            <div className="text-sm text-foreground">{children}</div>
        </div>
    );
}

export function SectionPanel({ title, description, children, className }: SectionPanelProps) {
    return (
        <div className={cn('rounded-xl border bg-muted/20 p-4 sm:p-5', className)}>
            <FormSection title={title} description={description}>
                {children}
            </FormSection>
        </div>
    );
}
