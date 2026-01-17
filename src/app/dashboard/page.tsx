'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Badge, Button } from '@/components/ui';
import { brands, getBrandName, getBrandColor } from '@/lib/data';
import { getDashboardStats, getPendingActions, type DashboardStats } from '@/lib/actions/dashboard';
import { toggleTaskStatus, getUserTodayTasks, getUserWeekDeadlines } from '@/lib/actions/tasks';

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

const stats = [
    { label: 'Aktif Projeler', value: '12', icon: '📁', trend: '+2', color: '#329FF5' },
    { label: 'Bekleyen Teslimatlar', value: '8', icon: '📦', trend: '-3', color: '#F6D73C' },
    { label: 'Müşteri Onayı', value: '5', icon: '⏳', trend: '+1', color: '#FF9800' },
];

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

// Yaklaşan Ödeme Riskleri - Gerçek markalar
const paymentRisks = {
    overdue: [
        { id: 'o1', client: 'Zeytindalı Gıda', invoice: 'INV-2026-002', amount: 50000, daysOverdue: 5 },
    ],
    next7Days: [
        { id: 'p1', client: 'Valora Psikoloji', invoice: 'INV-2026-003', amount: 35000, dueIn: 3 },
        { id: 'p2', client: 'İkra Giyim', invoice: 'INV-2026-004', amount: 25000, dueIn: 7 },
    ],
    next14Days: [
        { id: 'p3', client: 'Zoks Studio', invoice: 'INV-2026-005', amount: 45000, dueIn: 12 },
    ],
    next30Days: [
        { id: 'p4', client: 'Ali Haydar Ocakbaşı', invoice: 'INV-2026-006', amount: 20000, dueIn: 25 },
    ],
};

// Gerçek marka projeleri
const recentProjects = [
    { id: '1', name: 'Zeytindalı Rebrand 2026', client: 'Zeytindalı Gıda', status: 'ACTIVE', progress: 45, dueDate: '2026-02-28', paymentStatus: 'OVERDUE' },
    { id: '2', name: 'İkra Giyim Sosyal Medya', client: 'İkra Giyim', status: 'ACTIVE', progress: 70, dueDate: '2026-01-25', paymentStatus: 'PAID' },
    { id: '3', name: 'Zoks Studio Kampanyası', client: 'Zoks Studio', status: 'ACTIVE', progress: 90, dueDate: '2026-01-17', paymentStatus: 'PENDING' },
    { id: '4', name: 'Tevfik Usta Web Sitesi', client: 'Tevfik Usta', status: 'ON_HOLD', progress: 30, dueDate: '2026-01-30', paymentStatus: 'PAID' },
];

const pendingActions = [
    { id: '1', type: 'payment', message: 'Zeytindalı Gıda faturası ödenmedi - ₺50,000 (5 gün gecikmiş)', actionLabel: 'Faturayı Gör', severity: 'error', link: '/dashboard/invoices/i2' },
    { id: '2', type: 'deadline', message: 'Zoks Studio Video teslimi için 4 gün kaldı', actionLabel: 'Görevler', severity: 'warning', link: '/dashboard/tasks' },
    { id: '3', type: 'approval', message: 'Valora Logo Tasarımı müşteri onayı bekliyor', actionLabel: 'İncele', severity: 'info', link: '/dashboard/deliverables/d1' },
];

const quickActions = [
    { label: '+ Yeni Proje', icon: '📁', href: '/dashboard/projects', color: '#329FF5' },
    { label: '+ Yeni Teklif', icon: '📝', href: '/dashboard/proposals', color: '#9C27B0' },
    { label: '+ Yeni Fatura', icon: '💰', href: '/dashboard/invoices', color: '#F6D73C' },
    { label: 'Stüdyo Rezerve', icon: '📸', href: '/dashboard/studio', color: '#00F5B0' },
];

