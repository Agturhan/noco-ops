'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout';
import { Card, CardContent, Button, Badge, Modal } from '@/components/ui';

// ===== NOCO FİYAT LİSTESİ - 2026 =====

// Sosyal Medya Paketleri
const smPackages = [
    {
        id: 'starter',
        name: 'STARTER',
        price: 27900,
        color: '#329FF5',
        features: ['3 Video / ay', '2 Post / ay', 'İçerik Paylaşımı', 'Temel Raporlama'],
        videoCount: 3,
        postCount: 2,
    },
    {
        id: 'growth',
        name: 'GROWTH',
        price: 42500,
        color: '#00F5B0',
        popular: true,
        features: ['4 Video / ay', '3 Post / ay', '~20 Story / ay', 'Aylık Raporlama', 'İçerik Takvimi'],
        videoCount: 4,
        postCount: 3,
        storyCount: 20,
    },
    {
        id: 'pro',
        name: 'PRO',
        price: 69900,
        color: '#F6D73C',
        features: ['6 Video / ay', '4 Post / ay', '~30 Story / ay', 'Detaylı Analiz', 'Haftalık Rapor', 'Rakip Analizi'],
        videoCount: 6,
        postCount: 4,
        storyCount: 30,
    },
    {
        id: 'enterprise',
        name: 'ENTERPRISE',
        price: 159900,
        color: '#FF4242',
        features: ['8+ Video / ay', '6 Post / ay', 'Günlük Story', 'Strateji Danışmanlığı', 'Aylık Sunum', '2 Prof. Çekim', 'Owner-Level Yönetim'],
        videoCount: 8,
        postCount: 6,
    },
];

// Studio Reels Paketleri
const studioReelsPackages = [
    { id: 'basic', name: 'BASIC', hours: 2, videos: 6, price: 22500, perVideo: 3750 },
    { id: 'dinamik', name: 'DİNAMİK', hours: 3, videos: 6, price: 39900, perVideo: 6650 },
    { id: 'deluxe', name: 'DELUXE', hours: 4, videos: 12, price: 69900, perVideo: 5825 },
];

// Birim Fiyatlar
const unitPrices = {
    video: [
        { id: 'tek-video', name: 'Tek Video Prodüksiyon', description: 'Çekim + Kurgu + Tasarım + Müzik + Paylaşım', price: 19900, unit: 'video' },
        { id: 'sm-video', name: 'SM Video (Eşdeğer)', description: 'Sosyal medya video üretimi', price: 6500, unit: 'video', note: '~tahmini' },
    ],
    reklam: [
        { id: 'reklam-50k', name: 'Reklam Yönetimi (≤50K)', description: 'Aylık bütçe 50.000₺ ve altı', price: 7500, unit: 'ay' },
        { id: 'reklam-50k+', name: 'Reklam Yönetimi (>50K)', description: 'Bütçenin %15\'i', price: 0, unit: 'ay', note: '%15 komisyon' },
        { id: 'demo', name: 'Ajans Demo Çalışma', description: '1 Video + 1 Ay Reklam Yönetimi', price: 27400, unit: 'paket', note: '19.900 + 7.500' },
    ],
    podcast: [
        { id: 'podcast-studio', name: 'Stüdyo (Podcast)', description: 'Ekipman + Mekan', price: 2600, unit: 'saat' },
        { id: 'podcast-operator', name: 'Operatör', description: 'Profesyonel ses/görüntü', price: 1500, unit: 'saat' },
        { id: 'podcast-kurgu', name: 'Basit Kurgu', description: '1 saatlik kurgu işi', price: 2900, unit: 'video' },
    ],
    foto: [
        { id: 'foto-saat', name: 'Stüdyo Kiralama (Saatlik)', description: '', price: 2600, unit: 'saat' },
        { id: 'foto-yarim', name: 'Stüdyo Kiralama (Yarım Gün)', description: '4 saat', price: 9100, unit: 'paket' },
        { id: 'foto-tam', name: 'Stüdyo Kiralama (Tam Gün)', description: '8 saat', price: 14500, unit: 'paket' },
        { id: 'foto-operator', name: 'Operatör (Günlük)', description: '8 saat', price: 12000, unit: 'gün' },
        { id: 'retouch-basic', name: 'Basic Retouch', description: 'Temel düzenleme', price: 320, unit: 'kare' },
        { id: 'retouch-detay', name: 'Detaylı Retouch', description: 'İleri düzey düzenleme', price: 1450, unit: 'kare' },
    ],
    tasarim: [
        { id: 'post-tasarim', name: 'Post Tasarımı', description: 'Sosyal medya görseli', price: 2000, unit: 'adet', note: '~tahmini' },
        { id: 'story', name: 'Story', description: 'Dikey format görsel', price: 300, unit: 'adet', note: '~tahmini' },
        { id: 'operasyon', name: 'Aylık Operasyon', description: 'İçerik paylaşımı/koordinasyon', price: 4500, unit: 'ay', note: '~tahmini' },
    ],
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);

