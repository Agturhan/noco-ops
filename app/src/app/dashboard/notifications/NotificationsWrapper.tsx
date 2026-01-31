'use client';

import nextDynamic from 'next/dynamic';
import React from 'react';

const NotificationsPageClient = nextDynamic(() => import('./NotificationsPageClient').then(mod => mod.NotificationsPageClient), {
    ssr: false,
    loading: () => <div style={{ padding: 40, textAlign: 'center' }}>Bildirimler yükleniyor...</div>
});

export function NotificationsWrapper() {
    return <NotificationsPageClient />;
}
