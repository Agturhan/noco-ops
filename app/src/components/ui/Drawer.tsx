'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    side?: 'right' | 'bottom';
    width?: string;
}

/**
 * Drawer Component
 * - Desktop: Opens from right side (400px default)
 * - Mobile: Opens from bottom (full width, 90vh max-height)
 */
export function Drawer({
    isOpen,
    onClose,
    title,
    children,
    footer,
    side = 'right',
    width = '420px'
}: DrawerProps) {
    const drawerRef = useRef<HTMLDivElement>(null);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="drawer-backdrop"
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 999,
                    opacity: isOpen ? 1 : 0,
                    transition: 'opacity 0.2s ease'
                }}
            />

            {/* Drawer Panel */}
            <div
                ref={drawerRef}
                className="drawer-panel"
                style={{
                    position: 'fixed',
                    zIndex: 1000,
                    backgroundColor: 'var(--color-surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    // Desktop: right side
                    top: 0,
                    right: 0,
                    height: '100vh',
                    width: width,
                    borderTopLeftRadius: 'var(--radius-xl)',
                    borderBottomLeftRadius: 'var(--radius-xl)',
                    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.25s ease'
                }}
            >
                {/* Header */}
                <div
                    className="drawer-header"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderBottom: '1px solid var(--color-divider)',
                        flexShrink: 0
                    }}
                >
                    <h2 style={{
                        fontSize: 'var(--text-h3)',
                        fontWeight: 600,
                        margin: 0
                    }}>
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'var(--color-surface-hover)',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-ink)'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div
                    className="drawer-content"
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '20px'
                    }}
                >
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div
                        className="drawer-footer"
                        style={{
                            display: 'flex',
                            gap: 'var(--space-1)',
                            padding: '16px 20px',
                            borderTop: '1px solid var(--color-divider)',
                            flexShrink: 0
                        }}
                    >
                        {footer}
                    </div>
                )}
            </div>

            {/* Mobile Styles */}
            <style jsx global>{`
                @media (max-width: 640px) {
                    .drawer-panel {
                        top: auto !important;
                        bottom: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        max-height: 90vh !important;
                        border-radius: var(--radius-xl) var(--radius-xl) 0 0 !important;
                        transform: translateY(${isOpen ? '0' : '100%'}) !important;
                    }
                    .drawer-content {
                        max-height: 60vh;
                    }
                }
            `}</style>
        </>
    );
}
