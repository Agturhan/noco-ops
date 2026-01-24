'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Badge, Button, Modal } from '@/components/ui';
import { brands, getBrandName, getBrandColor } from '@/lib/data';
import { getDashboardStats, getPendingActions, type DashboardStats } from '@/lib/actions/dashboard';
import { toggleTaskStatus, getUserTodayTasks, getUserWeekDeadlines } from '@/lib/actions/tasks';
import { getMemberColors } from '@/lib/actions/userSettings';
import { getTodayTasks as getSharedTasks, getWeekDeadlines as getSharedDeadlines } from '@/lib/sharedTasks';
import { getRetainerStatus } from '@/lib/actions/content';
import { Clapperboard, TrendingDown, TrendingUp, Camera, Plus, LogOut, FolderOpen, ListChecks, AlertTriangle, Clock, CheckCircle, Check } from 'lucide-react';

// Takım üyeleri varsayılan renkleri
const defaultMemberColors: Record<string, string> = {
    'Şeyma Bora': '#E91E63',
    'Fatih Ustaosmanoğlu': '#329FF5',
    'Ayşegül Güler': '#00F5B0',
    'Ahmet Gürkan Turhan': '#9C27B0'
};

// ===== GELİŞMİŞ DASHBOARD (Blueprint Uyumlu) =====
// - Düzenli (Retainer) vs Düzensiz (Proje) Gelir Ayrımı
// - Bugünkü Stüdyo Doluluk
// - Yaklaşan Ödeme Riskleri (7/14/30 gün)
// - Rol Bazlı Görünüm

// Kullanıcı tipi
interface CurrentUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

// Günün saatine göre selamlama
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
};

// Gerçek markalardan gelir verileri
const revenueData = {
    recurring: 285000, // Retainer geliri
    project: 124500, // Proje geliri
    total: 409500,
    recurringChange: '+₺25K',
    projectChange: '+₺18K',
};



// Bugünkü Stüdyo Doluluk - Gerçek markalar
const todayStudio = {
    bookings: [
        { time: '09:00 - 13:00', client: 'Valora Psikoloji', project: 'Ürün Çekimi', type: 'INTERNAL' },
        { time: '14:00 - 18:00', client: 'Zoks Studio', project: 'Konsept Çekim', type: 'INTERNAL' },
    ],
    occupancyPercent: 80,
    isOccupiedNow: true,
    currentBooking: 'Valora Psikoloji - Ürün Çekimi',
};

// Yaklaşan Ödeme Riskleri - Gerçek markalar (dinamik tarih hesabı)
const getOverdueDays = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
};

const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

// Fatura vade tarihleri
const invoiceDueDates = {
    'INV-2026-002': '2026-01-12', // Zeytindalı - vadesi geçmiş
    'INV-2026-003': '2026-01-20', // Valora
    'INV-2026-004': '2026-01-24', // İkra
    'INV-2026-005': '2026-01-29', // Zoks
    'INV-2026-006': '2026-02-10', // Ali Haydar
};

const paymentRisks = {
    overdue: [
        { id: 'o1', client: 'Zeytindalı Gıda', invoice: 'INV-2026-002', amount: 50000, dueDate: invoiceDueDates['INV-2026-002'], daysOverdue: Math.max(0, getOverdueDays(invoiceDueDates['INV-2026-002'])) },
    ],
    next7Days: [
        { id: 'p1', client: 'Valora Psikoloji', invoice: 'INV-2026-003', amount: 35000, dueIn: getDaysUntil(invoiceDueDates['INV-2026-003']) },
        { id: 'p2', client: 'İkra Giyim', invoice: 'INV-2026-004', amount: 25000, dueIn: getDaysUntil(invoiceDueDates['INV-2026-004']) },
    ],
    next14Days: [
        { id: 'p3', client: 'Zoks Studio', invoice: 'INV-2026-005', amount: 45000, dueIn: getDaysUntil(invoiceDueDates['INV-2026-005']) },
    ],
    next30Days: [
        { id: 'p4', client: 'Ali Haydar Ocakbaşı', invoice: 'INV-2026-006', amount: 20000, dueIn: getDaysUntil(invoiceDueDates['INV-2026-006']) },
    ],
};

