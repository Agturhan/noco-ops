'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import {
    Card, CardHeader, CardContent,
    Badge, Button,
    InvoiceStatusBadge,
    Modal
} from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { brands, getBrandColor } from '@/lib/data';
import { exportToPDF, generateInvoiceHTML } from '@/lib/utils/pdfExport';
import { getInvoices, markInvoicePaid } from '@/lib/actions/projects';

// Invoice interface
interface Invoice {
    id: string;
    project: string;
    client: string;
    brandId?: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'REFUNDED';
    dueDate?: string;
    paidAt?: string;
    createdAt?: string;
}

// Mock invoices for fallback when DB is empty
const mockInvoices: Invoice[] = [
    { id: 'i1', project: 'Zeytindalı Rebrand 2026', client: 'Zeytindalı Gıda', amount: 59000, currency: 'TRY', status: 'PENDING', dueDate: '2026-02-01', createdAt: '2026-01-15' },
    { id: 'i2', project: 'İkranur Sosyal Medya', client: 'İkranur Kozmetik', amount: 25000, currency: 'TRY', status: 'OVERDUE', dueDate: '2026-01-12', createdAt: '2026-01-05' },
    { id: 'i3', project: 'Louvess Video', client: 'Louvess', amount: 35000, currency: 'TRY', status: 'PAID', dueDate: '2026-01-10', paidAt: '2026-01-08', createdAt: '2026-01-01' },
    { id: 'i4', project: 'Hair Chef Kampanyası', client: 'Hair Chef', amount: 18000, currency: 'TRY', status: 'PAID', dueDate: '2026-01-15', paidAt: '2026-01-14', createdAt: '2026-01-10' },
];

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    // Load invoices from database
    useEffect(() => {
        const loadInvoices = async () => {
            try {
                setLoading(true);
                const data = await getInvoices();
                // Transform DB data to local Invoice format
                const formatted: Invoice[] = data.map((inv: any) => ({
                    id: inv.id,
                    project: inv.project?.name || 'Bilinmeyen Proje',
                    client: inv.project?.contract?.client?.name || 'Bilinmeyen Müşteri',
                    brandId: '',
                    amount: inv.amount || 0,
                    currency: 'TRY',
                    status: inv.status,
                    dueDate: inv.dueDate?.split('T')[0] || '',
                    paidAt: inv.paidAt?.split('T')[0] || '',
                    createdAt: inv.createdAt?.split('T')[0] || '',
                }));
                // Fallback to mock data if DB is empty
                setInvoices(formatted.length > 0 ? formatted : mockInvoices);
            } catch (error) {
                console.error('Faturalar yüklenirken hata:', error);
                // Use mock data on error
                setInvoices(mockInvoices);
            } finally {
                setLoading(false);
            }
        };
        loadInvoices();
    }, []);

    const handleMarkPaid = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setShowPaymentModal(true);
    };

    const confirmPayment = async () => {
        if (!selectedInvoice) return;
        try {
            await markInvoicePaid(selectedInvoice.id);
            // Optimistic update
            setInvoices(invoices.map(inv =>
                inv.id === selectedInvoice.id
                    ? { ...inv, status: 'PAID' as const, paidAt: new Date().toISOString().split('T')[0] }
                    : inv
            ));
            setShowPaymentModal(false);
        } catch (error) {
            console.error('Ödeme kaydedilirken hata:', error);
            alert('Ödeme kaydedilirken bir hata oluştu');
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleExportPDF = (invoice: typeof invoices[0]) => {
        const content = generateInvoiceHTML(invoice);
        exportToPDF(content, {
            title: `Fatura - ${invoice.project}`,
            filename: `fatura-${invoice.id}`
        });
    };

    // Dinamik metrik hesaplamaları
    const totalPending = invoices
        .filter(inv => inv.status === 'PENDING' || inv.status === 'OVERDUE')
        .reduce((sum, inv) => sum + inv.amount, 0);

    const overdueCount = invoices.filter(inv => inv.status === 'OVERDUE').length;

    const thisMonthPaid = invoices
        .filter(inv => {
            if (inv.status !== 'PAID' || !inv.paidAt) return false;
            const paidDate = new Date(inv.paidAt);
            const now = new Date();
            return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, inv) => sum + inv.amount, 0);

    return (
        <>
            <Header
                title="Faturalar"
                subtitle="Ödeme durumu ve fatura yönetimi"
                actions={
                    <Button variant="primary">
                        + Yeni Fatura
                    </Button>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* Summary Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-3)'
                }}>
                    <Card>
                        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>
                            Bekleyen Ödemeler
                        </p>
                        <p style={{
                            fontSize: 'var(--text-h3)',
                            fontWeight: 700,
                            fontFamily: 'var(--font-heading)',
                            color: 'var(--color-warning)'
                        }}>
                            {formatCurrency(totalPending, 'TRY')}
                        </p>
                    </Card>
                    <Card>
                        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>
                            Gecikmiş Faturalar
                        </p>
                        <p style={{
                            fontSize: 'var(--text-h3)',
                            fontWeight: 700,
                            fontFamily: 'var(--font-heading)',
                            color: 'var(--color-error)'
                        }}>
                            {overdueCount}
                        </p>
                    </Card>
                    <Card>
                        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>
                            Bu Ay Ödenen
                        </p>
                        <p style={{
                            fontSize: 'var(--text-h3)',
                            fontWeight: 700,
                            fontFamily: 'var(--font-heading)',
                            color: 'var(--color-success)'
                        }}>
                            {formatCurrency(thisMonthPaid, 'TRY')}
                        </p>
                    </Card>
                </div>

                {/* Info Banner */}
                <Card style={{
                    marginBottom: 'var(--space-2)',
                    backgroundColor: 'rgba(245, 158, 11, 0.05)',
                    borderLeft: '3px solid var(--color-warning)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        fontSize: 'var(--text-body-sm)'
                    }}>
                        <span>⚠️</span>
                        <span>
                            <strong>Hatırlatma:</strong> Ödenmemiş faturalar olan projelerin teslimatları engellenmiştir.
                        </span>
                    </div>
                </Card>

                {/* Invoices Table */}
                {loading ? (
                    <Card>
                        <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                            <p style={{ color: 'var(--color-muted)' }}>Faturalar yükleniyor...</p>
                        </div>
                    </Card>
                ) : invoices.length === 0 ? (
                    <Card>
                        <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                            <p style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>💰</p>
                            <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Henüz fatura yok</p>
                            <p style={{ color: 'var(--color-muted)', marginBottom: 'var(--space-2)' }}>
                                Bir proje için ilk faturanızı oluşturun
                            </p>
                            <Button variant="primary">+ Yeni Fatura</Button>
                        </div>
                    </Card>
                ) : (
                    <Card>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Proje</th>
                                        <th>Müşteri</th>
                                        <th style={{ textAlign: 'right' }}>Tutar</th>
                                        <th>Vade</th>
                                        <th>Durum</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id}>
                                            <td style={{ fontWeight: 500 }}>{invoice.project}</td>
                                            <td style={{ color: 'var(--color-muted)' }}>{invoice.client}</td>
                                            <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                                {formatCurrency(invoice.amount, invoice.currency)}
                                            </td>
                                            <td>
                                                {invoice.status === 'PAID' ? (
                                                    <span style={{ color: 'var(--color-success)' }}>
                                                        ✓ {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        color: invoice.status === 'OVERDUE' ? 'var(--color-error)' : 'inherit'
                                                    }}>
                                                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <InvoiceStatusBadge status={invoice.status} />
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                                                    {invoice.status !== 'PAID' && (
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            onClick={() => handleMarkPaid(invoice)}
                                                        >
                                                            💳 Ödeme Al
                                                        </Button>
                                                    )}
                                                    <Button variant="secondary" size="sm" onClick={() => handleExportPDF(invoice)}>
                                                        📄 PDF
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>

            {/* Payment Modal */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                title="Ödeme Onayı"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
                            İptal
                        </Button>
                        <Button variant="success" onClick={confirmPayment}>
                            Ödemeyi Onayla
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <p style={{ color: 'var(--color-sub-ink)' }}>
                        <strong>{selectedInvoice?.project}</strong> projesi için ödeme onaylansın mı?
                    </p>
                    <div style={{
                        padding: 'var(--space-2)',
                        backgroundColor: 'var(--color-zebra)',
                        borderRadius: 'var(--radius-sm)'
                    }}>
                        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>
                            Tutar:
                        </p>
                        <p style={{
                            fontSize: 'var(--text-h3)',
                            fontWeight: 700,
                            fontFamily: 'var(--font-heading)'
                        }}>
                            {selectedInvoice && formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                        </p>
                    </div>
                    <p style={{
                        fontSize: 'var(--text-caption)',
                        color: 'var(--color-success)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        ✓ Ödeme onaylandığında ilgili teslimatlar aktif hale gelecek
                    </p>
                </div>
            </Modal>
        </>
    );
}
