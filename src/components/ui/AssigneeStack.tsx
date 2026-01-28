import React from 'react';
import { getBrandName } from '@/lib/data'; // fallback utility if needed, or remove

interface Assignee {
    id: string;
    name: string;
    // We expect the color to be passed in, or we can use a helper to get it
    color?: string;
}

interface AssigneeStackProps {
    assignees: Assignee[];
    max?: number;
    size?: number; // size in px
    borderColor?: string; // ring color (usually surface color)
    className?: string;
    resolveColor?: (name: string) => string;
}

export const AssigneeStack: React.FC<AssigneeStackProps> = ({
    assignees,
    max = 4,
    size = 24,
    borderColor = 'var(--color-surface)',
    className = '',
    resolveColor
}) => {
    const visibleAssignees = assignees.slice(0, max);
    const remaining = assignees.length - max;

    return (
        <div className={`flex items-center ${className}`} style={{ isolation: 'isolate' }}>
            {visibleAssignees.map((assignee, index) => {
                const color = assignee.color || (resolveColor ? resolveColor(assignee.name) : '#6B7B80');
                const initials = assignee.name
                    ?.split(' ')
                    .map(n => n[0])
                    .join('')
                    .substring(0, 1) || '?';

                return (
                    <div
                        key={assignee.id || index}
                        className="relative flex items-center justify-center rounded-full border-2 transition-transform hover:z-10 hover:-translate-y-1"
                        style={{
                            width: size,
                            height: size,
                            backgroundColor: 'white', // minimal bg behind transparency
                            borderColor: borderColor,
                            marginLeft: index === 0 ? 0 : -8,
                            zIndex: index,
                            color: color,
                        }}
                        title={assignee.name}
                    >
                        {/* Ring Color Background (Low Opacity) */}
                        <div
                            className="absolute inset-0 rounded-full"
                            style={{ backgroundColor: color, opacity: 0.15 }}
                        />

                        {/* Initials (Solid Color) */}
                        <span style={{ fontSize: size * 0.45, fontWeight: 700, lineHeight: 1 }}>
                            {initials}
                        </span>
                    </div>
                );
            })}

            {remaining > 0 && (
                <div
                    className="relative flex items-center justify-center rounded-full border-2 bg-gray-100 text-gray-500"
                    style={{
                        width: size,
                        height: size,
                        borderColor: borderColor,
                        marginLeft: -8,
                        zIndex: max,
                        fontSize: size * 0.4,
                        fontWeight: 600
                    }}
                >
                    +{remaining}
                </div>
            )}
        </div>
    );
};
