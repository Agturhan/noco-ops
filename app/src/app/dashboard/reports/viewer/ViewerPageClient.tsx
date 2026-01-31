'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// NOCO Renk Paleti
const colors = {
    bgPrimary: '#E9E2D0',
    bgCard: '#F2EBD8',
    textPrimary: '#3D4D52',
    textSecondary: '#6B7B80',
    accentBlue: '#329FF5',
    accentGreen: '#00F5B0',
    accentYellow: '#F6D73C',
    accentRed: '#FF4242',
    border: 'rgba(61, 77, 82, 0.1)',
};

const darkColors = {
    bgPrimary: '#0E1113',
    bgCard: '#1A1F23',
    textPrimary: '#E9E2D0',
    textSecondary: '#A8A29E',
    border: 'rgba(233, 226, 208, 0.1)',
};

const NocoLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 364 121.55" style={{ height: 48 }}>
        <g>
            <path fill="#F6D73C" d="M82.98,99.24l-41.49-39.81L0,99.24V17.97h41.49c22.92,0,41.49,18.58,41.49,41.5v39.77Z" />
            <path fill="#00F5B0" d="M229.27,59.47l33.96,29.34c-16.1,16.09-47.22,16.09-63.32,0-16.1-16.25-16.1-42.43,0-58.68,16.1-16.09,47.22-16.09,63.32,0l-33.96,29.34s0,0,0,0Z" />
            <path fill="#329FF5" d="M135.41,17.99c-22.93,0-41.51,18.57-41.51,41.49s18.59,41.49,41.51,41.49,41.51-18.57,41.51-41.49-18.59-41.49-41.51-41.49M135.95,64.61c-3.42.43-6.3-2.44-5.86-5.86.29-2.33,2.17-4.21,4.5-4.5,3.42-.43,6.29,2.44,5.86,5.86-.29,2.33-2.17,4.2-4.5,4.5" />
            <path fill="#FF4242" d="M311.71,17.99c-22.93,0-41.51,18.57-41.51,41.49s18.59,41.49,41.51,41.49,41.51-18.57,41.51-41.49-18.59-41.49-41.51-41.49M311.59,64.65c-2.89,0-5.23-2.34-5.23-5.22s2.34-5.22,5.23-5.22,5.23,2.34,5.23,5.22-2.34,5.22-5.23,5.22" />
        </g>
    </svg>
);

