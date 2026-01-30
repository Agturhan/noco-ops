'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import { navGroups } from '@/config/navigation';
import { SidebarItem } from './sidebar/SidebarItem';
import { UserProfile } from './sidebar/UserProfile';
import { FeedbackModal } from './sidebar/FeedbackModal';

import { useTheme } from 'next-themes';

interface SidebarProps {
    userRole?: string;
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ userRole = 'OPS', isOpen = true, onClose }: SidebarProps) {
    const [showFeedback, setShowFeedback] = useState(false);
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    return (
        <>
            {isOpen && (
                <div
                    className="sidebar-overlay fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`sidebar fixed top-0 left-0 flex flex-col w-[260px] h-screen bg-[var(--color-surface)] border-r border-[var(--color-border)] transition-transform duration-300 z-50 ${isOpen ? 'open translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
                style={{ backdropFilter: 'blur(20px)' }}
            >
                {/* Header */}
                <div className="sidebar-header p-4 border-b border-[var(--color-border)] flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-3 no-underline">
                        <Image
                            src="/noco-logo-icon.jpg"
                            alt="NOCO"
                            width={40}
                            height={40}
                            className="rounded-lg shadow-sm"
                        />
                        <div>
                            <h1 className="text-lg font-bold text-[var(--color-primary)] m-0 leading-tight">
                                NOCO Ops
                            </h1>
                            <span className="text-xs text-[var(--color-muted)] font-medium">
                                Creative Operations
                            </span>
                        </div>
                    </Link>

                    <button
                        onClick={onClose}
                        className="lg:hidden p-1 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
                    {navGroups.map((group) => {
                        // Filter items based on role
                        const visibleItems = group.items.filter(item =>
                            !item.roles || item.roles.includes(userRole)
                        );

                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={group.title}>
                                {group.title !== 'ANA' && (
                                    <div className="px-3 mb-2 text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                                        {group.title}
                                    </div>
                                )}
                                <div className="flex flex-col gap-0.5">
                                    {visibleItems.map((item) => (
                                        <SidebarItem
                                            key={item.href}
                                            item={item}
                                            userRole={userRole}
                                            onClose={onClose}
                                            isDark={isDark}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* Footer / User Profile */}
                <UserProfile
                    userRole={userRole}
                    onOpenFeedback={() => setShowFeedback(true)}
                />
            </aside>

            {/* Feedback Modal */}
            <FeedbackModal
                isOpen={showFeedback}
                onClose={() => setShowFeedback(false)}
            />
        </>
    );
}

export default Sidebar;
