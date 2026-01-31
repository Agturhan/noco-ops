'use client';

import nextDynamic from 'next/dynamic';
import React from 'react';

const PriceListPageClient = nextDynamic(() => import('./PriceListPageClient').then(mod => mod.PriceListPageClient), {
    ssr: false,
    loading: () => <div style={{ padding: 40, textAlign: 'center' }}>Fiyat Listesi yükleniyor...</div>
});

export function PriceListWrapper() {
    return <PriceListPageClient />;
}
