'use client';

import React from 'react';

interface HeaderProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
    return (
        <header className="header">
            <div>
                <h1 style={{
                    fontSize: 'var(--text-h3)',
                    fontWeight: 600,
                    fontFamily: 'var(--font-heading)',
                    lineHeight: 1.2
                }}>
                    {title}
                </h1>
                {subtitle && (
                    <p style={{
                        fontSize: 'var(--text-body-sm)',
                        color: 'var(--color-muted)',
                        marginTop: '2px'
                    }}>
                        {subtitle}
                    </p>
                )}
            </div>

            {actions && (
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    {actions}
                </div>
            )}
        </header>
    );
}

export default Header;