// Gerçek marka projeleri - projects/[id]/page.tsx ile SENKRON
// Progress: Tamamlanan teslimat / Toplam teslimat (detay sayfasıyla aynı)
// PaymentStatus: Ödeme durumu detay sayfasındaki fatura durumuna göre
const recentProjects = [
    // Zeytindalı: 0/5 teslimat completed → %0, Fatura PENDING → OVERDUE değil
    { id: '1', name: 'Zeytindalı Rebrand 2026', client: 'Zeytindalı Gıda', status: 'ACTIVE', progress: 0, dueDate: '2026-02-28', paymentStatus: 'PENDING' },
    // İkranur: 1/2 teslimat completed → %50
    { id: '2', name: 'İkranur Sosyal Medya Paketi', client: 'İkranur Kozmetik', status: 'ACTIVE', progress: 50, dueDate: '2026-03-15', paymentStatus: 'PAID' },
    // Louvess: 0/2 teslimat → %0
    { id: '3', name: 'Louvess E-Ticaret Lansmanı', client: 'Louvess Beauty', status: 'PENDING', progress: 0, dueDate: '2026-04-01', paymentStatus: 'PENDING' },
    // Tevfik: 1/3 teslimat completed → %33
    { id: '4', name: 'Tevfik Usta Web Sitesi', client: 'Tevfik Usta Döner', status: 'ACTIVE', progress: 33, dueDate: '2026-02-15', paymentStatus: 'PENDING' },
];


// Dinamik pending actions - bugünün tarihine göre
const getDynamicPendingActions = () => {
    const actions = [];
    const today = new Date();

    // Gecikmiş fatura - INV-2026-002 (Zeytindalı ara ödeme)
    // Not: projects/[id]/page.tsx'deki invoices ile tutarlı: amount: 50000, dueDate: '2026-02-01'
    const inv002DueDate = new Date('2026-02-01');
    const overdueDays = Math.ceil((today.getTime() - inv002DueDate.getTime()) / (1000 * 60 * 60 * 24));
    if (overdueDays > 0) {
        actions.push({
            id: '1',
            type: 'payment',
            message: `Zeytindalı Gıda ara ödeme - ₺50.000 (${overdueDays} gün gecikmiş)`,
            actionLabel: 'Faturayı Gör',
            severity: 'error',
            link: '/dashboard/invoices/i1' // ID=1 proje faturasına
        });
    }

    // Louvess projesi beklemede  - projects/[id] ID=3 ile tutarlı
    actions.push({
        id: '2',
        type: 'approval',
        message: 'Louvess E-Ticaret Lansmanı onay bekliyor',
        actionLabel: 'Projeyi Gör',
        severity: 'warning',
        link: '/dashboard/projects/3'
    });

    // Zeytindalı Logo incelemede - deliverables/d1 ile tutarlı
    actions.push({
        id: '3',
        type: 'deadline',
        message: 'Zeytindalı Logo Tasarımı müşteri onayı bekliyor',
        actionLabel: 'Teslimatı Gör',
        severity: 'info',
        link: '/dashboard/deliverables/d1'
    });

    return actions;
};

const pendingActions = getDynamicPendingActions();

const quickActions = [
    { label: 'Yeni İçerik', icon: Clapperboard, href: '/dashboard/content-production', color: '#329FF5' },
    { label: 'Yeni Gider', icon: TrendingDown, href: '/dashboard/accounting?tab=expenses', color: '#FF4242' },
    { label: 'Yeni Gelir', icon: TrendingUp, href: '/dashboard/accounting?tab=income', color: '#00F5B0' },
    { label: 'Stüdyo Rezerve', icon: Camera, href: '/dashboard/studio', color: '#9C27B0' },
];

