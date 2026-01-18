'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Badge, Modal, Input, Select, Textarea } from '@/components/ui';

// Mock teslimat verisi
const deliverableData = {
    id: 'd1',
    title: 'Logo Tasarımı',
    description: 'Zeytindalı markası için yeni logo tasarımı. Ana logo, yatay/dikey versiyonlar ve favicon.',
    project: { id: '1', name: 'Zeytindalı Rebrand 2026', client: 'Zeytindalı Gıda' },
    status: 'IN_REVIEW',
    priority: 'HIGH',
    assignee: 'Ahmet Yılmaz',
    dueDate: '2026-01-20',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-13',
    progress: 90,
    contract: {
        maxRevisions: 3,
        currentRevision: 2,
        paymentRequired: true,
        isPaid: true,
    },
    revisions: [
        { id: 'r1', round: 1, status: 'CLOSED', feedback: 'Renkler çok koyu, daha açık tonlar deneyelim.', date: '2026-01-08', closedDate: '2026-01-10' },
        { id: 'r2', round: 2, status: 'OPEN', feedback: 'Yeşil tonu güzel, zeytin motifini biraz daha belirgin yapabilir miyiz?', date: '2026-01-12', closedDate: null },
    ],
    files: {
        final: [
            { id: 'f1', name: 'zeytindali-logo-v2.png', size: '1.2 MB', date: '2026-01-12', type: 'PNG' },
            { id: 'f2', name: 'zeytindali-logo-v2.svg', size: '45 KB', date: '2026-01-12', type: 'SVG' },
            { id: 'f3', name: 'zeytindali-logo-v2.pdf', size: '890 KB', date: '2026-01-12', type: 'PDF' },
        ],
        raw: [
            { id: 'r1', name: 'zeytindali-logo.ai', size: '12.5 MB', date: '2026-01-12', type: 'AI', protected: true },
            { id: 'r2', name: 'zeytindali-logo.psd', size: '45.2 MB', date: '2026-01-12', type: 'PSD', protected: true },
        ],
    },
    activities: [
        { id: 'a1', date: '2026-01-13 14:30', user: 'Ahmet', action: 'v2 dosyalarını yükledi', type: 'file' },
        { id: 'a2', date: '2026-01-12 10:00', user: 'Müşteri', action: 'Revizyon 2 talep etti', type: 'revision' },
        { id: 'a3', date: '2026-01-10 16:00', user: 'Ahmet', action: 'Revizyon 1 tamamlandı', type: 'status' },
        { id: 'a4', date: '2026-01-08 11:30', user: 'Müşteri', action: 'Revizyon 1 talep etti', type: 'revision' },
        { id: 'a5', date: '2026-01-05 09:00', user: 'Ahmet', action: 'İlk tasarımı incelemeye gönderdi', type: 'status' },
        { id: 'a6', date: '2026-01-01 10:00', user: 'Ahmet', action: 'Teslimat oluşturuldu', type: 'create' },
    ],
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string; nextAction?: string }> = {
    IN_PROGRESS: { label: 'Devam Ediyor', color: '#329FF5', bgColor: '#E3F2FD', nextAction: 'İncelemeye Gönder' },
    IN_REVIEW: { label: 'Müşteri İncelemesinde', color: '#FF9800', bgColor: '#FFF3E0', nextAction: 'Onayla' },
    APPROVED: { label: 'Onaylandı', color: '#00F5B0', bgColor: '#E8F5E9', nextAction: 'Teslim Et' },
    DELIVERED: { label: 'Teslim Edildi', color: '#4CAF50', bgColor: '#E8F5E9' },
    BLOCKED: { label: 'Engellendi', color: '#FF4242', bgColor: '#FFEBEE' },
};

const activityIcons: Record<string, string> = {
    file: '📎',
    revision: '🔄',
    status: '📋',
    create: '✨',
    payment: '💰',
};

