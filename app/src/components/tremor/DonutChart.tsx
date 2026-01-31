"use client";

import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils/className";

interface DonutChartProps {
    data: any[];
    category: string;
    index: string;
    colors?: string[];
    valueFormatter?: (value: number) => string;
    className?: string;
    height?: number | string;
    showLabel?: boolean;
}

const defaultColors = ["#329FF5", "#F6D73C", "#00F5B0", "#FF4242", "#9C27B0"];

export function DonutChart({
    data,
    category,
    index,
    colors = defaultColors,
    valueFormatter = (value: number) => `${value}`,
    className,
    height = 180, // Default smaller for donut
    showLabel = true,
}: DonutChartProps) {
    return (
        <div className={cn("w-full flex flex-col items-center justify-center", className)} style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="80%"
                        paddingAngle={2}
                        dataKey={category}
                        nameKey={index}
                        strokeWidth={0}
                    >
                        {data.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                                        <div className="flex items-center gap-2 text-sm">
                                            <div
                                                className="h-2 w-2 rounded-full"
                                                style={{ backgroundColor: payload[0].color }}
                                            />
                                            <span className="text-slate-500">{data[index]}:</span>
                                            <span className="font-medium text-slate-900">
                                                {valueFormatter(data[category])}
                                            </span>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
            {showLabel && (
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                    {data.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                            <span className="text-xs text-slate-500">{item[index]}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
