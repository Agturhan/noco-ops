'use client';

import nextDynamic from 'next/dynamic';
import React from 'react';

const StudioBookingPageClient = nextDynamic(() => import('./StudioBookingPageClient').then(mod => mod.StudioBookingPageClient), {
    ssr: false,
    loading: () => <div style={{ padding: 40, textAlign: 'center' }}>Stüdyo sistemi yükleniyor...</div>
});

export function StudioWrapper() {
    return <StudioBookingPageClient />;
}
