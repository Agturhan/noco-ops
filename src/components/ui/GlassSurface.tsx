import React from 'react';

interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    intensity?: 'light' | 'medium' | 'heavy';
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
    children,
    className = '',
    style,
    intensity = 'medium',
    ...props
}) => {
    // Backdrop blur amounts based on intensity
    const blurAmount = {
        light: '5px',
        medium: '12px',
        heavy: '20px'
    };

    // Background oppacity based on intensity
    const bgOpacity = {
        light: 'rgba(255, 255, 255, 0.03)',
        medium: 'rgba(20, 20, 20, 0.4)', // Darker for better contrast on dark bg
        heavy: 'rgba(10, 10, 10, 0.6)'
    };

    return (
        <div
            className={`glass-surface ${className}`}
            style={{
                position: 'relative',
                background: bgOpacity[intensity],
                backdropFilter: `blur(${blurAmount[intensity]})`,
                WebkitBackdropFilter: `blur(${blurAmount[intensity]})`, // Safari support
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
                borderRadius: '16px',
                color: '#fff', // Default text color white for contrast
                ...style
            }}
            {...props}
        >
            {children}
        </div>
    );
};
