'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Badge, Modal, Input, Select, Textarea } from '@/components/ui';
import Link from 'next/link';
import { getProposals, createProposal, updateProposalStatus, sendProposal, approveProposal, deleteProposal } from '@/lib/actions/proposals';

// ===== TEKLİF OLUŞTURUCU (Proposal Builder) =====

// Fiyat Listesi (Price List'ten import edilecek - şimdilik inline)
interface PriceListItem {
    id: string;
    name: string;
    description: string;
    category: string;
    unit: string;
    unitPrice: number;
    incomeType: 'RECURRING' | 'PROJECT';
}

const priceListItems: PriceListItem[] = [
    // SOSYAL MEDYA PAKETLERİ
    { id: 'sm-starter', name: 'SM Paket STARTER', description: '3 video + 2 post / ay', category: 'SOCIAL', unit: 'AYLIK', unitPrice: 27900, incomeType: 'RECURRING' },
    { id: 'sm-growth', name: 'SM Paket GROWTH', description: '4 video + 3 post + 20 story / ay', category: 'SOCIAL', unit: 'AYLIK', unitPrice: 42500, incomeType: 'RECURRING' },
    { id: 'sm-pro', name: 'SM Paket PRO', description: '6 video + 4 post + 30 story + analiz', category: 'SOCIAL', unit: 'AYLIK', unitPrice: 69900, incomeType: 'RECURRING' },
    { id: 'sm-enterprise', name: 'SM Paket ENTERPRISE', description: '8+ video + strateji danışmanlık', category: 'SOCIAL', unit: 'AYLIK', unitPrice: 159900, incomeType: 'RECURRING' },

    // STUDIO REELS
    { id: 'reels-basic', name: 'Studio Reels BASIC', description: '2 saat çekim + 6 video', category: 'VIDEO', unit: 'PAKET', unitPrice: 22500, incomeType: 'PROJECT' },
    { id: 'reels-dinamik', name: 'Studio Reels DİNAMİK', description: '3 saat çekim + 6 video', category: 'VIDEO', unit: 'PAKET', unitPrice: 39900, incomeType: 'PROJECT' },
    { id: 'reels-deluxe', name: 'Studio Reels DELUXE', description: '4 saat çekim + 12 video', category: 'VIDEO', unit: 'PAKET', unitPrice: 69900, incomeType: 'PROJECT' },

    // VİDEO
    { id: 'tek-video', name: 'Tek Video Prodüksiyon', description: 'Çekim + kurgu + tasarım + müzik', category: 'VIDEO', unit: 'VIDEO', unitPrice: 19900, incomeType: 'PROJECT' },
    { id: 'sm-video', name: 'SM Video (Birim)', description: 'Sosyal medya video', category: 'VIDEO', unit: 'VIDEO', unitPrice: 6500, incomeType: 'PROJECT' },

    // REKLAM YÖNETİMİ
    { id: 'reklam-50k', name: 'Reklam Yönetimi (≤50K)', description: 'Aylık bütçe 50K ve altı', category: 'CONSULTING', unit: 'AYLIK', unitPrice: 7500, incomeType: 'RECURRING' },
    { id: 'demo', name: 'Ajans Demo Çalışma', description: '1 Video + 1 Ay Reklam Yönetimi', category: 'CONSULTING', unit: 'PAKET', unitPrice: 29500, incomeType: 'PROJECT' },

    // PODCAST
    { id: 'podcast-studio', name: 'Podcast Stüdyo', description: 'Ekipman + mekan', category: 'STUDIO', unit: 'SAAT', unitPrice: 2600, incomeType: 'PROJECT' },
    { id: 'podcast-operator', name: 'Podcast Operatör', description: 'Prof. ses/görüntü', category: 'STUDIO', unit: 'SAAT', unitPrice: 1500, incomeType: 'PROJECT' },
    { id: 'podcast-kurgu', name: 'Podcast Kurgu', description: 'Basit kurgu (1 saat)', category: 'VIDEO', unit: 'VIDEO', unitPrice: 2900, incomeType: 'PROJECT' },

    // FOTOĞRAF STÜDYO
    { id: 'foto-saat', name: 'Stüdyo Kiralama (Saatlik)', description: '', category: 'STUDIO', unit: 'SAAT', unitPrice: 2600, incomeType: 'PROJECT' },
    { id: 'foto-yarim', name: 'Stüdyo Kiralama (Yarım Gün)', description: '4 saat', category: 'STUDIO', unit: 'PAKET', unitPrice: 9100, incomeType: 'PROJECT' },
    { id: 'foto-tam', name: 'Stüdyo Kiralama (Tam Gün)', description: '8 saat', category: 'STUDIO', unit: 'PAKET', unitPrice: 14500, incomeType: 'PROJECT' },
    { id: 'foto-operator', name: 'Fotoğraf Operatör (Günlük)', description: '8 saat', category: 'PHOTO', unit: 'GÜN', unitPrice: 12000, incomeType: 'PROJECT' },
    { id: 'retouch-basic', name: 'Basic Retouch', description: 'Temel düzenleme', category: 'PHOTO', unit: 'ADET', unitPrice: 320, incomeType: 'PROJECT' },
    { id: 'retouch-detay', name: 'Detaylı Retouch', description: 'İleri düzey', category: 'PHOTO', unit: 'ADET', unitPrice: 1450, incomeType: 'PROJECT' },

    // TASARIM
    { id: 'post-tasarim', name: 'Post Tasarımı', description: 'SM görseli', category: 'DESIGN', unit: 'ADET', unitPrice: 2000, incomeType: 'PROJECT' },
    { id: 'story', name: 'Story Tasarımı', description: 'Dikey format', category: 'DESIGN', unit: 'ADET', unitPrice: 300, incomeType: 'PROJECT' },
];

