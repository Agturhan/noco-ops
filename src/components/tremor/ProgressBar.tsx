import React from "react";
import { cn } from "@/lib/utils/className";

interface ProgressBarProps {
    value: number;
    max?: number;
    color?: string;
    showAnimation?: boolean;
    className?: string;
}

export function ProgressBar({
    value,
    max = 100,
    color = "#329FF5",
    showAnimation = true,
    className,
}: ProgressBarProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
        <div className={cn("flex w-full items-center", className)}>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                    className={cn("h-full rounded-full transition-all duration-500", showAnimation && "ease-out")}
                    style={{ width: `${percentage}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
}
