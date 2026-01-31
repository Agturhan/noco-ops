import React from 'react';
import { GlassSurface } from './GlassSurface';
import { StarBorder } from '../react-bits/StarBorder';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    intensity?: 'light' | 'medium' | 'heavy';
    glowOnHover?: boolean;
    glowColor?: 'blue' | 'green' | 'purple';
    decoration?: "top" | "bottom" | "left" | "right";
    decorationColor?: string;
}

/**
 * Unified GlassCard Wrapper
 * 
 * Composes:
 * 1. GlassSurface (Background/Frost) - Layer 0
 * 2. StarBorder (Neon Effect on Hover) - Layer 1 (Desktop Only)
 * 3. Content - Layer 10
 */
export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = '',
    intensity = 'medium',
    glowOnHover = false,
    glowColor = 'blue',
    decoration,
    decorationColor,
    style,
    ...props
}) => {
    // Map glowColor to neon hex values for StarBorder
    const starColor = glowColor === 'blue' ? '#329FF5' : glowColor === 'green' ? '#00F5B0' : '#E91E63';

    return (
        <div
            className={`glass-card-root relative group rounded-2xl overflow-hidden ${className}`}
            style={{ width: '100%', isolation: 'isolate', ...style }}
            {...props}
        >
            {/* LAYER 0: Glass Surface (Background) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <GlassSurface
                    intensity={intensity}
                    glowOnHover={false} // Disable internal glow, we use StarBorder
                    className="w-full h-full"
                    style={{
                        borderRadius: '16px', // Standardize radius (rounded-2xl)
                        borderTop: decoration === "top" && decorationColor ? `4px solid ${decorationColor}` : undefined,
                        borderBottom: decoration === "bottom" && decorationColor ? `4px solid ${decorationColor}` : undefined,
                        borderLeft: decoration === "left" && decorationColor ? `4px solid ${decorationColor}` : undefined,
                        borderRight: decoration === "right" && decorationColor ? `4px solid ${decorationColor}` : undefined,
                    }}
                >
                    {null}
                </GlassSurface>
            </div>

            {/* LAYER 1: Star Border (Desktop Hover Only) */}
            {glowOnHover && (
                <div className="absolute inset-0 z-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block">
                    {/* 
                        StarBorder usually acts as a container. 
                        Here we use it as an absolute overlay that matches dimensions. 
                        We disable its inner background to let GlassSurface show through.
                     */}
                    <StarBorder
                        as="div"
                        color={starColor}
                        speed="4s"
                        className="w-full h-full !rounded-2xl pointer-events-none"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 1
                        }}
                    >
                        {/* Empty children for overlay mode */}
                        <div className="w-full h-full"></div>
                    </StarBorder>
                </div>
            )}

            {/* LAYER 10: Content */}
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </div>
    );
};