// Gerçek müşteri markaları
const clients = [
    { id: 'c1', name: 'Zeytindalı Gıda', contact: 'Mehmet Zeytinci', email: 'info@zeytindaligida.com' },
    { id: 'c2', name: 'Valora Psikoloji', contact: 'Ayşe Değerli', email: 'info@valorapsikoloji.com' },
    { id: 'c3', name: 'İkra Giyim', contact: 'Fatma Yılmaz', email: 'iletisim@ikragiyim.com' },
    { id: 'c4', name: 'Zoks Studio', contact: 'Ali Güzel', email: 'hello@zoksstudio.com' },
    { id: 'c5', name: 'Tevfik Usta', contact: 'Tevfik Bey', email: 'info@tevfikusta.com' },
    { id: 'c6', name: 'ByKasap', contact: 'Kasap Ahmet', email: 'info@bykasap.com' },
    { id: 'c7', name: 'Ali Haydar Ocakbaşı', contact: 'Ali Haydar', email: 'info@alihaydar.com' },
];

interface ProposalLineItem {
    id: string;
    serviceId: string;
    serviceName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    total: number;
    incomeType: 'RECURRING' | 'PROJECT';
}

interface Proposal {
    id: string;
    number: string;
    clientId: string;
    clientName: string;
    status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED';
    date: string;
    validUntil: string;
    lineItems: ProposalLineItem[];
    subtotal: number;
    kdv: number;
    total: number;
    notes: string;
    paymentTerms: string;
}

