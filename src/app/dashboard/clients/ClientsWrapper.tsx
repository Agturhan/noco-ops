'use client';

import nextDynamic from 'next/dynamic';
import React from 'react';

const ClientsPageClient = nextDynamic(() => import('./ClientsPageClient').then(mod => mod.ClientsPageClient), {
    ssr: false,
    loading: () => <div style={{ padding: 40, textAlign: 'center' }}>Müşteriler yükleniyor...</div>
});

export function ClientsWrapper() {
    return <ClientsPageClient />;
}
