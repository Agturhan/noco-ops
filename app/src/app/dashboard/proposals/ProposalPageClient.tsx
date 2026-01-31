'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Badge, Modal, Input, Select, Textarea, Drawer } from '@/components/ui';
import { getProposals, createProposal, updateProposalStatus, sendProposal, approveProposal, deleteProposal } from '@/lib/actions/proposals';
import { SERVICES, SM_PACKAGES, STUDIO_REELS_PACKAGES, formatCurrency, VAT_RATE, MAX_DISCOUNT_RATE } from '@/lib/constants/pricing';
import { Printer, Calculator } from 'lucide-react';
import { SmartProposalModal } from '@/components/proposals/SmartProposalModal';

// ===== TEKLİF OLUŞTURUCU (Proposal Builder) =====

// Build priceListItems from centralized pricing
const priceListItems = [
    // SM Packages as line items
    ...SM_PACKAGES.map(p => ({
        id: `sm-${p.id}`,
        name: `SM Paket ${p.name}`,
        description: p.features.slice(0, 2).join(', '),
        category: 'SOCIAL',
        unit: 'AYLIK',
        unitPrice: p.price,
        incomeType: 'RECURRING' as const,
    })),
    // Studio Reels as line items
    ...STUDIO_REELS_PACKAGES.map(p => ({
        id: `reels-${p.id}`,
        name: `Studio Reels ${p.name}`,
        description: p.features.join(', '),
        category: 'VIDEO',
        unit: 'PAKET',
        unitPrice: p.price,
        incomeType: 'PROJECT' as const,
    })),
    // Unit services
    ...SERVICES.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        category: s.category,
        unit: s.unit,
        unitPrice: s.unitPrice,
        incomeType: s.incomeType,
    })),
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
    discountPercent: number; // 0-25%
    total: number; // After discount
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
            { id: 'li1', serviceId: 'd1', serviceName: 'Logo Tasarımı', unit: 'PAKET', quantity: 1, unitPrice: 20000, discountPercent: 0, total: 20000, incomeType: 'PROJECT' },
            { id: 'li2', serviceId: 'd2', serviceName: 'Kurumsal Kimlik Kılavuzu', unit: 'PAKET', quantity: 1, unitPrice: 15000, discountPercent: 0, total: 15000, incomeType: 'PROJECT' },
            { id: 'li3', serviceId: 'v2', serviceName: 'Orta Video (30-60sn)', unit: 'VIDEO', quantity: 3, unitPrice: 8000, discountPercent: 0, total: 24000, incomeType: 'PROJECT' },
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
            { id: 'li4', serviceId: 's2', serviceName: 'Sosyal Medya Yönetimi - Standart', unit: 'AYLIK', quantity: 12, unitPrice: 25000, discountPercent: 0, total: 300000, incomeType: 'RECURRING' },
            { id: 'li5', serviceId: 'p1', serviceName: 'Ürün Fotoğrafı Paketi', unit: 'PAKET', quantity: 2, unitPrice: 8000, discountPercent: 0, total: 16000, incomeType: 'PROJECT' },
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

