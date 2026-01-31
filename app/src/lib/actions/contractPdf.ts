'use server';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { supabaseAdmin } from '@/lib/supabase';

// ===== CONTRACT PDF GENERATOR =====
// Farklı sözleşme şablonları için PDF oluşturucu

// Interface kept for documentation purposes
interface _ContractData {
    clientName: string;
    clientAddress?: string;
    clientEmail?: string;
    contractName: string;
    startDate: string;
    endDate?: string;
    value: number;
    maxRevisions: number;
    services: string[];
    paymentTerms: string;
}

// ===== GENERATE CONTRACT HTML =====

export async function generateContractHTML(contractId: string): Promise<string> {
    // Get contract with client data
    const { data: contract } = await supabaseAdmin
        .from('Contract')
        .select(`
            *,
            client:Client (
                name,
                email,
                phone,
                company,
                address
            )
        `)
        .eq('id', contractId)
        .single();

    if (!contract) {
        throw new Error('Sözleşme bulunamadı');
    }

    const today = new Date().toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Hizmet Sözleşmesi - ${contract.name}</title>
    <style>
        @page { size: A4; margin: 2cm; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1a1a2e;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #00F5B0;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: 800;
            color: #1a1a2e;
        }
        .logo span { color: #00F5B0; }
        .title {
            font-size: 24px;
            font-weight: 700;
            margin: 20px 0;
        }
        .contract-number {
            color: #666;
            font-size: 14px;
        }
        .parties {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        .party {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
        }
        .party h3 {
            margin: 0 0 10px;
            color: #00F5B0;
            font-size: 14px;
            text-transform: uppercase;
        }
        .party p { margin: 5px 0; font-size: 14px; }
        .section {
            margin-bottom: 25px;
        }
        .section h2 {
            font-size: 16px;
            color: #1a1a2e;
            border-bottom: 2px solid #eee;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        .section p, .section li {
            font-size: 14px;
            margin: 8px 0;
        }
        .highlight-box {
            background: linear-gradient(135deg, #1a1a2e 0%, #2d2d4a 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .highlight-box .amount {
            font-size: 28px;
            font-weight: 700;
            color: #00F5B0;
        }
        .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 50px;
            margin-top: 60px;
            padding-top: 30px;
            border-top: 1px solid #ddd;
        }
        .signature-block {
            text-align: center;
        }
        .signature-line {
            border-bottom: 1px solid #333;
            height: 60px;
            margin-bottom: 10px;
        }
        .signature-name {
            font-weight: 600;
            font-size: 14px;
        }
        .signature-title {
            color: #666;
            font-size: 12px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #999;
            font-size: 11px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">NOCO<span>.</span></div>
        <div class="title">HİZMET SÖZLEŞMESİ</div>
        <div class="contract-number">Sözleşme No: ${contract.id?.substring(0, 8).toUpperCase()}</div>
    </div>

    <div class="parties">
        <div class="party">
            <h3>Hizmet Veren</h3>
            <p><strong>Noco Creative Digital Studios</strong></p>
            <p>Reklam Ticaret Limited Şirketi</p>
            <p>İstanbul, Türkiye</p>
            <p>info@noco.com.tr</p>
        </div>
        <div class="party">
            <h3>Hizmet Alan</h3>
            <p><strong>${(contract as any).client?.company || (contract as any).client?.name || 'Müşteri'}</strong></p>
            <p>${(contract as any).client?.name || ''}</p>
            <p>${(contract as any).client?.address || 'Adres belirtilmemiş'}</p>
            <p>${(contract as any).client?.email || ''}</p>
        </div>
    </div>

    <div class="section">
        <h2>1. SÖZLEŞMENİN KONUSU</h2>
        <p>İşbu sözleşme, <strong>"${contract.name}"</strong> projesi kapsamında verilecek dijital pazarlama ve içerik üretim hizmetlerinin şartlarını düzenler.</p>
    </div>

    <div class="section">
        <h2>2. SÖZLEŞMENİN SÜRESİ</h2>
        <p><strong>Başlangıç Tarihi:</strong> ${new Date(contract.startDate).toLocaleDateString('tr-TR')}</p>
        ${contract.endDate ? `<p><strong>Bitiş Tarihi:</strong> ${new Date(contract.endDate).toLocaleDateString('tr-TR')}</p>` : '<p><strong>Süre:</strong> Belirsiz süreli</p>'}
    </div>

    <div class="highlight-box">
        <p style="margin: 0; opacity: 0.8;">Sözleşme Bedeli</p>
        <div class="amount">${formatCurrency(contract.value || 0)}</div>
        <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.7;">KDV dahil toplam tutar</p>
    </div>

    <div class="section">
        <h2>3. REVİZYON HAKKI</h2>
        <p>İşbu sözleşme kapsamında müşteriye <strong>${contract.maxRevisions || 2}</strong> adet ücretsiz revizyon hakkı tanınmıştır. Bu hakkın aşılması durumunda ek ücret uygulanacaktır.</p>
    </div>

    <div class="section">
        <h2>4. ÖDEME KOŞULLARI</h2>
        <p>Ödeme, fatura tarihinden itibaren <strong>15 iş günü</strong> içinde yapılacaktır. Gecikme durumunda aylık %2 gecikme faizi uygulanır.</p>
    </div>

    <div class="section">
        <h2>5. GİZLİLİK</h2>
        <p>Taraflar, sözleşme kapsamında edindikleri bilgileri gizli tutmayı ve üçüncü şahıslarla paylaşmamayı taahhüt eder.</p>
    </div>

    <div class="section">
        <h2>6. FESİH</h2>
        <p>Taraflardan herhangi biri, 30 gün önceden yazılı bildirimde bulunarak sözleşmeyi feshedebilir. Fesih tarihine kadar yapılan işlerin bedeli ödenir.</p>
    </div>

    <div class="signatures">
        <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-name">Noco Creative Digital Studios</div>
            <div class="signature-title">Yetkili İmza</div>
        </div>
        <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-name">${(contract as any).client?.name || 'Müşteri'}</div>
            <div class="signature-title">Yetkili İmza</div>
        </div>
    </div>

    <div class="footer">
        <p>Bu sözleşme ${today} tarihinde iki nüsha olarak düzenlenmiştir.</p>
        <p>Noco Creative Digital Studios © 2026</p>
    </div>
</body>
</html>
    `;
}

// ===== GENERATE WAIVER HTML (Muvafakatname) =====

export async function generateWaiverHTML(data: {
    participantName: string;
    projectName: string;
    shootDate: string;
    usageRights: string[];
}): Promise<string> {
    const today = new Date().toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Muvafakatname - ${data.projectName}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.8;
            max-width: 700px;
            margin: 0 auto;
            padding: 40px;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .logo {
            font-size: 24px;
            font-weight: 800;
        }
        .logo span { color: #00F5B0; }
        h1 {
            font-size: 22px;
            margin: 30px 0;
            text-align: center;
        }
        .content { font-size: 14px; }
        .info-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .signature-area {
            margin-top: 60px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
        }
        .signature-block {
            text-align: center;
        }
        .signature-line {
            border-bottom: 1px solid #333;
            height: 50px;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">NOCO<span>.</span></div>
    </div>

    <h1>GÖRSEL KULLANIM MUVAFAKATNAMESİ</h1>

    <div class="content">
        <p>Ben, <strong>${data.participantName}</strong>, ${new Date(data.shootDate).toLocaleDateString('tr-TR')} tarihinde <strong>"${data.projectName}"</strong> projesi kapsamında gerçekleştirilen çekimlere katıldığımı ve bu çekimler sırasında elde edilen görsel/işitsel materyallerin aşağıda belirtilen alanlarda kullanılmasına izin verdiğimi beyan ederim:</p>

        <div class="info-box">
            <strong>Kullanım Alanları:</strong>
            <ul>
                ${data.usageRights.map(r => `<li>${r}</li>`).join('')}
            </ul>
        </div>

        <p>Bu materyallerin kullanımından dolayı herhangi bir telif veya kullanım hakkı talep etmeyeceğimi kabul ve taahhüt ederim.</p>

        <p><strong>Tarih:</strong> ${today}</p>
    </div>

    <div class="signature-area">
        <div class="signature-block">
            <div class="signature-line"></div>
            <p><strong>${data.participantName}</strong></p>
            <p style="font-size: 12px; color: #666;">İmza</p>
        </div>
        <div class="signature-block">
            <div class="signature-line"></div>
            <p><strong>Noco Creative</strong></p>
            <p style="font-size: 12px; color: #666;">Şahit</p>
        </div>
    </div>
</body>
</html>
    `;
}

// ===== EXPORT CONTRACT TO PDF =====

export async function exportContractToPDF(contractId: string): Promise<{
    success: boolean;
    html?: string;
    error?: string;
}> {
    try {
        const html = await generateContractHTML(contractId);
        return { success: true, html };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
