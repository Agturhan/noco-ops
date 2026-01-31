'use client';

import nextDynamic from 'next/dynamic';
import React from 'react';

const SystemSettingsPageClient = nextDynamic(() => import('./SystemSettingsPageClient').then(mod => mod.SystemSettingsPageClient), {
    ssr: false,
    loading: () => <div style={{ padding: 40, textAlign: 'center' }}>Ayarlar yükleniyor...</div>
});

export function SystemSettingsWrapper() {
    return <SystemSettingsPageClient />;
}
