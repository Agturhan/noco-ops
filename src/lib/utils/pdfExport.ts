/**
 * PDF Export Utility
 * Uses browser's print-to-PDF functionality
 */

export interface PDFExportOptions {
    title: string;
    filename?: string;
}

/**
 * Opens a print dialog for PDF export
 * Uses a new window with formatted content
 */
export function exportToPDF(content: string, options: PDFExportOptions): void {
    const { title, filename = 'document' } = options;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up engelleyicinizi devre dışı bırakın ve tekrar deneyin.');
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    padding: 40px;
                    color: #333;
                    line-height: 1.6;
                }
                .header {
                    border-bottom: 2px solid #329FF5;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 24px;
                    font-weight: 700;
                    color: #329FF5;
                }
                .company-name {
                    font-size: 12px;
                    color: #666;
                }
                h1 {
                    font-size: 28px;
                    margin-bottom: 10px;
                }
                h2 {
                    font-size: 18px;
                    margin: 20px 0 10px;
                    color: #329FF5;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                th, td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #eee;
                }
                th {
                    background: #f5f5f5;
                    font-weight: 600;
                }
                .amount {
                    font-size: 24px;
                    font-weight: 700;
                    color: #329FF5;
                }
                .label {
                    color: #666;
                    font-size: 12px;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin: 20px 0;
                }
                .info-item {
                    background: #f9f9f9;
                    padding: 15px;
                    border-radius: 8px;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    font-size: 12px;
                    color: #666;
                    text-align: center;
                }
                @media print {
                    body { padding: 20px; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            ${content}
            <div class="footer">
                <p>NOCO Creative Digital Studios &copy; ${new Date().getFullYear()}</p>
                <p>Bu belge ${new Date().toLocaleDateString('tr-TR')} tarihinde oluşturulmuştur.</p>
            </div>
        </body>
        </html>
    `);

    printWindow.document.close();

    // Wait for content to load, then print
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

/**
 * Generate Invoice HTML content
 */
export function generateInvoiceHTML(invoice: {
    id: string;
    project: string;
    client: string;
    amount: number;
    currency: string;
    status: string;
    dueDate?: string;
    paidAt?: string;
    createdAt?: string;
}): string {
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(amount);
    };

    const statusLabels: Record<string, string> = {
        'PENDING': 'Beklemede',
        'PAID': 'Ödendi',
        'OVERDUE': 'Vadesi Geçmiş',
        'REFUNDED': 'İade Edildi'
    };

    return `
        <div class="header">
            <div class="logo">NOCO Ops</div>
            <div class="company-name">NOCO Creative Digital Studios</div>
        </div>
        
        <h1>FATURA</h1>
        <p style="color: #666;">Fatura No: INV-${invoice.id.substring(0, 8).toUpperCase()}</p>
        
        <div class="info-grid">
            <div class="info-item">
                <div class="label">Müşteri</div>
                <div style="font-weight: 600; font-size: 18px;">${invoice.client}</div>
            </div>
            <div class="info-item">
                <div class="label">Proje</div>
                <div style="font-weight: 600;">${invoice.project}</div>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Açıklama</th>
                    <th style="text-align: right;">Tutar</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${invoice.project}</td>
                    <td style="text-align: right; font-weight: 600;">${formatCurrency(invoice.amount, invoice.currency)}</td>
                </tr>
            </tbody>
            <tfoot>
                <tr>
                    <td style="font-weight: 700;">TOPLAM</td>
                    <td style="text-align: right;" class="amount">${formatCurrency(invoice.amount, invoice.currency)}</td>
                </tr>
            </tfoot>
        </table>
        
        <div class="info-grid">
            <div class="info-item">
                <div class="label">Durum</div>
                <div style="font-weight: 600;">${statusLabels[invoice.status] || invoice.status}</div>
            </div>
            <div class="info-item">
                <div class="label">Vade Tarihi</div>
                <div style="font-weight: 600;">${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('tr-TR') : '-'}</div>
            </div>
            <div class="info-item">
                <div class="label">Oluşturulma</div>
                <div>${invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('tr-TR') : '-'}</div>
            </div>
            ${invoice.paidAt ? `
            <div class="info-item">
                <div class="label">Ödeme Tarihi</div>
                <div style="color: #00C48C; font-weight: 600;">${new Date(invoice.paidAt).toLocaleDateString('tr-TR')}</div>
            </div>
            ` : ''}
        </div>
    `;
}

/**
 * Generate Report HTML content
 */
export function generateReportHTML(report: {
    title: string;
    client: string;
    period: string;
    data: any;
}): string {
    return `
        <div class="header">
            <div class="logo">NOCO Ops</div>
            <div class="company-name">NOCO Creative Digital Studios</div>
        </div>
        
        <h1>${report.title}</h1>
        <p style="color: #666;">Müşteri: ${report.client} | Dönem: ${report.period}</p>
        
        <h2>📊 Rapor Özeti</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="label">Toplam İçerik</div>
                <div style="font-size: 24px; font-weight: 700; color: #329FF5;">${report.data?.totalContent || 0}</div>
            </div>
            <div class="info-item">
                <div class="label">Toplam Etkileşim</div>
                <div style="font-size: 24px; font-weight: 700; color: #00C48C;">${report.data?.totalEngagement || 0}</div>
            </div>
            <div class="info-item">
                <div class="label">Büyüme Oranı</div>
                <div style="font-size: 24px; font-weight: 700; color: #F6D73C;">${report.data?.growthRate || '0%'}</div>
            </div>
            <div class="info-item">
                <div class="label">Erişim</div>
                <div style="font-size: 24px; font-weight: 700;">${report.data?.reach || 0}</div>
            </div>
        </div>
        
        <h2>📝 Notlar</h2>
        <p style="padding: 15px; background: #f9f9f9; border-radius: 8px;">
            ${report.data?.notes || 'Rapor notları burada görüntülenecek.'}
        </p>
    `;
}
