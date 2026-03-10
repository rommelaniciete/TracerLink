import { SidebarInset } from '@/components/ui/sidebar';
import * as React from 'react';
import SiteFooter from '@/components/SiteFooter';

interface AppContentProps extends React.ComponentProps<'main'> {
    variant?: 'header' | 'sidebar';
}

export function AppContent({ variant = 'header', children, ...props }: AppContentProps) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const showFooter = !currentPath.startsWith('/settings');
    if (variant === 'sidebar') {
        return (
            <SidebarInset {...props}>
                {children}
                {/* <SiteFooter showFooter={showFooter} /> */}
            </SidebarInset>
        );
    }

    return (
        <main className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-4 rounded-xl" {...props}>
            {children}
            {/* <SiteFooter showFooter={showFooter} /> */}
        </main>
    );
}
