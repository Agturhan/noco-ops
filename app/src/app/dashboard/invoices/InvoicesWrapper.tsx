'use client';

import nextDynamic from 'next/dynamic';
import React from 'react';

const InvoicesPageClient = nextDynamic(() => import('./InvoicesPageClient').then(mod => mod.InvoicesPageClient), {
    ssr: false,
    loading: () => <div style={{ padding: 40, textAlign: 'center' }}>Faturalar yükleniyor...</div>
});

export function InvoicesWrapper() {
    return <InvoicesPageClient />;
}
