'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Badge, Modal, Input, Textarea } from '@/components/ui';
import Link from 'next/link';
import { brands, getBrandColor, teamMembers } from '@/lib/data';
import { getAllRetainerSummaries, logRetainerHours, getRetainerById } from '@/lib/actions/retainers';

// ===== RETAINER TRACKING SİSTEMİ =====

interface RetainerClient {
    id: string;
    name: string;
    brandId: string;
    monthlyHours: number;
    usedHours: number;
    rate: number;
    startDate: string;
    renewDate: string;
    status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED';
    services: string[];
    logs: { id: string; date: string; hours: number; description: string; user: string }[];
}

// Gerçek marka retainer verileri
const retainerClients: RetainerClient[] = [
    {
        id: 'r1',
        name: 'Ali Haydar Ocakbaşı',
        brandId: 'alihaydar',
        monthlyHours: 20,
        usedHours: 16.5,
        rate: 1500,
        startDate: '2026-01-01',
        renewDate: '2026-02-01',
        status: 'ACTIVE',
        services: ['Sosyal Medya', 'Grafik Tasarım', 'Video Kurgu'],
        logs: [
            { id: 'l1', date: '2026-01-12', hours: 3, description: 'Instagram post tasarımları (5 adet)', user: 'Ahmet Gürkan' },
            { id: 'l2', date: '2026-01-10', hours: 4, description: 'Story şablonları hazırlama', user: 'Ayşegül Güler' },
            { id: 'l3', date: '2026-01-08', hours: 2.5, description: 'Reels düzenleme', user: 'Fatih Ustaosmanoğlu' },
            { id: 'l4', date: '2026-01-05', hours: 4, description: 'Aylık içerik planı', user: 'Şeyma Bora' },
            { id: 'l5', date: '2026-01-03', hours: 3, description: 'Marka kılavuzu revizyonu', user: 'Ahmet Gürkan' },
        ],
    },
    {
        id: 'r2',
        name: 'Valora Psikoloji',
        brandId: 'valora',
        monthlyHours: 30,
        usedHours: 8,
        rate: 1200,
        startDate: '2026-01-01',
        renewDate: '2026-02-01',
        status: 'ACTIVE',
        services: ['Sosyal Medya', 'Ürün Fotoğrafı'],
        logs: [
            { id: 'l6', date: '2026-01-11', hours: 4, description: 'Ürün çekimi hazırlığı', user: 'Ayşegül Güler' },
            { id: 'l7', date: '2026-01-09', hours: 4, description: 'Sosyal medya görselleri', user: 'Ahmet Gürkan' },
        ],
    },
    {
        id: 'r3',
        name: 'İkra Giyim',
        brandId: 'ikra',
        monthlyHours: 15,
        usedHours: 15,
        rate: 1800,
        startDate: '2026-01-01',
        renewDate: '2026-02-01',
        status: 'EXPIRING',
        services: ['Sosyal Medya', 'Influencer Yönetimi'],
        logs: [
            { id: 'l8', date: '2026-01-13', hours: 5, description: 'Influencer kampanya koordinasyonu', user: 'Şeyma Bora' },
            { id: 'l9', date: '2026-01-10', hours: 6, description: 'İçerik üretimi', user: 'Ahmet Gürkan' },
            { id: 'l10', date: '2026-01-05', hours: 4, description: 'Strateji toplantısı', user: 'Ayşegül Güler' },
        ],
    },
    {
        id: 'r4',
        name: 'Tevfik Usta',
        brandId: 'tevfik',
        monthlyHours: 25,
        usedHours: 18,
        rate: 1400,
        startDate: '2026-01-01',
        renewDate: '2026-02-01',
        status: 'ACTIVE',
        services: ['Sosyal Medya', 'Video Prodüksiyon'],
        logs: [
            { id: 'l11', date: '2026-01-12', hours: 6, description: 'Restoran video çekimi', user: 'Fatih Ustaosmanoğlu' },
            { id: 'l12', date: '2026-01-08', hours: 4, description: 'Sosyal medya görselleri', user: 'Ahmet Gürkan' },
            { id: 'l13', date: '2026-01-04', hours: 8, description: 'Aylık içerik paketi', user: 'Ayşegül Güler' },
        ],
    },
    {
        id: 'r5',
        name: 'ByKasap',
        brandId: 'bykasap',
        monthlyHours: 20,
        usedHours: 12,
        rate: 1500,
        startDate: '2026-01-01',
        renewDate: '2026-02-01',
        status: 'ACTIVE',
        services: ['Sosyal Medya', 'Fotoğraf Çekimi'],
        logs: [
            { id: 'l14', date: '2026-01-11', hours: 6, description: 'Ürün fotoğraf çekimi', user: 'Ayşegül Güler' },
            { id: 'l15', date: '2026-01-07', hours: 6, description: 'Instagram içerik paketi', user: 'Ahmet Gürkan' },
        ],
    },
];

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    ACTIVE: { label: 'Aktif', color: '#00F5B0', bgColor: '#E8F5E9' },
    EXPIRING: { label: 'Saat Doluyor', color: '#FF9800', bgColor: '#FFF3E0' },
    EXPIRED: { label: 'Saat Doldu', color: '#FF4242', bgColor: '#FFEBEE' },
};

