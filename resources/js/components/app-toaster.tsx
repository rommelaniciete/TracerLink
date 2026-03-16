'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'sileo';

type AppTheme = 'dark' | 'light';

const getTheme = (): AppTheme => {
    if (typeof document === 'undefined') {
        return 'light';
    }

    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

export function AppToaster() {
    const [theme, setTheme] = useState<AppTheme>(getTheme);

    useEffect(() => {
        const root = document.documentElement;
        const syncTheme = () => setTheme(root.classList.contains('dark') ? 'dark' : 'light');

        syncTheme();

        const observer = new MutationObserver(syncTheme);
        observer.observe(root, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    return <Toaster position="top-right" offset={16} theme={theme} />;
}