const proposals: Proposal[] = [
    {
        id: 'prop1',
        number: 'TKL-2026-001',
        clientId: 'c1',
        clientName: 'Zeytindalı Gıda',
        status: 'APPROVED',
        date: '2026-01-05',
        validUntil: '2026-01-20',
        lineItems: [
            { id: 'li1', serviceId: 'd1', serviceName: 'Logo Tasarımı', unit: 'PAKET', quantity: 1, unitPrice: 20000, total: 20000, incomeType: 'PROJECT' },
            { id: 'li2', serviceId: 'd2', serviceName: 'Kurumsal Kimlik Kılavuzu', unit: 'PAKET', quantity: 1, unitPrice: 15000, total: 15000, incomeType: 'PROJECT' },
            { id: 'li3', serviceId: 'v2', serviceName: 'Orta Video (30-60sn)', unit: 'VIDEO', quantity: 3, unitPrice: 8000, total: 24000, incomeType: 'PROJECT' },
        ],
        subtotal: 59000,
        kdv: 10620,
        total: 69620,
        notes: 'Zeytindalı rebrand projesi için kapsamlı teklif',
        paymentTerms: '%50 peşin, %50 teslimde',
    },
    {
        id: 'prop2',
        number: 'TKL-2026-002',
        clientId: 'c2',
        clientName: 'Valora',
        status: 'SENT',
        date: '2026-01-10',
        validUntil: '2026-01-25',
        lineItems: [
            { id: 'li4', serviceId: 's2', serviceName: 'Sosyal Medya Yönetimi - Standart', unit: 'AYLIK', quantity: 12, unitPrice: 25000, total: 300000, incomeType: 'RECURRING' },
            { id: 'li5', serviceId: 'p1', serviceName: 'Ürün Fotoğrafı Paketi', unit: 'PAKET', quantity: 2, unitPrice: 8000, total: 16000, incomeType: 'PROJECT' },
        ],
        subtotal: 316000,
        kdv: 56880,
        total: 372880,
        notes: '12 aylık sosyal medya yönetimi + ürün fotoğrafları',
        paymentTerms: 'Aylık fatura, NET 15',
    },
];

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    DRAFT: { label: 'Taslak', color: '#6B7B80', bgColor: '#F5F5F5' },
    SENT: { label: 'Gönderildi', color: '#329FF5', bgColor: '#E3F2FD' },
    APPROVED: { label: 'Onaylandı', color: '#00F5B0', bgColor: '#E8F5E9' },
    REJECTED: { label: 'Reddedildi', color: '#FF4242', bgColor: '#FFEBEE' },
};

