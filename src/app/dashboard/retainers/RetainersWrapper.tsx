'use client';

import nextDynamic from 'next/dynamic';
import React from 'react';

const RetainersPageClient = nextDynamic(() => import('./RetainersPageClient').then(mod => mod.RetainersPageClient), {
    ssr: false,
    loading: () => <div style={{ padding: 40, textAlign: 'center' }}>Retainer sistemi yükleniyor...</div>
});

export function RetainersWrapper() {
    return <RetainersPageClient />;
}
