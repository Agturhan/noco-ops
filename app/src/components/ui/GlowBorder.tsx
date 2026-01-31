import React from 'react';
import { cn } from '@/lib/utils/className';


interface GlowBorderProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    color?: 'blue' | 'green' | 'purple';
    className?: string; // Correct typing for ClassNameValue if needed, but string usually works with cn
}

export const GlowBorder: React.FC<GlowBorderProps> = ({
    children,
    color = 'blue',
    className = '',
    ...props
}) => {
    return (
        <div
            className={cn(
                "relative group rounded-xl bg-transparent transition-all duration-300",
                className
            )}
            style={{
                // Fallback for mobile/reduced motion
                border: '1px solid transparent'
            }}
            {...props}
        >
            {/* Hover Glow Effect (Desktop Only + No Reduced Motion) */}
            <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `linear-gradient(45deg, var(--noco-${color}, #329FF4), transparent 40%)`,
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    padding: '1px', // Border width
                }}
            />
            {/* Static Border Fallback */}
            <div className="absolute inset-0 rounded-xl border border-white/5 pointer-events-none" />

            {children}
        </div>
    );
};
