'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { logAction } from '@/lib/actions/audit';

export function AuditTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Debounce or just log immediately? 
        // Log immediately for simplicity, but avoid duplicate renders
        const url = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;

        // Use server action to log
        // We might want to filter out some paths or use a transition
        const logView = async () => {
            try {
                // Determine entity based on path
                let entityType = 'Page';
                const entityName = url;

                if (pathname?.includes('/dashboard/system/clients/')) {
                    entityType = 'Brand Detail';
                } else if (pathname?.includes('/dashboard/content-production')) {
                    entityType = 'Content Page';
                }

                await logAction('VIEW', entityType, url, { url }, entityName);
            } catch {
                // Ignore tracking errors
            }
        };

        logView();
    }, [pathname, searchParams]);

    return null;
}
