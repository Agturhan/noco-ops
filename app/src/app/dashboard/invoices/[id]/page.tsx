'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Modal, Input, Textarea } from '@/components/ui';

// Mock fatura verisi
const invoiceData = {
    id: 'i1',
    number: 'INV-2026-001',
    status: 'PENDING',
    client: { id: '1', name: 'Zeytindalı Gıda', contactPerson: 'Mehmet Zeytinci', email: 'mehmet@zeytindali.com' },
    project: { id: 'p1', name: 'Zeytindalı Rebrand 2026' },
    issueDate: '2026-01-15',
    dueDate: '2026-02-01',
    subtotal: 50000,
    tax: 9000,
    total: 59000,
    currency: 'TRY',
    paymentTerms: 'Net 15',
    notes: 'Zeytindalı Rebrand projesi - Ara ödeme (%33)',
    lineItems: [
        { id: 'li1', description: 'Logo Tasarımı - Ana logo ve varyasyonlar', quantity: 1, unitPrice: 20000, total: 20000 },
        { id: 'li2', description: 'Kurumsal Kimlik Kılavuzu', quantity: 1, unitPrice: 15000, total: 15000 },
        { id: 'li3', description: 'Sosyal Medya Görselleri (12 adet)', quantity: 12, unitPrice: 1250, total: 15000 },
    ],
    payments: [] as { id: string; date: string; amount: number; method: string; reference: string }[],
    activities: [
        { id: 'a1', date: '2026-01-15 10:00', user: 'Zeynep', action: 'Fatura oluşturuldu' },
        { id: 'a2', date: '2026-01-15 10:05', user: 'Sistem', action: 'E-posta gönderildi: mehmet@zeytindali.com' },
    ],
    bankInfo: {
        bankName: 'İş Bankası',
        iban: 'TR00 0006 4000 0011 2345 6789 00',
        accountName: 'NOCO Creative Digital Studios Ltd.',
        swift: 'ISBKTRIS',
    },
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    DRAFT: { label: 'Taslak', color: '#6B7B80', bgColor: '#F5F5F5' },
    PENDING: { label: 'Ödeme Bekleniyor', color: '#F6D73C', bgColor: '#FFF9E6' },
    PAID: { label: 'Ödendi', color: '#00F5B0', bgColor: '#E8F5E9' },
    OVERDUE: { label: 'Gecikmiş', color: '#FF4242', bgColor: '#FFEBEE' },
    CANCELLED: { label: 'İptal Edildi', color: '#6B7B80', bgColor: '#F5F5F5' },
    PARTIAL: { label: 'Kısmi Ödeme', color: '#FF9800', bgColor: '#FFF3E0' },
};

