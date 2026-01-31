'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Badge, Modal, Textarea } from '@/components/ui';
import {
    getClientDashboard,
    getClientProjects,
    getClientInvoices,
    approveDeliverable,
    requestRevision,
} from '@/lib/actions/clientPortal';

// ===== CLIENT PORTAL - Müşteri Görünümü =====

// Demo client ID - Gerçek uygulamada session'dan alınacak
const DEMO_CLIENT_ID = 'demo-client-1';

interface DashboardStats {
    totalProjects: number;
    activeProjects: number;
    pendingApprovals: number;
    pendingInvoices: number;
    totalPendingAmount: number;
}

interface ClientData {
    id: string;
    name: string;
    company: string | null;
    email: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    ACTIVE: { label: 'Aktif', color: '#329FF5', bgColor: '#E3F2FD' },
    PENDING: { label: 'Beklemede', color: '#F6D73C', bgColor: '#FFF9E6' },
    COMPLETED: { label: 'Tamamlandı', color: '#00F5B0', bgColor: '#E8F5E9' },
    IN_REVIEW: { label: 'Onayınızı Bekliyor', color: '#FF9800', bgColor: '#FFF3E0' },
    IN_PROGRESS: { label: 'Hazırlanıyor', color: '#329FF5', bgColor: '#E3F2FD' },
    TODO: { label: 'Planlandı', color: '#6B7B80', bgColor: '#F5F5F5' },
    APPROVED: { label: 'Onaylandı', color: '#00F5B0', bgColor: '#E8F5E9' },
    DELIVERED: { label: 'Teslim Edildi', color: '#4CAF50', bgColor: '#E8F5E9' },
    PAID: { label: 'Ödendi', color: '#00F5B0', bgColor: '#E8F5E9' },
    OVERDUE: { label: 'Gecikmiş', color: '#FF4242', bgColor: '#FFEBEE' },
};

