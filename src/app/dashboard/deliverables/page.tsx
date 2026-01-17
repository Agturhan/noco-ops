'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import {
    Card, CardHeader, CardContent,
    Badge, Button,
    DeliverableStatusBadge, InvoiceStatusBadge,
    Modal, ConfirmModal
} from '@/components/ui';
import { getBlockedReason } from '@/lib/machines/deliverableMachine';
import { getDeliverables, updateDeliverableStatus, deliverDeliverable } from '@/lib/actions/deliverables';
import type { DeliverableStatus } from '@/lib/actions/deliverables';

// Deliverable type
interface Deliverable {
    id: string;
    name: string;
    project: string;
    status: 'IN_PROGRESS' | 'IN_REVIEW' | 'APPROVED' | 'DELIVERED' | 'REVISION_LIMIT_MET';
    revisionCount: number;
    maxRevisions: number;
    invoiceStatus: 'PENDING' | 'PAID' | 'OVERDUE' | 'REFUNDED';
    invoicePaid: boolean;
    // Ödeme takibi için yeni alanlar
    paymentReceived?: boolean;
    paymentDueDate?: string; // 30 gün countdown için
    deliveredAt?: string;
}

export default function DeliverablesPage() {
    const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
    const [showDeliverModal, setShowDeliverModal] = useState(false);
    const [showBlockedModal, setShowBlockedModal] = useState(false);
    const [blockedReason, setBlockedReason] = useState('');

    // Ödeme takibi için yeni state'ler
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingDeliverable, setPendingDeliverable] = useState<Deliverable | null>(null);

    // Load deliverables from database
    useEffect(() => {
        const loadDeliverables = async () => {
            try {
                setLoading(true);
                const data = await getDeliverables();
                // Transform DB data to local format
                const formatted: Deliverable[] = data.map((d: any) => ({
                    id: d.id,
                    name: d.name,
                    project: d.project?.name || 'Bilinmeyen Proje',
                    status: d.status,
                    revisionCount: d.revisionCount || 0,
                    maxRevisions: d.project?.contract?.maxRevisions || 2,
                    invoiceStatus: 'PENDING',
                    invoicePaid: false
                }));
                setDeliverables(formatted);
            } catch (error) {
                console.error('Teslimatlar yüklenirken hata:', error);
            } finally {
                setLoading(false);
            }
        };
        loadDeliverables();
    }, []);

    const handleDeliverClick = (deliverable: Deliverable) => {
        // Kural kontrolü: Ödeme yapılmış mı?
        const reason = getBlockedReason('DELIVER', {
            deliverableId: deliverable.id,
            invoicePaid: deliverable.invoicePaid,
            revisionCount: deliverable.revisionCount,
            maxRevisions: deliverable.maxRevisions,
            rawAccessGranted: false
        });

        if (reason) {
            // Engellendi - nedeni göster
            setBlockedReason(reason);
            setShowBlockedModal(true);
        } else {
            // İzin verildi - onay modal'ı göster
            setSelectedDeliverable(deliverable);
            setShowDeliverModal(true);
        }
    };

    const handleDeliver = async () => {
        if (!selectedDeliverable) return;
        try {
            await deliverDeliverable(selectedDeliverable.id);
            const now = new Date().toISOString();
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30); // 30 gün sonra

            // Teslimatı güncelle
            setDeliverables(deliverables.map(d =>
                d.id === selectedDeliverable.id ? {
                    ...d,
                    status: 'DELIVERED' as const,
                    deliveredAt: now,
                    paymentDueDate: dueDate.toISOString()
                } : d
            ));
            setShowDeliverModal(false);

            // Ödeme sorgusu modal'ını aç
            setPendingDeliverable(selectedDeliverable);
            setShowPaymentModal(true);
        } catch (error) {
            console.error('Teslimat yapılırken hata:', error);
            alert('Teslimat yapılırken bir hata oluştu');
        }
    };

    // Ödeme yanıtı işle
    const handlePaymentResponse = (received: boolean) => {
        if (!pendingDeliverable) return;

        setDeliverables(deliverables.map(d =>
            d.id === pendingDeliverable.id ? {
                ...d,
                paymentReceived: received,
                invoiceStatus: received ? 'PAID' : 'PENDING',
                invoicePaid: received
            } : d
        ));

        setShowPaymentModal(false);
        setPendingDeliverable(null);
    };

    // 30 gün kalan süreyi hesapla
    const getDaysRemaining = (dueDate: string): number => {
        const due = new Date(dueDate);
        const now = new Date();
        return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    };

    const handleSendToReview = async (deliverable: Deliverable) => {
        try {
            await updateDeliverableStatus(deliverable.id, 'IN_REVIEW');
            setDeliverables(deliverables.map(d =>
                d.id === deliverable.id ? { ...d, status: 'IN_REVIEW' as const } : d
            ));
        } catch (error) {
            console.error('İncelemeye gönderilirken hata:', error);
            alert('İncelemeye gönderilirken bir hata oluştu');
        }
    };

    return (
        <>
            <Header
                title="Teslimatlar"
                subtitle="Tüm proje teslimatlarını yönetin"
                actions={
                    <Button variant="primary">
                        + Yeni Teslimat
                    </Button>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* Info Banner */}
                <Card style={{
                    marginBottom: 'var(--space-2)',
                    backgroundColor: 'rgba(50, 159, 245, 0.05)',
                    borderLeft: '3px solid var(--color-primary)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        fontSize: 'var(--text-body-sm)'
                    }}>
                        <span>ℹ️</span>
                        <span>
                            <strong>Kural Zorlama Aktif:</strong> Ödeme yapılmadan teslimat yapılamaz.
                            Revizyon limiti aşılamaz.
                        </span>
                    </div>
                </Card>

                {/* Deliverables Table */}
                <Card>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Teslimat</th>
                                    <th>Proje</th>
                                    <th>Durum</th>
                                    <th>Revizyon</th>
                                    <th>Ödeme</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deliverables.map((deliverable) => {
                                    const canDeliver = deliverable.status === 'APPROVED' && deliverable.invoicePaid;
                                    const deliverBlockedReason = !deliverable.invoicePaid
                                        ? 'Fatura ödenmeden teslimat yapılamaz'
                                        : null;

                                    return (
                                        <tr key={deliverable.id}>
                                            <td style={{ fontWeight: 500 }}>{deliverable.name}</td>
                                            <td style={{ color: 'var(--color-muted)' }}>{deliverable.project}</td>
                                            <td>
                                                <DeliverableStatusBadge status={deliverable.status} />
                                            </td>
                                            <td>
                                                <span style={{
                                                    color: deliverable.revisionCount >= deliverable.maxRevisions
                                                        ? 'var(--color-error)'
                                                        : 'var(--color-sub-ink)'
                                                }}>
                                                    {deliverable.revisionCount}/{deliverable.maxRevisions}
                                                    {deliverable.revisionCount >= deliverable.maxRevisions && ' ⚠️'}
                                                </span>
                                            </td>
                                            <td>
                                                <InvoiceStatusBadge status={deliverable.invoiceStatus} />
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                                                    {deliverable.status === 'APPROVED' && (
                                                        <Button
                                                            variant={canDeliver ? 'success' : 'secondary'}
                                                            size="sm"
                                                            disabled={!canDeliver}
                                                            blockedReason={deliverBlockedReason}
                                                            onClick={() => handleDeliverClick(deliverable)}
                                                            style={!canDeliver ? { cursor: 'not-allowed' } : {}}
                                                        >
                                                            {canDeliver ? '📤 Teslim Et' : '🔒 Teslim Et'}
                                                        </Button>
                                                    )}
                                                    {deliverable.status === 'IN_PROGRESS' && (
                                                        <Button variant="primary" size="sm" onClick={() => handleSendToReview(deliverable)}>
                                                            📤 İncelemeye Gönder
                                                        </Button>
                                                    )}
                                                    {deliverable.status === 'IN_REVIEW' && (
                                                        <Badge variant="info">Müşteri Bekleniyor</Badge>
                                                    )}
                                                    {deliverable.status === 'REVISION_LIMIT_MET' && (
                                                        <Button variant="secondary" size="sm">
                                                            Ek Kapsam Talep Et
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="sm">⋮</Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Teslimat Onay Modal */}
            <ConfirmModal
                isOpen={showDeliverModal}
                onClose={() => setShowDeliverModal(false)}
                onConfirm={handleDeliver}
                title="Teslimatı Onayla"
                message={`"${selectedDeliverable?.name}" teslimatını müşteriye göndermek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
                confirmText="Teslim Et"
            />

            {/* Engelleme Bilgi Modal */}
            <Modal
                isOpen={showBlockedModal}
                onClose={() => setShowBlockedModal(false)}
                title="🔒 İşlem Engellendi"
                size="sm"
                footer={
                    <Button variant="primary" onClick={() => setShowBlockedModal(false)}>
                        Anladım
                    </Button>
                }
            >
                <div style={{
                    padding: 'var(--space-2)',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: '3px solid var(--color-error)'
                }}>
                    <p style={{
                        color: 'var(--color-error)',
                        fontWeight: 500,
                        marginBottom: 'var(--space-1)'
                    }}>
                        Bu işlem sistem kuralları tarafından engellendi:
                    </p>
                    <p style={{ color: 'var(--color-sub-ink)' }}>
                        {blockedReason}
                    </p>
                </div>
            </Modal>

            {/* Ödeme Takibi Modal */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => {
                    setShowPaymentModal(false);
                    setPendingDeliverable(null);
                }}
                title="💰 Ödeme Durumu"
                size="sm"
                footer={
                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
                        <Button
                            variant="primary"
                            onClick={() => handlePaymentResponse(true)}
                            style={{ backgroundColor: '#4CAF50' }}
                        >
                            ✅ Evet, Ödeme Alındı
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => handlePaymentResponse(false)}
                        >
                            ❌ Hayır, Henüz Alınmadı
                        </Button>
                    </div>
                }
            >
                <div style={{ textAlign: 'center', padding: 'var(--space-2)' }}>
                    <p style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>💵</p>
                    <p style={{ fontSize: 'var(--text-h4)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                        Teslimat Tamamlandı!
                    </p>
                    <p style={{ color: 'var(--color-muted)', marginBottom: 'var(--space-2)' }}>
                        {pendingDeliverable?.name}
                    </p>
                    <p style={{
                        fontSize: 'var(--text-body)',
                        color: 'var(--color-sub-ink)',
                        backgroundColor: 'var(--color-surface)',
                        padding: 'var(--space-2)',
                        borderRadius: 'var(--radius-sm)'
                    }}>
                        Bu iş için <strong>ödeme alındı mı?</strong><br />
                        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                            (&quot;Hayır&quot; seçerseniz 30 gün sonra hatırlatılacak)
                        </span>
                    </p>
                </div>
            </Modal>
        </>
    );
}