export default function InvoiceDetailPage() {
    const router = useRouter();
    const [invoice, setInvoice] = useState(invoiceData);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);

    // Payment form
    const [paymentAmount, setPaymentAmount] = useState(invoice.total.toString());
    const [paymentMethod, setPaymentMethod] = useState('Banka Transferi');
    const [paymentReference, setPaymentReference] = useState('');

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);

    const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = invoice.total - paidAmount;
    const isPaid = remainingAmount <= 0;
    const isOverdue = new Date(invoice.dueDate) < new Date() && !isPaid;

    const recordPayment = () => {
        const amount = parseInt(paymentAmount);
        if (!amount || amount <= 0) return;

        const newPayment = {
            id: `pay${invoice.payments.length + 1}`,
            date: new Date().toISOString().split('T')[0],
            amount,
            method: paymentMethod,
            reference: paymentReference,
        };

        const updatedPayments = [...invoice.payments, newPayment];
        const newPaidAmount = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
        const newStatus = newPaidAmount >= invoice.total ? 'PAID' : 'PARTIAL';

        setInvoice({
            ...invoice,
            payments: updatedPayments,
            status: newStatus,
            activities: [
                ...invoice.activities,
                { id: `a${invoice.activities.length + 1}`, date: new Date().toLocaleString('tr-TR'), user: 'Sistem', action: `Ödeme kaydedildi: ${formatCurrency(amount)}` }
            ]
        });
        setShowPaymentModal(false);
    };

    const printInvoice = () => {
        window.print();
    };

    const downloadPDF = () => {
        // Gerçek uygulamada PDF oluşturma
        alert('PDF indirme özelliği yakında eklenecek');
    };

    return (
        <>
            <Header
                title={`Fatura ${invoice.number}`}
                subtitle={`${invoice.client.name} • ${statusConfig[invoice.status]?.label}`}
                actions={
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <Button variant="secondary" onClick={() => router.back()}>← Geri</Button>
                        <Button variant="secondary" onClick={printInvoice}>🖨️ Yazdır</Button>
                        <Button variant="secondary" onClick={downloadPDF}>📄 PDF</Button>
                        {!isPaid && (
                            <>
                                <Button variant="secondary" onClick={() => setShowSendModal(true)}>📧 Gönder</Button>
                                <Button variant="success" onClick={() => setShowPaymentModal(true)}>💰 Ödeme Kaydet</Button>
                            </>
                        )}
                    </div>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* Gecikme Uyarısı */}
                {isOverdue && (
                    <Card style={{ marginBottom: 'var(--space-2)', backgroundColor: '#FFEBEE', borderLeft: '4px solid #FF4242' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{ fontSize: '24px' }}>⚠️</span>
                            <div>
                                <p style={{ fontWeight: 600, color: '#C62828' }}>Fatura Vadesi Geçmiş!</p>
                                <p style={{ fontSize: 'var(--text-caption)', color: '#B71C1C' }}>
                                    Vade tarihi: {new Date(invoice.dueDate).toLocaleDateString('tr-TR')} - {Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))} gün gecikme
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Üst Kartlar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    <Card style={{ background: statusConfig[invoice.status]?.bgColor }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>DURUM</p>
                            <p style={{ fontSize: '18px', fontWeight: 700, color: statusConfig[invoice.status]?.color }}>
                                {statusConfig[invoice.status]?.label}
                            </p>
                        </div>
                    </Card>

                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>TOPLAM</p>
                            <p style={{ fontSize: '20px', fontWeight: 700 }}>{formatCurrency(invoice.total)}</p>
                        </div>
                    </Card>

                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>ÖDENDİ</p>
                            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-success)' }}>{formatCurrency(paidAmount)}</p>
                        </div>
                    </Card>

                    <Card style={{ background: remainingAmount > 0 ? '#FFF3E0' : '#E8F5E9' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>KALAN</p>
                            <p style={{ fontSize: '20px', fontWeight: 700, color: remainingAmount > 0 ? '#E65100' : '#2E7D32' }}>
                                {formatCurrency(remainingAmount)}
                            </p>
                        </div>
                    </Card>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-2)' }}>
                    {/* Sol - Fatura Detayları */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {/* Fatura Bilgileri */}
                        <Card>
                            <CardHeader title="📄 Fatura Bilgileri" />
                            <CardContent>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                                    <div>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Fatura No</p>
                                        <p style={{ fontWeight: 600 }}>{invoice.number}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Proje</p>
                                        <p>📁 {invoice.project.name}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Düzenleme Tarihi</p>
                                        <p>{new Date(invoice.issueDate).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Vade Tarihi</p>
                                        <p style={{ color: isOverdue ? '#C62828' : 'inherit' }}>
                                            {new Date(invoice.dueDate).toLocaleDateString('tr-TR')}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Fatura Kalemleri */}
                        <Card>
                            <CardHeader title="📋 Fatura Kalemleri" />
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Açıklama</th>
                                            <th style={{ textAlign: 'right' }}>Miktar</th>
                                            <th style={{ textAlign: 'right' }}>Birim Fiyat</th>
                                            <th style={{ textAlign: 'right' }}>Toplam</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.lineItems.map(item => (
                                            <tr key={item.id}>
                                                <td>{item.description}</td>
                                                <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                                                <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={3} style={{ textAlign: 'right', fontWeight: 500 }}>Ara Toplam</td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(invoice.subtotal)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={3} style={{ textAlign: 'right', fontWeight: 500 }}>KDV (%18)</td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(invoice.tax)}</td>
                                        </tr>
                                        <tr style={{ backgroundColor: 'var(--color-surface)' }}>
                                            <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700, fontSize: 'var(--text-body)' }}>GENEL TOPLAM</td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 'var(--text-body)', color: 'var(--color-primary)' }}>
                                                {formatCurrency(invoice.total)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </Card>

                        {/* Ödeme Geçmişi */}
                        <Card>
                            <CardHeader title="💳 Ödeme Geçmişi" />
                            <CardContent>
                                {invoice.payments.length === 0 ? (
                                    <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: 'var(--space-2)' }}>
                                        Henüz ödeme kaydı yok
                                    </p>
                                ) : (
                                    <div className="table-container">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Tarih</th>
                                                    <th>Tutar</th>
                                                    <th>Yöntem</th>
                                                    <th>Referans</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoice.payments.map(payment => (
                                                    <tr key={payment.id}>
                                                        <td>{payment.date}</td>
                                                        <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>{formatCurrency(payment.amount)}</td>
                                                        <td>{payment.method}</td>
                                                        <td style={{ fontFamily: 'monospace' }}>{payment.reference}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sağ - Müşteri ve Banka Bilgileri */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {/* Müşteri Bilgileri */}
                        <Card>
                            <CardHeader title="👤 Müşteri" />
                            <CardContent>
                                <p style={{ fontWeight: 600, marginBottom: '8px' }}>{invoice.client.name}</p>
                                <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>
                                    👤 {invoice.client.contactPerson}
                                </p>
                                <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>
                                    📧 {invoice.client.email}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Banka Bilgileri */}
                        <Card>
                            <CardHeader title="🏦 Banka Bilgileri" />
                            <CardContent>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Banka</p>
                                        <p style={{ fontWeight: 500 }}>{invoice.bankInfo.bankName}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>IBAN</p>
                                        <p style={{ fontFamily: 'monospace', fontSize: 'var(--text-body-sm)' }}>{invoice.bankInfo.iban}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Hesap Adı</p>
                                        <p>{invoice.bankInfo.accountName}</p>
                                    </div>
                                    <Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(invoice.bankInfo.iban)}>
                                        📋 IBAN Kopyala
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notlar */}
                        {invoice.notes && (
                            <Card>
                                <CardHeader title="📝 Notlar" />
                                <CardContent>
                                    <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>{invoice.notes}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Aktivite */}
                        <Card>
                            <CardHeader title="📜 Aktivite" />
                            <CardContent>
                                {invoice.activities.map(act => (
                                    <div key={act.id} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
                                        <p style={{ fontSize: 'var(--text-body-sm)' }}>
                                            <strong>{act.user}</strong>: {act.action}
                                        </p>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>{act.date}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Ödeme Kaydet Modal */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                title="💰 Ödeme Kaydet"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>İptal</Button>
                        <Button variant="success" onClick={recordPayment}>Ödeme Kaydet</Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Kalan Tutar</p>
                        <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(remainingAmount)}</p>
                    </div>
                    <Input
                        label="Ödeme Tutarı *"
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                    <Input
                        label="Ödeme Yöntemi"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        placeholder="Banka Transferi, Kredi Kartı, Nakit..."
                    />
                    <Input
                        label="Referans No"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="Dekont no, işlem referansı..."
                    />
                </div>
            </Modal>

            {/* Fatura Gönder Modal */}
            <Modal
                isOpen={showSendModal}
                onClose={() => setShowSendModal(false)}
                title="📧 Faturayı Gönder"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowSendModal(false)}>İptal</Button>
                        <Button variant="primary" onClick={() => { alert('E-posta gönderildi!'); setShowSendModal(false); }}>Gönder</Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <Input
                        label="Alıcı E-posta"
                        value={invoice.client.email}
                        readOnly
                    />
                    <Textarea
                        label="Mesaj (opsiyonel)"
                        rows={3}
                        placeholder="E-posta ile birlikte gönderilecek mesaj..."
                    />
                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                        ✓ PDF fatura eki olarak eklenecek
                    </p>
                </div>
            </Modal>
        </>
    );
}
