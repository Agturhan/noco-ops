'use client';

import nextDynamic from 'next/dynamic';
import React from 'react';

const ProposalPageClient = nextDynamic(() => import('./ProposalPageClient').then(mod => mod.ProposalPageClient), {
    ssr: false,
    loading: () => <div style={{ padding: 40, textAlign: 'center' }}>Teklifler yükleniyor...</div>
});

export function ProposalWrapper() {
    return <ProposalPageClient />;
}
