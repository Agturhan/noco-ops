'use client';

import nextDynamic from 'next/dynamic';
import React from 'react';

const AuditLogPageClient = nextDynamic(() => import('./AuditLogPageClient').then(mod => mod.AuditLogPageClient), {
    ssr: false,
    loading: () => <div style={{ padding: 40, textAlign: 'center' }}>Kayıtlar yükleniyor...</div>
});

export function AuditLogWrapper() {
    return <AuditLogPageClient />;
}
