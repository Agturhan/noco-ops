'use client';

import nextDynamic from 'next/dynamic';
import React from 'react';

const SettingsPageClient = nextDynamic(() => import('./SettingsPageClient').then(mod => mod.SettingsPageClient), {
    ssr: false,
    loading: () => <div style={{ padding: 40, textAlign: 'center' }}>Ayarlar yükleniyor...</div>
});

export function SettingsWrapper() {
    return <SettingsPageClient />;
}
