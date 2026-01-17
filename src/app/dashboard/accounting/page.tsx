'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Badge, Modal, Input, Select } from '@/components/ui';
import { RevenueChart, ProjectStatusChart } from '@/components/charts';

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

// ===== BAŞLANGIÇ VERİLERİ =====
const initialClients: Client[] = [
    { id: '1', name: 'Zeytindalı', amount: 50000, paymentDay: 1, type: 'fixed', period: 'Aylık', history: [] },
    { id: '2', name: 'İkranur', amount: 50000, paymentDay: 1, type: 'fixed', period: 'Aylık', history: [] },
    { id: '3', name: 'Louvess', amount: 50000, paymentDay: 1, type: 'fixed', period: 'Aylık', history: [] },
    { id: '4', name: 'Valora', amount: 10000, paymentDay: 1, type: 'fixed', period: 'Aylık', history: [] },
    { id: '5', name: 'Ali Haydar', amount: 15000, paymentDay: 15, type: 'fixed', period: 'Aylık', history: [] },
    {
        id: '6', name: 'Tevfik Usta', amount: 40000, paymentDay: 15, type: 'variable', period: 'Dönemsel',
        schedule: [
            { period: 'Aralık - Ocak', amount: 35000, duration: '1 Ay' },
            { period: 'Ocak - Nisan', amount: 40000, duration: '3 Ay' },
            { period: 'Nisan - Temmuz', amount: 45000, duration: '3 Ay' },
            { period: 'Temmuz+', amount: 50000, duration: '6 Ay' },
        ], history: []
    },
];

const initialExpenses: Expense[] = [
    { id: '1', title: 'Kira', amount: 45000, category: 'OFFICE', history: [] },
    { id: '2', title: 'Elektrik', amount: 3500, category: 'OFFICE', history: [] },
    { id: '3', title: 'Su', amount: 2500, category: 'OFFICE', history: [] },
    { id: '4', title: 'İnternet', amount: 800, category: 'OFFICE', history: [] },
    { id: '5', title: 'Bağkur', amount: 15000, category: 'LEGAL', history: [] },
    { id: '6', title: 'Stopaj', amount: 11250, category: 'LEGAL', history: [] },
    { id: '7', title: 'Muhasebe Hizmet Bedeli', amount: 5000, category: 'LEGAL', history: [] },
    { id: '8', title: 'Notion', amount: 510, category: 'SOFTWARE', history: [] },
    { id: '9', title: 'ChatGPT', amount: 500, category: 'SOFTWARE', history: [] },
    { id: '10', title: 'Netflix', amount: 300, category: 'SOFTWARE', history: [] },
    { id: '11', title: 'Meta Verification (Mavi Tik)', amount: 259, category: 'SOFTWARE', history: [] },
    { id: '12', title: 'Yeme - İçme', amount: 15000, category: 'OPERATIONAL', history: [] },
    { id: '13', title: 'Diğer (Keyfi/Çeşitli)', amount: 2000, category: 'OPERATIONAL', history: [] },
];

// Gider Kategorileri
const expenseCategories = {
    OFFICE: { name: 'Ofis ve Altyapı Giderleri', icon: '🏢', color: '#329FF5' },
    LEGAL: { name: 'Yasal ve Mali Giderler', icon: '⚖️', color: '#FF4242' },
    SOFTWARE: { name: 'Yazılım ve Dijital Abonelikler', icon: '💻', color: '#00F5B0' },
    OPERATIONAL: { name: 'Operasyonel ve Diğer Giderler', icon: '🔧', color: '#F6D73C' },
};

