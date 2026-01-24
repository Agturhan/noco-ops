'use client';

import nextDynamic from 'next/dynamic';
import React from 'react';

const AccountingPageClient = nextDynamic(() => import('./AccountingPageClient').then(mod => mod.AccountingPageClient), {
    ssr: false,
    loading: () => <div style={{ padding: 40, textAlign: 'center' }}>Muhasebe yükleniyor...</div>
});

export function AccountingWrapper() {
    return <AccountingPageClient />;
}
