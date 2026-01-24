'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout';
import { Card, CardContent, Button, Badge, Modal } from '@/components/ui';
import { smPackages, studioReelsPackages, unitPrices } from './data';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);

export function PriceListPageClient() {
    const [activeTab, setActiveTab] = useState<'packages' | 'units' | 'studio'>('packages');

    return (
        <>
            <Header
                title="Fiyat Listesi"
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
                        { id: 'packages', label: 'Sosyal Medya Paketleri' },
                        { id: 'studio', label: 'Studio Reels' },
                        { id: 'units', label: 'Birim Fiyatlar' },
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
                                <h3>Video Prodüksiyon</h3>
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
                        <span style={{ fontSize: '24px' }}>ℹ️</span>
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
