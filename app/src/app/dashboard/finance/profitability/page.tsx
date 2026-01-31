import { getProfitabilityStats } from '@/lib/actions/finance-profitability';
import ProfitabilityTable from '@/components/finance/ProfitabilityTable';
import { TrendingUp, ArrowDown } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProfitabilityPage(props: { searchParams: Promise<{ month?: string, year?: string }> }) {
    const searchParams = await props.searchParams;
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const selectedMonth = searchParams.month ? parseInt(searchParams.month) : currentMonth;
    const selectedYear = searchParams.year ? parseInt(searchParams.year) : currentYear;

    const stats = await getProfitabilityStats(selectedMonth, selectedYear);

    // Calculate totals
    const totalRevenue = stats.reduce((acc, s) => acc + s.revenue, 0);
    const totalCost = stats.reduce((acc, s) => acc + s.cost, 0);
    const totalProfit = totalRevenue - totalCost;
    const totalMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <TrendingUp className="text-[var(--accent)]" />
                        Kârlılık Raporu
                    </h1>
                    <p className="text-[var(--muted)] mt-1">
                        {selectedMonth}/{selectedYear} dönemi için müşteri bazlı kârlılık analizi.
                    </p>
                </div>
                {/* Date Picker could go here, simplified for now */}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="group p-5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:hover:bg-white/[0.05] transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/40 tracking-tight">Toplam Gelir</div>
                        <div className="p-2 rounded-lg bg-green-50 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalRevenue)}
                    </div>
                </div>

                <div className="group p-5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:hover:bg-white/[0.05] transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/40 tracking-tight">Toplam Maliyet</div>
                        <div className="p-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                            <ArrowDown size={16} /> {/* Importing ArrowDown elsewhere or use TrendingDown */}
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalCost)}
                    </div>
                </div>

                <div className="group p-5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:hover:bg-white/[0.05] transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-medium text-gray-500 dark:text-white/40 tracking-tight">Toplam Net Kâr</div>
                        <div className={`p-2 rounded-lg ${totalProfit >= 0 ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-orange-50 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400'}`}>
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    <div className="flex items-end gap-3">
                        <div className={`text-3xl font-bold tracking-tight ${totalProfit >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalProfit)}
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-semibold mb-1 ${totalMargin >= 0
                            ? 'bg-green-100/50 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                            : 'bg-red-100/50 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                            }`}>
                            %{totalMargin.toFixed(1)} Marj
                        </div>
                    </div>
                </div>
            </div>

            <ProfitabilityTable stats={stats} />
        </div>
    );
}