export default function ClientPortalPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [clientData, setClientData] = useState<ClientData | null>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);

    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRevisionModal, setShowRevisionModal] = useState(false);
    const [selectedDeliverable, setSelectedDeliverable] = useState<any>(null);
    const [revisionNotes, setRevisionNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Verileri yükle
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [dashboardData, projectsData, invoicesData] = await Promise.all([
                getClientDashboard(DEMO_CLIENT_ID),
                getClientProjects(DEMO_CLIENT_ID),
                getClientInvoices(DEMO_CLIENT_ID),
            ]);

            setClientData(dashboardData.client);
            setStats(dashboardData.stats);
            setProjects(projectsData);
            setInvoices(invoicesData);
        } catch (err) {
            console.error('Veri yüklenemedi:', err);
            setError('Veriler yüklenirken bir hata oluştu. Demo verileriyle devam ediliyor.');
            // Demo veriler
            setClientData({
                id: DEMO_CLIENT_ID,
                name: 'Demo Müşteri',
                company: 'Demo Şirket',
                email: 'demo@example.com',
            });
            setStats({
                totalProjects: 2,
                activeProjects: 1,
                pendingApprovals: 1,
                pendingInvoices: 1,
                totalPendingAmount: 50000,
            });
            setProjects([
                {
                    id: 'p1',
                    name: 'Demo Proje',
                    status: 'ACTIVE',
                    deliverables: [
                        { id: 'd1', name: 'Logo Tasarımı', status: 'IN_REVIEW', revisionCount: 0 },
                        { id: 'd2', name: 'Kurumsal Kimlik', status: 'IN_PROGRESS', revisionCount: 0 },
                    ],
                    maxRevisions: 3,
                },
            ]);
            setInvoices([
                { id: 'i1', projectName: 'Demo Proje', amount: 50000, status: 'PENDING', dueDate: '2026-02-01' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);

    const handleApprove = (deliverable: any) => {
        setSelectedDeliverable(deliverable);
        setShowApproveModal(true);
    };

    const handleRequestRevision = (deliverable: any) => {
        setSelectedDeliverable(deliverable);
        setRevisionNotes('');
        setShowRevisionModal(true);
    };

    const confirmApprove = async () => {
        if (!selectedDeliverable) return;

        try {
            setActionLoading(true);
            await approveDeliverable(selectedDeliverable.id, DEMO_CLIENT_ID);
            await loadData(); // Verileri yenile
            setShowApproveModal(false);
        } catch (err: any) {
            alert(err.message || 'Onaylama başarısız');
        } finally {
            setActionLoading(false);
        }
    };

    const confirmRevision = async () => {
        if (!selectedDeliverable || !revisionNotes.trim()) {
            alert('Lütfen revizyon notlarını girin');
            return;
        }

        try {
            setActionLoading(true);
            await requestRevision(selectedDeliverable.id, DEMO_CLIENT_ID, revisionNotes);
            await loadData(); // Verileri yenile
            setShowRevisionModal(false);
        } catch (err: any) {
            alert(err.message || 'Revizyon talebi başarısız');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <>
                <Header title="Müşteri Portalı" subtitle="Yükleniyor..." />
                <div style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                    <p style={{ fontSize: '48px' }}>⏳</p>
                    <p>Veriler yükleniyor...</p>
                </div>
            </>
        );
    }

    const pendingApprovals = projects.flatMap(p =>
        (p.deliverables || []).filter((d: any) => d.status === 'IN_REVIEW')
    );

    const pendingInvoices = invoices.filter(i => i.status !== 'PAID');

    return (
        <>
            <Header
                title={`Hoş Geldiniz, ${clientData?.name || 'Müşteri'}`}
                subtitle={clientData?.company || ''}
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* Hata Mesajı */}
                {error && (
                    <Card style={{ marginBottom: 'var(--space-2)', backgroundColor: '#FFF3E0', borderLeft: '4px solid #FF9800' }}>
                        <p style={{ color: '#E65100' }}>⚠️ {error}</p>
                    </Card>
                )}

                {/* Uyarı Kartları */}
                {(pendingInvoices.length > 0 || pendingApprovals.length > 0) && (
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                        {pendingApprovals.length > 0 && (
                            <Card style={{ flex: 1, backgroundColor: '#FFF3E0', borderLeft: '4px solid #FF9800' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    <span style={{ fontSize: '32px' }}>👀</span>
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#E65100' }}>{pendingApprovals.length} teslimat onayınızı bekliyor</p>
                                        <p style={{ fontSize: 'var(--text-caption)', color: '#BF360C' }}>
                                            İnceleyip onaylayın veya revizyon talep edin
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}
                        {pendingInvoices.length > 0 && (
                            <Card style={{ flex: 1, backgroundColor: '#FFF9E6', borderLeft: '4px solid #F6D73C' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    <span style={{ fontSize: '32px' }}>💰</span>
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#F57F17' }}>{pendingInvoices.length} bekleyen fatura</p>
                                        <p style={{ fontSize: 'var(--text-caption)', color: '#F9A825' }}>
                                            Toplam: {formatCurrency(pendingInvoices.reduce((s, i) => s + Number(i.amount), 0))}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-2)' }}>
                    {/* Sol - Projeler ve Teslimatlar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {projects.length === 0 ? (
                            <Card>
                                <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                                    <p style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>📁</p>
                                    <p>Henüz projeniz bulunmuyor</p>
                                </div>
                            </Card>
                        ) : (
                            projects.map(project => (
                                <Card key={project.id}>
                                    <CardHeader
                                        title={`📁 ${project.name}`}
                                        description={`Durum: ${statusConfig[project.status]?.label || project.status}`}
                                    />
                                    <CardContent>
                                        {/* Teslimatlar */}
                                        <p style={{ fontWeight: 600, marginBottom: '12px' }}>📦 Teslimatlar</p>
                                        {(project.deliverables || []).map((del: any) => (
                                            <div key={del.id} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '12px',
                                                backgroundColor: del.status === 'IN_REVIEW' ? statusConfig.IN_REVIEW.bgColor : 'var(--color-surface)',
                                                borderRadius: 'var(--radius-sm)',
                                                marginBottom: '8px',
                                                borderLeft: del.status === 'IN_REVIEW' ? '4px solid #FF9800' : 'none'
                                            }}>
                                                <div>
                                                    <p style={{ fontWeight: 500 }}>{del.name}</p>
                                                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                                        <Badge style={{
                                                            backgroundColor: statusConfig[del.status]?.bgColor,
                                                            color: statusConfig[del.status]?.color,
                                                        }}>
                                                            {statusConfig[del.status]?.label || del.status}
                                                        </Badge>
                                                        {del.revisionCount > 0 && (
                                                            <Badge variant="warning" style={{ fontSize: '10px' }}>
                                                                Revizyon: {del.revisionCount}/{project.maxRevisions || 3}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                {del.status === 'IN_REVIEW' && (
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <Button size="sm" variant="warning" onClick={() => handleRequestRevision(del)}>
                                                            🔄 Revizyon
                                                        </Button>
                                                        <Button size="sm" variant="success" onClick={() => handleApprove(del)}>
                                                            ✅ Onayla
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Sağ - Faturalar ve Destek */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {/* Faturalar */}
                        <Card>
                            <CardHeader title="💰 Faturalar" />
                            <CardContent>
                                {invoices.length === 0 ? (
                                    <p style={{ color: 'var(--color-muted)', textAlign: 'center' }}>Fatura bulunmuyor</p>
                                ) : (
                                    invoices.map(inv => (
                                        <div key={inv.id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px',
                                            backgroundColor: 'var(--color-surface)',
                                            borderRadius: 'var(--radius-sm)',
                                            marginBottom: '8px'
                                        }}>
                                            <div>
                                                <p style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>{inv.projectName}</p>
                                                {inv.dueDate && (
                                                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                                                        Vade: {new Date(inv.dueDate).toLocaleDateString('tr-TR')}
                                                    </p>
                                                )}
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontWeight: 600 }}>{formatCurrency(Number(inv.amount))}</p>
                                                <Badge style={{
                                                    backgroundColor: statusConfig[inv.status]?.bgColor,
                                                    color: statusConfig[inv.status]?.color
                                                }}>
                                                    {statusConfig[inv.status]?.label || inv.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* İstatistikler */}
                        {stats && (
                            <Card>
                                <CardHeader title="📊 Özet" />
                                <CardContent>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                                            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>{stats.totalProjects}</p>
                                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Toplam Proje</p>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                                            <p style={{ fontSize: '24px', fontWeight: 700, color: '#00F5B0' }}>{stats.activeProjects}</p>
                                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Aktif</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Destek */}
                        <Card style={{ backgroundColor: 'var(--color-surface)' }}>
                            <CardHeader title="💬 Destek" />
                            <CardContent>
                                <p style={{ fontSize: 'var(--text-body-sm)', marginBottom: '12px' }}>
                                    Sorularınız mı var? Bize ulaşın.
                                </p>
                                <Button variant="primary" style={{ width: '100%' }}>📧 Mesaj Gönder</Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Onay Modal */}
            <Modal
                isOpen={showApproveModal}
                onClose={() => setShowApproveModal(false)}
                title="✅ Teslimatı Onayla"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowApproveModal(false)} disabled={actionLoading}>İptal</Button>
                        <Button variant="success" onClick={confirmApprove} disabled={actionLoading}>
                            {actionLoading ? 'İşleniyor...' : 'Onayla'}
                        </Button>
                    </>
                }
            >
                <p>
                    <strong>{selectedDeliverable?.name}</strong> teslimatını onaylamak istediğinizden emin misiniz?
                </p>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginTop: '12px' }}>
                    ⚠️ Onay sonrası revizyon talep edemezsiniz.
                </p>
            </Modal>

            {/* Revizyon Modal */}
            <Modal
                isOpen={showRevisionModal}
                onClose={() => setShowRevisionModal(false)}
                title="🔄 Revizyon Talep Et"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowRevisionModal(false)} disabled={actionLoading}>İptal</Button>
                        <Button variant="warning" onClick={confirmRevision} disabled={actionLoading || !revisionNotes.trim()}>
                            {actionLoading ? 'Gönderiliyor...' : 'Talep Gönder'}
                        </Button>
                    </>
                }
            >
                <p style={{ marginBottom: '12px' }}>
                    <strong>{selectedDeliverable?.name}</strong> için revizyon talebi
                </p>
                <Textarea
                    label="Revizyon Notları *"
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    rows={4}
                    placeholder="Yapılmasını istediğiniz değişiklikleri detaylı açıklayın..."
                />
            </Modal>
        </>
    );
}
