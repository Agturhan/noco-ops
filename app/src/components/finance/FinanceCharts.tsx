'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { GlassSurface } from '@/components/ui/GlassSurface';

interface FinanceChartsProps {
    data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cashFlow: any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expenseBreakdown: any[];
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1C1C1E] border border-white/10 p-3 rounded-lg shadow-xl">
                <p className="text-white font-medium mb-2">{label}</p>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {payload.map((p: any) => (
                    <div key={p.name} className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-white/70">{p.name === 'income' ? 'Gelir' : 'Gider'}:</span>
                        <span className="text-white font-mono">
                            ₺{Number(p.value).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function FinanceCharts({ data }: FinanceChartsProps) {

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cash Flow Chart */}
            <div className="lg:col-span-2">
                <GlassSurface className="p-6 h-[400px] flex flex-col">
                    <h3 className="text-lg font-semibold text-white mb-6">Nakit Akışı (Son 6 Ay)</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.cashFlow} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#32D74B" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#32D74B" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FF453A" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#FF453A" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                                    tickFormatter={(value) => `₺${value / 1000}k`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                                <Area
                                    type="monotone"
                                    dataKey="income"
                                    name="income"
                                    stroke="#32D74B"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorIncome)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="expense"
                                    name="expense"
                                    stroke="#FF453A"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorExpense)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassSurface>
            </div>

            {/* Expense Breakdown */}
            <div className="lg:col-span-1">
                <GlassSurface className="p-6 h-[400px] flex flex-col">
                    <h3 className="text-lg font-semibold text-white mb-6">Gider Dağılımı (Bu Ay)</h3>
                    <div className="flex-1 w-full relative">
                        {data.expenseBreakdown.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.expenseBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data.expenseBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} stroke="rgba(0,0,0,0)" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1C1C1E', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value: number) => `₺${value.toLocaleString('tr-TR')}`}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value) => <span className="text-white/60 text-xs ml-1">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">
                                Bu ay henüz harcama yok.
                            </div>
                        )}

                        {/* Center Text for Total */}
                        {data.expenseBreakdown.length > 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                <span className="text-white/40 text-xs">Toplam</span>
                                <span className="text-white font-bold text-lg">
                                    ₺{data.expenseBreakdown.reduce((a, b) => a + b.value, 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                        )}
                    </div>
                </GlassSurface>
            </div>
        </div>
    );
}
