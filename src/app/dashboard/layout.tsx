import React from 'react';
import { Sidebar } from '@/components/layout';
import '@/styles/tokens.css';
import '@/styles/components.css';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="layout">
            <Sidebar userRole="OPS" />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
