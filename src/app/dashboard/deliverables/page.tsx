'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Badge, Button, Modal } from '@/components/ui';
import { getDeliverables, updateDeliverableStatus, deliverDeliverable } from '@/lib/actions/deliverables';
import { getBrandColor, getBrandName } from '@/lib/data';

// Sadeleştirilmiş Teslimat Durumları (2 adet)
type SimpleDeliverableStatus = 'BEKLEMEDE' | 'TESLIM_EDILDI';

const statusConfig: Record<SimpleDeliverableStatus, { label: string; color: string; icon: string }> = {
    BEKLEMEDE: { label: 'Beklemede', color: '#FF9800', icon: '⏳' },
    TESLIM_EDILDI: { label: 'Teslim Edildi', color: '#00F5B0', icon: '✅' }
};

// Teslimat tipi - genişletilmiş
interface Deliverable {
    id: string;
    name: string;
    project: string;
    projectId?: string;
    status: SimpleDeliverableStatus;
    deliveredAt?: string;
    // İçerik detayları
    contentType?: 'VIDEO' | 'FOTOGRAF' | 'POST' | 'REELS' | 'STORY' | 'GRAFIK';
    contentCount?: number;
    brand?: string;
    brandId?: string;
    description?: string;
    assignee?: string;
    dueDate?: string;
    // Ödeme durumu
    paymentReceived?: boolean;
}

// İçerik tipleri
const contentTypeConfig: Record<string, { label: string; icon: string; color: string }> = {
    VIDEO: { label: 'Video', icon: '🎬', color: '#329FF5' },
    FOTOGRAF: { label: 'Fotoğraf', icon: '📷', color: '#00F5B0' },
    POST: { label: 'Post', icon: '📱', color: '#9C27B0' },
    REELS: { label: 'Reels', icon: '🎞️', color: '#E91E63' },
    STORY: { label: 'Story', icon: '📸', color: '#FF9800' },
    GRAFIK: { label: 'Grafik', icon: '🎨', color: '#2196F3' }
};

