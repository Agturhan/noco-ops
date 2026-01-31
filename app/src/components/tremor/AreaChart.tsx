"use client";

import React from "react";
import { Area, AreaChart as RechartsAreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils/className";

interface AreaChartProps {
    data: Record<string, unknown>[];
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
}

const defaultColors = ["#329FF5", "#F6D73C", "#00F5B0", "#FF4242"];

export function AreaChart({
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
}: AreaChartProps) {
    return (
        <div className={cn("w-full", className)} style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <RechartsAreaChart data={data}>
                    {showGridLines && (
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                    )}
                    {showXAxis && (
                        <XAxis
                            dataKey={index}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: "#6b7280" }}
                            dy={10}
                        />
                    )}
                    {showYAxis && (
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: "#6b7280" }}
                            tickFormatter={valueFormatter}
                            dx={-10}
                        />
                    )}
                    {showTooltip && (
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                                            <p className="mb-2 font-medium text-slate-900">{label}</p>
                                            {payload.map((category: { color: string; name: string; value: number }, idx: number) => (
                                                <div key={idx} className="flex items-center gap-2 text-sm">
                                                    <div
                                                        className="h-2 w-2 rounded-full"
                                                        style={{ backgroundColor: category.color }}
                                                    />
                                                    <span className="text-slate-500">{category.name}:</span>
                                                    <span className="font-medium text-slate-900">
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
                        <Area
                            key={category}
                            type="monotone"
                            dataKey={category}
                            stroke={colors[idx % colors.length]}
                            fill={`url(#color-${idx})`} // Simple fill for now, optimally gradients define
                            fillOpacity={0.2}
                            strokeWidth={2}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    ))}
                    <defs>
                        {categories.map((_, idx) => (
                            <linearGradient key={idx} id={`color-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors[idx % colors.length]} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={colors[idx % colors.length]} stopOpacity={0} />
                            </linearGradient>
                        ))}
                    </defs>
                </RechartsAreaChart>
            </ResponsiveContainer>
        </div>
    );
}
