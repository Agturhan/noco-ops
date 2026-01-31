'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import {
    Card,
    Badge, Button,
    InvoiceStatusBadge,
    Modal
} from '@/components/ui';
import { exportToPDF, generateInvoiceHTML } from '@/lib/utils/pdfExport';
import { getInvoices, markInvoicePaid } from '@/lib/actions/projects';
import {
    FileText,
    CreditCard,
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    Download,
    MoreHorizontal,
    ArrowRight
} from 'lucide-react';

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

// Kanban column config
const KANBAN_COLUMNS = [
    { id: 'PENDING', label: 'Bekleyen', color: 'var(--color-warning)', icon: Clock },
    { id: 'OVERDUE', label: 'Vadesi Geçmiş', color: 'var(--color-error)', icon: AlertCircle },
    { id: 'PAID', label: 'Ödendi', color: 'var(--color-success)', icon: CheckCircle },
    { id: 'REFUNDED', label: 'İade', color: 'var(--color-muted)', icon: XCircle },
] as const;

// Mock invoices for fallback when DB is empty
const mockInvoices: Invoice[] = [
    { id: 'i1', project: 'Zeytindalı Rebrand 2026', client: 'Zeytindalı Gıda', amount: 59000, currency: 'TRY', status: 'PENDING', dueDate: '2026-02-01', createdAt: '2026-01-15' },
    { id: 'i2', project: 'İkranur Sosyal Medya', client: 'İkranur Kozmetik', amount: 25000, currency: 'TRY', status: 'OVERDUE', dueDate: '2026-01-12', createdAt: '2026-01-05' },
    { id: 'i3', project: 'Louvess Video', client: 'Louvess', amount: 35000, currency: 'TRY', status: 'PAID', dueDate: '2026-01-10', paidAt: '2026-01-08', createdAt: '2026-01-01' },
    { id: 'i4', project: 'Hair Chef Kampanyası', client: 'Hair Chef', amount: 18000, currency: 'TRY', status: 'PAID', dueDate: '2026-01-15', paidAt: '2026-01-14', createdAt: '2026-01-10' },
];