export default function RetainersPage() {
    const [retainerClients, setRetainerClients] = useState<RetainerClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState<RetainerClient | null>(null);
    const [showLogModal, setShowLogModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Load retainers from DB
    useEffect(() => {
        const loadRetainers = async () => {
            try {
                setLoading(true);
                const summaries = await getAllRetainerSummaries();
                // Transform to local format - keeping backward compatibility with mock data structure
                const formatted: RetainerClient[] = summaries.map((r: any) => ({
                    id: r.id,
                    name: r.name || r.clientName,
                    brandId: '',
                    monthlyHours: r.monthlyHours || 20,
                    usedHours: r.usedHours || 0,
                    rate: 1500,
                    startDate: '',
                    renewDate: '',
                    status: r.isWarning ? 'EXPIRING' : 'ACTIVE',
                    services: [],
                    logs: [],
                }));
                setRetainerClients(formatted);
            } catch (error) {
                console.error('Retainerlar yüklenirken hata:', error);
            } finally {
                setLoading(false);
            }
        };
        loadRetainers();
    }, []);

    // Form state
    const [logHours, setLogHours] = useState('');
    const [logDescription, setLogDescription] = useState('');

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);

    const openLogModal = (client: RetainerClient) => {
        setSelectedClient(client);
        setLogHours('');
        setLogDescription('');
        setShowLogModal(true);
    };

    const openDetailModal = (client: RetainerClient) => {
        setSelectedClient(client);
        setShowDetailModal(true);
    };

    // Özet hesaplamalar
    const totalMonthlyHours = retainerClients.reduce((s, c) => s + c.monthlyHours, 0);
    const totalUsedHours = retainerClients.reduce((s, c) => s + c.usedHours, 0);
    const totalRevenue = retainerClients.reduce((s, c) => s + (c.monthlyHours * c.rate), 0);
    const expiringCount = retainerClients.filter(c => c.usedHours >= c.monthlyHours * 0.8).length;

    return (
        <>
            <Header
                title="Retainer Takibi"
                subtitle="Aylık saat paketleri ve kullanım"
                actions={
                    <Button variant="primary">+ Yeni Retainer</Button>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* Özet Kartları */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>TOPLAM MÜŞTERİ</p>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-primary)' }}>{retainerClients.length}</p>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>aktif retainer</p>
                        </div>
                    </Card>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>AYLIK SAAT</p>
                            <p style={{ fontSize: '28px', fontWeight: 700 }}>{totalMonthlyHours}</p>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                                {totalUsedHours} kullanıldı ({Math.round((totalUsedHours / totalMonthlyHours) * 100)}%)
                            </p>
                        </div>
                    </Card>
                    <Card style={{ background: '#E8F5E9' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>AYLIK GELİR</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, color: '#2E7D32' }}>{formatCurrency(totalRevenue)}</p>
                            <p style={{ fontSize: 'var(--text-caption)', color: '#388E3C' }}>retainer geliri</p>
                        </div>
                    </Card>
                    <Card style={{ background: expiringCount > 0 ? '#FFF3E0' : 'var(--color-card)' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>DİKKAT</p>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: expiringCount > 0 ? '#E65100' : 'var(--color-success)' }}>
                                {expiringCount}
                            </p>
                            <p style={{ fontSize: 'var(--text-caption)', color: expiringCount > 0 ? '#F57C00' : 'var(--color-muted)' }}>
                                saat dolmak üzere
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Retainer Kartları */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--space-2)' }}>
                    {retainerClients.map(client => {
                        const usagePercent = Math.round((client.usedHours / client.monthlyHours) * 100);
                        const remainingHours = client.monthlyHours - client.usedHours;
                        const daysLeft = Math.ceil((new Date(client.renewDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                        return (
                            <Card
                                key={client.id}
                                style={{ borderTop: `4px solid ${statusConfig[client.status].color}` }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                    <div>
                                        <h3 style={{ fontWeight: 700, fontSize: 'var(--text-body)', marginBottom: '4px' }}>{client.name}</h3>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {client.services.slice(0, 2).map(s => (
                                                <span key={s} style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: 'var(--color-surface)', borderRadius: 10 }}>
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <Badge style={{ backgroundColor: statusConfig[client.status].bgColor, color: statusConfig[client.status].color }}>
                                        {statusConfig[client.status].label}
                                    </Badge>
                                </div>

                                {/* Saat Kullanım Çubuğu */}
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Saat Kullanımı</span>
                                        <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600 }}>
                                            {client.usedHours} / {client.monthlyHours} saat
                                        </span>
                                    </div>
                                    <div style={{ height: 10, backgroundColor: 'var(--color-border)', borderRadius: 5, overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${Math.min(usagePercent, 100)}%`,
                                            backgroundColor: usagePercent >= 100 ? '#FF4242' : usagePercent >= 80 ? '#FF9800' : '#00F5B0',
                                            borderRadius: 5,
                                            transition: 'width 0.3s'
                                        }} />
                                    </div>
                                </div>

                                {/* Bilgiler */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px', fontSize: 'var(--text-body-sm)' }}>
                                    <div>
                                        <span style={{ color: 'var(--color-muted)' }}>Kalan: </span>
                                        <span style={{ fontWeight: 600, color: remainingHours <= 0 ? '#FF4242' : 'inherit' }}>
                                            {remainingHours > 0 ? `${remainingHours} saat` : 'Tükendi'}
                                        </span>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--color-muted)' }}>Yenileme: </span>
                                        <span>{daysLeft} gün</span>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--color-muted)' }}>Ücret: </span>
                                        <span style={{ fontWeight: 600 }}>{formatCurrency(client.rate)}/saat</span>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--color-muted)' }}>Aylık: </span>
                                        <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>{formatCurrency(client.monthlyHours * client.rate)}</span>
                                    </div>
                                </div>

                                {/* Uyarı */}
                                {usagePercent >= 80 && (
                                    <div style={{
                                        padding: '8px',
                                        backgroundColor: usagePercent >= 100 ? '#FFEBEE' : '#FFF3E0',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: 'var(--text-caption)',
                                        color: usagePercent >= 100 ? '#C62828' : '#E65100',
                                        marginBottom: '12px'
                                    }}>
                                        {usagePercent >= 100 ? '⚠️ Saat paketi tükendi! Ek çalışma için onay gerekli.' : '⚠️ Saat paketi %80+ kullanıldı.'}
                                    </div>
                                )}

                                {/* USE IT OR LOSE IT UYARISI */}
                                {remainingHours > 0 && daysLeft <= 7 && (
                                    <div style={{
                                        padding: '10px',
                                        background: 'linear-gradient(135deg, #FF6B6B 0%, #FF4242 100%)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'white',
                                        marginBottom: '12px',
                                        textAlign: 'center',
                                        animation: 'pulse 2s infinite'
                                    }}>
                                        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                                            ⏰ USE IT OR LOSE IT!
                                        </div>
                                        <div style={{ fontSize: '12px', opacity: 0.9 }}>
                                            {remainingHours} saat kaldı - {daysLeft} gün içinde sıfırlanacak!
                                        </div>
                                    </div>
                                )}

                                {/* Aksiyonlar */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Button variant="ghost" size="sm" style={{ flex: 1 }} onClick={() => openDetailModal(client)}>
                                        📊 Detay
                                    </Button>
                                    <Button
                                        variant={remainingHours > 0 ? 'primary' : 'ghost'}
                                        size="sm"
                                        style={{ flex: 1 }}
                                        disabled={remainingHours <= 0}
                                        onClick={() => openLogModal(client)}
                                    >
                                        ⏱️ Saat Ekle
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Saat Ekleme Modal */}
            <Modal
                isOpen={showLogModal}
                onClose={() => setShowLogModal(false)}
                title={`⏱️ Saat Kaydet - ${selectedClient?.name}`}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowLogModal(false)}>İptal</Button>
                        <Button variant="primary" onClick={() => { alert('Saat kaydedildi!'); setShowLogModal(false); }}>Kaydet</Button>
                    </>
                }
            >
                {selectedClient && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Kalan Saat</span>
                                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                                    {selectedClient.monthlyHours - selectedClient.usedHours} saat
                                </span>
                            </div>
                        </div>
                        <Input
                            label="Çalışma Süresi (saat) *"
                            type="number"
                            step="0.5"
                            value={logHours}
                            onChange={(e) => setLogHours(e.target.value)}
                            placeholder="Örn: 2.5"
                        />
                        <Textarea
                            label="Açıklama *"
                            value={logDescription}
                            onChange={(e) => setLogDescription(e.target.value)}
                            rows={3}
                            placeholder="Yapılan iş açıklaması..."
                        />
                    </div>
                )}
            </Modal>

            {/* Detay Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title={`📊 ${selectedClient?.name} - Retainer Detayı`}
                size="lg"
                footer={
                    <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Kapat</Button>
                }
            >
                {selectedClient && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {/* Özet */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                            <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Kullanılan</p>
                                <p style={{ fontSize: '24px', fontWeight: 700 }}>{selectedClient.usedHours} saat</p>
                            </div>
                            <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Kalan</p>
                                <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>
                                    {selectedClient.monthlyHours - selectedClient.usedHours} saat
                                </p>
                            </div>
                            <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Değer</p>
                                <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-success)' }}>
                                    {formatCurrency(selectedClient.usedHours * selectedClient.rate)}
                                </p>
                            </div>
                        </div>

                        {/* Saat Geçmişi */}
                        <div>
                            <p style={{ fontWeight: 600, marginBottom: '12px' }}>📜 Çalışma Geçmişi</p>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Tarih</th>
                                            <th>Saat</th>
                                            <th>Açıklama</th>
                                            <th>Kişi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedClient.logs.map(log => (
                                            <tr key={log.id}>
                                                <td>{log.date}</td>
                                                <td style={{ fontWeight: 600 }}>{log.hours}s</td>
                                                <td>{log.description}</td>
                                                <td>👤 {log.user}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}