export default function DashboardPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [actions, setActions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [todayTasks, setTodayTasks] = useState<any[]>([]);
    const [upcomingStudio, setUpcomingStudio] = useState<any[]>([]);
    const [retainerStats, setRetainerStats] = useState<any[]>([]);
    const [weekDeadlines, setWeekDeadlines] = useState<any[]>([]);
    const [teamMemberColors, setTeamMemberColors] = useState<Record<string, string>>(defaultMemberColors);
    const [taskViewMode, setTaskViewMode] = useState<'today' | 'upcoming'>('today');
    const [debugCounts, setDebugCounts] = useState({ server: 0, client: 0 });
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    // Görev tamamla/geri al toggle - DB'ye kaydet
    const handleToggleTask = async (taskId: string) => {
        // UI'da hemen güncelle (İyimser güncelleme)
        setTodayTasks(prev => {
            const updated = prev.map(t =>
                t.id === taskId ? { ...t, completed: !t.completed, status: t.completed ? 'TODO' : 'DONE' } : t
            );
            return updated.sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0));
        });

        // DB'ye kaydet
        try {
            const result = await toggleTaskStatus(taskId, currentUser?.id);
            console.log('Görev durumu güncellendi:', result);
        } catch (error) {
            console.error('Görev güncellenirken hata:', error);
            // Hata durumunda geri al
            setTodayTasks(prev => {
                const updated = prev.map(t =>
                    t.id === taskId ? { ...t, completed: !t.completed, status: t.completed ? 'DONE' : 'TODO' } : t
                );
                return updated.sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0));
            });
        }
    };


    useEffect(() => {
        // Kullanıcı bilgilerini localStorage'dan al
        const userStr = localStorage.getItem('currentUser');
        let userId = 'user-owner'; // Default
        let userName = ''; // Kullanıcı adı
        if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
            userId = user.id || 'user-owner';
            userName = user.name || '';
        }

        // Dashboard verilerini yükle
        const loadDashboardData = async () => {
            try {
                // Supabase'den görevleri ve renkleri çek
                const [dbTasks, dbDeadlines, memberColors] = await Promise.all([
                    getUserTodayTasks(userId),
                    getUserWeekDeadlines(userId),
                    getMemberColors().catch(() => defaultMemberColors),
                ]);

                // Kişi renklerini set et
                setTeamMemberColors(memberColors);

                let userTasks = dbTasks || [];

                // DB boşsa, sharedTasks'ten fallback kullan
                // if (userTasks.length === 0) { ... } -> Removed to avoid showing successful static tasks that fail on interaction


                // Kullanıcıya göre filtrele
                if (userId || userName) {
                    const filtered = userTasks.filter((t: any) => {
                        const assignees = t.assigneeIds || [];
                        if (t.assigneeId && !assignees.includes(t.assigneeId)) assignees.push(t.assigneeId);

                        // Atanmamış görevleri herkese göster
                        if (assignees.length === 0) return true;

                        // 1. ID Kontrolü (Öncelikli)
                        if (userId && assignees.includes(userId)) return true;

                        // 2. İsim Kontrolü (Gelişmiş)
                        if (userName) {
                            const lowerUserName = userName.toLowerCase();
                            const userParts = lowerUserName.split(' ');
                            const firstName = userParts[0].trim();

                            return assignees.some((a: string) => {
                                if (!a) return false;
                                const lowerA = a.toLowerCase();
                                // Çapraz kontrol: İsimler birbirini içeriyor mu?
                                return lowerA.includes(firstName) || lowerUserName.includes(lowerA);
                            });
                        }

                        return false;
                    });
                    // Filtrelenmiş görev varsa kullan
                    setDebugCounts({ server: userTasks.length, client: filtered.length });
                    userTasks = filtered;
                } else {
                    setDebugCounts({ server: userTasks.length, client: userTasks.length });
                }

                // Deadline'ları set et
                if (dbDeadlines && dbDeadlines.length > 0) {
                    setWeekDeadlines(dbDeadlines);
                } else {
                    // Fallback: görevlerden hesapla
                    const today = new Date();
                    const weekLater = new Date(today);
                    weekLater.setDate(weekLater.getDate() + 7);

                    const deadlines = userTasks.filter((t: any) => {
                        if (!t.dueDate) return false;
                        const due = new Date(t.dueDate);
                        return due >= today && due <= weekLater && t.status !== 'DONE';
                    }).map((t: any) => ({
                        id: t.id,
                        title: t.title,
                        date: new Date(t.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
                        brand: t.project || 'Genel',
                        daysLeft: Math.ceil((new Date(t.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
                        assigneeIds: t.assigneeIds || (t.assigneeId ? [t.assigneeId] : [])
                    })).slice(0, 5);

                    setWeekDeadlines(deadlines);
                }

                // Görevleri formatla ve set et
                const formattedTasks = userTasks.map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    brand: t.project?.name || t.brand || 'Genel',
                    priority: t.priority,
                    deadline: t.dueDate ? new Date(t.dueDate).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Belirsiz',
                    completed: t.status === 'DONE',
                    assignee: t.assignee || t.assigneeId || '',
                    assigneeIds: t.assigneeIds || (t.assigneeId ? [t.assigneeId] : [])
                })).slice(0, 10);

                setTodayTasks(formattedTasks);

                // Studio Verileri (LocalStorage)
                let studioData: any[] = [];
                if (typeof window !== 'undefined') {
                    const saved = localStorage.getItem('studioBookings');
                    if (saved) {
                        try {
                            studioData = JSON.parse(saved);
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }

                // Fallback: Eğer hiç veri yoksa, varsayılanları (initialBookings benzeri) kullan ki dashboard boş görünmesin
                // Ancak senkronizasyon sorunu yaşamamak için, Studio sayfası açıldığında localstorage dolacaktır.
                // Burada sadece varsa gösterelim.

                const now = new Date();
                now.setHours(0, 0, 0, 0);

                const filteredStudio = studioData
                    .filter((b: any) => {
                        const bDate = new Date(b.date);
                        const diffTime = bDate.getTime() - now.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays >= 0 && diffDays <= 7;
                    })
                    .sort((a: any, b: any) => new Date(a.date + 'T' + a.startTime).getTime() - new Date(b.date + 'T' + b.startTime).getTime());
                // Group by date
                const groupedStudio: any[] = [];
                filteredStudio.forEach((b: any) => {
                    const dateStr = b.date;
                    let group = groupedStudio.find(g => g.date === dateStr);
                    if (!group) {
                        group = { date: dateStr, bookings: [] };
                        groupedStudio.push(group);
                    }
                    group.bookings.push(b);
                });

                setUpcomingStudio(groupedStudio);

                // Diğer dashboard verileri
                const [stats, pendingActions, rStats] = await Promise.all([
                    getDashboardStats(),
                    getPendingActions(),
                    getRetainerStatus(),
                ]);
                setDashboardStats(stats);
                setActions(pendingActions.length > 0 ? pendingActions : []);
                setRetainerStats(rStats);
            } catch (error) {
                console.error('Dashboard verileri yüklenirken hata:', error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        router.push('/login');
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);

    const totalOverdue = paymentRisks.overdue.reduce((s, i) => s + i.amount, 0);
    const total7Days = paymentRisks.next7Days.reduce((s, i) => s + i.amount, 0);
    const total14Days = paymentRisks.next14Days.reduce((s, i) => s + i.amount, 0);

    return (
        <>
            <Header
                title={currentUser ? `${getGreeting()}, ${currentUser.name.split(' ')[0]}!` : 'Gösterge Paneli'}
                subtitle={`${new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
                actions={
                    currentUser && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>
                                {currentUser.role}
                            </span>
                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                                Çıkış
                            </Button>
                        </div>
                    )
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* Hızlı Aksiyonlar */}
                <div className="quick-actions" style={{ marginBottom: 'var(--space-2)' }}>
                    {quickActions.map(action => {
                        const Icon = action.icon;
                        return (
                            <Link key={action.label} href={action.href} style={{ textDecoration: 'none' }}>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    style={{ borderLeft: `3px solid ${action.color}`, gap: '8px' }}
                                >
                                    <Icon size={16} />
                                    {action.label}
                                </Button>
                            </Link>
                        );
                    })}
                </div>


                {currentUser && (
                    <div className="dashboard-grid dashboard-grid-2-1" style={{ marginBottom: 'var(--space-2)' }}>
                        {/* Bugünkü Görevlerim */}
                        <Card style={{ borderTop: '4px solid #329FF5' }}>
                            <CardHeader
                                title={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>{taskViewMode === 'today' ? 'Bugünkü Görevlerim' : 'Sıradaki İşler'}</span>
                                        {taskViewMode === 'upcoming' && <Badge variant="success" style={{ fontSize: 10 }}>Bugün Boş 🎉</Badge>}
                                    </div>
                                }
                                description={taskViewMode === 'today' ? `${todayTasks.filter(t => !t.completed).length} aktif görev` : 'Bugün teslim edilecek iş yok, sıradaki işler listeleniyor:'}
                                action={<Link href="/dashboard/tasks"><Button size="sm" variant="ghost">Tümünü Gör</Button></Link>}
                            />
                            <CardContent>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                                    {todayTasks.map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => setSelectedTask(task)}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: 'var(--space-1) var(--space-2)',
                                                backgroundColor: task.completed ? 'rgba(107, 123, 128, 0.1)' : 'var(--color-surface)',
                                                borderRadius: 'var(--radius-sm)',
                                                borderLeft: `4px solid ${task.completed ? '#9CA3AF' : (task.assigneeIds?.length > 0 ? (teamMemberColors[task.assigneeIds[0]] || '#6B7B80') : '#6B7B80')}`,
                                                opacity: task.completed ? 0.6 : 1,
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleTask(task.id);
                                                    }}
                                                    style={{
                                                        width: '20px',
                                                        height: '20px',
                                                        borderRadius: '4px',
                                                        border: task.completed ? 'none' : '2px solid var(--color-border)',
                                                        backgroundColor: task.completed ? '#00F5B0' : 'transparent',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '12px',
                                                        color: 'white',
                                                        transition: 'all 0.2s',
                                                        cursor: 'pointer'
                                                    }}>
                                                    {task.completed && <Check size={12} strokeWidth={3} />}
                                                </div>
                                                <div>
                                                    <p style={{
                                                        fontWeight: 600,
                                                        marginBottom: '2px',
                                                        textDecoration: task.completed ? 'line-through' : 'none',
                                                        color: task.completed ? '#9CA3AF' : 'inherit'
                                                    }}>{task.title}</p>
                                                    <p style={{
                                                        fontSize: 'var(--text-caption)',
                                                        color: task.completed ? '#9CA3AF' : 'var(--color-muted)'
                                                    }}>
                                                        {getBrandName(task.brand)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                {!task.completed && (
                                                    <Badge variant={task.priority === 'high' || task.priority === 'urgent' ? 'error' : task.priority === 'medium' ? 'warning' : 'info'}>
                                                        {task.deadline}
                                                    </Badge>
                                                )}
                                                {task.completed && (
                                                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Tamamlandı</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Bu Hafta Deadline */}
                        <Card style={{ borderTop: '4px solid #FF4242' }}>
                            <CardHeader title="Bu Hafta Deadline" />
                            <CardContent>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                                    {weekDeadlines.map(dl => (
                                        <div
                                            key={dl.id}
                                            onClick={() => setSelectedTask(dl)}
                                            style={{
                                                padding: 'var(--space-1)',
                                                backgroundColor: dl.status === 'DONE' ? 'rgba(107, 123, 128, 0.1)' : (dl.daysLeft <= 2 ? 'rgba(255, 66, 66, 0.1)' : 'var(--color-surface)'),
                                                borderRadius: 'var(--radius-sm)',
                                                borderLeft: `3px solid ${dl.status === 'DONE' ? '#9CA3AF' : (dl.assigneeIds?.length > 0 ? (teamMemberColors[dl.assigneeIds[0]] || '#6B7B80') : '#6B7B80')}`,
                                                opacity: dl.status === 'DONE' ? 0.7 : 1,
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s',
                                            }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <p style={{
                                                    fontWeight: 600,
                                                    fontSize: 'var(--text-body-sm)',
                                                    textDecoration: dl.status === 'DONE' ? 'line-through' : 'none',
                                                    color: dl.status === 'DONE' ? 'var(--color-muted)' : 'inherit'
                                                }}>{dl.title}</p>
                                                {dl.status === 'DONE' && <Badge variant="neutral" style={{ fontSize: 9, height: 18 }}>OK</Badge>}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                                <span style={{ fontSize: 'var(--text-caption)', color: dl.status === 'DONE' ? 'var(--color-muted)' : (dl.daysLeft <= 2 ? '#FF4242' : 'var(--color-muted)') }}>
                                                    {dl.date} • {dl.status === 'DONE' ? 'Tamamlandı' : `${dl.daysLeft} gün kaldı`}
                                                </span>
                                                {dl.assigneeIds && dl.assigneeIds.length > 0 && (
                                                    <div style={{ display: 'flex', gap: 4 }}>
                                                        {dl.assigneeIds.slice(0, 3).map((name: string) => {
                                                            const memberColor = teamMemberColors[name] || '#6B7B80';
                                                            return (
                                                                <span key={name} style={{
                                                                    fontSize: 9,
                                                                    padding: '2px 6px',
                                                                    backgroundColor: memberColor + '20',
                                                                    color: memberColor,
                                                                    borderRadius: 8,
                                                                    fontWeight: 500
                                                                }}>
                                                                    {name.split(' ')[0]}
                                                                </span>
                                                            );
                                                        })}
                                                        {dl.assigneeIds.length > 3 && <span style={{ fontSize: 9, color: 'var(--color-muted)' }}>+{dl.assigneeIds.length - 3}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Not: Kişisel Performans bloğu kaldırıldı (Tamamlanan/Seri/Haftalık) */}



                {/* BÖLÜM 5: Hakediş Paneli */}
                <div className="dashboard-grid dashboard-grid-2-1">
                    <Card>
                        <CardHeader
                            title="Hakediş Paneli (Aylık Üretim)"
                            description="Müşteri kotaları ve gerçekleşen üretimler (Ocak 2026)"
                            action={<Link href="/dashboard/retainers"><Button variant="secondary" size="sm">Detaylı Rapor</Button></Link>}
                        />
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Müşteri</th>
                                        <th>Hakediş Durumu</th>
                                        <th>Yayına Hazır</th>
                                        <th>Operasyon Notu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {retainerStats.length > 0 ? retainerStats.map((item) => (
                                        <tr key={item.id}>
                                            <td style={{ fontWeight: 600 }}>
                                                {item.clientId ? (
                                                    <Link href={`/dashboard/system/clients/${item.clientId}`} style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                                                        <span className="hover:text-primary transition-colors">{item.client}</span>
                                                    </Link>
                                                ) : (
                                                    item.client
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ flex: 1, minWidth: 80, height: 8, backgroundColor: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
                                                        <div style={{
                                                            height: '100%',
                                                            width: `${Math.min(100, (item.progress / item.total) * 100)}%`,
                                                            backgroundColor: item.warning ? 'var(--color-warning)' : 'var(--color-primary)',
                                                            borderRadius: 4
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: '12px', fontWeight: 600, color: item.warning ? 'var(--color-warning)' : 'inherit' }}>{item.label}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontSize: '13px',
                                                    fontWeight: 500,
                                                    color: item.stock > 0 ? 'var(--color-text)' : 'var(--color-muted)',
                                                    display: 'flex', alignItems: 'center', gap: 8
                                                }}>
                                                    {item.stock > 0 && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00F5B0', boxShadow: '0 0 4px #00F5B0' }} />}
                                                    {item.stock > 0 ? `${item.stock} Adet` : '-'}
                                                </span>
                                            </td>
                                            <td>
                                                <p style={{ fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.3 }}>{item.note}</p>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-muted)' }}>Yükleniyor...</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Haftalık Stüdyo Programı */}
                    <Card>
                        <CardHeader
                            title="Stüdyo Programı"
                            action={
                                <Link href="/dashboard/studio">
                                    <Button variant="ghost" size="sm">Detay →</Button>
                                </Link>
                            }
                        />
                        <CardContent>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {upcomingStudio.length > 0 ? (
                                    upcomingStudio.map((group, groupIndex) => {
                                        const bDate = new Date(group.date);
                                        const dayName = bDate.toLocaleDateString('tr-TR', { weekday: 'long' });
                                        const dayNum = bDate.getDate();
                                        const monthName = bDate.toLocaleDateString('tr-TR', { month: 'long' });
                                        const isToday = new Date().toDateString() === bDate.toDateString();
                                        const isTomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toDateString() === bDate.toDateString();

                                        const label = isToday ? 'Bugün' : isTomorrow ? 'Yarın' : `${dayNum} ${monthName}, ${dayName}`;

                                        return (
                                            <div key={group.date}>
                                                <p style={{
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    color: isToday ? 'var(--color-primary)' : 'var(--color-muted)',
                                                    marginBottom: '8px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {label}
                                                </p>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {group.bookings.map((booking: any, index: number) => (
                                                        <div
                                                            key={booking.id || index}
                                                            onClick={() => setSelectedBooking({ ...booking, date: group.date })}
                                                            style={{
                                                                display: 'flex',
                                                                gap: '12px',
                                                                padding: '10px',
                                                                backgroundColor: 'var(--color-surface)',
                                                                borderRadius: '6px',
                                                                borderLeft: `3px solid ${booking.type === 'EXTERNAL' ? '#E91E63' : '#329FF5'}`,
                                                                cursor: 'pointer',
                                                                transition: 'transform 0.2s',
                                                            }}>
                                                            <div style={{ minWidth: '80px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>
                                                                {booking.startTime} - {booking.endTime}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>{booking.client}</p>
                                                                <p style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{booking.project} {booking.type === 'EXTERNAL' && '• Dış Çekim'}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-muted)', fontSize: '13px', backgroundColor: 'var(--color-surface)', borderRadius: '8px' }}>
                                        <p>📅 Önümüzdeki 7 gün için stüdyo boş.</p>
                                        <Link href="/dashboard/studio">
                                            <Button variant="ghost" size="sm" style={{ marginTop: '8px' }}>Rezervasyon Yap</Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            {/* TASK DETAIL MODAL */}
            <Modal
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                title={selectedTask?.title || 'Görev Detayı'}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Header Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'var(--color-muted)', fontWeight: 500 }}>
                            {getBrandName(selectedTask?.brand)}
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {selectedTask?.priority && (
                                <Badge variant={selectedTask?.priority === 'high' || selectedTask?.priority === 'urgent' ? 'error' : selectedTask?.priority === 'medium' ? 'warning' : 'info'}>
                                    {selectedTask.priority === 'urgent' ? 'ACİL' : selectedTask.priority === 'high' ? 'YÜKSEK' : selectedTask.priority === 'medium' ? 'NORMAL' : 'DÜŞÜK'}
                                </Badge>
                            )}
                            <Badge variant={selectedTask?.completed ? 'success' : 'neutral'}>
                                {selectedTask?.completed ? 'TAMAMLANDI' : 'YAPILACAK'}
                            </Badge>
                        </div>
                    </div>

                    {/* Description */}
                    <div style={{ padding: '16px', backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ListChecks size={14} />
                            Açıklama / İçerik Detayı
                        </h4>
                        <p style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: 'var(--color-text)' }}>
                            {selectedTask?.description || 'Bu görev için girilmiş bir açıklama bulunmuyor.'}
                        </p>
                    </div>

                    {/* Footer / Meta */}
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--color-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={16} />
                            <span>Son Tarih: {selectedTask?.deadline}</span>
                        </div>
                        {selectedTask?.assignee && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: teamMemberColors[selectedTask.assignee] || '#ccc' }} />
                                <span>{selectedTask.assignee.split(' ')[0]}</span>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                        <Button onClick={() => setSelectedTask(null)} variant="primary">Kapat</Button>
                    </div>
                </div>
            </Modal>

            {/* STUDIO DETAIL MODAL */}
            <Modal
                isOpen={!!selectedBooking}
                onClose={() => setSelectedBooking(null)}
                title={selectedBooking?.client || 'Rezervasyon Detayı'}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '16px', backgroundColor: 'var(--color-surface)', borderRadius: '8px', borderLeft: `4px solid ${selectedBooking?.type === 'EXTERNAL' ? '#E91E63' : '#329FF5'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 600, fontSize: '16px' }}>{selectedBooking?.project}</span>
                            <Badge variant={selectedBooking?.type === 'EXTERNAL' ? 'warning' : 'info'}>
                                {selectedBooking?.type === 'EXTERNAL' ? 'DIŞ ÇEKİM' : 'STÜDYO'}
                            </Badge>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-muted)', fontSize: '14px' }}>
                            <Clock size={16} />
                            <span>{selectedBooking?.date ? new Date(selectedBooking.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : ''}  •  {selectedBooking?.startTime} - {selectedBooking?.endTime}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                        <Link href="/dashboard/studio">
                            <Button variant="secondary" size="sm" style={{ marginRight: '8px' }}>Takvime Git</Button>
                        </Link>
                        <Button onClick={() => setSelectedBooking(null)} variant="primary" size="sm">Kapat</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
