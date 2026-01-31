import React from 'react';

interface MagicBentoProps {
    children: React.ReactNode;
    className?: string;
    gap?: number;
}

export const MagicBento: React.FC<MagicBentoProps> = ({ children, className = '', gap = 24 }) => {
    return (
        <div
            className={`grid grid-cols-1 md:grid-cols-12 auto-rows-min ${className}`}
            style={{ gap: `${gap}px` }}
        >
            {children}
        </div>
    );
};
