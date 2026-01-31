'use client';

import nextDynamic from 'next/dynamic';
import React from 'react';

const ReportsPageClient = nextDynamic(() => import('./ReportsPageClient').then(mod => mod.ReportsPageClient), {
    ssr: false,
    loading: () => <div style={{ padding: 40, textAlign: 'center' }}>Raporlar yükleniyor...</div>
});

export function ReportsWrapper() {
    return <ReportsPageClient />;
}
