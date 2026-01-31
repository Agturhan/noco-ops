import React from "react";
import { cn } from "@/lib/utils/className";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    decoration?: "top" | "bottom" | "left" | "right";
    decorationColor?: string;
}

export function Card({ className, decoration, decorationColor, children, ...props }: CardProps) {
    const decorationStyles = decoration
        ? {
            borderTop: decoration === "top" ? `4px solid ${decorationColor}` : undefined,
            borderBottom: decoration === "bottom" ? `4px solid ${decorationColor}` : undefined,
            borderLeft: decoration === "left" ? `4px solid ${decorationColor}` : undefined,
            borderRight: decoration === "right" ? `4px solid ${decorationColor}` : undefined,
        }
        : {};

    return (
        <div
            className={cn(
                "relative w-full rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md",
                className
            )}
            style={decorationStyles}
            {...props}
        >
            <div className="p-6">{children}</div>
        </div>
    );
}
