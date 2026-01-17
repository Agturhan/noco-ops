'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Badge, Modal, Input, Select, Textarea } from '@/components/ui';

// Mock proje verileri - ID bazlı
const projectsData: Record<string, typeof projectTemplate> = {
    '1': {
        id: '1',
        name: 'Zeytindalı Rebrand 2026',
        client: 'Zeytindalı Gıda',
        status: 'ACTIVE',
        priority: 'HIGH',
        startDate: '2026-01-01',
        dueDate: '2026-02-28',
        budget: 150000,
        description: 'Zeytindalı markası için kapsamlı yeniden markalaşma projesi. Logo, kurumsal kimlik, ambalaj tasarımı ve dijital varlıklar.',
        manager: 'Ahmet Yılmaz',
        team: ['Ahmet Yılmaz', 'Mehmet Kaya', 'Zeynep Demir'],
        tags: ['rebrand', 'kurumsal kimlik', 'ambalaj'],
        contract: {
            signedDate: '2025-12-20',
            maxRevisions: 3,
            paymentTerms: 'Net 30',
            retainerHours: 0,
        },
        deliverables: [
            { id: 'd1', title: 'Logo Tasarımı', status: 'IN_REVIEW', dueDate: '2026-01-20', assignee: 'Ahmet', progress: 90 },
            { id: 'd2', title: 'Kurumsal Kimlik Kılavuzu', status: 'IN_PROGRESS', dueDate: '2026-02-01', assignee: 'Mehmet', progress: 45 },
            { id: 'd3', title: 'Ambalaj Tasarımı (5 SKU)', status: 'TODO', dueDate: '2026-02-15', assignee: 'Zeynep', progress: 0 },
            { id: 'd4', title: 'Sosyal Medya Görselleri', status: 'TODO', dueDate: '2026-02-20', assignee: 'Ahmet', progress: 0 },
            { id: 'd5', title: 'Web Sitesi UI/UX', status: 'BLOCKED', dueDate: '2026-02-28', assignee: 'Mehmet', progress: 10 },
        ],
        invoices: [
            { id: 'i1', number: 'INV-2026-001', amount: 50000, status: 'PAID', dueDate: '2026-01-15', paidDate: '2026-01-10', description: 'Ön ödeme (%33)' },
            { id: 'i2', number: 'INV-2026-002', amount: 50000, status: 'PENDING', dueDate: '2026-02-01', description: 'Ara ödeme (%33)' },
            { id: 'i3', number: 'INV-2026-003', amount: 50000, status: 'DRAFT', dueDate: '2026-02-28', description: 'Final ödeme (%33)' },
        ],
        activities: [
            { id: 'a1', date: '2026-01-13 14:30', user: 'Ahmet', action: 'Logo tasarımını incelemeye gönderdi', type: 'deliverable' },
            { id: 'a2', date: '2026-01-12 10:15', user: 'Zeynep', action: 'Proje notlarını güncelledi', type: 'note' },
            { id: 'a3', date: '2026-01-10 09:00', user: 'Sistem', action: 'Fatura INV-2026-001 ödendi', type: 'payment' },
        ],
        notes: [
            { id: 'n1', date: '2026-01-12', user: 'Zeynep', content: 'Müşteri yeşil tonlarını tercih ediyor. Zeytin yaprağı motifi önemli.' },
        ]
    },
    '2': {
        id: '2',
        name: 'İkranur Sosyal Medya Paketi',
        client: 'İkranur Kozmetik',
        status: 'ACTIVE',
        priority: 'MEDIUM',
        startDate: '2026-01-10',
        dueDate: '2026-03-15',
        budget: 85000,
        description: 'İkranur için aylık sosyal medya içerik üretimi ve yönetimi. Instagram, TikTok ve YouTube içerikleri.',
        manager: 'Zeynep Demir',
        team: ['Zeynep Demir', 'Ali Veli'],
        tags: ['sosyal medya', 'içerik', 'kozmetik'],
        contract: { signedDate: '2026-01-05', maxRevisions: 2, paymentTerms: 'Net 15', retainerHours: 20 },
        deliverables: [
            { id: 'd1', title: 'Ocak Video Paketi', status: 'COMPLETED', dueDate: '2026-01-31', assignee: 'Zeynep', progress: 100 },
            { id: 'd2', title: 'Şubat Video Paketi', status: 'IN_PROGRESS', dueDate: '2026-02-28', assignee: 'Ali', progress: 30 },
        ],
        invoices: [
            { id: 'i1', number: 'INV-2026-010', amount: 28000, status: 'PAID', dueDate: '2026-01-15', paidDate: '2026-01-14', description: 'Ocak paketi' },
        ],
        activities: [
            { id: 'a1', date: '2026-01-15 10:00', user: 'Zeynep', action: 'Ocak videolarını teslim etti', type: 'deliverable' },
        ],
        notes: []
    },
    '3': {
        id: '3',
        name: 'Louvess E-Ticaret Lansmanı',
        client: 'Louvess Beauty',
        status: 'PENDING',
        priority: 'HIGH',
        startDate: '2026-02-01',
        dueDate: '2026-04-30',
        budget: 250000,
        description: 'Louvess için yeni e-ticaret platformu tasarımı ve lansman kampanyası.',
        manager: 'Mehmet Kaya',
        team: ['Mehmet Kaya', 'Ahmet Yılmaz', 'Zeynep Demir'],
        tags: ['e-ticaret', 'lansman', 'web tasarım'],
        contract: { signedDate: '2026-01-20', maxRevisions: 4, paymentTerms: 'Net 30', retainerHours: 0 },
        deliverables: [
            { id: 'd1', title: 'UI/UX Tasarım', status: 'TODO', dueDate: '2026-02-28', assignee: 'Mehmet', progress: 0 },
            { id: 'd2', title: 'Lansman Kampanyası', status: 'TODO', dueDate: '2026-04-15', assignee: 'Zeynep', progress: 0 },
        ],
        invoices: [],
        activities: [
            { id: 'a1', date: '2026-01-20 14:00', user: 'Sistem', action: 'Proje oluşturuldu', type: 'project' },
        ],
        notes: []
    },
    '4': {
        id: '4',
        name: 'Tevfik Usta Web Sitesi',
        client: 'Tevfik Usta Döner',
        status: 'ACTIVE',
        priority: 'MEDIUM',
        startDate: '2026-01-05',
        dueDate: '2026-02-15',
        budget: 45000,
        description: 'Tevfik Usta franchise için kurumsal web sitesi tasarımı.',
        manager: 'Ahmet Yılmaz',
        team: ['Ahmet Yılmaz'],
        tags: ['web sitesi', 'kurumsal', 'restoran'],
        contract: { signedDate: '2026-01-03', maxRevisions: 2, paymentTerms: 'Net 15', retainerHours: 0 },
        deliverables: [
            { id: 'd1', title: 'Ana Sayfa Tasarımı', status: 'COMPLETED', dueDate: '2026-01-20', assignee: 'Ahmet', progress: 100 },
            { id: 'd2', title: 'Alt Sayfalar', status: 'IN_PROGRESS', dueDate: '2026-02-01', assignee: 'Ahmet', progress: 60 },
            { id: 'd3', title: 'Mobil Optimizasyon', status: 'TODO', dueDate: '2026-02-10', assignee: 'Ahmet', progress: 0 },
        ],
        invoices: [
            { id: 'i1', number: 'INV-2026-015', amount: 22500, status: 'PAID', dueDate: '2026-01-10', paidDate: '2026-01-08', description: 'Ön ödeme (%50)' },
            { id: 'i2', number: 'INV-2026-016', amount: 22500, status: 'PENDING', dueDate: '2026-02-15', description: 'Final ödeme (%50)' },
        ],
        activities: [
            { id: 'a1', date: '2026-01-18 16:00', user: 'Ahmet', action: 'Ana sayfa tasarımı onaylandı', type: 'deliverable' },
        ],
        notes: [
            { id: 'n1', date: '2026-01-10', user: 'Ahmet', content: 'Müşteri kırmızı-beyaz renk paletini onayladı.' },
        ]
    },
};

