'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout';
import { AuditTracker } from '@/components/audit/AuditTracker';
import '@/styles/tokens.css';
import '@/styles/components.css';
import { flags } from '@/lib/flags';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);

    // Tema tercihini localStorage'dan yükle
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setIsDark(true);
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <div
            className={`layout ${isDark ? 'dark' : ''} ${flags.dashboardReskin ? 'dashboard-skin' : ''}`}
            data-dashboard={flags.dashboardReskin ? "true" : undefined}
        >
            <AuditTracker />
            <Sidebar
                userRole="OPS"
                isOpen={sidebarOpen}
                onClose={closeSidebar}
                onToggleTheme={toggleTheme}
                isDark={isDark}
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
                        className="theme-btn-mobile"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                    >
                        {isDark ? '☀️' : '🌙'}
                    </button>
                </div>
                {children}
            </main>
        </div>
    );
}
