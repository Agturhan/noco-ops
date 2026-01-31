'use client';

import nextDynamic from 'next/dynamic';
import React from 'react';

const TasksPageClient = nextDynamic(() => import('./TasksPageClient').then(mod => mod.TasksPageClient), {
    ssr: false,
    loading: () => <div style={{ padding: 40, textAlign: 'center' }}>Görevler yükleniyor...</div>
});

export function TasksWrapper() {
    return <TasksPageClient />;
}