export function ViewerPageClient() {
    const [isDark, setIsDark] = useState(false);
    const [jsonInput, setJsonInput] = useState('');
    const [showSavedInfo, setShowSavedInfo] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') setIsDark(true);

        const savedData = localStorage.getItem('report_data');
        if (savedData) {
            setJsonInput(savedData);
            setShowSavedInfo(true);
        }
    }, []);

    const toggleTheme = () => {
        setIsDark(!isDark);
        localStorage.setItem('theme', !isDark ? 'dark' : 'light');
    };

    const c = isDark ? { ...colors, ...darkColors } : colors;

    const showReport = () => {
        if (!jsonInput.trim()) {
            alert('⚠️ Lütfen JSON kodunu yapıştırın!');
            return;
        }

        try {
            const data = JSON.parse(jsonInput);
            localStorage.setItem('report_data', jsonInput);
            setShowSavedInfo(true);
            setTimeout(() => setShowSavedInfo(false), 3000);

            // Yeni sekmede rapor göster - basit bir rapor önizlemesi
            const reportWindow = window.open('', '_blank');
            if (reportWindow) {
                reportWindow.document.write(generateReportHTML(data, isDark));
                reportWindow.document.close();
            }
        } catch (error) {
            alert('❌ Geçersiz JSON formatı!\n\n' + (error as Error).message);
        }
    };

    const generateReportHTML = (data: any, dark: boolean) => {
        const bg = dark ? '#0E1113' : '#E9E2D0';
        const cardBg = dark ? '#1A1F23' : '#F2EBD8';
        const text = dark ? '#E9E2D0' : '#3D4D52';
        const textSec = dark ? '#A8A29E' : '#6B7B80';

        return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.brand?.name || 'Rapor'} - ${data.brand?.period || ''}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: ${bg}; color: ${text}; font-family: 'Inter', sans-serif; padding: 40px; }
        .container { max-width: 1000px; margin: 0 auto; }
        h1 { font-family: 'Space Grotesk', sans-serif; font-size: 36px; text-align: center; margin-bottom: 8px; }
        .subtitle { text-align: center; color: ${textSec}; margin-bottom: 40px; }
        .card { background: ${cardBg}; border-radius: 16px; padding: 24px; margin-bottom: 20px; }
        .card-title { font-family: 'Space Grotesk', sans-serif; font-size: 18px; margin-bottom: 16px; }
        .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .metric { text-align: center; padding: 20px; background: ${bg}; border-radius: 12px; }
        .metric-value { font-size: 28px; font-weight: 700; color: #329FF5; }
        .metric-change { font-size: 13px; color: #00F5B0; }
        .metric-label { font-size: 12px; color: ${textSec}; margin-top: 4px; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid rgba(0,0,0,0.1); }
        .table th { font-weight: 600; color: ${textSec}; font-size: 12px; text-transform: uppercase; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(0,0,0,0.1); color: ${textSec}; font-size: 13px; }
        @media print { body { padding: 20px; } .card { break-inside: avoid; } }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 ${data.brand?.name || 'Sosyal Medya Raporu'}</h1>
        <p class="subtitle">${data.brand?.period || ''} Dönemi Performans Raporu</p>

        <!-- Özet Metrikler -->
        <div class="card">
            <h2 class="card-title">📈 Özet Metrikler</h2>
            <div class="metrics">
                <div class="metric">
                    <div class="metric-value">${(data.summary?.followers || 0).toLocaleString('tr-TR')}</div>
                    <div class="metric-change">+${data.summary?.followers_change || 0}%</div>
                    <div class="metric-label">Takipçi</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${(data.summary?.reach || 0).toLocaleString('tr-TR')}</div>
                    <div class="metric-change">+${data.summary?.reach_change || 0}%</div>
                    <div class="metric-label">Erişilen Hesap</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${(data.summary?.impressions || 0).toLocaleString('tr-TR')}</div>
                    <div class="metric-change">+${data.summary?.impressions_change || 0}%</div>
                    <div class="metric-label">Görüntülemeler</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${data.summary?.eng_rate || 0}%</div>
                    <div class="metric-change">+${data.summary?.engagement_change || 0}%</div>
                    <div class="metric-label">Etkileşim Oranı</div>
                </div>
            </div>
        </div>

        <!-- En İyi İçerikler -->
        ${data.top_contents?.length ? `
        <div class="card">
            <h2 class="card-title">🏆 En İyi İçerikler</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Başlık</th>
                        <th>Tür</th>
                        <th>Erişim</th>
                        <th>Etkileşim</th>
                        <th>Oran</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.top_contents.map((c: any) => `
                    <tr>
                        <td>${c.title}</td>
                        <td>${c.type}</td>
                        <td>${(c.reach || 0).toLocaleString('tr-TR')}</td>
                        <td>${(c.eng || 0).toLocaleString('tr-TR')}</td>
                        <td style="color: #00F5B0">${c.rate || 0}%</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <!-- Stratejiler -->
        ${data.strategies?.length ? `
        <div class="card">
            <h2 class="card-title">💡 Stratejiler</h2>
            <ul style="padding-left: 20px;">
                ${data.strategies.map((s: string) => `<li style="margin-bottom: 8px;">${s}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        <!-- Öneriler -->
        ${data.recommendations?.length ? `
        <div class="card">
            <h2 class="card-title">🎯 Öneriler</h2>
            <ul style="padding-left: 20px;">
                ${data.recommendations.map((r: string) => `<li style="margin-bottom: 8px;">${r}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        <!-- Hizmet Bedeli -->
        ${data.service_fee?.amount ? `
        <div class="card" style="text-align: center;">
            <h2 class="card-title">💰 Hizmet Bedeli</h2>
            <div style="font-size: 32px; font-weight: 700; color: #329FF5;">
                ${data.service_fee.amount.toLocaleString('tr-TR')} ${data.service_fee.currency || 'TRY'}
            </div>
        </div>
        ` : ''}

        <footer class="footer">
            <div><strong>NOCO CREATIVE DIGITAL STUDIOS</strong></div>
            <div style="margin-top: 4px;">Reklam Ticaret Limited Şirketi</div>
        </footer>
    </div>
</body>
</html>`;
    };

    const exportCSV = () => {
        if (!jsonInput.trim()) {
            alert('⚠️ Lütfen önce JSON kodunu yapıştırın!');
            return;
        }

        try {
            const data = JSON.parse(jsonInput);
            let csvContent = '=== SOSYAL MEDYA RAPORU ===\n';
            csvContent += `Marka,${data.brand?.name || ''}\n`;
            csvContent += `Dönem,${data.brand?.period || ''}\n\n`;

            csvContent += '=== ÖZET METRİKLER ===\n';
            csvContent += 'Metrik,Değer,Değişim (%)\n';
            csvContent += `Takipçi,${data.summary?.followers || 0},${data.summary?.followers_change || 0}%\n`;
            csvContent += `Erişilen Hesap,${data.summary?.reach || 0},${data.summary?.reach_change || 0}%\n`;
            csvContent += `Görüntülemeler,${data.summary?.impressions || 0},${data.summary?.impressions_change || 0}%\n`;
            csvContent += `Etkileşim Oranı,${data.summary?.eng_rate || 0}%,${data.summary?.engagement_change || 0}%\n`;

            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${data.brand?.name || 'Rapor'}-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            alert('✅ CSV dosyası indirildi!');
        } catch (error) {
            alert('❌ Geçersiz JSON formatı!');
        }
    };

    const pasteJSON = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setJsonInput(text);
            alert('✅ Panodaki veri yapıştırıldı!');
        } catch {
            alert('❌ Pano erişimi reddedildi. Lütfen manuel olarak yapıştırın.');
        }
    };

    const clearData = () => {
        if (confirm('Tüm veriler silinecek. Emin misiniz?')) {
            setJsonInput('');
            localStorage.removeItem('report_data');
            alert('✅ Veriler temizlendi');
        }
    };

    const btnStyle = {
        flex: 1,
        minWidth: 150,
        padding: '16px 32px',
        border: 'none',
        borderRadius: 12,
        fontSize: 15,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        textDecoration: 'none',
        textAlign: 'center' as const,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
    };

    return (
        <div style={{
            background: c.bgPrimary,
            color: c.textPrimary,
            fontFamily: "'Inter', sans-serif",
            padding: 24,
            minHeight: '100vh',
            transition: 'background 0.3s ease'
        }}>
            {/* Tema Toggle */}
            <button
                onClick={toggleTheme}
                style={{
                    position: 'fixed',
                    top: 20,
                    right: 20,
                    padding: '8px 16px',
                    background: c.bgCard,
                    color: c.textPrimary,
                    border: `1px solid ${c.border}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    zIndex: 100
                }}
            >
                🌓 Tema
            </button>

            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <NocoLogo />
                </div>

                <h1 style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 36,
                    fontWeight: 700,
                    marginBottom: 12,
                    textAlign: 'center'
                }}>
                    📊 Rapor Görüntüleyici
                </h1>
                <p style={{
                    textAlign: 'center',
                    fontSize: 16,
                    color: c.textSecondary,
                    marginBottom: 48,
                    lineHeight: 1.6
                }}>
                    JSON verilerinizi yapıştırın ve raporunuzu anında görüntüleyin.<br />
                    Sunucu gerektirmez, tamamen tarayıcınızda çalışır.
                </p>

                {/* Ana Kart */}
                <div style={{
                    background: c.bgCard,
                    borderRadius: 16,
                    padding: 40,
                    marginBottom: 32
                }}>
                    <h2 style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 20,
                        fontWeight: 600,
                        marginBottom: 24,
                        color: c.textPrimary
                    }}>Nasıl Kullanılır?</h2>

                    {/* Adımlar */}
                    <div style={{
                        background: c.bgPrimary,
                        borderRadius: 12,
                        padding: 24,
                        marginBottom: 32
                    }}>
                        {[
                            { num: 1, title: 'Editöre gidin', desc: 'Form üzerinden tüm rapor bilgilerinizi girin' },
                            { num: 2, title: '"JSON Oluştur" butonuna tıklayın', desc: 'Formunuz otomatik olarak JSON formatına dönüştürülür' },
                            { num: 3, title: 'Oluşan JSON kodunu kopyalayın', desc: 'Tüm JSON kodunu seçip kopyalayın (Ctrl/Cmd + C)' },
                            { num: 4, title: 'Aşağıdaki alana yapıştırın', desc: 'JSON kodunu text alanına yapıştırın ve "Raporu Göster" butonuna tıklayın' },
                        ].map((step, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 16,
                                marginBottom: i < 3 ? 20 : 0,
                                paddingBottom: i < 3 ? 20 : 0,
                                borderBottom: i < 3 ? `1px solid ${c.border}` : 'none'
                            }}>
                                <span style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 40,
                                    height: 40,
                                    background: colors.accentBlue,
                                    color: 'white',
                                    borderRadius: '50%',
                                    fontWeight: 700,
                                    fontSize: 18,
                                    flexShrink: 0
                                }}>{step.num}</span>
                                <div style={{ paddingTop: 4 }}>
                                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{step.title}</div>
                                    <div style={{ fontSize: 14, color: c.textSecondary }}>{step.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* İpucu */}
                    <div style={{
                        background: colors.accentYellow,
                        color: '#0E1113',
                        padding: '16px 20px',
                        borderRadius: 12,
                        marginBottom: 24,
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12
                    }}>
                        <span style={{ fontSize: 20 }}>💡</span>
                        <div>
                            <strong>İpucu:</strong> JSON kodunuz tarayıcınıza kaydedilir. Bir sonraki sefere bu sayfayı açtığınızda verileriniz burada hazır olacak.
                        </div>
                    </div>

                    {/* Textarea */}
                    <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder={`JSON kodunuzu buraya yapıştırın...

Örnek:
{
  "brand": {
    "name": "Müşteri Adı",
    "period": "Ocak 2026"
  },
  "summary": {
    "followers": 18834,
    "reach": 96450,
    ...
  }
}`}
                        style={{
                            width: '100%',
                            minHeight: 320,
                            padding: 20,
                            background: c.bgPrimary,
                            border: `2px dashed ${c.border}`,
                            borderRadius: 12,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 13,
                            resize: 'vertical',
                            marginBottom: 24,
                            color: c.textPrimary,
                            lineHeight: 1.6
                        }}
                    />

                    {/* Butonlar */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <button onClick={showReport} style={{ ...btnStyle, background: colors.accentGreen, color: '#0E1113' }}>
                            👁️ Raporu Göster
                        </button>
                        <button onClick={exportCSV} style={{ ...btnStyle, background: c.bgPrimary, color: c.textPrimary, border: `2px solid ${c.border}` }}>
                            📊 CSV İndir
                        </button>
                        <button onClick={pasteJSON} style={{ ...btnStyle, background: c.bgPrimary, color: c.textPrimary, border: `2px solid ${c.border}` }}>
                            📋 Yapıştır
                        </button>
                        <button onClick={clearData} style={{ ...btnStyle, background: c.bgPrimary, color: c.textPrimary, border: `2px solid ${c.border}` }}>
                            🗑️ Temizle
                        </button>
                        <Link href="/dashboard/reports/editor" style={{ ...btnStyle, background: colors.accentBlue, color: 'white' }}>
                            ✏️ Editöre Git
                        </Link>
                    </div>

                    {showSavedInfo && (
                        <div style={{
                            background: c.bgPrimary,
                            padding: '16px 20px',
                            borderRadius: 12,
                            marginTop: 20,
                            fontSize: 13,
                            color: c.textSecondary,
                            textAlign: 'center',
                            border: `1px solid ${c.border}`
                        }}>
                            <strong style={{ color: c.textPrimary }}>✅ Kaydedildi:</strong> Verileriniz tarayıcınızda saklanıyor
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer style={{
                    textAlign: 'center',
                    marginTop: 48,
                    paddingTop: 24,
                    borderTop: `1px solid ${c.border}`,
                    color: c.textSecondary,
                    fontSize: 13
                }}>
                    <div>NOCO CREATIVE DIGITAL STUDIOS</div>
                    <div style={{ opacity: 0.5, marginTop: 4 }}>Rapor Sistemi v2.0 - SaaS Edition</div>
                </footer>
            </div>
        </div>
    );
}
