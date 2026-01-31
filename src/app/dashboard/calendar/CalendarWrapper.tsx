'use client';

import nextDynamic from 'next/dynamic';
import React from 'react';

const CalendarPageClient = nextDynamic(() => import('./CalendarPageClient').then(mod => mod.CalendarPageClient), {
    ssr: false,
    loading: () => <div style={{ padding: 40, textAlign: 'center' }}>Takvim yükleniyor...</div>
});

export function CalendarWrapper() {
    return <CalendarPageClient />;
}
