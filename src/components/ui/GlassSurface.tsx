import React from 'react';

interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    intensity?: 'light' | 'medium' | 'heavy';
    glowOnHover?: boolean;
    glowColor?: 'blue' | 'green' | 'purple';
    isActive?: boolean;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
    children,
    className = '',
    style,
    intensity = 'medium',
    glowOnHover = false,
    glowColor = 'blue',
    isActive = false,
    ...props
}) => {
    // Backdrop blur amounts based on intensity
    const blurAmount = {
        light: 'var(--glass-blur, 5px)',
        medium: 'var(--glass-blur, 12px)',
        heavy: 'var(--glass-blur, 20px)'
    };

    // Background opacity based on intensity (variables take precedence if defined)
    const bgOpacity = {
        light: 'var(--glass-bg, rgba(255, 255, 255, 0.03))',
        medium: 'var(--glass-bg, rgba(20, 20, 20, 0.4))',
        heavy: 'var(--glass-bg, rgba(10, 10, 10, 0.6))'
    };

    const getGlowShadow = () => {
        if (isActive) return `var(--shadow-neon-${glowColor}-active)`;
        return glowOnHover ? `var(--shadow-neon-${glowColor})` : 'none';
    };

    return (
        <div
            className={`glass-surface ${glowOnHover ? `glass-glow-${glowColor}` : ''} ${isActive ? 'active' : ''} ${className}`}
            style={{
                position: 'relative',
                background: `var(--glass-bg)`,
                backdropFilter: `blur(${blurAmount[intensity]})`,
                WebkitBackdropFilter: `blur(${blurAmount[intensity]})`,
                border: isActive
                    ? `1px solid var(--noco-${glowColor}, #329FF4)`
                    : 'var(--glass-border, 1px solid rgba(255, 255, 255, 0.08))',
                boxShadow: isActive ? getGlowShadow() : 'var(--card-shadow, 0 8px 32px 0 rgba(0, 0, 0, 0.36))',
                borderRadius: 'var(--radius-lg, 16px)',
                color: 'var(--color-ink, #fff)',
                transition: 'all 0.3s ease',
                ...style
            }}
            {...props}
        >
            {children}
        </div>
    );
};