export default function DeliverableDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'revisions' | 'activity'>('overview');
    const [showRevisionModal, setShowRevisionModal] = useState(false);
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);

    const deliverable = deliverableData;
    const canDeliver = deliverable.contract.isPaid && deliverable.status === 'APPROVED';
    const canRequestRevision = deliverable.contract.currentRevision < deliverable.contract.maxRevisions && deliverable.status === 'IN_REVIEW';
    const revisionsRemaining = deliverable.contract.maxRevisions - deliverable.contract.currentRevision;

    return (
        <>
            <Header
                title={deliverable.title}
                subtitle={`${deliverable.project.name} • ${deliverable.project.client}`}
                actions={
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <Button variant="secondary" onClick={() => router.back()}>← Geri</Button>

                        {/* State-based Actions */}
                        {deliverable.status === 'IN_PROGRESS' && (
                            <Button variant="primary">📤 İncelemeye Gönder</Button>
                        )}
                        {deliverable.status === 'IN_REVIEW' && (
                            <>
                                <Button
                                    variant={canRequestRevision ? 'warning' : 'ghost'}
                                    disabled={!canRequestRevision}
                                    onClick={() => setShowRevisionModal(true)}
                                    title={!canRequestRevision ? `Revizyon limiti doldu (${deliverable.contract.maxRevisions} tur)` : ''}
                                >
                                    🔄 Revizyon Talep Et {!canRequestRevision && '🔒'}
                                </Button>
                                <Button variant="success" onClick={() => setShowApproveConfirm(true)}>✅ Onayla</Button>
                            </>
                        )}
                        {deliverable.status === 'APPROVED' && (
                            <Button
                                variant={canDeliver ? 'success' : 'ghost'}
                                disabled={!canDeliver}
                                title={!deliverable.contract.isPaid ? '⚠️ Ödeme bekleniyor - Teslim yapılamaz' : ''}
                            >
                                📦 Teslim Et {!canDeliver && '🔒'}
                            </Button>
                        )}
                    </div>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* Ödeme Uyarısı */}
                {!deliverable.contract.isPaid && (
                    <Card style={{ marginBottom: 'var(--space-2)', backgroundColor: '#FFEBEE', borderLeft: '4px solid #FF4242' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{ fontSize: '24px' }}>⚠️</span>
                            <div>
                                <p style={{ fontWeight: 600, color: '#C62828' }}>Ödeme Bekleniyor</p>
                                <p style={{ fontSize: 'var(--text-caption)', color: '#B71C1C' }}>
                                    Fatura ödenmeden dosyalar teslim edilemez. Ödeme alındıktan sonra teslim butonu aktif olacaktır.
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Üst Kartlar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    <Card style={{ background: statusConfig[deliverable.status]?.bgColor }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>DURUM</p>
                            <p style={{ fontSize: '18px', fontWeight: 700, color: statusConfig[deliverable.status]?.color }}>
                                {statusConfig[deliverable.status]?.label}
                            </p>
                        </div>
                    </Card>

                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>İLERLEME</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>{deliverable.progress}%</p>
                            <div style={{ height: 4, backgroundColor: 'var(--color-border)', borderRadius: 2, marginTop: 8 }}>
                                <div style={{ height: '100%', width: `${deliverable.progress}%`, backgroundColor: 'var(--color-primary)', borderRadius: 2 }} />
                            </div>
                        </div>
                    </Card>

                    <Card style={{ background: revisionsRemaining === 0 ? '#FFF3E0' : undefined }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>REVİZYON</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, color: revisionsRemaining === 0 ? '#E65100' : 'inherit' }}>
                                {deliverable.contract.currentRevision}/{deliverable.contract.maxRevisions}
                            </p>
                            <p style={{ fontSize: 'var(--text-caption)', color: revisionsRemaining === 0 ? '#E65100' : 'var(--color-muted)' }}>
                                {revisionsRemaining === 0 ? 'Limit doldu' : `${revisionsRemaining} kaldı`}
                            </p>
                        </div>
                    </Card>

                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>SON TARİH</p>
                            <p style={{ fontSize: '18px', fontWeight: 700 }}>
                                {new Date(deliverable.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                            </p>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                                👤 {deliverable.assignee}
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Tab Navigation */}
                <Card style={{ marginBottom: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        {[
                            { id: 'overview', label: '📊 Genel Bakış' },
                            { id: 'files', label: '📁 Dosyalar' },
                            { id: 'revisions', label: '🔄 Revizyonlar' },
                            { id: 'activity', label: '📜 Aktivite' },
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
                    <Card>
                        <CardHeader title="📋 Teslimat Detayları" />
                        <CardContent>
                            <p style={{ marginBottom: 'var(--space-2)', lineHeight: 1.6 }}>{deliverable.description}</p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)' }}>
                                <div>
                                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Proje</p>
                                    <p style={{ fontWeight: 600 }}>📁 {deliverable.project.name}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Atanan Kişi</p>
                                    <p style={{ fontWeight: 600 }}>👤 {deliverable.assignee}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Oluşturulma</p>
                                    <p>📅 {new Date(deliverable.createdAt).toLocaleDateString('tr-TR')}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Son Güncelleme</p>
                                    <p>📅 {new Date(deliverable.updatedAt).toLocaleDateString('tr-TR')}</p>
                                </div>
                            </div>

                            {/* Kural Bilgileri */}
                            <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                                <p style={{ fontWeight: 600, marginBottom: '12px' }}>📋 Sözleşme Kuralları</p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: 'var(--text-body-sm)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>{deliverable.contract.isPaid ? '✅' : '❌'}</span>
                                        <span>Ödeme {deliverable.contract.isPaid ? 'Alındı' : 'Bekleniyor'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>{revisionsRemaining > 0 ? '✅' : '⚠️'}</span>
                                        <span>Revizyon: {deliverable.contract.currentRevision}/{deliverable.contract.maxRevisions} kullanıldı</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>{!deliverable.contract.paymentRequired || deliverable.contract.isPaid ? '✅' : '🔒'}</span>
                                        <span>Teslim {!deliverable.contract.paymentRequired ? 'açık' : deliverable.contract.isPaid ? 'hazır' : 'ödeme bekliyor'}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'files' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                        <Card>
                            <CardHeader title="📦 Final Dosyaları" description="Müşteriye teslim edilecek dosyalar" />
                            <CardContent>
                                {deliverable.files.final.map(file => (
                                    <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '24px' }}>📄</span>
                                            <div>
                                                <p style={{ fontWeight: 500 }}>{file.name}</p>
                                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>{file.size} • {file.type}</p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost">İndir</Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader title="🔐 Kaynak Dosyaları (RAW)" description="Korumalı - Sözleşmeye bağlı" />
                            <CardContent>
                                {deliverable.files.raw.map(file => (
                                    <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#FFF3E0', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '24px' }}>🔒</span>
                                            <div>
                                                <p style={{ fontWeight: 500 }}>{file.name}</p>
                                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>{file.size} • {file.type}</p>
                                            </div>
                                        </div>
                                        <Badge variant="warning">Korumalı</Badge>
                                    </div>
                                ))}
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginTop: '12px', fontStyle: 'italic' }}>
                                    ⚠️ RAW dosyalar sözleşme kapsamında müşteriye verilmez. Özel anlaşma gereklidir.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'revisions' && (
                    <Card>
                        <CardHeader title="🔄 Revizyon Geçmişi" description={`${deliverable.contract.currentRevision}/${deliverable.contract.maxRevisions} tur kullanıldı`} />
                        <CardContent>
                            {deliverable.revisions.map(rev => (
                                <div key={rev.id} style={{ padding: '16px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', marginBottom: '12px', borderLeft: `4px solid ${rev.status === 'OPEN' ? '#FF9800' : '#00F5B0'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontWeight: 600 }}>Revizyon Turu #{rev.round}</span>
                                        <Badge variant={rev.status === 'OPEN' ? 'warning' : 'success'}>
                                            {rev.status === 'OPEN' ? 'Açık' : 'Kapatıldı'}
                                        </Badge>
                                    </div>
                                    <p style={{ marginBottom: '8px', lineHeight: 1.6 }}>"{rev.feedback}"</p>
                                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                                        Talep: {rev.date} {rev.closedDate && `• Kapatıldı: ${rev.closedDate}`}
                                    </p>
                                </div>
                            ))}

                            {revisionsRemaining === 0 && (
                                <div style={{ padding: '16px', backgroundColor: '#FFF3E0', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                    <p style={{ fontWeight: 600, color: '#E65100' }}>⚠️ Revizyon Limiti Doldu</p>
                                    <p style={{ fontSize: 'var(--text-caption)', color: '#BF360C' }}>
                                        Ek revizyonlar için yeni sözleşme kapsamı gereklidir.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'activity' && (
                    <Card>
                        <CardHeader title="📜 Aktivite Akışı" />
                        <CardContent>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {deliverable.activities.map(act => (
                                    <div key={act.id} style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
                                        <span style={{ fontSize: '20px' }}>{activityIcons[act.type] || '📌'}</span>
                                        <div style={{ flex: 1 }}>
                                            <p><strong>{act.user}</strong> {act.action}</p>
                                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>{act.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Revizyon Modal */}
            <Modal
                isOpen={showRevisionModal}
                onClose={() => setShowRevisionModal(false)}
                title="🔄 Revizyon Talebi"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowRevisionModal(false)}>İptal</Button>
                        <Button variant="warning" onClick={() => setShowRevisionModal(false)}>Talep Gönder</Button>
                    </>
                }
            >
                <div style={{ marginBottom: 'var(--space-2)' }}>
                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginBottom: '8px' }}>
                        Kalan Revizyon Hakkı: <strong>{revisionsRemaining}</strong>
                    </p>
                </div>
                <Textarea
                    label="Revizyon Notları"
                    rows={4}
                    placeholder="Yapılmasını istediğiniz değişiklikleri açıklayın..."
                />
            </Modal>

            {/* Onay Modal */}
            <Modal
                isOpen={showApproveConfirm}
                onClose={() => setShowApproveConfirm(false)}
                title="✅ Teslimatı Onayla"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowApproveConfirm(false)}>İptal</Button>
                        <Button variant="success" onClick={() => setShowApproveConfirm(false)}>Onayla</Button>
                    </>
                }
            >
                <p>Bu teslimatı onaylamak istediğinizden emin misiniz?</p>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginTop: '12px' }}>
                    ⚠️ Onay sonrası revizyon talep edemezsiniz.
                </p>
            </Modal>
        </>
    );
}
