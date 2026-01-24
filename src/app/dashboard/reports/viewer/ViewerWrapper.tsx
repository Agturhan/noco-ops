'use client';

import nextDynamic from 'next/dynamic';
import React from 'react';

const ViewerPageClient = nextDynamic(() => import('./ViewerPageClient').then(mod => mod.ViewerPageClient), {
    ssr: false,
    loading: () => <div style={{ padding: 40, textAlign: 'center' }}>Görüntüleyici yükleniyor...</div>
});

export function ViewerWrapper() {
    return <ViewerPageClient />;
}
