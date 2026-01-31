import React from 'react';
import styles from './Skeleton.module.css';

// ===== SKELETON BASE =====
interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    className?: string;
    style?: React.CSSProperties;
}

export function Skeleton({
    width = '100%',
    height = 16,
    borderRadius = 4,
    className = '',
    style = {}
}: SkeletonProps) {
    return (
        <div
            className={`${styles.skeleton} ${className}`}
            style={{
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
                borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
                ...style
            }}
        />
    );
}

// ===== SKELETON TEXT =====
interface SkeletonTextProps {
    lines?: number;
    lastLineWidth?: string;
    lineHeight?: number;
    gap?: number;
}

export function SkeletonText({
    lines = 3,
    lastLineWidth = '60%',
    lineHeight = 16,
    gap = 8
}: SkeletonTextProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap }}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    height={lineHeight}
                    width={i === lines - 1 ? lastLineWidth : '100%'}
                />
            ))}
        </div>
    );
}

// ===== SKELETON CARD =====
export function SkeletonCard() {
    return (
        <div style={{
            padding: 'var(--space-3)',
            backgroundColor: 'var(--color-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <Skeleton width={120} height={20} />
                <Skeleton width={60} height={24} borderRadius={12} />
            </div>
            <SkeletonText lines={2} />
            <div style={{ marginTop: 'var(--space-2)', display: 'flex', gap: 'var(--space-1)' }}>
                <Skeleton width={80} height={28} borderRadius={4} />
                <Skeleton width={80} height={28} borderRadius={4} />
            </div>
        </div>
    );
}

// ===== SKELETON TABLE =====
interface SkeletonTableProps {
    rows?: number;
    columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
    return (
        <div style={{
            backgroundColor: 'var(--color-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: 'var(--space-2)',
                padding: 'var(--space-2)',
                backgroundColor: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
            }}>
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} height={16} width="80%" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                    key={rowIndex}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${columns}, 1fr)`,
                        gap: 'var(--space-2)',
                        padding: 'var(--space-2)',
                        borderBottom: rowIndex < rows - 1 ? '1px solid var(--color-border)' : 'none',
                    }}
                >
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton
                            key={colIndex}
                            height={14}
                            width={colIndex === 0 ? '100%' : `${60 + (colIndex * 10) % 30}%`}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

// ===== SKELETON STATS =====
interface SkeletonStatsProps {
    count?: number;
}

export function SkeletonStats({ count = 4 }: SkeletonStatsProps) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${count}, 1fr)`,
            gap: 'var(--space-2)',
        }}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} style={{
                    padding: 'var(--space-2)',
                    backgroundColor: 'var(--color-card)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    textAlign: 'center',
                }}>
                    <Skeleton width={60} height={32} style={{ margin: '0 auto 8px' }} />
                    <Skeleton width={80} height={12} style={{ margin: '0 auto' }} />
                </div>
            ))}
        </div>
    );
}

// ===== SKELETON LIST =====
interface SkeletonListProps {
    items?: number;
    showAvatar?: boolean;
}

export function SkeletonList({ items = 5, showAvatar = true }: SkeletonListProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2)',
                    backgroundColor: 'var(--color-card)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                }}>
                    {showAvatar && <Skeleton width={40} height={40} borderRadius="50%" />}
                    <div style={{ flex: 1 }}>
                        <Skeleton width="60%" height={14} style={{ marginBottom: 6 }} />
                        <Skeleton width="40%" height={12} />
                    </div>
                    <Skeleton width={60} height={24} borderRadius={12} />
                </div>
            ))}
        </div>
    );
}

// ===== SKELETON KANBAN =====
export function SkeletonKanban() {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 'var(--space-2)',
        }}>
            {Array.from({ length: 5 }).map((_, colIndex) => (
                <div key={colIndex} style={{
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-2)',
                }}>
                    <Skeleton width="70%" height={18} style={{ marginBottom: 'var(--space-2)' }} />
                    {Array.from({ length: 2 + (colIndex % 2) }).map((_, cardIndex) => (
                        <div key={cardIndex} style={{
                            backgroundColor: 'var(--color-card)',
                            borderRadius: 'var(--radius-sm)',
                            padding: 'var(--space-2)',
                            marginBottom: 'var(--space-1)',
                            border: '1px solid var(--color-border)',
                        }}>
                            <Skeleton width="90%" height={14} style={{ marginBottom: 8 }} />
                            <Skeleton width="60%" height={12} />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
