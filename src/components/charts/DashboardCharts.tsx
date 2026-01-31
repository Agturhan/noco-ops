'use client';

import React from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

// ===== COLORS =====
const CHART_COLORS = {
    primary: '#329FF5',
    secondary: '#00F5B0',
    accent: '#F6D73C',
    danger: '#FF4242',
    muted: '#6B7B80',
    success: '#10B981',
    warning: '#F59E0B',
};

const PIE_COLORS = ['#329FF5', '#00F5B0', '#F6D73C', '#FF4242', '#9C27B0', '#FF9800'];

// ===== REVENUE CHART (Area) =====
interface RevenueData {
    month: string;
    gelir: number;
    gider: number;
}

interface RevenueChartProps {
    data: RevenueData[];
    height?: number;
}

export function RevenueChart({ data, height = 300 }: RevenueChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorGelir" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorGider" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.danger} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS.danger} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted)" fontSize={12} />
                <YAxis stroke="var(--color-muted)" fontSize={12} tickFormatter={(v) => `₺${v / 1000}K`} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 8
                    }}
                    formatter={(value) => [`₺${Number(value).toLocaleString('tr-TR')}`, '']}
                />
                <Legend />
                <Area
                    type="monotone"
                    dataKey="gelir"
                    name="Gelir"
                    stroke={CHART_COLORS.success}
                    fillOpacity={1}
                    fill="url(#colorGelir)"
                />
                <Area
                    type="monotone"
                    dataKey="gider"
                    name="Gider"
                    stroke={CHART_COLORS.danger}
                    fillOpacity={1}
                    fill="url(#colorGider)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

// ===== PROJECT STATUS CHART (Pie) =====
interface ProjectStatusData {
    name: string;
    value: number;
    color?: string;
}

interface ProjectStatusChartProps {
    data: ProjectStatusData[];
    height?: number;
}

export function ProjectStatusChart({ data, height = 250 }: ProjectStatusChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={data as any}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 8
                    }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}

// ===== TASK COMPLETION CHART (Bar) =====
interface TaskData {
    name: string;
    tamamlanan: number;
    bekleyen: number;
}

interface TaskCompletionChartProps {
    data: TaskData[];
    height?: number;
}

export function TaskCompletionChart({ data, height = 250 }: TaskCompletionChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted)" fontSize={12} />
                <YAxis stroke="var(--color-muted)" fontSize={12} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 8
                    }}
                />
                <Legend />
                <Bar dataKey="tamamlanan" name="Tamamlanan" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
                <Bar dataKey="bekleyen" name="Bekleyen" fill={CHART_COLORS.warning} radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

// ===== DELIVERABLE TREND (Line) =====
interface DeliverableTrendData {
    week: string;
    teslimEdilen: number;
    revizyon: number;
}

interface DeliverableTrendChartProps {
    data: DeliverableTrendData[];
    height?: number;
}

export function DeliverableTrendChart({ data, height = 250 }: DeliverableTrendChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="week" stroke="var(--color-muted)" fontSize={12} />
                <YAxis stroke="var(--color-muted)" fontSize={12} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 8
                    }}
                />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="teslimEdilen"
                    name="Teslim Edilen"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                />
                <Line
                    type="monotone"
                    dataKey="revizyon"
                    name="Revizyon"
                    stroke={CHART_COLORS.warning}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

// ===== STUDIO OCCUPANCY (Horizontal Bar) =====
interface StudioData {
    day: string;
    saat: number;
    maxSaat: number;
}

interface StudioOccupancyChartProps {
    data: StudioData[];
    height?: number;
}

export function StudioOccupancyChart({ data, height = 200 }: StudioOccupancyChartProps) {
    const processedData = data.map(d => ({
        ...d,
        doluluk: Math.round((d.saat / d.maxSaat) * 100),
        bos: 100 - Math.round((d.saat / d.maxSaat) * 100),
    }));

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={processedData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" domain={[0, 100]} stroke="var(--color-muted)" fontSize={12} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="day" stroke="var(--color-muted)" fontSize={12} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 8
                    }}
                    formatter={(value, name) => [
                        `${value}%`,
                        name === 'doluluk' ? 'Dolu' : 'Boş'
                    ]}
                />
                <Bar dataKey="doluluk" name="Dolu" stackId="a" fill={CHART_COLORS.primary} />
                <Bar dataKey="bos" name="Boş" stackId="a" fill="var(--color-border)" />
            </BarChart>
        </ResponsiveContainer>
    );
}

// ===== MINI SPARKLINE =====
interface SparklineData {
    value: number;
}

interface SparklineProps {
    data: SparklineData[];
    color?: string;
    height?: number;
}

export function Sparkline({ data, color = CHART_COLORS.primary, height = 40 }: SparklineProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id={`sparkline-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#sparkline-${color.replace('#', '')})`}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export default {
    RevenueChart,
    ProjectStatusChart,
    TaskCompletionChart,
    DeliverableTrendChart,
    StudioOccupancyChart,
    Sparkline,
};