export default function DashboardPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [actions, setActions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [todayTasks, setTodayTasks] = useState<any[]>([]);
    const [weekDeadlines, setWeekDeadlines] = useState<any[]>([]);

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
        if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
            userId = user.id || 'user-owner';
        }

        // Dashboard verilerini DB'den çek
        const loadDashboardData = async () => {
            try {
                // Görevleri DB'den çek
                const [dbTasks, dbDeadlines] = await Promise.all([
                    getUserTodayTasks(userId),
                    getUserWeekDeadlines(userId),
                ]);

                // Görevleri set et
                setTodayTasks(dbTasks || []);
                setWeekDeadlines(dbDeadlines || []);

                // Diğer dashboard verileri
                const [stats, pendingActions] = await Promise.all([
                    getDashboardStats(),
                    getPendingActions(),
                ]);
                setDashboardStats(stats);
                setActions(pendingActions.length > 0 ? pendingActions : []);
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
                title={currentUser ? `${getGreeting()}, ${currentUser.name.split(' ')[0]}! 👋` : 'Gösterge Paneli'}
                subtitle={`${new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
                actions={
                    currentUser && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>
                                {currentUser.role}
                            </span>
                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                                🚪 Çıkış
                            </Button>
                        </div>
                    )
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* Hızlı Aksiyonlar */}
                <div className="quick-actions" style={{ marginBottom: 'var(--space-2)' }}>
                    {quickActions.map(action => (
                        <Link key={action.label} href={action.href} style={{ textDecoration: 'none' }}>
                            <Button
                                variant="secondary"
                                size="sm"
                                style={{ borderLeft: `3px solid ${action.color}` }}
                            >
                                {action.icon} {action.label}
                            </Button>
                        </Link>
                    ))}
                </div>

                {/* KİŞİSEL BÖLÜM: Bugünkü Görevlerim + Bu Hafta Deadline */}
                {currentUser && (
                    <div className="dashboard-grid dashboard-grid-2-1" style={{ marginBottom: 'var(--space-2)' }}>
                        {/* Bugünkü Görevlerim */}
                        <Card style={{ borderTop: '4px solid #329FF5' }}>
                            <CardHeader
                                title={`📋 Bugünkü Görevlerim (${todayTasks.filter(t => !t.completed).length}/${todayTasks.length})`}
                                action={<Link href="/dashboard/tasks"><Button size="sm" variant="ghost">Tümünü Gör</Button></Link>}
                            />
                            <CardContent>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                                    {todayTasks.map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => handleToggleTask(task.id)}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: 'var(--space-1) var(--space-2)',
                                                backgroundColor: task.completed ? 'rgba(107, 123, 128, 0.1)' : 'var(--color-surface)',
                                                borderRadius: 'var(--radius-sm)',
                                                borderLeft: `4px solid ${task.completed ? '#9CA3AF' : getBrandColor(task.brand)}`,
                                                opacity: task.completed ? 0.6 : 1,
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
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
                                                    transition: 'all 0.2s'
                                                }}>
                                                    {task.completed && '✓'}
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
                                                        ⏰ {task.deadline}
                                                    </Badge>
                                                )}
                                                {task.completed && (
                                                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>✅ Tamamlandı</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Bu Hafta Deadline */}
                        <Card style={{ borderTop: '4px solid #FF4242' }}>
                            <CardHeader title="⚠️ Bu Hafta Deadline" />
                            <CardContent>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                                    {weekDeadlines.map(dl => (
                                        <div key={dl.id} style={{
                                            padding: 'var(--space-1)',
                                            backgroundColor: dl.daysLeft <= 2 ? 'rgba(255, 66, 66, 0.1)' : 'var(--color-surface)',
                                            borderRadius: 'var(--radius-sm)',
                                            borderLeft: `3px solid ${getBrandColor(dl.brand)}`
                                        }}>
                                            <p style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>{dl.title}</p>
                                            <p style={{ fontSize: 'var(--text-caption)', color: dl.daysLeft <= 2 ? '#FF4242' : 'var(--color-muted)' }}>
                                                {dl.date} • {dl.daysLeft} gün kaldı
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* BÖLÜM 1: Kişisel Performans */}
                {currentUser && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                        {/* Tamamlanan Görevler */}
                        <Card style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'white' }}>
                            <div style={{ textAlign: 'center', padding: 'var(--space-1)' }}>
                                <p style={{ fontSize: 'var(--text-caption)', opacity: 0.8 }}>✅ TAMAMLANAN GÖREVLER</p>
                                <p style={{ fontSize: '32px', fontWeight: 700, color: '#00F5B0' }}>
                                    {todayTasks.filter(t => t.completed).length}
                                </p>
                                <p style={{ fontSize: 'var(--text-caption)', color: '#00F5B0' }}>Bugün</p>
                            </div>
                        </Card>

                        {/* Seri Gün */}
                        <Card style={{ background: '#FFF3E0', borderTop: '4px solid #FF9800' }}>
                            <div style={{ textAlign: 'center', padding: 'var(--space-1)' }}>
                                <p style={{ fontSize: 'var(--text-caption)', color: '#E65100' }}>🔥 SERİ GÜN</p>
                                <p style={{ fontSize: '28px', fontWeight: 700, color: '#BF360C' }}>7</p>
                                <p style={{ fontSize: 'var(--text-caption)', color: '#F57C00' }}>Ardışık aktif gün</p>
                            </div>
                        </Card>

                        {/* Haftalık Hedef */}
                        <Card style={{ background: '#E3F2FD', borderTop: '4px solid #2196F3' }}>
                            <div style={{ textAlign: 'center', padding: 'var(--space-1)' }}>
                                <p style={{ fontSize: 'var(--text-caption)', color: '#1565C0' }}>🎯 HAFTALIK HEDEF</p>
                                <p style={{ fontSize: '28px', fontWeight: 700, color: '#0D47A1' }}>12/15</p>
                                <div style={{ marginTop: '8px', height: '6px', backgroundColor: '#BBDEFB', borderRadius: '3px' }}>
                                    <div style={{ width: '80%', height: '100%', backgroundColor: '#2196F3', borderRadius: '3px' }} />
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* BÖLÜM 2: Stats + Stüdyo Doluluk */}
                <div className="dashboard-grid dashboard-grid-2-1" style={{ marginBottom: 'var(--space-2)' }}>
                    {/* Sol: İstatistikler */}
                    <div className="stats-grid">
                        {stats.map((stat) => (
                            <Card key={stat.label}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <div>
                                        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)', marginBottom: '4px' }}>{stat.label}</p>
                                        <p style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>{stat.value}</p>
                                        <span style={{ fontSize: 'var(--text-caption)', color: stat.trend.startsWith('+') ? 'var(--color-success)' : stat.trend.startsWith('-') ? 'var(--color-error)' : 'var(--color-muted)' }}>
                                            {stat.trend} bu ay
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '32px' }}>{stat.icon}</span>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Sağ: Bugünkü Stüdyo Doluluk */}
                    <Card style={{ borderLeft: todayStudio.isOccupiedNow ? '4px solid #4CAF50' : '4px solid var(--color-border)' }}>
                        <CardHeader title="📸 Bugün Stüdyo" />
                        <CardContent>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <div style={{ width: '100%', height: 10, backgroundColor: 'var(--color-border)', borderRadius: 5 }}>
                                    <div style={{ width: `${todayStudio.occupancyPercent}%`, height: '100%', backgroundColor: '#4CAF50', borderRadius: 5 }} />
                                </div>
                                <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>%{todayStudio.occupancyPercent}</span>
                            </div>
                            {todayStudio.isOccupiedNow && (
                                <div style={{ padding: '8px', backgroundColor: '#E8F5E9', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
                                    <p style={{ fontSize: 'var(--text-caption)', color: '#2E7D32' }}>🔴 ŞU AN DOLU</p>
                                    <p style={{ fontWeight: 600, color: '#1B5E20' }}>{todayStudio.currentBooking}</p>
                                </div>
                            )}
                            {todayStudio.bookings.map((booking, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: idx < todayStudio.bookings.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                                    <div>
                                        <p style={{ fontSize: 'var(--text-body-sm)', fontWeight: 500 }}>{booking.time}</p>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>{booking.client}</p>
                                    </div>
                                    <Badge variant={booking.type === 'INTERNAL' ? 'info' : 'success'}>
                                        {booking.type === 'INTERNAL' ? '🏠 İç' : '💵 Dış'}
                                    </Badge>
                                </div>
                            ))}
                            <Link href="/dashboard/studio">
                                <Button variant="ghost" size="sm" style={{ marginTop: '8px', width: '100%' }}>
                                    Takvimi Gör →
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Not: Ödeme Riskleri artık Yönetim Paneli -> Faturalar altında */}

                {/* BÖLÜM 4: Dikkat Gerektiren İşlemler */}
                <Card style={{ marginBottom: 'var(--space-2)' }}>
                    <CardHeader
                        title="🔔 Dikkat Gerektiren İşlemler"
                        description="Sistem tarafından engellenen veya bekleyen işlemler"
                    />
                    <CardContent>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                            {pendingActions.map((action) => (
                                <div
                                    key={action.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 'var(--space-2)',
                                        backgroundColor: action.severity === 'error'
                                            ? 'rgba(239, 68, 68, 0.08)'
                                            : action.severity === 'warning'
                                                ? 'rgba(245, 158, 11, 0.08)'
                                                : 'rgba(50, 159, 245, 0.08)',
                                        borderRadius: 'var(--radius-sm)',
                                        borderLeft: `3px solid ${action.severity === 'error'
                                            ? 'var(--color-error)'
                                            : action.severity === 'warning'
                                                ? 'var(--color-warning)'
                                                : 'var(--color-primary)'
                                            }`
                                    }}
                                >
                                    <span style={{ fontSize: 'var(--text-body-sm)' }}>
                                        {action.type === 'payment' ? '💰' : action.type === 'deadline' ? '⏰' : '👀'} {action.message}
                                    </span>
                                    <Link href={action.link}>
                                        <Button variant="ghost" size="sm">{action.actionLabel} →</Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* BÖLÜM 5: Aktif Projeler */}
                <Card>
                    <CardHeader
                        title="📁 Aktif Projeler"
                        action={<Link href="/dashboard/projects"><Button variant="secondary" size="sm">Tümünü Gör</Button></Link>}
                    />
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Proje</th>
                                    <th>Müşteri</th>
                                    <th>İlerleme</th>
                                    <th>Son Tarih</th>
                                    <th>Ödeme</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentProjects.map((project) => (
                                    <tr key={project.id}>
                                        <td style={{ fontWeight: 500 }}>{project.name}</td>
                                        <td>{project.client}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ flex: 1, maxWidth: 80, height: 6, backgroundColor: 'var(--color-border)', borderRadius: 3 }}>
                                                    <div style={{ height: '100%', width: `${project.progress}%`, backgroundColor: 'var(--color-primary)', borderRadius: 3 }} />
                                                </div>
                                                <span style={{ fontSize: 'var(--text-caption)' }}>%{project.progress}</span>
                                            </div>
                                        </td>
                                        <td>{new Date(project.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</td>
                                        <td>
                                            <Badge variant={
                                                project.paymentStatus === 'PAID' ? 'success' :
                                                    project.paymentStatus === 'OVERDUE' ? 'error' : 'warning'
                                            }>
                                                {project.paymentStatus === 'PAID' ? '✅ Ödendi' :
                                                    project.paymentStatus === 'OVERDUE' ? '🔴 Gecikmiş' : '⏳ Bekliyor'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Link href={`/dashboard/projects/${project.id}`}>
                                                <Button variant="ghost" size="sm">Aç →</Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </>
    );
}