export default function PriceListPage() {
    const [activeTab, setActiveTab] = useState<'packages' | 'units' | 'studio'>('packages');

    return (
        <>
            <Header
                title="💰 Fiyat Listesi"
                subtitle="NOCO Creative Digital Studios - 2026"
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* Tab Navigation */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-1)',
                    marginBottom: 'var(--space-3)',
                    borderBottom: '2px solid var(--color-border)',
                    paddingBottom: 'var(--space-1)'
                }}>
                    {[
                        { id: 'packages', label: '📱 Sosyal Medya Paketleri', icon: '📱' },
                        { id: 'studio', label: '🎬 Studio Reels', icon: '🎬' },
                        { id: 'units', label: '📋 Birim Fiyatlar', icon: '📋' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                padding: '12px 24px',
                                background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                                color: activeTab === tab.id ? 'white' : 'var(--color-muted)',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* SOSYAL MEDYA PAKETLERİ */}
                {activeTab === 'packages' && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 'var(--space-2)'
                    }}>
                        {smPackages.map(pkg => (
                            <Card key={pkg.id} style={{
                                position: 'relative',
                                borderTop: `4px solid ${pkg.color}`,
                                overflow: 'hidden'
                            }}>
                                {pkg.popular && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 12,
                                        right: -30,
                                        background: pkg.color,
                                        color: '#0E1113',
                                        padding: '4px 40px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        transform: 'rotate(45deg)'
                                    }}>
                                        EN POPÜLER
                                    </div>
                                )}

                                <div className="card-header">
                                    <h3 style={{
                                        fontSize: '24px',
                                        fontWeight: 700,
                                        color: pkg.color,
                                        marginBottom: '8px'
                                    }}>
                                        {pkg.name}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                        <span style={{ fontSize: '36px', fontWeight: 800 }}>
                                            {formatCurrency(pkg.price)}
                                        </span>
                                        <span style={{ color: 'var(--color-muted)', fontSize: '14px' }}>/ay</span>
                                    </div>
                                </div>

                                <CardContent>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {pkg.features.map((feature, i) => (
                                            <li key={i} style={{
                                                padding: '10px 0',
                                                borderBottom: i < pkg.features.length - 1 ? '1px solid var(--color-border)' : 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <span style={{ color: pkg.color }}>✓</span>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}

                        {/* 3 Ay Anlaşma İbaresi */}
                        <div style={{
                            gridColumn: '1 / -1',
                            padding: 'var(--space-2)',
                            background: 'var(--color-surface-2)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px dashed var(--color-border)',
                            textAlign: 'center'
                        }}>
                            <p style={{ color: 'var(--color-sub-ink)', fontWeight: 500 }}>
                                📌 Sosyal Medya Paketleri <strong>en az 3 ay anlaşıldığı takdirde</strong> geçerlidir.
                            </p>
                        </div>
                    </div>
                )}

                {/* STUDIO REELS PAKETLERİ */}
                {activeTab === 'studio' && (
                    <>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 'var(--space-2)',
                            marginBottom: 'var(--space-3)'
                        }}>
                            {studioReelsPackages.map(pkg => (
                                <Card key={pkg.id} style={{
                                    textAlign: 'center',
                                    borderTop: '4px solid var(--color-primary)'
                                }}>
                                    <div className="card-header">
                                        <h3 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
                                            {pkg.name}
                                        </h3>
                                        <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>
                                            {pkg.hours} saat çekim + {pkg.videos} video
                                        </p>
                                    </div>
                                    <CardContent>
                                        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '16px' }}>
                                            {formatCurrency(pkg.price)}
                                            <span style={{ fontSize: '14px', color: 'var(--color-muted)' }}> +KDV</span>
                                        </div>
                                        <div style={{
                                            padding: '12px',
                                            background: 'linear-gradient(135deg, rgba(50,159,245,0.1), rgba(0,245,176,0.1))',
                                            borderRadius: 'var(--radius-sm)'
                                        }}>
                                            <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Video başına</p>
                                            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-success)' }}>
                                                {formatCurrency(pkg.perVideo)}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Card>
                            <div className="card-header">
                                <h3>📊 Studio Reels Karşılaştırma</h3>
                            </div>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Paket</th>
                                            <th>Çekim Süresi</th>
                                            <th>Video Sayısı</th>
                                            <th style={{ textAlign: 'right' }}>Paket Fiyatı</th>
                                            <th style={{ textAlign: 'right' }}>Video Başına</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studioReelsPackages.map(pkg => (
                                            <tr key={pkg.id}>
                                                <td style={{ fontWeight: 600 }}>{pkg.name}</td>
                                                <td>{pkg.hours} saat</td>
                                                <td>{pkg.videos} video</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(pkg.price)}</td>
                                                <td style={{ textAlign: 'right', color: 'var(--color-success)' }}>{formatCurrency(pkg.perVideo)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </>
                )}

                {/* BİRİM FİYATLAR */}
                {activeTab === 'units' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {/* Video Prodüksiyon */}
                        <Card>
                            <div className="card-header">
                                <h3>🎬 Video Prodüksiyon</h3>
                            </div>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Hizmet</th>
                                            <th>Açıklama</th>
                                            <th style={{ textAlign: 'right' }}>Fiyat</th>
                                            <th>Birim</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {unitPrices.video.map(item => (
                                            <tr key={item.id}>
                                                <td style={{ fontWeight: 600 }}>{item.name}</td>
                                                <td style={{ color: 'var(--color-muted)' }}>{item.description}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
                                                    {formatCurrency(item.price)}
                                                    {item.note && <span style={{ fontSize: '11px', color: 'var(--color-muted)', marginLeft: '4px' }}>({item.note})</span>}
                                                </td>
                                                <td>/ {item.unit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Reklam Yönetimi */}
                        <Card>
                            <div className="card-header">
                                <h3>📢 Reklam Yönetimi</h3>
                            </div>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Hizmet</th>
                                            <th>Açıklama</th>
                                            <th style={{ textAlign: 'right' }}>Fiyat</th>
                                            <th>Birim</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {unitPrices.reklam.map(item => (
                                            <tr key={item.id}>
                                                <td style={{ fontWeight: 600 }}>{item.name}</td>
                                                <td style={{ color: 'var(--color-muted)' }}>{item.description}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
                                                    {item.price > 0 ? formatCurrency(item.price) : '—'}
                                                    {item.note && <Badge variant="warning" style={{ marginLeft: '8px' }}>{item.note}</Badge>}
                                                </td>
                                                <td>/ {item.unit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Podcast */}
                        <Card>
                            <div className="card-header">
                                <h3>🎙️ Podcast</h3>
                            </div>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Hizmet</th>
                                            <th>Açıklama</th>
                                            <th style={{ textAlign: 'right' }}>Fiyat</th>
                                            <th>Birim</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {unitPrices.podcast.map(item => (
                                            <tr key={item.id}>
                                                <td style={{ fontWeight: 600 }}>{item.name}</td>
                                                <td style={{ color: 'var(--color-muted)' }}>{item.description}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(item.price)}</td>
                                                <td>/ {item.unit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Fotoğraf Stüdyo */}
                        <Card>
                            <div className="card-header">
                                <h3>📸 Fotoğraf Stüdyo</h3>
                            </div>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Hizmet</th>
                                            <th>Açıklama</th>
                                            <th style={{ textAlign: 'right' }}>Fiyat</th>
                                            <th>Birim</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {unitPrices.foto.map(item => (
                                            <tr key={item.id}>
                                                <td style={{ fontWeight: 600 }}>{item.name}</td>
                                                <td style={{ color: 'var(--color-muted)' }}>{item.description}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(item.price)}</td>
                                                <td>/ {item.unit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Tasarım & Operasyon (Eşdeğer) */}
                        <Card>
                            <div className="card-header">
                                <h3>🎨 Tasarım & Operasyon (Eşdeğer Birim Fiyatlar)</h3>
                            </div>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Hizmet</th>
                                            <th>Açıklama</th>
                                            <th style={{ textAlign: 'right' }}>Fiyat</th>
                                            <th>Birim</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {unitPrices.tasarim.map(item => (
                                            <tr key={item.id}>
                                                <td style={{ fontWeight: 600 }}>{item.name}</td>
                                                <td style={{ color: 'var(--color-muted)' }}>{item.description}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
                                                    {formatCurrency(item.price)}
                                                    {item.note && <span style={{ fontSize: '11px', color: 'var(--color-muted)', marginLeft: '4px' }}>({item.note})</span>}
                                                </td>
                                                <td>/ {item.unit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Info Banner */}
                <Card style={{
                    marginTop: 'var(--space-3)',
                    background: 'linear-gradient(135deg, rgba(50,159,245,0.05), rgba(0,245,176,0.05))',
                    borderLeft: '4px solid var(--color-primary)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ fontSize: '24px' }}>💡</span>
                        <div>
                            <p style={{ fontWeight: 600, marginBottom: '4px' }}>Fiyatlandırma Notu</p>
                            <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>
                                Tüm fiyatlar KDV hariçtir. Özel projeler ve enterprise anlaşmalar için iletişime geçin.
                                ~işaretli fiyatlar paket içi eşdeğer tahmini değerlerdir.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
}

// Export price data for use in proposals
export { smPackages, studioReelsPackages, unitPrices };
