'use client';

import nextDynamic from 'next/dynamic';
import React from 'react';

const DashboardPageClient = nextDynamic(() => import('./DashboardPageClient').then(mod => mod.DashboardPageClient), {
    ssr: false,
    loading: () => <div style={{ padding: 40, textAlign: 'center' }}>Dashboard yükleniyor...</div>
});

export function DashboardWrapper() {
    return <DashboardPageClient />;
}
