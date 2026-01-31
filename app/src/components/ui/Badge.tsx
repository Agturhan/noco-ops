import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Badge Component
 * 
 * Status indicators for deliverables, invoices, etc.
 */
export function Badge({ children, variant = 'neutral', size = 'md', className = '', style }: BadgeProps) {
    const sizeClass = size !== 'md' ? `badge-${size}` : '';
    // Optional: inline fallback if CSS classes missing
    const sizeStyle = size === 'sm' ? { fontSize: '0.75rem', padding: '0.125em 0.5em' } : {};

    return (
        <span className={`badge badge-${variant} ${sizeClass} ${className}`} style={{ ...sizeStyle, ...style }}>
            {children}
        </span>
    );
}

// Status-specific badge helpers
type DeliverableStatus = 'IN_PROGRESS' | 'IN_REVIEW' | 'APPROVED' | 'DELIVERED' | 'REVISION_LIMIT_MET';
type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'REFUNDED';
type ProjectStatus = 'PENDING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

const deliverableStatusConfig: Record<DeliverableStatus, { variant: BadgeVariant; label: string }> = {
    IN_PROGRESS: { variant: 'info', label: 'Devam Ediyor' },
    IN_REVIEW: { variant: 'warning', label: 'İncelemede' },
    APPROVED: { variant: 'success', label: 'Onaylandı' },
    DELIVERED: { variant: 'success', label: 'Teslim Edildi' },
    REVISION_LIMIT_MET: { variant: 'error', label: 'Revizyon Limiti Doldu' },
};

const invoiceStatusConfig: Record<InvoiceStatus, { variant: BadgeVariant; label: string }> = {
    PENDING: { variant: 'warning', label: 'Ödeme Bekleniyor' },
    PAID: { variant: 'success', label: 'Ödendi' },
    OVERDUE: { variant: 'error', label: 'Gecikmiş' },
    REFUNDED: { variant: 'neutral', label: 'İade Edildi' },
};

const projectStatusConfig: Record<ProjectStatus, { variant: BadgeVariant; label: string }> = {
    PENDING: { variant: 'neutral', label: 'Beklemede' },
    ACTIVE: { variant: 'info', label: 'Aktif' },
    ON_HOLD: { variant: 'warning', label: 'Askıda' },
    COMPLETED: { variant: 'success', label: 'Tamamlandı' },
    ARCHIVED: { variant: 'neutral', label: 'Arşivlendi' },
};

export function DeliverableStatusBadge({ status }: { status: DeliverableStatus }) {
    const config = deliverableStatusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
    const config = invoiceStatusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
    const config = projectStatusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default Badge;