export default function AccountingPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'expenses' | 'cashflow' | 'logs'>('overview');
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
    const [selectedMonth, setSelectedMonth] = useState('Ocak 2026');

    // Modal states
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [viewingHistory, setViewingHistory] = useState<HistoryEntry[]>([]);
    const [historyTitle, setHistoryTitle] = useState('');

    // Form states
    const [formName, setFormName] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [formPaymentDay, setFormPaymentDay] = useState('1');
    const [formCategory, setFormCategory] = useState('OFFICE');

    // ID counter
    const [nextId, setNextId] = useState(100);
    const getId = () => { const id = nextId; setNextId(nextId + 1); return id.toString(); };

    // Hesaplamalar
    const totalMonthlyIncome = clients.reduce((sum, c) => sum + c.amount, 0);
    const totalMonthlyExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalMonthlyIncome - totalMonthlyExpenses;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
    };

    const formatDate = () => new Date().toLocaleString('tr-TR');

    // ===== GELİR İŞLEMLERİ =====
    const openAddIncome = () => {
        setEditingClient(null);
        setFormName('');
        setFormAmount('');
        setFormPaymentDay('1');
        setShowIncomeModal(true);
    };

    const openEditIncome = (client: Client) => {
        setEditingClient(client);
        setFormName(client.name);
        setFormAmount(client.amount.toString());
        setFormPaymentDay(client.paymentDay.toString());
        setShowIncomeModal(true);
    };

    const saveIncome = () => {
        if (!formName || !formAmount) return;

        if (editingClient) {
            // Düzenleme - geçmiş kaydet
            const changes: HistoryEntry[] = [];
            if (editingClient.name !== formName) {
                changes.push({ date: formatDate(), field: 'İsim', oldValue: editingClient.name, newValue: formName });
            }
            if (editingClient.amount !== parseInt(formAmount)) {
                changes.push({ date: formatDate(), field: 'Tutar', oldValue: formatCurrency(editingClient.amount), newValue: formatCurrency(parseInt(formAmount)) });
            }
            if (editingClient.paymentDay !== parseInt(formPaymentDay)) {
                changes.push({ date: formatDate(), field: 'Ödeme Günü', oldValue: editingClient.paymentDay.toString(), newValue: formPaymentDay });
            }

            setClients(clients.map(c => c.id === editingClient.id ? {
                ...c,
                name: formName,
                amount: parseInt(formAmount),
                paymentDay: parseInt(formPaymentDay),
                history: [...c.history, ...changes]
            } : c));
        } else {
            // Yeni ekleme
            setClients([...clients, {
                id: getId(),
                name: formName,
                amount: parseInt(formAmount),
                paymentDay: parseInt(formPaymentDay),
                type: 'fixed',
                period: 'Aylık',
                history: []
            }]);
        }
        setShowIncomeModal(false);
    };

    const deleteIncome = (id: string) => {
        if (confirm('Bu gelir kalemini silmek istediğinizden emin misiniz?')) {
            setClients(clients.filter(c => c.id !== id));
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

    const openEditExpense = (expense: Expense) => {
        setEditingExpense(expense);
        setFormName(expense.title);
        setFormAmount(expense.amount.toString());
        setFormCategory(expense.category);
        setShowExpenseModal(true);
    };

    const saveExpense = () => {
        if (!formName || !formAmount) return;

        if (editingExpense) {
            // Düzenleme - geçmiş kaydet
            const changes: HistoryEntry[] = [];
            if (editingExpense.title !== formName) {
                changes.push({ date: formatDate(), field: 'Başlık', oldValue: editingExpense.title, newValue: formName });
            }
            if (editingExpense.amount !== parseInt(formAmount)) {
                changes.push({ date: formatDate(), field: 'Tutar', oldValue: formatCurrency(editingExpense.amount), newValue: formatCurrency(parseInt(formAmount)) });
            }
            if (editingExpense.category !== formCategory) {
                changes.push({ date: formatDate(), field: 'Kategori', oldValue: expenseCategories[editingExpense.category as keyof typeof expenseCategories].name, newValue: expenseCategories[formCategory as keyof typeof expenseCategories].name });
            }

            setExpenses(expenses.map(e => e.id === editingExpense.id ? {
                ...e,
                title: formName,
                amount: parseInt(formAmount),
                category: formCategory,
                history: [...e.history, ...changes]
            } : e));
        } else {
            // Yeni ekleme
            setExpenses([...expenses, {
                id: getId(),
                title: formName,
                amount: parseInt(formAmount),
                category: formCategory,
                history: []
            }]);
        }
        setShowExpenseModal(false);
    };

    const deleteExpense = (id: string) => {
        if (confirm('Bu gider kalemini silmek istediğinizden emin misiniz?')) {
            setExpenses(expenses.filter(e => e.id !== id));
        }
    };

    // ===== GEÇMİŞ =====
    const openHistory = (history: HistoryEntry[], title: string) => {
        setViewingHistory(history);
        setHistoryTitle(title);
        setShowHistoryModal(true);
    };

    // Gider kategorileri toplamları
    const expensesByCategory = Object.entries(expenseCategories).map(([key, cat]) => ({
        ...cat,
        key,
        total: expenses.filter(e => e.category === key).reduce((sum, e) => sum + e.amount, 0),
        items: expenses.filter(e => e.category === key)
    }));

    // Ödeme günlerine göre gelir grupları
    const incomeByPaymentDay = {
        day1: clients.filter(c => c.paymentDay === 1),
        day15: clients.filter(c => c.paymentDay === 15),
    };

    // Geçmiş ikonu component
    const HistoryIcon = ({ history, title }: { history: HistoryEntry[]; title: string }) => (
        history.length > 0 ? (
            <button
                onClick={(e) => { e.stopPropagation(); openHistory(history, title); }}
                style={{
                    background: 'var(--color-warning)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 24, height: 24,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                }}
                title={`${history.length} değişiklik`}
            >
                📜
            </button>
        ) : null
    );

    return (
        <>
            <Header
                title="Muhasebe"
                subtitle="Noco Studio - Aylık Nakit Akışı"
                actions={
                    <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                        <Button variant="success" size="sm" onClick={openAddIncome}>+ Gelir</Button>
                        <Button variant="danger" size="sm" onClick={openAddExpense}>+ Gider</Button>
                        <Select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            options={[
                                { value: 'Ocak 2026', label: 'Ocak 2026' },
                                { value: 'Şubat 2026', label: 'Şubat 2026' },
                                { value: 'Mart 2026', label: 'Mart 2026' },
                            ]}
                        />
                    </div>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* Tabs */}
                <Card style={{ marginBottom: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                        {[
                            { id: 'overview', label: '📊 Genel Bakış' },
                            { id: 'income', label: '💰 Gelirler' },
                            { id: 'expenses', label: '💸 Giderler' },
                            { id: 'cashflow', label: '📈 Nakit Akışı' },
                        ].map(tab => (
                            <Button
                                key={tab.id}
                                variant={activeTab === tab.id ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setActiveTab(tab.id as any)}
                            >
                                {tab.label}
                            </Button>
                        ))}
                    </div>
                </Card>

                {/* ===== GENEL BAKIŞ ===== */}
                {activeTab === 'overview' && (
                    <>
                        {/* Özet Kartları */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: 'var(--space-2)',
                            marginBottom: 'var(--space-3)'
                        }}>
                            <Card style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)' }}>
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-success)', fontWeight: 600 }}>
                                    💰 AYLIK GELİR
                                </p>
                                <p style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#2E7D32' }}>
                                    {formatCurrency(totalMonthlyIncome)}
                                </p>
                                <p style={{ fontSize: 'var(--text-caption)', color: '#388E3C', marginTop: '4px' }}>
                                    {clients.length} müşteriden
                                </p>
                            </Card>

                            <Card style={{ background: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)' }}>
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-error)', fontWeight: 600 }}>
                                    💸 AYLIK GİDER
                                </p>
                                <p style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#C62828' }}>
                                    {formatCurrency(totalMonthlyExpenses)}
                                </p>
                                <p style={{ fontSize: 'var(--text-caption)', color: '#D32F2F', marginTop: '4px' }}>
                                    {expenses.length} kalem
                                </p>
                            </Card>

                            <Card style={{
                                background: netProfit >= 0
                                    ? 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)'
                                    : 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)'
                            }}>
                                <p style={{ fontSize: 'var(--text-caption)', color: netProfit >= 0 ? '#1565C0' : '#E65100', fontWeight: 600 }}>
                                    📈 NET KAR
                                </p>
                                <p style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: netProfit >= 0 ? '#1565C0' : '#E65100' }}>
                                    {formatCurrency(netProfit)}
                                </p>
                                <p style={{ fontSize: 'var(--text-caption)', color: netProfit >= 0 ? '#1976D2' : '#F57C00', marginTop: '4px' }}>
                                    Kar oranı: %{((netProfit / totalMonthlyIncome) * 100).toFixed(1)}
                                </p>
                            </Card>
                        </div>

                        {/* Yıllık Gelir/Gider Grafiği */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                            <Card>
                                <CardHeader title="📈 Yıllık Gelir / Gider Trendi" description="2026 - Aylık karşılaştırma" />
                                <CardContent>
                                    <RevenueChart
                                        data={[
                                            { month: 'Oca', gelir: totalMonthlyIncome, gider: totalMonthlyExpenses },
                                            { month: 'Şub', gelir: totalMonthlyIncome * 0.95, gider: totalMonthlyExpenses * 1.02 },
                                            { month: 'Mar', gelir: totalMonthlyIncome * 1.05, gider: totalMonthlyExpenses * 0.98 },
                                            { month: 'Nis', gelir: totalMonthlyIncome * 1.1, gider: totalMonthlyExpenses * 1.01 },
                                            { month: 'May', gelir: totalMonthlyIncome * 1.15, gider: totalMonthlyExpenses * 0.99 },
                                            { month: 'Haz', gelir: totalMonthlyIncome * 1.08, gider: totalMonthlyExpenses * 1.03 },
                                        ]}
                                        height={280}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader title="🥧 Gider Dağılımı" />
                                <CardContent>
                                    <ProjectStatusChart
                                        data={expensesByCategory.map(cat => ({
                                            name: cat.name.split(' ')[0],
                                            value: cat.total,
                                            color: cat.color,
                                        }))}
                                        height={250}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Gider Kategorileri Detay */}
                        <Card>
                            <CardHeader title="📋 Gider Detayları" />
                            <CardContent>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-2)' }}>
                                    {expensesByCategory.map(cat => (
                                        <div key={cat.key} style={{
                                            padding: 'var(--space-2)',
                                            backgroundColor: 'var(--color-surface)',
                                            borderRadius: 'var(--radius-sm)',
                                            borderLeft: `4px solid ${cat.color}`
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                                                <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600 }}>
                                                    {cat.icon} {cat.name}
                                                </span>
                                                <span style={{ fontWeight: 700, color: cat.color, fontVariantNumeric: 'tabular-nums' }}>
                                                    {formatCurrency(cat.total)}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                                                {cat.items.map(item => (
                                                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', alignItems: 'center' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            {item.title}
                                                            <HistoryIcon history={item.history} title={item.title} />
                                                        </span>
                                                        <span>{formatCurrency(item.amount)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* ===== GELİRLER ===== */}
                {activeTab === 'income' && (
                    <>
                        {/* Ödeme Günü: 1 */}
                        <Card style={{ marginBottom: 'var(--space-2)' }}>
                            <CardHeader
                                title="📅 Her Ayın 1'i - Sabit Ödemeler"
                                description={`Toplam: ${formatCurrency(incomeByPaymentDay.day1.reduce((s, c) => s + c.amount, 0))}`}
                            />
                            <CardContent>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-2)' }}>
                                    {incomeByPaymentDay.day1.map(client => (
                                        <div key={client.id} style={{
                                            padding: 'var(--space-2)',
                                            backgroundColor: 'var(--color-surface)',
                                            borderRadius: 'var(--radius-sm)',
                                            position: 'relative'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                                <p style={{ fontWeight: 600 }}>{client.name}</p>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <HistoryIcon history={client.history} title={client.name} />
                                                    <button onClick={() => openEditIncome(client)} style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>✏️</button>
                                                    <button onClick={() => deleteIncome(client.id)} style={{ background: 'var(--color-error)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-success)', textAlign: 'center' }}>
                                                {formatCurrency(client.amount)}
                                            </p>
                                            <div style={{ textAlign: 'center', marginTop: '8px' }}>
                                                <Badge variant="success">Aylık</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Ödeme Günü: 15 */}
                        <Card>
                            <CardHeader
                                title="📅 Her Ayın 15'i - Ödemeler"
                                description={`Toplam: ${formatCurrency(incomeByPaymentDay.day15.reduce((s, c) => s + c.amount, 0))}`}
                            />
                            <CardContent>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-2)' }}>
                                    {incomeByPaymentDay.day15.map(client => (
                                        <div key={client.id} style={{
                                            padding: 'var(--space-2)',
                                            backgroundColor: 'var(--color-surface)',
                                            borderRadius: 'var(--radius-sm)',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <p style={{ fontWeight: 600 }}>{client.name}</p>
                                                    <HistoryIcon history={client.history} title={client.name} />
                                                </div>
                                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                    <Badge variant={client.type === 'variable' ? 'warning' : 'success'}>
                                                        {client.type === 'variable' ? 'Değişken' : 'Sabit'}
                                                    </Badge>
                                                    <button onClick={() => openEditIncome(client)} style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>✏️</button>
                                                    <button onClick={() => deleteIncome(client.id)} style={{ background: 'var(--color-error)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-success)' }}>
                                                {formatCurrency(client.amount)}
                                            </p>

                                            {client.schedule && (
                                                <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-caption)' }}>
                                                    <p style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--color-warning)' }}>📈 Artış Planı:</p>
                                                    {client.schedule.map((s, i) => (
                                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: 'var(--color-muted)' }}>
                                                            <span>{s.period}</span>
                                                            <span>{formatCurrency(s.amount)} ({s.duration})</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* ===== GİDERLER ===== */}
                {activeTab === 'expenses' && (
                    <>
                        {expensesByCategory.map(cat => (
                            <Card key={cat.key} style={{ marginBottom: 'var(--space-2)' }}>
                                <CardHeader
                                    title={`${cat.icon} ${cat.name}`}
                                    description={`Toplam: ${formatCurrency(cat.total)}`}
                                    action={
                                        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: cat.color }} />
                                    }
                                />
                                <CardContent>
                                    <div className="table-container">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Kalem</th>
                                                    <th style={{ textAlign: 'right' }}>Tutar</th>
                                                    <th style={{ textAlign: 'right' }}>% Pay</th>
                                                    <th style={{ textAlign: 'center', width: '100px' }}>İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {cat.items.map(item => (
                                                    <tr key={item.id}>
                                                        <td style={{ fontWeight: 500 }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                {item.title}
                                                                <HistoryIcon history={item.history} title={item.title} />
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-error)' }}>
                                                            {formatCurrency(item.amount)}
                                                        </td>
                                                        <td style={{ textAlign: 'right', color: 'var(--color-muted)' }}>
                                                            %{((item.amount / totalMonthlyExpenses) * 100).toFixed(1)}
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                                <button onClick={() => openEditExpense(item)} style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>✏️</button>
                                                                <button onClick={() => deleteExpense(item.id)} style={{ background: 'var(--color-error)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </>
                )}

                {/* ===== NAKİT AKIŞI ===== */}
                {activeTab === 'cashflow' && (
                    <Card>
                        <CardHeader title="📈 Aylık Nakit Akış Takvimi" />
                        <CardContent>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                                <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                                    <h4 style={{ marginBottom: 'var(--space-2)', color: 'var(--color-success)' }}>📅 Ayın 1'i</h4>
                                    <div style={{ marginBottom: 'var(--space-2)' }}>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Gelen Ödemeler:</p>
                                        {incomeByPaymentDay.day1.map(c => (
                                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                                                <span>{c.name}</span>
                                                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>+{formatCurrency(c.amount)}</span>
                                            </div>
                                        ))}
                                        <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '8px', paddingTop: '8px', fontWeight: 700 }}>
                                            <span>Toplam Giriş:</span>
                                            <span style={{ float: 'right', color: 'var(--color-success)' }}>
                                                +{formatCurrency(incomeByPaymentDay.day1.reduce((s, c) => s + c.amount, 0))}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                                    <h4 style={{ marginBottom: 'var(--space-2)', color: 'var(--color-success)' }}>📅 Ayın 15'i</h4>
                                    <div style={{ marginBottom: 'var(--space-2)' }}>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Gelen Ödemeler:</p>
                                        {incomeByPaymentDay.day15.map(c => (
                                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                                                <span>{c.name}</span>
                                                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>+{formatCurrency(c.amount)}</span>
                                            </div>
                                        ))}
                                        <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '8px', paddingTop: '8px', fontWeight: 700 }}>
                                            <span>Toplam Giriş:</span>
                                            <span style={{ float: 'right', color: 'var(--color-success)' }}>
                                                +{formatCurrency(incomeByPaymentDay.day15.reduce((s, c) => s + c.amount, 0))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                marginTop: 'var(--space-3)',
                                padding: 'var(--space-3)',
                                backgroundColor: 'var(--color-card)',
                                borderRadius: 'var(--radius-md)',
                                border: '2px solid var(--color-primary)'
                            }}>
                                <h4 style={{ marginBottom: 'var(--space-2)', textAlign: 'center' }}>📊 Ay Sonu Özeti - {selectedMonth}</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)', textAlign: 'center' }}>
                                    <div>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Toplam Gelir</p>
                                        <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-success)' }}>{formatCurrency(totalMonthlyIncome)}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Toplam Gider</p>
                                        <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-error)' }}>{formatCurrency(totalMonthlyExpenses)}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Net Kar</p>
                                        <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(netProfit)}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* ===== GELİR MODAL ===== */}
            <Modal
                isOpen={showIncomeModal}
                onClose={() => setShowIncomeModal(false)}
                title={editingClient ? `✏️ Gelir Düzenle: ${editingClient.name}` : '💰 Yeni Gelir Ekle'}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowIncomeModal(false)}>İptal</Button>
                        <Button variant="success" onClick={saveIncome}>Kaydet</Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <Input label="Müşteri Adı" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Müşteri adı..." required />
                    <Input label="Tutar (TRY)" type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0" required />
                    <Select
                        label="Ödeme Günü"
                        value={formPaymentDay}
                        onChange={(e) => setFormPaymentDay(e.target.value)}
                        options={[
                            { value: '1', label: 'Her Ayın 1\'i' },
                            { value: '15', label: 'Her Ayın 15\'i' },
                        ]}
                    />
                </div>
            </Modal>

            {/* ===== GİDER MODAL ===== */}
            <Modal
                isOpen={showExpenseModal}
                onClose={() => setShowExpenseModal(false)}
                title={editingExpense ? `✏️ Gider Düzenle: ${editingExpense.title}` : '💸 Yeni Gider Ekle'}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowExpenseModal(false)}>İptal</Button>
                        <Button variant="danger" onClick={saveExpense}>Kaydet</Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <Input label="Gider Adı" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Gider başlığı..." required />
                    <Input label="Tutar (TRY)" type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0" required />
                    <Select
                        label="Kategori"
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        options={Object.entries(expenseCategories).map(([key, cat]) => ({
                            value: key,
                            label: `${cat.icon} ${cat.name}`
                        }))}
                    />
                </div>
            </Modal>

            {/* ===== GEÇMİŞ MODAL ===== */}
            <Modal
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                title={`📜 Değişiklik Geçmişi: ${historyTitle}`}
                size="md"
                footer={
                    <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>Kapat</Button>
                }
            >
                {viewingHistory.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-muted)' }}>Henüz değişiklik yok</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {viewingHistory.map((entry, i) => (
                            <div key={i} style={{
                                padding: 'var(--space-2)',
                                backgroundColor: 'var(--color-surface)',
                                borderRadius: 'var(--radius-sm)',
                                borderLeft: '3px solid var(--color-warning)'
                            }}>
                                <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginBottom: '4px' }}>
                                    📅 {entry.date}
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                                    <Badge variant="info">{entry.field}</Badge>
                                    <span style={{ color: 'var(--color-error)', textDecoration: 'line-through' }}>{entry.oldValue}</span>
                                    <span>→</span>
                                    <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{entry.newValue}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </>
    );
}