export function InvoicesPageClient() {
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
                setInvoices(formatted.length > 0 ? formatted : mockInvoices);
            } catch (error) {
                console.error('Faturalar yüklenirken hata:', error);
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

    const handleExportPDF = (invoice: Invoice) => {
        const content = generateInvoiceHTML(invoice);
        exportToPDF(content, {
            title: `Fatura - ${invoice.project}`,
            filename: `fatura-${invoice.id}`
        });
    };

    // Get invoices by status
    const getInvoicesByStatus = (status: string) =>
        invoices.filter(inv => inv.status === status);

    // Calculate totals per column
    const getColumnTotal = (status: string) =>
        getInvoicesByStatus(status).reduce((sum, inv) => sum + inv.amount, 0);

    // Summary metrics
    const totalPending = invoices
        .filter(inv => inv.status === 'PENDING' || inv.status === 'OVERDUE')
        .reduce((sum, inv) => sum + inv.amount, 0);

    const overdueCount = invoices.filter(inv => inv.status === 'OVERDUE').length;

    return (
        <>
            <Header
                title="Faturalar"
                subtitle="Ödeme durumu ve fatura yönetimi"
                actions={
                    <Button variant="primary">
                        <FileText size={16} />
                        Yeni Fatura
                    </Button>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* Summary Bar */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-3)',
                    marginBottom: 'var(--space-3)',
                    flexWrap: 'wrap'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        padding: '8px 16px',
                        background: 'var(--color-surface)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <Clock size={16} style={{ color: 'var(--color-warning)' }} />
                        <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>Bekleyen:</span>
                        <strong style={{ color: 'var(--color-warning)' }}>{formatCurrency(totalPending, 'TRY')}</strong>
                    </div>
                    {overdueCount > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-1)',
                            padding: '8px 16px',
                            background: 'rgba(255, 67, 66, 0.1)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-error)'
                        }}>
                            <AlertCircle size={16} style={{ color: 'var(--color-error)' }} />
                            <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-error)' }}>
                                {overdueCount} vadesi geçmiş fatura
                            </span>
                        </div>
                    )}
                </div>

                {/* Kanban Board */}
                {loading ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 'var(--space-2)'
                    }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{
                                height: '200px',
                                background: 'var(--color-surface)',
                                borderRadius: 'var(--radius-md)',
                                animation: 'pulse 1.5s infinite'
                            }} />
                        ))}
                    </div>
                ) : (
                    <div
                        className="kanban-board"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: 'var(--space-2)',
                            minHeight: '400px'
                        }}
                    >
                        {KANBAN_COLUMNS.map(column => {
                            const columnInvoices = getInvoicesByStatus(column.id);
                            const columnTotal = getColumnTotal(column.id);
                            const Icon = column.icon;

                            return (
                                <div
                                    key={column.id}
                                    className="kanban-column"
                                    style={{
                                        background: 'var(--color-surface)',
                                        borderRadius: 'var(--radius-lg)',
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
                                        padding: '8px 12px',
                                        borderBottom: '1px solid var(--color-divider)'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <Icon size={16} style={{ color: column.color }} />
                                            <span style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>
                                                {column.label}
                                            </span>
                                            <span style={{
                                                background: 'var(--color-surface-2)',
                                                padding: '2px 8px',
                                                borderRadius: 'var(--radius-pill)',
                                                fontSize: 'var(--text-caption)',
                                                color: 'var(--color-muted)'
                                            }}>
                                                {columnInvoices.length}
                                            </span>
                                        </div>
                                        {columnTotal > 0 && (
                                            <span style={{
                                                fontSize: 'var(--text-caption)',
                                                color: column.color,
                                                fontWeight: 600
                                            }}>
                                                {formatCurrency(columnTotal, 'TRY')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Invoice Cards */}
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 'var(--space-1)',
                                        flex: 1,
                                        overflowY: 'auto'
                                    }}>
                                        {columnInvoices.length === 0 ? (
                                            <div style={{
                                                padding: 'var(--space-3)',
                                                textAlign: 'center',
                                                color: 'var(--color-muted)',
                                                fontSize: 'var(--text-body-sm)'
                                            }}>
                                                Fatura yok
                                            </div>
                                        ) : (
                                            columnInvoices.map(invoice => (
                                                <div
                                                    key={invoice.id}
                                                    className="invoice-card"
                                                    style={{
                                                        background: 'var(--color-surface-3)',
                                                        borderRadius: 'var(--radius-row)',
                                                        padding: '12px 16px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease',
                                                        border: '1px solid transparent'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'var(--color-surface-hover)';
                                                        e.currentTarget.style.borderColor = 'var(--color-border)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'var(--color-surface-3)';
                                                        e.currentTarget.style.borderColor = 'transparent';
                                                    }}
                                                >
                                                    {/* Client & Project */}
                                                    <div style={{ marginBottom: '8px' }}>
                                                        <p style={{
                                                            fontWeight: 600,
                                                            fontSize: 'var(--text-body)',
                                                            marginBottom: '2px',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            {invoice.client}
                                                        </p>
                                                        <p style={{
                                                            fontSize: 'var(--text-caption)',
                                                            color: 'var(--color-muted)',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            {invoice.project}
                                                        </p>
                                                    </div>

                                                    {/* Amount */}
                                                    <div style={{
                                                        fontSize: 'var(--text-h3)',
                                                        fontWeight: 700,
                                                        marginBottom: '8px',
                                                        fontVariantNumeric: 'tabular-nums'
                                                    }}>
                                                        {formatCurrency(invoice.amount, invoice.currency)}
                                                    </div>

                                                    {/* Date & Actions */}
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between'
                                                    }}>
                                                        <span style={{
                                                            fontSize: 'var(--text-caption)',
                                                            color: column.id === 'OVERDUE' ? 'var(--color-error)' : 'var(--color-muted)'
                                                        }}>
                                                            {invoice.status === 'PAID'
                                                                ? `✓ ${invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : ''}`
                                                                : invoice.dueDate
                                                                    ? new Date(invoice.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
                                                                    : '-'
                                                            }
                                                        </span>
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            {invoice.status !== 'PAID' && invoice.status !== 'REFUNDED' && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleMarkPaid(invoice);
                                                                    }}
                                                                    style={{
                                                                        background: 'var(--color-success)',
                                                                        border: 'none',
                                                                        borderRadius: 'var(--radius-sm)',
                                                                        padding: '4px 8px',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px',
                                                                        color: 'white',
                                                                        fontSize: 'var(--text-caption)'
                                                                    }}
                                                                >
                                                                    <CreditCard size={12} />
                                                                    Ödendi
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleExportPDF(invoice);
                                                                }}
                                                                style={{
                                                                    background: 'var(--color-surface-2)',
                                                                    border: 'none',
                                                                    borderRadius: 'var(--radius-sm)',
                                                                    padding: '4px 8px',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    color: 'var(--color-ink)'
                                                                }}
                                                            >
                                                                <Download size={12} />
                                                            </button>
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
                )}
            </div>

            {/* Mobile Kanban Styles */}
            <style jsx global>{`
                @media (max-width: 1024px) {
                    .kanban-board {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
                @media (max-width: 640px) {
                    .kanban-board {
                        grid-template-columns: 1fr !important;
                        gap: var(--space-3) !important;
                    }
                    .kanban-column {
                        max-height: none !important;
                    }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>

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
                            <CheckCircle size={16} />
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
                        backgroundColor: 'var(--color-surface-3)',
                        borderRadius: 'var(--radius-md)'
                    }}>
                        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>
                            Tutar:
                        </p>
                        <p style={{
                            fontSize: 'var(--text-h2)',
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
                        <CheckCircle size={14} />
                        Ödeme onaylandığında ilgili teslimatlar aktif hale gelecek
                    </p>
                </div>
            </Modal>
        </>
    );
}
