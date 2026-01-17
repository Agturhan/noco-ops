'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Select } from '@/components/ui';
import {
    RevenueChart,
    ProjectStatusChart,
    TaskCompletionChart,
    DeliverableTrendChart,
    StudioOccupancyChart,
    Sparkline,
} from '@/components/charts';

// ===== ÖRNEK VERİLER =====

const revenueData = [
    { month: 'Oca', gelir: 85000, gider: 45000 },
    { month: 'Şub', gelir: 92000, gider: 48000 },
    { month: 'Mar', gelir: 78000, gider: 42000 },
    { month: 'Nis', gelir: 110000, gider: 55000 },
    { month: 'May', gelir: 125000, gider: 62000 },
    { month: 'Haz', gelir: 98000, gider: 51000 },
    { month: 'Tem', gelir: 115000, gider: 58000 },
    { month: 'Ağu', gelir: 130000, gider: 65000 },
    { month: 'Eyl', gelir: 142000, gider: 72000 },
    { month: 'Eki', gelir: 138000, gider: 70000 },
    { month: 'Kas', gelir: 155000, gider: 78000 },
    { month: 'Ara', gelir: 168000, gider: 85000 },
];

const projectStatusData = [
    { name: 'Aktif', value: 12, color: '#329FF5' },
    { name: 'Beklemede', value: 5, color: '#F6D73C' },
    { name: 'Tamamlandı', value: 28, color: '#00F5B0' },
    { name: 'İptal', value: 3, color: '#FF4242' },
];

const taskData = [
    { name: 'Pazartesi', tamamlanan: 8, bekleyen: 3 },
    { name: 'Salı', tamamlanan: 12, bekleyen: 5 },
    { name: 'Çarşamba', tamamlanan: 6, bekleyen: 8 },
    { name: 'Perşembe', tamamlanan: 15, bekleyen: 4 },
    { name: 'Cuma', tamamlanan: 10, bekleyen: 6 },
];

const deliverableTrendData = [
    { week: 'Hafta 1', teslimEdilen: 5, revizyon: 2 },
    { week: 'Hafta 2', teslimEdilen: 8, revizyon: 3 },
    { week: 'Hafta 3', teslimEdilen: 6, revizyon: 4 },
    { week: 'Hafta 4', teslimEdilen: 12, revizyon: 2 },
];

const studioData = [
    { day: 'Pazartesi', saat: 6, maxSaat: 8 },
    { day: 'Salı', saat: 8, maxSaat: 8 },
    { day: 'Çarşamba', saat: 4, maxSaat: 8 },
    { day: 'Perşembe', saat: 7, maxSaat: 8 },
    { day: 'Cuma', saat: 5, maxSaat: 8 },
];

const sparklineGelir = [
    { value: 85 }, { value: 92 }, { value: 78 }, { value: 110 },
    { value: 125 }, { value: 98 }, { value: 115 }, { value: 130 },
];

const sparklineTeslimat = [
    { value: 5 }, { value: 8 }, { value: 6 }, { value: 12 },
    { value: 9 }, { value: 15 }, { value: 11 }, { value: 14 },
];

export default function AnalyticsPage() {
    const [period, setPeriod] = useState<string>('month');

    // İstatistik kartları
    const stats = [
        {
            title: 'Toplam Gelir',
            value: '₺1.436.000',
            change: '+18%',
            positive: true,
            sparkline: sparklineGelir,
            color: '#10B981'
        },
        {
            title: 'Tamamlanan Teslimat',
            value: '156',
            change: '+24%',
            positive: true,
            sparkline: sparklineTeslimat,
            color: '#329FF5'
        },
        {
            title: 'Ortalama Revizyon',
            value: '1.8',
            change: '-12%',
            positive: true,
            sparkline: [{ value: 2.5 }, { value: 2.2 }, { value: 1.9 }, { value: 1.8 }],
            color: '#F59E0B'
        },
        {
            title: 'Stüdyo Kullanım',
            value: '%72',
            change: '+5%',
            positive: true,
            sparkline: [{ value: 65 }, { value: 68 }, { value: 70 }, { value: 72 }],
            color: '#9C27B0'
        },
    ];

    return (
        <>
            <Header
                title="Analytics"
                subtitle="Performans Metrikleri ve Raporlar"
                actions={
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <Select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            options={[
                                { value: 'week', label: 'Bu Hafta' },
                                { value: 'month', label: 'Bu Ay' },
                                { value: 'quarter', label: 'Bu Çeyrek' },
                                { value: 'year', label: 'Bu Yıl' },
                            ]}
                        />
                        <Button variant="primary">📥 Rapor İndir</Button>
                    </div>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* Özet İstatistikleri */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-3)'
                }}>
                    {stats.map((stat, i) => (
                        <Card key={i}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginBottom: 4 }}>
                                        {stat.title}
                                    </p>
                                    <p style={{ fontSize: '28px', fontWeight: 700, marginBottom: 4 }}>
                                        {stat.value}
                                    </p>
                                    <p style={{
                                        fontSize: 'var(--text-caption)',
                                        color: stat.positive ? '#10B981' : '#EF4444',
                                        fontWeight: 600
                                    }}>
                                        {stat.change} geçen aya göre
                                    </p>
                                </div>
                                <div style={{ width: 80 }}>
                                    <Sparkline data={stat.sparkline} color={stat.color} height={40} />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Gelir/Gider Grafiği */}
                <Card style={{ marginBottom: 'var(--space-2)' }}>
                    <CardHeader
                        title="💰 Gelir ve Gider Trendi"
                        description="Aylık gelir-gider karşılaştırması"
                    />
                    <CardContent>
                        <RevenueChart data={revenueData} height={350} />
                    </CardContent>
                </Card>

                {/* Alt Grafikler */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    {/* Proje Durumları */}
                    <Card>
                        <CardHeader title="📁 Proje Durumları" />
                        <CardContent>
                            <ProjectStatusChart data={projectStatusData} height={280} />
                        </CardContent>
                    </Card>

                    {/* Görev Tamamlama */}
                    <Card>
                        <CardHeader title="✅ Haftalık Görev Performansı" />
                        <CardContent>
                            <TaskCompletionChart data={taskData} height={280} />
                        </CardContent>
                    </Card>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                    {/* Teslimat Trendi */}
                    <Card>
                        <CardHeader title="📦 Teslimat Trendi" description="Son 4 hafta" />
                        <CardContent>
                            <DeliverableTrendChart data={deliverableTrendData} height={250} />
                        </CardContent>
                    </Card>

                    {/* Stüdyo Kullanım */}
                    <Card>
                        <CardHeader title="📸 Stüdyo Doluluk Oranı" description="Bu hafta" />
                        <CardContent>
                            <StudioOccupancyChart data={studioData} height={250} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
