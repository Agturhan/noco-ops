'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const ReportEditor = dynamic(() => import('./ReportEditor'), {
    ssr: false,
    loading: () => <div style={{ padding: 40, textAlign: 'center' }}>Editör yükleniyor...</div>
});

export function ReportEditorWrapper() {
    return <ReportEditor />;
}
