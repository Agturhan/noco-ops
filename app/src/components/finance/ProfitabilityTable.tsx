'use client';

import { useState, Fragment } from 'react';
import { ArrowDown, ArrowUp, Minus, TrendingUp, ChevronDown, ChevronRight, User } from 'lucide-react';

interface ProfitabilityStat {
    clientId: string;
    clientName: string;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
    totalHours: number;
    hourlyRevenue: number;
    breakdown: {
        userId: string;
        userName: string;
        role: string;
        hours: number;
        cost: number;
    }[];
    taskBreakdown: {
        taskId: string;
        taskTitle: string;
        contentType: string;
        hours: number;
        cost: number;
    }[];
}

export default function ProfitabilityTable({ stats }: { stats: ProfitabilityStat[] }) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = (clientId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(clientId)) {
            newExpanded.delete(clientId);
        } else {
            newExpanded.add(clientId);
        }
        setExpandedRows(newExpanded);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
    };

    const formatNumber = (val: number) => {
        return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(val);
    };

    return (
        <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none backdrop-blur-xl transition-all duration-300">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-white/5 bg-gray-100/50 dark:bg-white/[0.02]">
                            <th className="w-10 px-5 py-4"></th>
                            <th className="px-5 py-4 text-left font-semibold text-gray-500 dark:text-white/40 tracking-tight">Müşteri</th>
                            <th className="px-5 py-4 text-right font-semibold text-gray-500 dark:text-white/40 tracking-tight">Efor</th>
                            <th className="px-5 py-4 text-right font-semibold text-gray-500 dark:text-white/40 tracking-tight">Gelir (Retainer)</th>
                            <th className="px-5 py-4 text-right font-semibold text-gray-500 dark:text-white/40 tracking-tight">Maliyet</th>
                            <th className="px-5 py-4 text-right font-semibold text-gray-500 dark:text-white/40 tracking-tight">Net Kâr</th>
                            <th className="px-5 py-4 text-right font-semibold text-gray-500 dark:text-white/40 tracking-tight">Marj</th>
                            <th className="px-5 py-4 text-right font-semibold text-gray-500 dark:text-white/40 tracking-tight">
                                <div className="flex items-center justify-end gap-1">
                                    <span>Saatlik Getiri</span>
                                    <TrendingUp size={12} className="opacity-50" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {stats.map((stat) => (
                            <Fragment key={stat.clientId}>
                                <tr
                                    className="group hover:bg-gray-100/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                                    onClick={() => toggleRow(stat.clientId)}
                                >
                                    <td className="px-5 py-4 text-gray-400 dark:text-white/30">
                                        {expandedRows.has(stat.clientId) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </td>
                                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                                        {stat.clientName}
                                    </td>
                                    <td className="px-5 py-4 text-right text-gray-500 dark:text-white/40 tabular-nums">
                                        {formatNumber(stat.totalHours)} s
                                    </td>
                                    <td className="px-5 py-4 text-right text-gray-900 dark:text-white/90 tabular-nums font-medium">
                                        {formatCurrency(stat.revenue)}
                                    </td>
                                    <td className="px-5 py-4 text-right text-gray-500 dark:text-white/50 tabular-nums">
                                        {formatCurrency(stat.cost)}
                                    </td>
                                    <td className={`px-5 py-4 text-right font-bold tabular-nums ${stat.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {formatCurrency(stat.profit)}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${stat.margin >= 50
                                            ? 'bg-green-100/50 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                                            stat.margin >= 20
                                                ? 'bg-blue-100/50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                                                stat.margin >= 0
                                                    ? 'bg-yellow-100/50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400' :
                                                    'bg-red-100/50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                                            }`}>
                                            {stat.margin > 0 ? <ArrowUp size={10} /> : stat.margin < 0 ? <ArrowDown size={10} /> : <Minus size={10} />}
                                            %{formatNumber(stat.margin)}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right font-semibold text-gray-900 dark:text-white tabular-nums">
                                        {formatCurrency(stat.hourlyRevenue)}/s
                                    </td>
                                </tr>
                                {/* Breakdown Row */}
                                {expandedRows.has(stat.clientId) && (
                                    <tr className="bg-gray-100/30 dark:bg-white/[0.01]">
                                        <td colSpan={8} className="px-5 py-4 pl-4 md:pl-16">
                                            <DetailBreakdown stat={stat} />
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        ))}
                        {stats.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-4 py-12 text-center text-gray-400 dark:text-white/30 text-sm">
                                    Bu dönem için veri bulunamadı.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-200 dark:border-white/5 bg-gray-100/50 dark:bg-white/[0.02] text-xs text-gray-400 dark:text-white/30 flex justify-between items-center">
                <span>Saatlik verimlilik analizi</span>
                <span>Otomatik hesaplanır</span>
            </div>
        </div>
    );
}

function DetailBreakdown({ stat }: { stat: ProfitabilityStat }) {
    const [activeTab, setActiveTab] = useState<'personnel' | 'tasks'>('personnel');

    const formatCurrency = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
    const formatNumber = (val: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(val);

    return (
        <div>
            {/* Tabs */}
            <div className="flex items-center gap-4 mb-4 border-b border-gray-200 dark:border-white/5">
                <button
                    onClick={() => setActiveTab('personnel')}
                    className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors relative ${activeTab === 'personnel'
                        ? 'text-[var(--accent)]'
                        : 'text-gray-400 dark:text-white/30 hover:text-[var(--ink)]'
                        }`}
                >
                    Personel Dağılımı
                    {activeTab === 'personnel' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent)] rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors relative ${activeTab === 'tasks'
                        ? 'text-[var(--accent)]'
                        : 'text-gray-400 dark:text-white/30 hover:text-[var(--ink)]'
                        }`}
                >
                    İçerik/Görev Dağılımı
                    {activeTab === 'tasks' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent)] rounded-t-full" />
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="min-h-[100px]">
                {activeTab === 'personnel' && (
                    stat.breakdown.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stat.breakdown.map((user) => (
                                <div key={user.userId} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-white/5 bg-white dark:bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                                            <User size={14} className="text-gray-500 dark:text-white/50" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                                                {user.userName}
                                            </div>
                                            <div className="text-[10px] text-gray-400 dark:text-white/30 uppercase">
                                                {user.role}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                                            {formatNumber(user.hours)} saat
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-white/40">
                                            {formatCurrency(user.cost)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-400 dark:text-white/30 italic">
                            Bu dönemde kaydedilmiş personel eforu yok.
                        </div>
                    )
                )}

                {activeTab === 'tasks' && (
                    stat.taskBreakdown && stat.taskBreakdown.length > 0 ? (
                        <div className="space-y-2">
                            {stat.taskBreakdown.map((task) => (
                                <div key={task.taskId} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-white/5 bg-white dark:bg-white/5 group hover:border-[var(--accent)]/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--surface-active)] text-[var(--accent)] flex items-center justify-center font-bold text-xs ring-1 ring-inset ring-[var(--accent)]/20">
                                            {task.contentType ? task.contentType.substring(0, 2) : '??'}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                                                {task.taskTitle}
                                            </div>
                                            <div className="text-[10px] text-gray-400 dark:text-white/30 uppercase">
                                                {task.contentType || 'Genel'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500 dark:text-white/40">Süre</div>
                                            <div className="font-medium text-gray-900 dark:text-white text-sm tabular-nums">
                                                {formatNumber(task.hours)} s
                                            </div>
                                        </div>
                                        <div className="text-right min-w-[80px]">
                                            <div className="text-xs text-gray-500 dark:text-white/40">Maliyet</div>
                                            <div className="font-bold text-gray-900 dark:text-white text-sm tabular-nums">
                                                {formatCurrency(task.cost)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-400 dark:text-white/30 italic">
                            Bu dönemde maliyet oluşturan görev kaydı bulunamadı.
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