// Template type tanımı
const projectTemplate = {
    id: '',
    name: '',
    client: '',
    status: '' as 'ACTIVE' | 'PENDING' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED',
    priority: '' as 'HIGH' | 'MEDIUM' | 'LOW',
    startDate: '',
    dueDate: '',
    budget: 0,
    description: '',
    manager: '',
    team: [] as string[],
    tags: [] as string[],
    contract: { signedDate: '', maxRevisions: 0, paymentTerms: '', retainerHours: 0 },
    deliverables: [] as { id: string; title: string; status: string; dueDate: string; assignee: string; progress: number }[],
    invoices: [] as { id: string; number: string; amount: number; status: string; dueDate: string; paidDate?: string; description: string }[],
    activities: [] as { id: string; date: string; user: string; action: string; type: string }[],
    notes: [] as { id: string; date: string; user: string; content: string }[],
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    DRAFT: { label: 'Taslak', color: '#6B7B80', bgColor: '#F5F5F5' },
    PENDING: { label: 'Beklemede', color: '#F6D73C', bgColor: '#FFF9E6' },
    ACTIVE: { label: 'Aktif', color: '#329FF5', bgColor: '#E3F2FD' },
    IN_PROGRESS: { label: 'Devam Ediyor', color: '#329FF5', bgColor: '#E3F2FD' },
    IN_REVIEW: { label: 'İncelemede', color: '#FF9800', bgColor: '#FFF3E0' },
    TODO: { label: 'Yapılacak', color: '#6B7B80', bgColor: '#F5F5F5' },
    COMPLETED: { label: 'Tamamlandı', color: '#00F5B0', bgColor: '#E8F5E9' },
    BLOCKED: { label: 'Engellendi', color: '#FF4242', bgColor: '#FFEBEE' },
    PAID: { label: 'Ödendi', color: '#00F5B0', bgColor: '#E8F5E9' },
    OVERDUE: { label: 'Gecikmiş', color: '#FF4242', bgColor: '#FFEBEE' },
};

