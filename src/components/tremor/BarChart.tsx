"use client";

import React from "react";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { cn } from "@/lib/utils/className";

interface BarChartProps {
    data: any[];
    categories: string[];
    index: string;
    colors?: string[];
    valueFormatter?: (value: number) => string;
    className?: string;
    height?: number | string;
    showXAxis?: boolean;
    showYAxis?: boolean;
    showGridLines?: boolean;
    showTooltip?: boolean;
    layout?: 'vertical' | 'horizontal';
}

const defaultColors = ["#329FF5", "#F6D73C", "#00F5B0", "#FF4242"];

export function BarChart({
    data,
    categories,
    index,
    colors = defaultColors,
    valueFormatter = (value: number) => `${value}`,
    className,
    height = 350,
    showXAxis = true,
    showYAxis = true,
    showGridLines = true,
    showTooltip = true,
    layout = 'horizontal'
}: BarChartProps) {
    return (
        <div className={cn("w-full", className)} style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={data} layout={layout} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    {showGridLines && (
                        <CartesianGrid strokeDasharray="3 3" horizontal={layout === 'horizontal'} vertical={layout === 'vertical'} stroke="var(--color-border)" />
                    )}
                    {showXAxis && (
                        <XAxis
                            dataKey={layout === 'vertical' ? undefined : index}
                            type={layout === 'vertical' ? 'number' : 'category'}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: "var(--color-sub-ink)" }}
                            dy={10}
                        />
                    )}
                    {showYAxis && (
                        <YAxis
                            dataKey={layout === 'vertical' ? index : undefined}
                            type={layout === 'vertical' ? 'category' : 'number'}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: "var(--color-sub-ink)" }}
                            tickFormatter={layout === 'vertical' ? undefined : valueFormatter}
                            dx={-10}
                            width={layout === 'vertical' ? 100 : undefined}
                        />
                    )}
                    {showTooltip && (
                        <Tooltip
                            cursor={{ fill: 'var(--color-surface)', opacity: 0.5 }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-sm">
                                            <p className="mb-2 font-medium text-[var(--color-ink)]">{label}</p>
                                            {payload.map((category: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-2 text-sm">
                                                    <div
                                                        className="h-2 w-2 rounded-full"
                                                        style={{ backgroundColor: category.color }}
                                                    />
                                                    <span className="text-[var(--color-sub-ink)]">{category.name}:</span>
                                                    <span className="font-medium text-[var(--color-ink)]">
                                                        {valueFormatter(category.value)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    )}
                    {categories.map((category, idx) => (
                        <Bar
                            key={category}
                            dataKey={category}
                            fill={colors[idx % colors.length]}
                            radius={[4, 4, 0, 0]}
                            barSize={layout === 'vertical' ? 20 : undefined}
                        />
                    ))}
                </RechartsBarChart>
            </ResponsiveContainer>
        </div>
    );
}
