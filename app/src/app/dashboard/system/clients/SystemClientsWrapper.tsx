'use client';

import nextDynamic from 'next/dynamic';
import React from 'react';

const SystemClientsPageClient = nextDynamic(() => import('./SystemClientsPageClient').then(mod => mod.SystemClientsPageClient), {
    ssr: false,
    loading: () => <div style={{ padding: 40, textAlign: 'center' }}>Müşteriler yükleniyor...</div>
});

export function SystemClientsWrapper() {
    return <SystemClientsPageClient />;
}
