'use client';

import nextDynamic from 'next/dynamic';
import React from 'react';

const ProjectsPageClient = nextDynamic(() => import('./ProjectsPageClient').then(mod => mod.ProjectsPageClient), {
    ssr: false,
    loading: () => <div style={{ padding: 40, textAlign: 'center' }}>Projeler yükleniyor...</div>
});

export function ProjectsWrapper() {
    return <ProjectsPageClient />;
}