const activityIcons: Record<string, string> = {
    deliverable: '📋',
    note: '📝',
    payment: '💰',
    project: '📁',
};

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'deliverables' | 'invoices' | 'activity' | 'files' | 'notes'>('overview');
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [newNote, setNewNote] = useState('');

    // ID'ye göre proje seç
    const projectId = params.id as string;
    const project = projectsData[projectId];

    // Proje bulunamadıysa 404 state
    if (!project) {
        return (
            <>
                <Header title="Proje Bulunamadı" subtitle="404" />
                <div style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                    <Card>
                        <CardContent>
                            <p style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>🔍</p>
                            <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Proje bulunamadı</p>
                            <p style={{ color: 'var(--color-muted)', marginBottom: 'var(--space-2)' }}>
                                ID: {projectId} ile eşleşen bir proje yok.
                            </p>
                            <Button variant="primary" onClick={() => router.push('/dashboard/projects')}>
                                ← Projelere Dön
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    // Hesaplamalar - Liste sayfasıyla tutarlı
    const totalDeliverables = project.deliverables.length;
    const completedDeliverables = project.deliverables.filter(d =>
        d.status === 'DELIVERED' || d.status === 'APPROVED' || d.status === 'COMPLETED'
    ).length;
    const progress = totalDeliverables > 0 ? Math.round((completedDeliverables / totalDeliverables) * 100) : 0;

    const totalInvoiced = project.invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = project.invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.amount, 0);
    const paymentProgress = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);

    return (
        <>
            <Header
                title={project.name}
                subtitle={`${project.client} • ${statusConfig[project.status]?.label || project.status}`}
                actions={
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <Button variant="secondary" onClick={() => router.back()}>← Geri</Button>
                        <Button variant="primary">✏️ Düzenle</Button>
                    </div>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* Üst Kartlar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    {/* Durum */}
                    <Card style={{ background: statusConfig[project.status]?.bgColor }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>DURUM</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, color: statusConfig[project.status]?.color }}>
                                {statusConfig[project.status]?.label}
                            </p>
                        </div>
                    </Card>

                    {/* İlerleme */}
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>İLERLEME</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>%{progress}</p>
                            <div style={{ height: 4, backgroundColor: 'var(--color-border)', borderRadius: 2, marginTop: 8 }}>
                                <div style={{ height: '100%', width: `${progress}%`, backgroundColor: 'var(--color-primary)', borderRadius: 2 }} />
                            </div>
                        </div>
                    </Card>

                    {/* Bütçe */}
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>BÜTÇE</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-success)' }}>{formatCurrency(project.budget)}</p>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                                {formatCurrency(totalPaid)} ödendi
                            </p>
                        </div>
                    </Card>

                    {/* Son Tarih */}
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>SON TARİH</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, color: new Date(project.dueDate) < new Date() ? 'var(--color-error)' : 'inherit' }}>
                                {new Date(project.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                            </p>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                                {Math.ceil((new Date(project.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} gün kaldı
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Tab Navigation */}
                <Card style={{ marginBottom: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        {[
                            { id: 'overview', label: '📊 Genel Bakış' },
                            { id: 'deliverables', label: '📋 Teslimatlar' },
                            { id: 'invoices', label: '💰 Faturalar' },
                            { id: 'activity', label: '📜 Aktivite' },
                            { id: 'notes', label: '📝 Notlar' },
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

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-2)' }}>
                        {/* Sol - Proje Detayları */}
                        <Card>
                            <CardHeader title="📁 Proje Detayları" />
                            <CardContent>
                                <p style={{ marginBottom: 'var(--space-2)', lineHeight: 1.6 }}>{project.description}</p>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                                    <div>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Müşteri</p>
                                        <p style={{ fontWeight: 600 }}>🏢 {project.client}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Proje Yöneticisi</p>
                                        <p style={{ fontWeight: 600 }}>👤 {project.manager}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Başlangıç</p>
                                        <p>📅 {new Date(project.startDate).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Bitiş</p>
                                        <p>📅 {new Date(project.dueDate).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                </div>

                                <div style={{ marginTop: 'var(--space-2)' }}>
                                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginBottom: '8px' }}>Ekip</p>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {project.team.map(member => (
                                            <Badge key={member} variant="info">👤 {member}</Badge>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ marginTop: 'var(--space-2)' }}>
                                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginBottom: '8px' }}>Etiketler</p>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {project.tags.map(tag => (
                                            <span key={tag} style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: 'var(--color-surface)', borderRadius: 12 }}>
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sağ - Sözleşme Bilgileri */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            <Card>
                                <CardHeader title="📄 Sözleşme" />
                                <CardContent>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--color-muted)' }}>İmza Tarihi</span>
                                            <span>{new Date(project.contract.signedDate).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--color-muted)' }}>Max Revizyon</span>
                                            <span style={{ fontWeight: 600 }}>{project.contract.maxRevisions} tur</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--color-muted)' }}>Ödeme Vadesi</span>
                                            <span>{project.contract.paymentTerms}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader title="💳 Ödeme Durumu" />
                                <CardContent>
                                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                        <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-success)' }}>
                                            %{paymentProgress}
                                        </p>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                                            {formatCurrency(totalPaid)} / {formatCurrency(totalInvoiced)}
                                        </p>
                                    </div>
                                    <div style={{ height: 8, backgroundColor: 'var(--color-border)', borderRadius: 4 }}>
                                        <div style={{ height: '100%', width: `${paymentProgress}%`, backgroundColor: 'var(--color-success)', borderRadius: 4 }} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'deliverables' && (
                    <Card>
                        <CardHeader title="📋 Teslimatlar" action={<Button size="sm">+ Yeni Teslimat</Button>} />
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Teslimat</th>
                                        <th>Atanan</th>
                                        <th>Son Tarih</th>
                                        <th>İlerleme</th>
                                        <th>Durum</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {project.deliverables.map(del => (
                                        <tr key={del.id}>
                                            <td style={{ fontWeight: 600 }}>{del.title}</td>
                                            <td>👤 {del.assignee}</td>
                                            <td>{new Date(del.dueDate).toLocaleDateString('tr-TR')}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ flex: 1, height: 6, backgroundColor: 'var(--color-border)', borderRadius: 3 }}>
                                                        <div style={{ height: '100%', width: `${del.progress}%`, backgroundColor: 'var(--color-primary)', borderRadius: 3 }} />
                                                    </div>
                                                    <span style={{ fontSize: 'var(--text-caption)' }}>%{del.progress}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <Badge style={{ backgroundColor: statusConfig[del.status]?.bgColor, color: statusConfig[del.status]?.color }}>
                                                    {statusConfig[del.status]?.label}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Button size="sm" variant="ghost">Görüntüle</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {activeTab === 'invoices' && (
                    <Card>
                        <CardHeader title="💰 Faturalar" action={<Button size="sm">+ Yeni Fatura</Button>} />
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Fatura No</th>
                                        <th>Açıklama</th>
                                        <th>Tutar</th>
                                        <th>Vade</th>
                                        <th>Durum</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {project.invoices.map(inv => (
                                        <tr key={inv.id}>
                                            <td style={{ fontWeight: 600 }}>{inv.number}</td>
                                            <td>{inv.description}</td>
                                            <td style={{ fontWeight: 600 }}>{formatCurrency(inv.amount)}</td>
                                            <td>{new Date(inv.dueDate).toLocaleDateString('tr-TR')}</td>
                                            <td>
                                                <Badge style={{ backgroundColor: statusConfig[inv.status]?.bgColor, color: statusConfig[inv.status]?.color }}>
                                                    {statusConfig[inv.status]?.label}
                                                </Badge>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    {inv.status === 'PENDING' && <Button size="sm" variant="success">Ödeme Al</Button>}
                                                    <Button size="sm" variant="ghost">Görüntüle</Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {activeTab === 'activity' && (
                    <Card>
                        <CardHeader title="📜 Aktivite Akışı" />
                        <CardContent>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {project.activities.map(act => (
                                    <div key={act.id} style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
                                        <span style={{ fontSize: '20px' }}>{activityIcons[act.type] || '📌'}</span>
                                        <div style={{ flex: 1 }}>
                                            <p>
                                                <strong>{act.user}</strong> {act.action}
                                            </p>
                                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>{act.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'notes' && (
                    <Card>
                        <CardHeader title="📝 Proje Notları" action={<Button size="sm" onClick={() => setShowNoteModal(true)}>+ Not Ekle</Button>} />
                        <CardContent>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {project.notes.map(note => (
                                    <div key={note.id} style={{ padding: '16px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--color-primary)' }}>
                                        <p style={{ marginBottom: '8px' }}>{note.content}</p>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                                            👤 {note.user} • {note.date}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Not Ekleme Modal */}
            <Modal
                isOpen={showNoteModal}
                onClose={() => setShowNoteModal(false)}
                title="📝 Not Ekle"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowNoteModal(false)}>İptal</Button>
                        <Button variant="primary" onClick={() => setShowNoteModal(false)}>Kaydet</Button>
                    </>
                }
            >
                <Textarea
                    label="Not"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={4}
                    placeholder="Proje ile ilgili notunuzu yazın..."
                />
            </Modal>
        </>
    );
}
