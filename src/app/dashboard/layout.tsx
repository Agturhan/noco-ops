'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout';
import { AuditTracker } from '@/components/audit/AuditTracker';
import { Sun, Moon } from 'lucide-react';
import '@/styles/tokens.css';
import '@/styles/components.css';
import { flags } from '@/lib/flags';

import { useTheme } from 'next-themes';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    // Prevent hydration mismatch for icon
    const isDark = mounted && resolvedTheme === 'dark';

    return (
        <div className={`layout ${flags.dashboardReskin ? 'dashboard-skin' : ''}`} data-dashboard={flags.dashboardReskin ? "true" : undefined}>
            <AuditTracker />
            <Sidebar
                userRole="OPS"
                isOpen={sidebarOpen}
                onClose={closeSidebar}
            />
            <main className="main-content">
                {/* Mobil Header - Hamburger menü */}
                <div className="mobile-header">
                    <button
                        className="hamburger-btn"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                    <span className="mobile-logo">NOCO Ops</span>
                    <button
                        className="theme-btn-mobile flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-ink)]"
                        onClick={() => setTheme(isDark ? 'light' : 'dark')}
                        aria-label="Toggle theme"
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
                {children}
            </main>
        </div>
    );
}
