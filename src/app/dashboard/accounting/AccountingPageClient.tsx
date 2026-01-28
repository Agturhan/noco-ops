'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Badge, Modal, Input, Select } from '@/components/ui';
import { RevenueChart, ProjectStatusChart } from '@/components/charts';
import { MagicBento } from '@/components/react-bits/MagicBento';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { StarBorder } from '@/components/react-bits/StarBorder';
import ShinyText from '@/components/react-bits/ShinyText';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Wallet, TrendingUp, TrendingDown, PieChart as PieChartIcon } from 'lucide-react';
import { getMonthlyFinancials, getExpensesByCategory, createIncome, createExpense, deleteIncome, deleteExpense, getRevenueByClient, seedExpenses, getIncomes, getExpenses } from '@/lib/actions/accounting';

// ===== TİPLER =====
interface HistoryEntry {
    date: string;
    field: string;
    oldValue: string;
    newValue: string;
}

interface Client {
    id: string;
    name: string;
    amount: number;
    paymentDay: number;
    type: 'fixed' | 'variable';
    period: string;
    schedule?: { period: string; amount: number; duration: string }[];
    history: HistoryEntry[];
}

interface Expense {
    id: string;
    title: string;
    amount: number;
    category: string;
    history: HistoryEntry[];
}

// Varsayılan Giderler (Geri Yüklendi)
const initialExpensesList = [
    { title: 'Kira', amount: 45000, category: 'OFFICE' },
    { title: 'Elektrik', amount: 3500, category: 'OFFICE' },
    { title: 'Su', amount: 2500, category: 'OFFICE' },
    { title: 'İnternet', amount: 800, category: 'OFFICE' },
    { title: 'Bağkur', amount: 15000, category: 'LEGAL' },
    { title: 'Stopaj', amount: 11250, category: 'LEGAL' },
    { title: 'Muhasebe Hizmet Bedeli', amount: 5000, category: 'LEGAL' },
    { title: 'Notion', amount: 510, category: 'SOFTWARE' },
    { title: 'ChatGPT', amount: 500, category: 'SOFTWARE' },
    { title: 'Netflix', amount: 300, category: 'SOFTWARE' },
    { title: 'Meta Verification (Mavi Tik)', amount: 259, category: 'SOFTWARE' },
    { title: 'Yeme - İçme', amount: 15000, category: 'OPERATIONAL' },
    { title: 'Diğer (Keyfi/Çeşitli)', amount: 2000, category: 'OPERATIONAL' },
];

// Gider Kategorileri
const expenseCategories = {
    OFFICE: { name: 'Ofis ve Altyapı Giderleri', icon: '🏢', color: '#329FF5' },
    LEGAL: { name: 'Yasal ve Mali Giderler', icon: '⚖️', color: '#FF4242' },
    SOFTWARE: { name: 'Yazılım ve Dijital Abonelikler', icon: '💻', color: '#00F5B0' },
    OPERATIONAL: { name: 'Operasyonel ve Diğer Giderler', icon: '🔧', color: '#F6D73C' },
    MARKETING: { name: 'Pazarlama', icon: '📢', color: '#9C27B0' },
    OTHER: { name: 'Diğer', icon: '📦', color: '#6B7B80' },
};

