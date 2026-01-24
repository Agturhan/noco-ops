'use client';

import nextDynamic from 'next/dynamic';
import React from 'react';

const ContentProductionPageClient = nextDynamic(() => import('./ContentProductionPageClient').then(mod => mod.ContentProductionPageClient), {
    ssr: false,
    loading: () => <div style={{ padding: 40, textAlign: 'center' }}>İçerikler yükleniyor...</div>
});

export function ContentProductionWrapper() {
    return <ContentProductionPageClient />;
}