export default function ProposalsPage() {
    const router = useRouter();
    const [proposalList, setProposalList] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Load proposals from database
    useEffect(() => {
        const loadProposals = async () => {
            try {
                setLoading(true);
                const data = await getProposals();
                const formatted: Proposal[] = data.map((p: any) => ({
                    id: p.id,
                    number: p.number || 'TKL-XXX',
                    clientId: p.clientId,
                    clientName: p.client?.name || 'Bilinmeyen Müşteri',
                    status: p.status,
                    date: p.createdAt?.split('T')[0] || '',
                    validUntil: p.validUntil?.split('T')[0] || '',
                    lineItems: p.lineItems || [],
                    subtotal: p.subtotal || 0,
                    kdv: p.kdv || 0,
                    total: p.total || 0,
                    notes: p.notes || '',
                    paymentTerms: p.paymentTerms || '',
                }));
                setProposalList(formatted);
            } catch (error) {
                console.error('Teklifler yüklenirken hata:', error);
            } finally {
                setLoading(false);
            }
        };
        loadProposals();
    }, []);

    // New proposal form state
    const [newClient, setNewClient] = useState('');
    const [newLineItems, setNewLineItems] = useState<ProposalLineItem[]>([]);
    const [newNotes, setNewNotes] = useState('');
    const [newPaymentTerms, setNewPaymentTerms] = useState('%50 peşin, %50 teslimde');
    const [selectedService, setSelectedService] = useState('');
    const [selectedQuantity, setSelectedQuantity] = useState('1');

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);

    const addLineItem = () => {
        const service = priceListItems.find(s => s.id === selectedService);
        if (!service) return;

        const qty = parseInt(selectedQuantity) || 1;
        const newItem: ProposalLineItem = {
            id: `li-${Date.now()}`,
            serviceId: service.id,
            serviceName: service.name,
            unit: service.unit,
            quantity: qty,
            unitPrice: service.unitPrice,
            total: service.unitPrice * qty,
            incomeType: service.incomeType,
        };

        setNewLineItems([...newLineItems, newItem]);
        setSelectedService('');
        setSelectedQuantity('1');
    };

    const removeLineItem = (id: string) => {
        setNewLineItems(newLineItems.filter(item => item.id !== id));
    };

    const calculateTotals = (items: ProposalLineItem[]) => {
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const kdv = subtotal * 0.18;
        return { subtotal, kdv, total: subtotal + kdv };
    };

    const createProposal = () => {
        if (!newClient || newLineItems.length === 0) return;

        const client = clients.find(c => c.id === newClient);
        const totals = calculateTotals(newLineItems);

        const proposal: Proposal = {
            id: `prop-${Date.now()}`,
            number: `TKL-2026-${String(proposalList.length + 1).padStart(3, '0')}`,
            clientId: newClient,
            clientName: client?.name || '',
            status: 'DRAFT',
            date: new Date().toISOString().split('T')[0],
            validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            lineItems: newLineItems,
            subtotal: totals.subtotal,
            kdv: totals.kdv,
            total: totals.total,
            notes: newNotes,
            paymentTerms: newPaymentTerms,
        };

        setProposalList([proposal, ...proposalList]);
        setShowNewModal(false);
        resetForm();
    };

    const resetForm = () => {
        setNewClient('');
        setNewLineItems([]);
        setNewNotes('');
        setNewPaymentTerms('%50 peşin, %50 teslimde');
    };

    const updateProposalStatus = (id: string, status: Proposal['status']) => {
        setProposalList(proposalList.map(p => p.id === id ? { ...p, status } : p));
        if (status === 'APPROVED') {
            alert('✅ Teklif onaylandı! Projeye dönüştürülecek.');
            // TODO: Proje oluşturma akışı
        }
        setShowDetailModal(false);
    };

    const viewDetail = (proposal: Proposal) => {
        setSelectedProposal(proposal);
        setShowDetailModal(true);
    };

    const newTotals = calculateTotals(newLineItems);
    const recurringTotal = newLineItems.filter(i => i.incomeType === 'RECURRING').reduce((s, i) => s + i.total, 0);
    const projectTotal = newLineItems.filter(i => i.incomeType === 'PROJECT').reduce((s, i) => s + i.total, 0);

    return (
        <>
            <Header
                title="Teklifler"
                subtitle="Müşteri teklifleri ve onay takibi"
                actions={
                    <Button variant="primary" onClick={() => { resetForm(); setShowNewModal(true); }}>+ Yeni Teklif</Button>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* İstatistikler */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>TOPLAM</p>
                            <p style={{ fontSize: '28px', fontWeight: 700 }}>{proposalList.length}</p>
                        </div>
                    </Card>
                    <Card style={{ background: '#FFF9E6' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>BEKLİYOR</p>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: '#F6D73C' }}>
                                {proposalList.filter(p => p.status === 'SENT').length}
                            </p>
                        </div>
                    </Card>
                    <Card style={{ background: '#E8F5E9' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>ONAYLANDI</p>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: '#2E7D32' }}>
                                {proposalList.filter(p => p.status === 'APPROVED').length}
                            </p>
                        </div>
                    </Card>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>TOPLAM DEĞER</p>
                            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-primary)' }}>
                                {formatCurrency(proposalList.filter(p => p.status === 'APPROVED').reduce((s, p) => s + p.total, 0))}
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Teklif Listesi */}
                <Card>
                    <CardHeader title="📄 Teklifler" />
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Teklif No</th>
                                    <th>Müşteri</th>
                                    <th>Tarih</th>
                                    <th style={{ textAlign: 'right' }}>Toplam</th>
                                    <th>Gelir Tipi</th>
                                    <th>Durum</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {proposalList.map(proposal => {
                                    const hasRecurring = proposal.lineItems.some(i => i.incomeType === 'RECURRING');
                                    const hasProject = proposal.lineItems.some(i => i.incomeType === 'PROJECT');
                                    return (
                                        <tr key={proposal.id}>
                                            <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{proposal.number}</td>
                                            <td>{proposal.clientName}</td>
                                            <td>{new Date(proposal.date).toLocaleDateString('tr-TR')}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(proposal.total)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    {hasRecurring && <Badge variant="success">🔄 Düzenli</Badge>}
                                                    {hasProject && <Badge variant="info">📦 Proje</Badge>}
                                                </div>
                                            </td>
                                            <td>
                                                <Badge style={{ backgroundColor: statusConfig[proposal.status]?.bgColor, color: statusConfig[proposal.status]?.color }}>
                                                    {statusConfig[proposal.status]?.label}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Button variant="ghost" size="sm" onClick={() => viewDetail(proposal)}>Detay →</Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Yeni Teklif Modal */}
            <Modal
                isOpen={showNewModal}
                onClose={() => setShowNewModal(false)}
                title="📝 Yeni Teklif Oluştur"
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowNewModal(false)}>İptal</Button>
                        <Button variant="primary" onClick={createProposal} disabled={!newClient || newLineItems.length === 0}>
                            Teklif Oluştur
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {/* Müşteri Seçimi */}
                    <Select
                        label="Müşteri *"
                        value={newClient}
                        onChange={(e) => setNewClient(e.target.value)}
                        options={[
                            { value: '', label: 'Müşteri seçin...' },
                            ...clients.map(c => ({ value: c.id, label: c.name }))
                        ]}
                    />

                    {/* Hizmet Ekleme */}
                    <Card style={{ backgroundColor: 'var(--color-surface)' }}>
                        <p style={{ fontWeight: 600, marginBottom: '12px' }}>➕ Fiyat Listesinden Hizmet Ekle</p>
                        <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'flex-end' }}>
                            <Select
                                label="Hizmet"
                                value={selectedService}
                                onChange={(e) => setSelectedService(e.target.value)}
                                options={[
                                    { value: '', label: 'Hizmet seçin...' },
                                    ...priceListItems.map(s => ({
                                        value: s.id,
                                        label: `${s.name} (${formatCurrency(s.unitPrice)}/${s.unit})`
                                    }))
                                ]}
                                style={{ flex: 2 }}
                            />
                            <Input
                                label="Miktar"
                                type="number"
                                value={selectedQuantity}
                                onChange={(e) => setSelectedQuantity(e.target.value)}
                                min={1}
                                style={{ width: 80 }}
                            />
                            <Button variant="primary" onClick={addLineItem} disabled={!selectedService}>Ekle</Button>
                        </div>
                    </Card>

                    {/* Eklenen Kalemler */}
                    {newLineItems.length > 0 && (
                        <Card>
                            <p style={{ fontWeight: 600, marginBottom: '12px' }}>📋 Teklif Kalemleri</p>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Hizmet</th>
                                            <th>Birim</th>
                                            <th style={{ textAlign: 'right' }}>Miktar</th>
                                            <th style={{ textAlign: 'right' }}>Birim Fiyat</th>
                                            <th style={{ textAlign: 'right' }}>Toplam</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {newLineItems.map(item => (
                                            <tr key={item.id}>
                                                <td>
                                                    {item.serviceName}
                                                    <Badge
                                                        variant={item.incomeType === 'RECURRING' ? 'success' : 'info'}
                                                        style={{ marginLeft: '8px', fontSize: '10px' }}
                                                    >
                                                        {item.incomeType === 'RECURRING' ? '🔄' : '📦'}
                                                    </Badge>
                                                </td>
                                                <td>{item.unit}</td>
                                                <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                                                <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                                                <td>
                                                    <Button variant="ghost" size="sm" onClick={() => removeLineItem(item.id)}>🗑️</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: 'right' }}>Ara Toplam</td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(newTotals.subtotal)}</td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: 'right' }}>KDV (%18)</td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(newTotals.kdv)}</td>
                                            <td></td>
                                        </tr>
                                        <tr style={{ backgroundColor: 'var(--color-surface)' }}>
                                            <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700 }}>GENEL TOPLAM</td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)', fontSize: 'var(--text-body)' }}>
                                                {formatCurrency(newTotals.total)}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Gelir Ayrımı */}
                            {(recurringTotal > 0 || projectTotal > 0) && (
                                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: '12px' }}>
                                    {recurringTotal > 0 && (
                                        <div style={{ flex: 1, padding: 'var(--space-1)', backgroundColor: '#E8F5E9', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                            <p style={{ fontSize: 'var(--text-caption)', color: '#2E7D32' }}>🔄 Düzenli Gelir</p>
                                            <p style={{ fontWeight: 700, color: '#1B5E20' }}>{formatCurrency(recurringTotal)}</p>
                                        </div>
                                    )}
                                    {projectTotal > 0 && (
                                        <div style={{ flex: 1, padding: 'var(--space-1)', backgroundColor: '#E3F2FD', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                            <p style={{ fontSize: 'var(--text-caption)', color: '#1565C0' }}>📦 Proje Geliri</p>
                                            <p style={{ fontWeight: 700, color: '#0D47A1' }}>{formatCurrency(projectTotal)}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Ödeme Şartları ve Notlar */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                        <Input
                            label="Ödeme Şartları"
                            value={newPaymentTerms}
                            onChange={(e) => setNewPaymentTerms(e.target.value)}
                            placeholder="%50 peşin, %50 teslimde"
                        />
                        <Input
                            label="Geçerlilik (gün)"
                            type="number"
                            defaultValue={15}
                        />
                    </div>
                    <Textarea
                        label="Notlar"
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        rows={2}
                        placeholder="Teklif hakkında notlar..."
                    />
                </div>
            </Modal>

            {/* Teklif Detay Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title={selectedProposal ? `📄 ${selectedProposal.number}` : 'Teklif Detayı'}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Kapat</Button>
                        {selectedProposal?.status === 'DRAFT' && (
                            <Button variant="primary" onClick={() => updateProposalStatus(selectedProposal.id, 'SENT')}>
                                📤 Müşteriye Gönder
                            </Button>
                        )}
                        {selectedProposal?.status === 'SENT' && (
                            <>
                                <Button variant="danger" onClick={() => updateProposalStatus(selectedProposal.id, 'REJECTED')}>
                                    ❌ Reddedildi
                                </Button>
                                <Button variant="success" onClick={() => updateProposalStatus(selectedProposal.id, 'APPROVED')}>
                                    ✅ Onaylandı → Proje Oluştur
                                </Button>
                            </>
                        )}
                    </>
                }
            >
                {selectedProposal && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {/* Başlık Bilgileri */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <p style={{ fontSize: 'var(--text-h3)', fontWeight: 700 }}>{selectedProposal.clientName}</p>
                                <p style={{ color: 'var(--color-muted)' }}>
                                    Tarih: {new Date(selectedProposal.date).toLocaleDateString('tr-TR')} •
                                    Geçerlilik: {new Date(selectedProposal.validUntil).toLocaleDateString('tr-TR')}
                                </p>
                            </div>
                            <Badge style={{
                                backgroundColor: statusConfig[selectedProposal.status]?.bgColor,
                                color: statusConfig[selectedProposal.status]?.color,
                                fontSize: 'var(--text-body-sm)'
                            }}>
                                {statusConfig[selectedProposal.status]?.label}
                            </Badge>
                        </div>

                        {/* Kalemler */}
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Hizmet</th>
                                        <th style={{ textAlign: 'right' }}>Miktar</th>
                                        <th style={{ textAlign: 'right' }}>Birim Fiyat</th>
                                        <th style={{ textAlign: 'right' }}>Toplam</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedProposal.lineItems.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                {item.serviceName}
                                                <Badge
                                                    variant={item.incomeType === 'RECURRING' ? 'success' : 'info'}
                                                    style={{ marginLeft: '8px', fontSize: '10px' }}
                                                >
                                                    {item.incomeType === 'RECURRING' ? '🔄 Düzenli' : '📦 Proje'}
                                                </Badge>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>{item.quantity} {item.unit}</td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'right' }}>Ara Toplam</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(selectedProposal.subtotal)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'right' }}>KDV (%18)</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(selectedProposal.kdv)}</td>
                                    </tr>
                                    <tr style={{ backgroundColor: 'var(--color-surface)' }}>
                                        <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700 }}>GENEL TOPLAM</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)', fontSize: 'var(--text-body)' }}>
                                            {formatCurrency(selectedProposal.total)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Ek Bilgiler */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                            <div>
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Ödeme Şartları</p>
                                <p style={{ fontWeight: 600 }}>{selectedProposal.paymentTerms}</p>
                            </div>
                            {selectedProposal.notes && (
                                <div>
                                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Notlar</p>
                                    <p>{selectedProposal.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Onay Sonrası Bilgi */}
                        {selectedProposal.status === 'APPROVED' && (
                            <div style={{ padding: 'var(--space-2)', backgroundColor: '#E8F5E9', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #4CAF50' }}>
                                <p style={{ fontWeight: 600, color: '#2E7D32' }}>✅ Bu teklif onaylandı</p>
                                <p style={{ fontSize: 'var(--text-caption)', color: '#388E3C' }}>
                                    Proje oluşturuldu ve çalışmaya başlanabilir.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
}