export default function DeliverablesPage() {
    const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | SimpleDeliverableStatus>('all');

    // Verileri yükle
    useEffect(() => {
        const loadDeliverables = async () => {
            try {
                setLoading(true);
                const data = await getDeliverables();

                // DB verisini düzenle
                const formatted: Deliverable[] = data.map((d: any) => ({
                    id: d.id,
                    name: d.name,
                    project: d.project?.name || d.projectName || 'Genel',
                    projectId: d.projectId,
                    // Status mapping: DELIVERED → TESLIM_EDILDI, diğerleri → BEKLEMEDE
                    status: d.status === 'DELIVERED' ? 'TESLIM_EDILDI' : 'BEKLEMEDE',
                    deliveredAt: d.deliveredAt,
                    contentType: d.contentType || 'VIDEO',
                    contentCount: d.contentCount || 1,
                    brand: d.brand?.name || d.brandName || d.project?.client?.name,
                    brandId: d.brandId || d.project?.clientId,
                    description: d.description || d.notes,
                    assignee: d.assignee?.name || d.assigneeId,
                    dueDate: d.dueDate,
                    paymentReceived: d.paymentReceived || false
                }));

                setDeliverables(formatted);
            } catch (error) {
                console.error('Teslimatlar yüklenirken hata:', error);
                // Demo veri
                setDeliverables([
                    {
                        id: '1',
                        name: 'Zeytindalı Ocak Ayı İçerikleri',
                        project: 'Zeytindalı Sosyal Medya',
                        status: 'BEKLEMEDE',
                        contentType: 'VIDEO',
                        contentCount: 4,
                        brand: 'Zeytindalı Gıda',
                        description: '4 adet Reels videosu - Ürün tanıtımı',
                        assignee: 'Fatih Ustaosmanoğlu',
                        dueDate: '2026-01-25'
                    },
                    {
                        id: '2',
                        name: 'Valora Psikoloji Fotoğraf Çekimi',
                        project: 'Valora Web Sitesi',
                        status: 'TESLIM_EDILDI',
                        contentType: 'FOTOGRAF',
                        contentCount: 25,
                        brand: 'Valora Psikoloji',
                        description: 'Profesyonel ekip fotoğrafları, ofis çekimleri',
                        assignee: 'Ayşegül Güler',
                        deliveredAt: '2026-01-15T14:30:00Z',
                        paymentReceived: true
                    },
                    {
                        id: '3',
                        name: 'İkranur Story Tasarımları',
                        project: 'İkranur Aylık Paket',
                        status: 'BEKLEMEDE',
                        contentType: 'STORY',
                        contentCount: 8,
                        brand: 'İkranur Kozmetik',
                        description: 'Haftalık story görselleri (2 haftalık)',
                        assignee: 'Şeyma Bora',
                        dueDate: '2026-01-22'
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };
        loadDeliverables();
    }, []);

    // Teslimat yap
    const handleDeliver = async (deliverable: Deliverable) => {
        try {
            await deliverDeliverable(deliverable.id);
            const now = new Date().toISOString();
            setDeliverables(prev => prev.map(d =>
                d.id === deliverable.id
                    ? { ...d, status: 'TESLIM_EDILDI', deliveredAt: now }
                    : d
            ));
        } catch (error) {
            console.error('Teslimat yapılırken hata:', error);
            // Fallback: Lokal güncelle
            const now = new Date().toISOString();
            setDeliverables(prev => prev.map(d =>
                d.id === deliverable.id
                    ? { ...d, status: 'TESLIM_EDILDI', deliveredAt: now }
                    : d
            ));
        }
    };

    // Ödeme al
    const handleMarkAsPaid = (id: string) => {
        setDeliverables(prev => prev.map(d =>
            d.id === id ? { ...d, paymentReceived: true } : d
        ));
    };

    // Filtreleme
    const filteredDeliverables = deliverables.filter(d => {
        if (filterStatus === 'all') return true;
        return d.status === filterStatus;
    });

    // İstatistikler
    const stats = {
        total: deliverables.length,
        beklemede: deliverables.filter(d => d.status === 'BEKLEMEDE').length,
        teslimEdildi: deliverables.filter(d => d.status === 'TESLIM_EDILDI').length,
        odemeBekleyen: deliverables.filter(d => d.status === 'TESLIM_EDILDI' && !d.paymentReceived).length
    };

    // Detay modal'ı aç
    const openDetail = (d: Deliverable) => {
        setSelectedDeliverable(d);
        setShowDetailModal(true);
    };

    return (
        <>
            <Header
                title="Teslimatlar"
                subtitle="İçerik teslimatlarını takip edin"
                actions={
                    <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                        {/* Status Filtre */}
                        <div style={{
                            display: 'flex',
                            backgroundColor: 'var(--color-surface)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '2px',
                            border: '1px solid var(--color-border)'
                        }}>
                            <Button
                                variant={filterStatus === 'all' ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setFilterStatus('all')}
                            >
                                Tümü ({stats.total})
                            </Button>
                            <Button
                                variant={filterStatus === 'BEKLEMEDE' ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setFilterStatus('BEKLEMEDE')}
                            >
                                ⏳ Beklemede ({stats.beklemede})
                            </Button>
                            <Button
                                variant={filterStatus === 'TESLIM_EDILDI' ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setFilterStatus('TESLIM_EDILDI')}
                            >
                                ✅ Teslim Edildi ({stats.teslimEdildi})
                            </Button>
                        </div>
                    </div>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* İstatistik Kartları */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-3)'
                }}>
                    <Card>
                        <CardContent>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-primary)' }}>{stats.total}</p>
                                <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>Toplam</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: 32, fontWeight: 700, color: '#FF9800' }}>{stats.beklemede}</p>
                                <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>⏳ Beklemede</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: 32, fontWeight: 700, color: '#00F5B0' }}>{stats.teslimEdildi}</p>
                                <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>✅ Teslim Edildi</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card style={{ borderLeft: stats.odemeBekleyen > 0 ? '3px solid #FF4242' : undefined }}>
                        <CardContent>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: 32, fontWeight: 700, color: stats.odemeBekleyen > 0 ? '#FF4242' : 'var(--color-muted)' }}>
                                    {stats.odemeBekleyen}
                                </p>
                                <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>💰 Ödeme Bekliyor</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Teslimat Listesi */}
                {loading ? (
                    <Card>
                        <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                            <p style={{ color: 'var(--color-muted)' }}>Teslimatlar yükleniyor...</p>
                        </div>
                    </Card>
                ) : filteredDeliverables.length === 0 ? (
                    <Card>
                        <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                            <p style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>📦</p>
                            <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Teslimat bulunamadı</p>
                            <p style={{ color: 'var(--color-muted)' }}>
                                {filterStatus !== 'all' ? 'Filtre kriterlerini değiştirin' : 'Henüz teslimat oluşturulmamış'}
                            </p>
                        </div>
                    </Card>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {filteredDeliverables.map(deliverable => {
                            const contentConfig = contentTypeConfig[deliverable.contentType || 'VIDEO'];
                            const brandColor = getBrandColor(deliverable.brandId || deliverable.brand || '');
                            const isOverdue = deliverable.dueDate && new Date(deliverable.dueDate) < new Date() && deliverable.status === 'BEKLEMEDE';

                            return (
                                <Card
                                    key={deliverable.id}
                                    style={{
                                        cursor: 'pointer',
                                        borderLeft: `4px solid ${deliverable.status === 'TESLIM_EDILDI' ? '#00F5B0' : '#FF9800'}`,
                                        transition: 'transform 0.2s, box-shadow 0.2s'
                                    }}
                                    onClick={() => openDetail(deliverable)}
                                >
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 'var(--space-2)'
                                    }}>
                                        {/* Sol: İçerik Bilgisi */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1 }}>
                                            {/* İçerik Tipi İkonu */}
                                            <div style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 'var(--radius-md)',
                                                backgroundColor: contentConfig.color + '20',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 24
                                            }}>
                                                {contentConfig.icon}
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                {/* Başlık */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <p style={{ fontWeight: 600, fontSize: 'var(--text-body)' }}>
                                                        {deliverable.name}
                                                    </p>
                                                    {isOverdue && (
                                                        <Badge style={{ backgroundColor: '#FF4242', color: 'white', fontSize: 10 }}>
                                                            GECİKMİŞ
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Detaylar */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                                    {/* Marka */}
                                                    <span style={{
                                                        fontSize: 11,
                                                        padding: '2px 8px',
                                                        backgroundColor: brandColor + '20',
                                                        color: brandColor,
                                                        borderRadius: 10,
                                                        fontWeight: 500
                                                    }}>
                                                        {deliverable.brand || 'Genel'}
                                                    </span>

                                                    {/* İçerik Sayısı */}
                                                    <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                                                        {contentConfig.icon} {deliverable.contentCount} {contentConfig.label}
                                                    </span>

                                                    {/* Tarih */}
                                                    {deliverable.status === 'BEKLEMEDE' && deliverable.dueDate && (
                                                        <span style={{
                                                            fontSize: 12,
                                                            color: isOverdue ? '#FF4242' : 'var(--color-muted)'
                                                        }}>
                                                            📅 {new Date(deliverable.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    )}
                                                    {deliverable.status === 'TESLIM_EDILDI' && deliverable.deliveredAt && (
                                                        <span style={{ fontSize: 12, color: '#00F5B0' }}>
                                                            ✅ {new Date(deliverable.deliveredAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    )}

                                                    {/* Sorumlu */}
                                                    {deliverable.assignee && (
                                                        <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                                                            👤 {deliverable.assignee.split(' ')[0]}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Açıklama */}
                                                {deliverable.description && (
                                                    <p style={{
                                                        fontSize: 12,
                                                        color: 'var(--color-muted)',
                                                        marginTop: 6,
                                                        maxWidth: 500,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {deliverable.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Sağ: Status ve Aksiyon */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                            {/* Status Badge */}
                                            <Badge style={{
                                                backgroundColor: statusConfig[deliverable.status].color,
                                                color: 'white',
                                                fontWeight: 600
                                            }}>
                                                {statusConfig[deliverable.status].icon} {statusConfig[deliverable.status].label}
                                            </Badge>

                                            {/* Ödeme Durumu (teslim edildiyse) */}
                                            {deliverable.status === 'TESLIM_EDILDI' && (
                                                <Badge style={{
                                                    backgroundColor: deliverable.paymentReceived ? '#4CAF50' : '#FF4242',
                                                    color: 'white'
                                                }}>
                                                    {deliverable.paymentReceived ? '💰 Ödendi' : '⏳ Ödeme Bekliyor'}
                                                </Badge>
                                            )}

                                            {/* Aksiyon Butonu */}
                                            {deliverable.status === 'BEKLEMEDE' && (
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeliver(deliverable);
                                                    }}
                                                >
                                                    📤 Teslim Et
                                                </Button>
                                            )}
                                            {deliverable.status === 'TESLIM_EDILDI' && !deliverable.paymentReceived && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkAsPaid(deliverable.id);
                                                    }}
                                                >
                                                    💵 Ödeme Al
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Detay Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title={selectedDeliverable ? `📦 ${selectedDeliverable.name}` : 'Teslimat Detayı'}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Kapat</Button>
                        {selectedDeliverable?.status === 'BEKLEMEDE' && (
                            <Button
                                variant="success"
                                onClick={() => {
                                    handleDeliver(selectedDeliverable);
                                    setShowDetailModal(false);
                                }}
                            >
                                📤 Teslim Et
                            </Button>
                        )}
                    </>
                }
            >
                {selectedDeliverable && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {/* Status Banner */}
                        <div style={{
                            padding: 'var(--space-2)',
                            backgroundColor: statusConfig[selectedDeliverable.status].color + '20',
                            borderRadius: 'var(--radius-md)',
                            borderLeft: `4px solid ${statusConfig[selectedDeliverable.status].color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 32 }}>{statusConfig[selectedDeliverable.status].icon}</span>
                                <div>
                                    <p style={{ fontWeight: 700, fontSize: 'var(--text-h4)' }}>
                                        {statusConfig[selectedDeliverable.status].label}
                                    </p>
                                    <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                                        {selectedDeliverable.status === 'TESLIM_EDILDI' && selectedDeliverable.deliveredAt
                                            ? `Teslim tarihi: ${new Date(selectedDeliverable.deliveredAt).toLocaleDateString('tr-TR')}`
                                            : selectedDeliverable.dueDate
                                                ? `Hedef tarih: ${new Date(selectedDeliverable.dueDate).toLocaleDateString('tr-TR')}`
                                                : 'Tarih belirlenmedi'
                                        }
                                    </p>
                                </div>
                            </div>
                            {selectedDeliverable.status === 'TESLIM_EDILDI' && (
                                <Badge style={{
                                    backgroundColor: selectedDeliverable.paymentReceived ? '#4CAF50' : '#FF4242',
                                    color: 'white',
                                    fontSize: 14
                                }}>
                                    {selectedDeliverable.paymentReceived ? '💰 Ödeme Alındı' : '⏳ Ödeme Bekliyor'}
                                </Badge>
                            )}
                        </div>

                        {/* İçerik Detayları */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                            <div style={{
                                padding: 'var(--space-2)',
                                backgroundColor: 'var(--color-surface)',
                                borderRadius: 'var(--radius-sm)'
                            }}>
                                <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>İçerik Tipi</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 24 }}>
                                        {contentTypeConfig[selectedDeliverable.contentType || 'VIDEO'].icon}
                                    </span>
                                    <div>
                                        <p style={{ fontWeight: 600 }}>
                                            {contentTypeConfig[selectedDeliverable.contentType || 'VIDEO'].label}
                                        </p>
                                        <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                                            {selectedDeliverable.contentCount} adet
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                padding: 'var(--space-2)',
                                backgroundColor: 'var(--color-surface)',
                                borderRadius: 'var(--radius-sm)'
                            }}>
                                <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>Marka / Müşteri</p>
                                <p style={{ fontWeight: 600 }}>{selectedDeliverable.brand || 'Belirtilmemiş'}</p>
                                <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>{selectedDeliverable.project}</p>
                            </div>

                            <div style={{
                                padding: 'var(--space-2)',
                                backgroundColor: 'var(--color-surface)',
                                borderRadius: 'var(--radius-sm)'
                            }}>
                                <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>Sorumlu</p>
                                <p style={{ fontWeight: 600 }}>{selectedDeliverable.assignee || 'Atanmamış'}</p>
                            </div>

                            <div style={{
                                padding: 'var(--space-2)',
                                backgroundColor: 'var(--color-surface)',
                                borderRadius: 'var(--radius-sm)'
                            }}>
                                <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>Hedef Tarih</p>
                                <p style={{ fontWeight: 600 }}>
                                    {selectedDeliverable.dueDate
                                        ? new Date(selectedDeliverable.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                                        : 'Belirlenmedi'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Açıklama */}
                        {selectedDeliverable.description && (
                            <div style={{
                                padding: 'var(--space-2)',
                                backgroundColor: 'var(--color-surface)',
                                borderRadius: 'var(--radius-sm)'
                            }}>
                                <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 8 }}>📝 Açıklama</p>
                                <p style={{ lineHeight: 1.6 }}>{selectedDeliverable.description}</p>
                            </div>
                        )}

                        {/* Ödeme Aksiyonu */}
                        {selectedDeliverable.status === 'TESLIM_EDILDI' && !selectedDeliverable.paymentReceived && (
                            <div style={{
                                padding: 'var(--space-2)',
                                backgroundColor: 'rgba(255, 66, 66, 0.1)',
                                borderRadius: 'var(--radius-sm)',
                                borderLeft: '4px solid #FF4242',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div>
                                    <p style={{ fontWeight: 600, color: '#FF4242' }}>⚠️ Ödeme Bekliyor</p>
                                    <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                                        Teslimat yapıldı ancak ödeme henüz alınmadı
                                    </p>
                                </div>
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        handleMarkAsPaid(selectedDeliverable.id);
                                        setSelectedDeliverable({ ...selectedDeliverable, paymentReceived: true });
                                    }}
                                >
                                    💵 Ödeme Alındı İşaretle
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
}
