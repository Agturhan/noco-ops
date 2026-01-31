'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { getFinancialSummary, getTransactions, getFinanceChartData, type FinanceSummary, type FinanceTransaction } from '@/lib/actions/finance';
import { Wallet, TrendingUp, Clock, ArrowUpRight, ArrowDownLeft, Landmark, CreditCard, Banknote } from 'lucide-react';
import { AddTransactionModal } from '@/components/finance/AddTransactionModal';
import Link from 'next/link';
import nextDynamic from 'next/dynamic';

const FinanceCharts = nextDynamic(() => import('@/components/finance/FinanceCharts').then(mod => mod.FinanceCharts), {
    ssr: false,
});

import { Suspense } from 'react';

export default function FinancePageClient() {
    return (
        <Suspense fallback={<div className="p-8 text-white/50">Yükleniyor...</div>}>
            <FinanceContent />
        </Suspense>
    );
}

function FinanceContent() {
    const [summary, setSummary] = useState<FinanceSummary | null>(null);
    const [recentTx, setRecentTx] = useState<FinanceTransaction[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [chartData, setChartData] = useState<{ cashFlow: any[], expenseBreakdown: any[] }>({ cashFlow: [], expenseBreakdown: [] });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadData = async () => {
        try {
            const [sumData, txData, cData] = await Promise.all([
                getFinancialSummary(),
                getTransactions(10),
                getFinanceChartData()
            ]);
            setSummary(sumData);
            setRecentTx(txData);
            setChartData(cData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) return <div className="p-8 text-white/50">Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-[#0A0A0A] p-6 lg:p-8 space-y-8">
            <AddTransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadData}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Finans Yönetimi</h1>
                    <p className="text-white/50 mt-1">Nakit akışı ve karlılık takibi</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" className="border border-white/10 bg-transparent text-white hover:bg-white/5">
                        <Clock size={16} className="mr-2 opacity-70" />
                        Raporlar
                    </Button>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[#2997FF] hover:bg-[#2997FF]/90 text-white border-none shadow-[0_0_20px_rgba(41,151,255,0.3)]"
                    >
                        + İşlem Ekle
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassSurface className="p-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet size={48} />
                    </div>
                    <p className="text-sm font-medium text-white/50 mb-1">Toplam Varlık</p>
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                        ₺{summary?.totalBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </h2>
                    <div className="mt-4 flex items-center text-xs text-white/40">
                        <span className="text-[#32D74B] flex items-center gap-1 bg-[#32D74B]/10 px-1.5 py-0.5 rounded">
                            <TrendingUp size={12} /> +12%
                        </span>
                        <span className="ml-2">geçen aya göre</span>
                    </div>
                </GlassSurface>

                <GlassSurface className="p-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ArrowUpRight size={48} className="text-[#32D74B]" />
                    </div>
                    <p className="text-sm font-medium text-white/50 mb-1">Aylık Gelir</p>
                    <h2 className="text-3xl font-bold text-[#32D74B] tracking-tight">
                        +₺{summary?.monthlyIncome.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </h2>
                    <p className="mt-4 text-xs text-white/40">Bu ay onaylanan girişler</p>
                </GlassSurface>

                <GlassSurface className="p-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ArrowDownLeft size={48} className="text-[#FF453A]" />
                    </div>
                    <p className="text-sm font-medium text-white/50 mb-1">Aylık Gider</p>
                    <h2 className="text-3xl font-bold text-[#FF453A] tracking-tight">
                        -₺{summary?.monthlyExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </h2>
                    <p className="mt-4 text-xs text-white/40">Bu ay yapılan harcamalar</p>
                </GlassSurface>

                <GlassSurface className="p-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock size={48} className="text-[#BF5AF2]" />
                    </div>
                    <p className="text-sm font-medium text-white/50 mb-1">Bekleyen Tahsilat</p>
                    <h2 className="text-3xl font-bold text-[#BF5AF2] tracking-tight">
                        ₺{summary?.pendingIncome.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </h2>
                    <p className="mt-4 text-xs text-white/40">Faturalandırılmış, ödenmemiş</p>
                </GlassSurface>
            </div>

            {/* Charts */}
            <FinanceCharts data={chartData} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Accounts & Quick Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <GlassSurface className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-6">Hesaplar</h3>
                        <div className="space-y-4">
                            {summary?.accounts.map(acc => (
                                <div key={acc.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${acc.type === 'BANK' ? 'bg-blue-500/20 text-blue-400' :
                                            acc.type === 'CREDIT_CARD' ? 'bg-purple-500/20 text-purple-400' :
                                                'bg-green-500/20 text-green-400'
                                            }`}>
                                            {acc.type === 'BANK' ? <Landmark size={18} /> :
                                                acc.type === 'CREDIT_CARD' ? <CreditCard size={18} /> : <Banknote size={18} />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">{acc.name}</div>
                                            <div className="text-xs text-white/40">{acc.type === 'BANK' ? 'Banka' : acc.type === 'CREDIT_CARD' ? 'Kredi Kartı' : 'Kasa'}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-white">
                                            {acc.currency === 'USD' ? '$' : acc.currency === 'EUR' ? '€' : '₺'}
                                            {acc.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" className="w-full mt-4 text-xs text-white/40 hover:text-white">
                            Tüm Hesapları Gör
                        </Button>
                    </GlassSurface>
                </div>

                {/* Right: Recent Transactions */}
                <div className="lg:col-span-2">
                    <GlassSurface className="h-full flex flex-col">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Son İşlemler</h3>
                            <Link href="/dashboard/finance/transactions" className="text-xs text-[#2997FF] hover:underline">Tümünü Gör</Link>
                        </div>
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-[11px] uppercase tracking-wider text-white/40 font-medium bg-white/[0.02]">
                                    <tr>
                                        <th className="px-6 py-3">Tarih</th>
                                        <th className="px-6 py-3">Açıklama</th>
                                        <th className="px-6 py-3">Kategori</th>
                                        <th className="px-6 py-3 text-right">Tutar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {recentTx.length > 0 ? recentTx.map(tx => (
                                        <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4 text-sm text-white/60">
                                                {new Date(tx.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-white font-medium">{tx.description || 'İsimsiz İşlem'}</div>
                                                <div className="text-xs text-white/30">{tx.account?.name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {tx.category && (
                                                    <span className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-white/70 border border-white/5" style={{ color: tx.category.color, borderColor: tx.category.color + '20', backgroundColor: tx.category.color + '10' }}>
                                                        {tx.category.name}
                                                    </span>
                                                )}
                                            </td>
                                            <td className={`px-6 py-4 text-sm font-bold text-right ${Number(tx.amount) > 0 ? 'text-[#32D74B]' : 'text-white'}`}>
                                                {Number(tx.amount) > 0 ? '+' : ''}
                                                {Number(tx.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-white/30 text-sm">
                                                Henüz işlem kaydı yok.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </GlassSurface>
                </div>
            </div>
        </div>
    );
}
