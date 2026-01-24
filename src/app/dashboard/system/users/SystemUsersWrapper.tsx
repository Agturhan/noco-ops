'use client';

import nextDynamic from 'next/dynamic';
import React from 'react';

const SystemUsersPageClient = nextDynamic(() => import('./SystemUsersPageClient').then(mod => mod.SystemUsersPageClient), {
    ssr: false,
    loading: () => <div style={{ padding: 40, textAlign: 'center' }}>Kullanıcılar yükleniyor...</div>
});

export function SystemUsersWrapper() {
    return <SystemUsersPageClient />;
}
