import React, { CSSProperties } from 'react';

type StarBorderProps = {
    as?: React.ElementType;
    className?: string;
    color?: string;
    speed?: string;
    children?: React.ReactNode;
    style?: CSSProperties;
    [key: string]: any;
};

export const StarBorder: React.FC<StarBorderProps> = ({
    as: Component = 'div',
    className = '',
    color = 'white',
    speed = '6s',
    children,
    style,
    ...props
}) => {
    return (
        <Component
            className={`relative inline-block py-[1px] overflow-hidden rounded-[20px] ${className}`}
            style={style}
            {...props}
        >
            <div
                className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0 pointer-events-none"
                style={{
                    background: `radial-gradient(circle, ${color}, transparent 10%)`,
                    animationDuration: speed,
                }}
            ></div>
            <div
                className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0 pointer-events-none"
                style={{
                    background: `radial-gradient(circle, ${color}, transparent 10%)`,
                    animationDuration: speed,
                }}
            ></div>
            <div className="relative z-10 w-full h-full border border-white/10 rounded-[20px] bg-black/5">
                {children}
            </div>
        </Component>
    );
};