export function ProposalPageClient() {
    const router = useRouter();
    const [proposalList, setProposalList] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showSmartModal, setShowSmartModal] = useState(false);

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
                // Fallback to static proposals if DB is empty
                setProposalList(formatted.length > 0 ? formatted : proposals);
            } catch (error) {
                console.error('Teklifler yüklenirken hata:', error);
                // Use static proposals on error
                setProposalList(proposals);
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
            discountPercent: 0,
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

    const updateLineItemDiscount = (id: string, discountPercent: number) => {
        // Clamp between 0 and MAX_DISCOUNT_RATE (25%)
        const clampedDiscount = Math.min(Math.max(discountPercent, 0), MAX_DISCOUNT_RATE * 100);
        setNewLineItems(newLineItems.map(item => {
            if (item.id === id) {
                const discountMultiplier = 1 - (clampedDiscount / 100);
                const newTotal = item.unitPrice * item.quantity * discountMultiplier;
                return { ...item, discountPercent: clampedDiscount, total: newTotal };
            }
            return item;
        }));
    };

    const calculateTotals = (items: ProposalLineItem[]) => {
        // Subtotal is already discounted per item
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const kdv = subtotal * VAT_RATE;
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

    // Handle items generated from Smart Calculator
    const handleSmartGenerate = (items: any[], notes: string, discount: number) => {
        const lineItems: ProposalLineItem[] = items.map((item, idx) => ({
            id: `li-smart-${Date.now()}-${idx}`,
            serviceId: item.serviceId,
            serviceName: item.serviceName,
            unit: item.unit || 'ADET',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercent: discount,
            total: item.total * (1 - discount / 100),
            incomeType: item.unit === 'AYLIK' ? 'RECURRING' as const : 'PROJECT' as const,
        }));

        setNewLineItems(lineItems);
        setNewNotes(notes);
        setShowSmartModal(false);
        setShowNewModal(true);
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
                    <>
                        <Button variant="secondary" onClick={() => setShowSmartModal(true)}>
                            <Calculator size={16} style={{ marginRight: '6px' }} />
                            Akıllı Hesaplayıcı
                        </Button>
                        <Button variant="primary" onClick={() => { resetForm(); setShowNewModal(true); }}>+ Yeni Teklif</Button>
                    </>
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

                {/* Kanban Teklif Görünümü */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 'var(--space-2)',
                    minHeight: '400px'
                }}>
                    {(['DRAFT', 'SENT', 'APPROVED', 'REJECTED'] as const).map(status => {
                        const statusProposals = proposalList.filter(p => p.status === status);
                        const config = statusConfig[status];
                        return (
                            <div
                                key={status}
                                style={{
                                    backgroundColor: 'var(--color-surface)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: 'var(--space-2)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--space-2)'
                                }}
                            >
                                {/* Column Header */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingBottom: 'var(--space-1)',
                                    borderBottom: `2px solid ${config.color}`
                                }}>
                                    <span style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>
                                        {config.label}
                                    </span>
                                    <span style={{
                                        backgroundColor: config.bgColor,
                                        color: config.color,
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: 'var(--text-caption)',
                                        fontWeight: 600
                                    }}>
                                        {statusProposals.length}
                                    </span>
                                </div>

                                {/* Proposal Cards */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--space-1)',
                                    flex: 1,
                                    overflowY: 'auto'
                                }}>
                                    {statusProposals.length === 0 ? (
                                        <div style={{
                                            padding: 'var(--space-3)',
                                            textAlign: 'center',
                                            color: 'var(--color-muted)',
                                            fontSize: 'var(--text-caption)'
                                        }}>
                                            Teklif yok
                                        </div>
                                    ) : (
                                        statusProposals.map(proposal => (
                                            <div
                                                key={proposal.id}
                                                onClick={() => viewDetail(proposal)}
                                                style={{
                                                    backgroundColor: 'var(--color-bg)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    padding: 'var(--space-2)',
                                                    cursor: 'pointer',
                                                    border: '1px solid var(--color-border)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.borderColor = config.color;
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                {/* Card Header */}
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    marginBottom: 'var(--space-1)'
                                                }}>
                                                    <span style={{
                                                        fontSize: 'var(--text-caption)',
                                                        fontFamily: 'monospace',
                                                        color: 'var(--color-muted)'
                                                    }}>
                                                        {proposal.number}
                                                    </span>
                                                </div>

                                                {/* Client Name */}
                                                <p style={{
                                                    fontWeight: 600,
                                                    fontSize: 'var(--text-body-sm)',
                                                    marginBottom: 'var(--space-1)'
                                                }}>
                                                    {proposal.clientName}
                                                </p>

                                                {/* Total */}
                                                <p style={{
                                                    fontSize: '16px',
                                                    fontWeight: 700,
                                                    color: 'var(--color-primary)',
                                                    marginBottom: 'var(--space-1)'
                                                }}>
                                                    {formatCurrency(proposal.total)}
                                                </p>

                                                {/* Footer: Date + Income Type */}
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    fontSize: 'var(--text-caption)',
                                                    color: 'var(--color-muted)'
                                                }}>
                                                    <span>{new Date(proposal.date).toLocaleDateString('tr-TR')}</span>
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        {proposal.lineItems.some(i => i.incomeType === 'RECURRING') && (
                                                            <span style={{
                                                                backgroundColor: 'rgba(0, 245, 176, 0.2)',
                                                                color: '#00F5B0',
                                                                padding: '1px 6px',
                                                                borderRadius: '8px',
                                                                fontSize: '10px'
                                                            }}>
                                                                Düzenli
                                                            </span>
                                                        )}
                                                        {proposal.lineItems.some(i => i.incomeType === 'PROJECT') && (
                                                            <span style={{
                                                                backgroundColor: 'rgba(50, 159, 245, 0.2)',
                                                                color: '#329FF5',
                                                                padding: '1px 6px',
                                                                borderRadius: '8px',
                                                                fontSize: '10px'
                                                            }}>
                                                                Proje
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
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
                                            <th style={{ textAlign: 'right' }}>İndirim %</th>
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
                                                <td style={{ textAlign: 'right' }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="25"
                                                        value={item.discountPercent || 0}
                                                        onChange={(e) => updateLineItemDiscount(item.id, parseFloat(e.target.value) || 0)}
                                                        style={{ width: '50px', textAlign: 'right', padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                    {item.discountPercent > 0 && (
                                                        <span style={{ textDecoration: 'line-through', color: 'var(--color-muted)', marginRight: '8px', fontSize: '12px' }}>
                                                            {formatCurrency(item.unitPrice * item.quantity)}
                                                        </span>
                                                    )}
                                                    {formatCurrency(item.total)}
                                                </td>
                                                <td>
                                                    <Button variant="ghost" size="sm" onClick={() => removeLineItem(item.id)}>🗑️</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'right' }}>Ara Toplam</td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(newTotals.subtotal)}</td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'right' }}>KDV (%20)</td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(newTotals.kdv)}</td>
                                            <td></td>
                                        </tr>
                                        <tr style={{ backgroundColor: 'var(--color-surface)' }}>
                                            <td colSpan={5} style={{ textAlign: 'right', fontWeight: 700 }}>GENEL TOPLAM</td>
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

            {/* Teklif Detay Drawer */}
            <Drawer
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title={selectedProposal ? selectedProposal.number : 'Teklif Detayı'}
                footer={
                    <>
                        {selectedProposal?.status === 'DRAFT' && (
                            <Button variant="primary" onClick={() => updateProposalStatus(selectedProposal.id, 'SENT')} style={{ flex: 1 }}>
                                📤 Müşteriye Gönder
                            </Button>
                        )}
                        {selectedProposal?.status === 'SENT' && (
                            <>
                                <Button variant="danger" onClick={() => updateProposalStatus(selectedProposal.id, 'REJECTED')} style={{ flex: 1 }}>
                                    ❌ Reddedildi
                                </Button>
                                <Button variant="success" onClick={() => updateProposalStatus(selectedProposal.id, 'APPROVED')} style={{ flex: 1 }}>
                                    ✅ Onaylandı
                                </Button>
                            </>
                        )}
                        <Button variant="secondary" onClick={() => window.print()}>
                            <Printer size={16} />
                        </Button>
                    </>
                }
            >
                {selectedProposal && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {/* Başlık ve Durum */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <Badge style={{
                                    backgroundColor: statusConfig[selectedProposal.status]?.bgColor,
                                    color: statusConfig[selectedProposal.status]?.color,
                                    fontSize: 'var(--text-body-sm)'
                                }}>
                                    {statusConfig[selectedProposal.status]?.label}
                                </Badge>
                                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                                    {new Date(selectedProposal.date).toLocaleDateString('tr-TR')}
                                </span>
                            </div>
                            <h3 style={{ fontSize: 'var(--text-h2)', fontWeight: 700, margin: 0 }}>
                                {selectedProposal.clientName}
                            </h3>
                            <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-body-sm)' }}>
                                Geçerlilik: {new Date(selectedProposal.validUntil).toLocaleDateString('tr-TR')}
                            </p>
                        </div>

                        {/* Onay Sonrası Bilgi */}
                        {selectedProposal.status === 'APPROVED' && (
                            <div style={{
                                padding: 'var(--space-2)',
                                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                borderRadius: 'var(--radius-sm)',
                                borderLeft: '3px solid #4CAF50'
                            }}>
                                <p style={{ fontWeight: 600, color: '#2E7D32', fontSize: 'var(--text-body-sm)' }}>✅ Bu teklif onaylandı</p>
                                <p style={{ fontSize: 'var(--text-caption)', color: '#388E3C' }}>
                                    Proje oluşturuldu ve çalışmaya başlanabilir.
                                </p>
                            </div>
                        )}

                        {/* Özet Kartlar */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                            <div style={{
                                background: 'var(--color-surface-2)',
                                padding: '12px',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Toplam Tutar</p>
                                <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-primary)' }}>
                                    {formatCurrency(selectedProposal.total)}
                                </p>
                            </div>
                            <div style={{
                                background: 'var(--color-surface-2)',
                                padding: '12px',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Hizmet Sayısı</p>
                                <p style={{ fontSize: '20px', fontWeight: 700 }}>
                                    {selectedProposal.lineItems.length}
                                </p>
                            </div>
                        </div>

                        {/* Kalemler */}
                        <div>
                            <p style={{
                                fontSize: 'var(--text-body-sm)',
                                fontWeight: 600,
                                color: 'var(--color-muted)',
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Hizmet Detayları
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {selectedProposal.lineItems.map(item => (
                                    <div key={item.id} style={{
                                        background: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '12px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 500 }}>{item.serviceName}</span>
                                            <span style={{ fontWeight: 600 }}>{formatCurrency(item.total)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                                            <span>
                                                {item.quantity} {item.unit} x {formatCurrency(item.unitPrice)}
                                            </span>
                                            <span style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                color: item.incomeType === 'RECURRING' ? 'var(--color-success)' : 'inherit'
                                            }}>
                                                {item.incomeType === 'RECURRING' ? '🔄 Aylık' : '📦 Proje'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Alt Bilgiler */}
                        <div style={{
                            background: 'var(--color-surface-3)',
                            padding: '16px',
                            borderRadius: 'var(--radius-lg)',
                            fontSize: 'var(--text-body-sm)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: 'var(--color-muted)' }}>Ara Toplam</span>
                                <span>{formatCurrency(selectedProposal.subtotal)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--color-divider)' }}>
                                <span style={{ color: 'var(--color-muted)' }}>KDV (%20)</span>
                                <span>{formatCurrency(selectedProposal.kdv)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600 }}>GENEL TOPLAM</span>
                                <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(selectedProposal.total)}</span>
                            </div>
                        </div>

                        {/* Notlar ve Ödeme Şartları */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginBottom: '4px' }}>Ödeme Şartları</p>
                                <p style={{ fontSize: 'var(--text-body-sm)', padding: '8px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                                    {selectedProposal.paymentTerms}
                                </p>
                            </div>
                            {selectedProposal.notes && (
                                <div>
                                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginBottom: '4px' }}>Notlar</p>
                                    <p style={{ fontSize: 'var(--text-body-sm)', whiteSpace: 'pre-line' }}>{selectedProposal.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Drawer>

            {/* Akıllı Teklif Hesaplayıcı Modal */}
            <SmartProposalModal
                isOpen={showSmartModal}
                onClose={() => setShowSmartModal(false)}
                onGenerate={handleSmartGenerate}
            />
        </>
    );
}