export function AccountingPageClient() {
    const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'expenses' | 'cashflow' | 'logs'>('overview');
    const [clients, setClients] = useState<Client[]>([]); // Incomes treated as 'Clients' for UI consistency
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [selectedMonth, setSelectedMonth] = useState('Ocak 2026');
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    // Form states
    const [formName, setFormName] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [formPaymentDay, setFormPaymentDay] = useState('1');
    const [formCategory, setFormCategory] = useState('OFFICE');

    // Load Data
    const loadData = async () => {
        setLoading(true);
        try {
            const date = new Date();
            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            // Fetch Financials
            const financials = await getMonthlyFinancials(year, month);

            // Fetch Lists
            const [dbIncomes, dbExpenses] = await Promise.all([
                getIncomes(year, month),
                getExpenses(year, month)
            ]);

            // Map Incomes to Client Interface (UI Compatibility)
            const mappedIncomes: Client[] = dbIncomes.map((inc: any) => ({
                id: inc.id,
                name: inc.title || 'Gelir',
                amount: inc.amount,
                paymentDay: new Date(inc.date).getDate(),
                type: 'fixed',
                period: 'Tek Seferlik',
                history: []
            }));
            setClients(mappedIncomes);

            // Map Expenses
            const mappedExpenses: Expense[] = dbExpenses.map((exp: any) => ({
                id: exp.id,
                title: exp.title,
                amount: exp.amount,
                category: exp.category,
                history: []
            }));
            setExpenses(mappedExpenses);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadData();
    }, []);

    const handleSeedExpenses = async () => {
        if (confirm('Varsayılan gider kalemleri (Kira, Elektrik, Abonelikler vb.) eklensin mi? mevcutta ekliyse mükerrer olabilir.')) {
            await seedExpenses(initialExpensesList);
            alert('Giderler eklendi!');
            loadData();
        }
    };

    // Hesaplamalar
    const totalMonthlyIncome = clients.reduce((sum, c) => sum + c.amount, 0);
    const totalMonthlyExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalMonthlyIncome - totalMonthlyExpenses;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
    };

    // ===== GELİR İŞLEMLERİ =====
    const openAddIncome = () => {
        setEditingClient(null);
        setFormName('');
        setFormAmount('');
        setFormPaymentDay('1');
        setShowIncomeModal(true);
    };

    const saveIncome = async () => {
        if (!formName || !formAmount) return;
        try {
            await createIncome({
                title: formName,
                amount: parseFloat(formAmount),
                source: 'Manual',
                date: new Date().toISOString()
            });
            setShowIncomeModal(false);
            loadData(); // Refresh
        } catch (e) {
            alert('Gelir eklenirken hata oluştu.');
        }
    };

    const handleDeleteIncome = async (id: string) => {
        if (confirm('Silmek istediğinize emin misiniz?')) {
            // We need real IDs from DB to delete. mappedClients use fake IDs currently.
            // This requires `getIncomes` implementation to work 100%.
            alert('Bu özellik için gelir listeleme endpointi güncellenmelidir.');
        }
    };

    // ===== GİDER İŞLEMLERİ =====
    const openAddExpense = () => {
        setEditingExpense(null);
        setFormName('');
        setFormAmount('');
        setFormCategory('OFFICE');
        setShowExpenseModal(true);
    };

    const saveExpense = async () => {
        if (!formName || !formAmount) return;
        try {
            await createExpense({
                title: formName,
                amount: parseFloat(formAmount),
                category: formCategory as any,
                Date: new Date().toISOString()
            });
            setShowExpenseModal(false);
            loadData(); // Refresh
        } catch (e) {
            console.error(e);
            alert('Gider eklenirken hata oluştu.');
        }
    };

    // ... (Charts and render logic remains mostly same, using state variables)

    return (
        <div className="p-4 md:p-6 min-h-screen pt-6 text-white">
            {/* HEADER */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
                        Muhasebe
                    </h1>
                    <div className="text-white/40 text-sm font-medium tracking-wide">
                        Noco Studio - Aylık Nakit Akışı
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleSeedExpenses} className="text-white/40 hover:text-white border border-white/5 hover:bg-white/10">
                        📥 Varsayılanları Yükle
                    </Button>
                    <div className="h-6 w-px bg-white/10 mx-2" />
                    <Select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-white/5 border-none text-white w-[140px] rounded-xl h-[40px]"
                        options={[
                            { value: 'Ocak 2026', label: 'Ocak 2026' },
                            { value: 'Şubat 2026', label: 'Şubat 2026' },
                            { value: 'Mart 2026', label: 'Mart 2026' },
                        ]}
                    />
                    <Button
                        onClick={openAddIncome}
                        className="h-[40px] px-5 bg-[#30D158]/20 text-[#30D158] hover:bg-[#30D158]/30 border border-[#30D158]/50 rounded-xl font-semibold transition-all hover:scale-105"
                    >
                        + Gelir
                    </Button>
                    <Button
                        onClick={openAddExpense}
                        className="h-[40px] px-5 bg-[#FF453A]/20 text-[#FF453A] hover:bg-[#FF453A]/30 border border-[#FF453A]/50 rounded-xl font-semibold transition-all hover:scale-105"
                    >
                        + Gider
                    </Button>
                </div>
            </div>

            <MagicBento gap={24}>
                {/* 1. NET PROFIT (Big Card) */}
                <div className="md:col-span-4 lg:col-span-3 group relative rounded-[24px] overflow-hidden h-full min-h-[160px] shadow-sm">
                    <StarBorder color="#2997FF" speed="4s" />
                    <GlassSurface className="h-full w-full flex flex-col justify-between p-6" intensity="medium">
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] font-medium text-white/50 uppercase tracking-widest">Net Kâr</span>
                            <div className={`p-2 rounded-full ${netProfit >= 0 ? 'bg-[#30D158]/20 text-[#30D158]' : 'bg-[#FF453A]/20 text-[#FF453A]'}`}>
                                {netProfit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                            </div>
                        </div>
                        <div>
                            {/* Auto-scale text based on length */}
                            <div className={`font-bold text-white tracking-tight ${formatCurrency(netProfit).length > 10 ? 'text-2xl' : 'text-4xl'}`}>
                                {formatCurrency(netProfit)}
                            </div>
                            <div className="text-[12px] text-white/40 mt-1 font-medium">Bu ayki toplam kar</div>
                        </div>
                    </GlassSurface>
                </div>

                {/* 2. INCOME (Medium Card) */}
                <div className="md:col-span-4 lg:col-span-3 group relative rounded-[24px] overflow-hidden h-full min-h-[160px] shadow-sm">
                    <GlassSurface className="h-full w-full flex flex-col justify-between p-6" intensity="low">
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] font-medium text-white/50 uppercase tracking-widest">Gelirler</span>
                            <div className="p-2 rounded-full bg-[#30D158]/10 text-[#30D158]">
                                <Wallet size={18} />
                            </div>
                        </div>
                        <div>
                            <div className={`font-bold text-white tracking-tight ${formatCurrency(totalMonthlyIncome).length > 10 ? 'text-2xl' : 'text-3xl'}`}>
                                {formatCurrency(totalMonthlyIncome)}
                            </div>
                            <div className="text-[12px] text-[#30D158] mt-1 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#30D158]" /> Aktif Giriş
                            </div>
                        </div>
                    </GlassSurface>
                </div>

                {/* 3. EXPENSE (Medium Card) */}
                <div className="md:col-span-4 lg:col-span-3 group relative rounded-[24px] overflow-hidden h-full min-h-[160px] shadow-sm">
                    <GlassSurface className="h-full w-full flex flex-col justify-between p-6" intensity="low">
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] font-medium text-white/50 uppercase tracking-widest">Giderler</span>
                            <div className="p-2 rounded-full bg-[#FF453A]/10 text-[#FF453A]">
                                <PieChartIcon size={18} />
                            </div>
                        </div>
                        <div>
                            <div className={`font-bold text-white tracking-tight ${formatCurrency(totalMonthlyExpenses).length > 10 ? 'text-2xl' : 'text-3xl'}`}>
                                {formatCurrency(totalMonthlyExpenses)}
                            </div>
                            <div className="text-[12px] text-[#FF453A] mt-1 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FF453A]" /> Toplam Harcama
                            </div>
                        </div>
                    </GlassSurface>
                </div>

                {/* 4. CHARTS & LISTS GRID */}
                <div className="md:col-span-12 lg:col-span-9 h-full min-h-[500px] flex flex-col gap-6">
                    {/* INCOME LIST */}
                    <GlassSurface className="w-full rounded-[24px] p-6" intensity="low">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <span className="w-1 h-5 rounded-full bg-[#30D158]" />
                                Gelir Kalemleri
                            </h3>
                            <span className="text-xs text-white/30 font-mono bg-white/5 px-2 py-1 rounded-md">{clients.length} Kayıt</span>
                        </div>

                        {/* Headers */}
                        <div className="flex items-center justify-between px-4 text-[11px] font-medium text-white/30 uppercase tracking-wider mb-2">
                            <div className="flex-1">Kaynak</div>
                            <div className="hidden md:block w-32 text-center">Tarih</div>
                            <div className="w-[120px] text-right">Tutar</div>
                        </div>

                        <div className="flex flex-col gap-2">
                            {clients.length > 0 ? clients.map((client) => (
                                <div key={client.id} className="group flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] transition-colors cursor-default">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#30D158]/20 to-[#30D158]/5 flex items-center justify-center text-[#30D158] font-bold text-sm">
                                            {client.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white text-[15px]">{client.name}</div>
                                            <div className="text-xs text-white/40">{client.period}</div>
                                        </div>
                                    </div>

                                    {/* Center Details */}
                                    <div className="hidden md:flex w-32 justify-center text-xs text-white/50 bg-white/5 px-2 py-1 rounded-md font-mono">
                                        {client.paymentDay} {selectedMonth.split(' ')[0]}
                                    </div>

                                    <div className="text-right w-[120px]">
                                        <div className="font-semibold text-white text-[15px]">{formatCurrency(client.amount)}</div>
                                        <div className="text-[10px] text-[#30D158] bg-[#30D158]/10 px-1.5 py-0.5 rounded inline-block mt-0.5">TAHSİL EDİLDİ</div>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-12 text-center text-white/20 text-sm">Henüz gelir kaydı yok.</div>
                            )}
                        </div>
                    </GlassSurface>

                    {/* EXPENSE LIST */}
                    <GlassSurface className="w-full rounded-[24px] p-6" intensity="low">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <span className="w-1 h-5 rounded-full bg-[#FF453A]" />
                                Gider Kalemleri
                            </h3>
                            <span className="text-xs text-white/30 font-mono bg-white/5 px-2 py-1 rounded-md">{expenses.length} Kayıt</span>
                        </div>

                        {/* Headers */}
                        <div className="flex items-center justify-between px-4 text-[11px] font-medium text-white/30 uppercase tracking-wider mb-2">
                            <div className="flex-1">Kalem</div>
                            <div className="hidden md:block w-32 text-center">Kategori</div>
                            <div className="w-[120px] text-right">Tutar</div>
                        </div>

                        <div className="flex flex-col gap-2">
                            {expenses.length > 0 ? expenses.map((exp) => {
                                const cat = expenseCategories[exp.category as keyof typeof expenseCategories] || expenseCategories.OTHER;
                                return (
                                    <div key={exp.id} className="group flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] transition-colors cursor-default">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl relative overflow-hidden">
                                                <div className="absolute inset-0 opacity-20" style={{ backgroundColor: cat.color }} />
                                                {cat.icon}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white text-[15px]">{exp.title}</div>
                                                <div className="text-xs text-white/30 font-mono">ID: #{exp.id.substring(0, 4)}</div>
                                            </div>
                                        </div>

                                        {/* Category Badge */}
                                        <div className="hidden md:flex w-32 justify-center">
                                            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-white/5 flex items-center gap-1.5 w-full justify-center" style={{ backgroundColor: `${cat.color}10`, color: cat.color, borderColor: `${cat.color}20` }}>
                                                {cat.name}
                                            </span>
                                        </div>

                                        <div className="text-right w-[120px]">
                                            <div className="font-semibold text-white text-[15px]">{formatCurrency(exp.amount)}</div>
                                            <div className="flex justify-end gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="text-[10px] text-white/30 hover:text-[#FF453A] transition-colors" onClick={() => { }}>Sil</button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="py-12 text-center text-white/20 text-sm">Henüz gider kaydı yok.</div>
                            )}
                        </div>
                    </GlassSurface>
                </div>

                {/* SIDEBAR */}
                <div className="md:col-span-12 lg:col-span-3 flex flex-col gap-6">
                    <GlassSurface className="p-6 rounded-[24px]" intensity="medium">
                        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4">Gider Dağılımı</h3>

                        <div className="space-y-5">
                            {Object.entries(expenseCategories).map(([key, cat]) => {
                                const catTotal = expenses.filter(e => e.category === key).reduce((s, e) => s + e.amount, 0);
                                const percentage = totalMonthlyExpenses > 0 ? (catTotal / totalMonthlyExpenses) * 100 : 0;

                                if (percentage === 0) return null;

                                return (
                                    <div key={key}>
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-white/90 font-medium flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                                {cat.name}
                                            </span>
                                            <span className="font-mono text-white/60 text-[10px]">{percentage.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex gap-[1px]">
                                            {/* Segmented bar visual */}
                                            {Array.from({ length: 20 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="flex-1 h-full rounded-[0.5px]"
                                                    style={{
                                                        backgroundColor: i < (percentage / 5) ? cat.color : 'transparent',
                                                        opacity: i < (percentage / 5) ? 1 : 0.1
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <div className="text-[11px] text-white/40 mt-1 pl-3.5">{formatCurrency(catTotal)}</div>
                                    </div>
                                );
                            })}

                            {totalMonthlyExpenses === 0 && (
                                <div className="text-center py-8 text-white/20 text-xs bg-white/5 rounded-xl border border-white/5 border-dashed">
                                    Analiz için veri bekleniyor...
                                </div>
                            )}
                        </div>
                    </GlassSurface>

                    <GlassSurface className="p-6 rounded-[24px]" intensity="medium">
                        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4">Finansal Notlar</h3>
                        <div className="space-y-3">
                            <div className="flex gap-3 items-start p-3 rounded-xl bg-[#30D158]/5 border border-[#30D158]/10">
                                <div className="text-[#30D158] mt-0.5"><TrendingUp size={14} /></div>
                                <div className="text-xs text-white/60 leading-relaxed">
                                    Gelir hedefinin <strong className="text-[#30D158]">78%</strong>'ine ulaşıldı. Geçen aya göre artış var.
                                </div>
                            </div>
                            <div className="flex gap-3 items-start p-3 rounded-xl bg-[#FF453A]/5 border border-[#FF453A]/10">
                                <div className="text-[#FF453A] mt-0.5"><PieChartIcon size={14} /></div>
                                <div className="text-xs text-white/60 leading-relaxed">
                                    Ofis giderleri bütçenin <strong className="text-[#FF453A]">45%</strong>'ini oluşturuyor.
                                </div>
                            </div>
                        </div>
                    </GlassSurface>
                </div>
            </MagicBento>

            {/* Modals reuse same structure but with dark theme styling needed? 
                Modals currently use standard UI which might be light/dark adaptive. 
                Assuming they work fine overlaying this. 
            */}
            <Modal
                isOpen={showIncomeModal}
                onClose={() => setShowIncomeModal(false)}
                title="Yeni Gelir Ekle"
                size="md"
                footer={<><Button className="bg-white/10 hover:bg-white/20 text-white border-none" onClick={() => setShowIncomeModal(false)}>İptal</Button><Button className="bg-[#30D158] hover:bg-[#30D158]/80 text-black border-none" onClick={saveIncome}>Kaydet</Button></>}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <Input label="Müşteri / Kaynak" value={formName} onChange={(e) => setFormName(e.target.value)} className="bg-black/20 border-white/10 text-white" />
                    <Input label="Tutar" type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} className="bg-black/20 border-white/10 text-white" />
                </div>
            </Modal>

            <Modal
                isOpen={showExpenseModal}
                onClose={() => setShowExpenseModal(false)}
                title="Yeni Gider Ekle"
                size="md"
                footer={<><Button className="bg-white/10 hover:bg-white/20 text-white border-none" onClick={() => setShowExpenseModal(false)}>İptal</Button><Button className="bg-[#FF453A] hover:bg-[#FF453A]/80 text-white border-none" onClick={saveExpense}>Kaydet</Button></>}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <Input label="Gider Başlığı" value={formName} onChange={(e) => setFormName(e.target.value)} className="bg-black/20 border-white/10 text-white" />
                    <Input label="Tutar" type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} className="bg-black/20 border-white/10 text-white" />
                    <Select
                        label="Kategori"
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="bg-black/20 border-white/10 text-white"
                        options={Object.entries(expenseCategories).map(([key, cat]) => ({
                            value: key,
                            label: cat.name
                        }))}
                    />
                </div>
            </Modal>
        </div>
    );
}
