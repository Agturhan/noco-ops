'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// NOCO Rapor Renk Paleti
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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 364 121.55" style={{ height: 80 }}>
        <g>
            <path fill="#F6D73C" d="M82.98,99.24l-41.49-39.81L0,99.24V17.97h41.49c22.92,0,41.49,18.58,41.49,41.5v39.77Z" />
            <path fill="#00F5B0" d="M229.27,59.47l33.96,29.34c-16.1,16.09-47.22,16.09-63.32,0-16.1-16.25-16.1-42.43,0-58.68,16.1-16.09,47.22-16.09,63.32,0l-33.96,29.34s0,0,0,0Z" />
            <path fill="#329FF5" d="M135.41,17.99c-22.93,0-41.51,18.57-41.51,41.49s18.59,41.49,41.51,41.49,41.51-18.57,41.51-41.49-18.59-41.49-41.51-41.49M135.95,64.61c-3.42.43-6.3-2.44-5.86-5.86.29-2.33,2.17-4.21,4.5-4.5,3.42-.43,6.29,2.44,5.86,5.86-.29,2.33-2.17,4.2-4.5,4.5" />
            <path fill="#FF4242" d="M311.71,17.99c-22.93,0-41.51,18.57-41.51,41.49s18.59,41.49,41.51,41.49,41.51-18.57,41.51-41.49-18.59-41.49-41.51-41.49M311.59,64.65c-2.89,0-5.23-2.34-5.23-5.22s2.34-5.22,5.23-5.22,5.23,2.34,5.23,5.22-2.34,5.22-5.23,5.22" />
        </g>
    </svg>
);

export function ReportsPageClient() {
    const [isDark, setIsDark] = useState(false);
    const [hasSavedData, setHasSavedData] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') setIsDark(true);
        const data = localStorage.getItem('report_data');
        if (data) setHasSavedData(true);
    }, []);

    const toggleTheme = () => {
        setIsDark(!isDark);
        localStorage.setItem('theme', !isDark ? 'dark' : 'light');
    };

    const c = isDark ? { ...colors, ...darkColors } : colors;

    return (
        <div style={{
            minHeight: '100vh',
            background: c.bgPrimary,
            color: c.textPrimary,
            fontFamily: "'Inter', sans-serif",
            padding: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.3s ease'
        }}>
            {/* Tema Toggle */}
            <button
                onClick={toggleTheme}
                style={{
                    position: 'fixed',
                    top: 20,
                    right: 20,
                    padding: '10px 20px',
                    background: c.bgCard,
                    border: `1px solid ${c.border}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 500,
                    color: c.textPrimary,
                    transition: 'all 0.2s',
                    zIndex: 100
                }}
            >
                🌓 Tema
            </button>

            <div style={{ maxWidth: 1000, width: '100%' }}>
                {/* Hero */}
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <div style={{ marginBottom: 32 }}>
                        <NocoLogo />
                    </div>
                    <h1 style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 48,
                        fontWeight: 700,
                        marginBottom: 16,
                        color: c.textPrimary
                    }}>
                        Rapor Sistemi
                    </h1>
                    <p style={{
                        fontSize: 18,
                        color: c.textSecondary,
                        marginBottom: 12,
                        lineHeight: 1.6
                    }}>
                        Server gerektirmeyen, tamamen tarayıcı tabanlı<br />
                        sosyal medya rapor oluşturma platformu
                    </p>
                    <span style={{
                        display: 'inline-block',
                        padding: '6px 16px',
                        background: colors.accentGreen,
                        color: '#0E1113',
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 600,
                        marginTop: 12
                    }}>
                        ✨ v2.0 - SaaS Edition
                    </span>
                    {hasSavedData && (
                        <div style={{
                            marginTop: 16,
                            padding: '8px 16px',
                            background: colors.accentBlue + '20',
                            borderRadius: 8,
                            fontSize: 13,
                            color: colors.accentBlue
                        }}>
                            ✅ Kaydedilmiş rapor verisi bulundu
                        </div>
                    )}
                </div>

                {/* Kartlar */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 24,
                    marginBottom: 48
                }}>
                    {/* Veri Gir */}
                    <div style={{
                        background: c.bgCard,
                        borderRadius: 20,
                        padding: 32,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.3s',
                        border: '2px solid transparent'
                    }}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            background: colors.accentBlue,
                            color: 'white',
                            borderRadius: '50%',
                            fontWeight: 700,
                            fontSize: 16,
                            marginBottom: 16
                        }}>1</span>
                        <h2 style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: 22,
                            fontWeight: 600,
                            marginBottom: 12,
                            color: c.textPrimary
                        }}>Veri Gir</h2>
                        <p style={{
                            fontSize: 14,
                            color: c.textSecondary,
                            marginBottom: 24,
                            lineHeight: 1.6
                        }}>
                            Form üzerinden tüm rapor bilgilerinizi kolayca girin. Otomatik JSON formatına dönüştürülür.
                        </p>
                        <Link href="/dashboard/reports/editor" style={{
                            display: 'block',
                            width: '100%',
                            padding: '14px 24px',
                            background: colors.accentBlue,
                            color: 'white',
                            border: 'none',
                            borderRadius: 12,
                            fontSize: 15,
                            fontWeight: 600,
                            textDecoration: 'none',
                            textAlign: 'center'
                        }}>
                            ✏️ Editöre Git
                        </Link>
                    </div>

                    {/* Rapor Oluştur */}
                    <div style={{
                        background: c.bgCard,
                        borderRadius: 20,
                        padding: 32,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        border: '2px solid transparent'
                    }}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            background: colors.accentBlue,
                            color: 'white',
                            borderRadius: '50%',
                            fontWeight: 700,
                            fontSize: 16,
                            marginBottom: 16
                        }}>2</span>
                        <h2 style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: 22,
                            fontWeight: 600,
                            marginBottom: 12,
                            color: c.textPrimary
                        }}>Rapor Oluştur</h2>
                        <p style={{
                            fontSize: 14,
                            color: c.textSecondary,
                            marginBottom: 24,
                            lineHeight: 1.6
                        }}>
                            JSON verilerinizi yapıştırın ve anında profesyonel rapor oluşturun. Veriler tarayıcınızda saklanır.
                        </p>
                        <Link href="/dashboard/reports/viewer" style={{
                            display: 'block',
                            width: '100%',
                            padding: '14px 24px',
                            background: colors.accentBlue,
                            color: 'white',
                            border: 'none',
                            borderRadius: 12,
                            fontSize: 15,
                            fontWeight: 600,
                            textDecoration: 'none',
                            textAlign: 'center'
                        }}>
                            👁️ Rapor Görüntüle
                        </Link>
                    </div>

                    {/* Export Et */}
                    <div style={{
                        background: c.bgCard,
                        borderRadius: 20,
                        padding: 32,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        border: '2px solid transparent'
                    }}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            background: colors.accentBlue,
                            color: 'white',
                            borderRadius: '50%',
                            fontWeight: 700,
                            fontSize: 16,
                            marginBottom: 16
                        }}>3</span>
                        <h2 style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: 22,
                            fontWeight: 600,
                            marginBottom: 12,
                            color: c.textPrimary
                        }}>Export Et</h2>
                        <p style={{
                            fontSize: 14,
                            color: c.textSecondary,
                            marginBottom: 24,
                            lineHeight: 1.6
                        }}>
                            Oluşturduğunuz raporları PDF olarak indirin veya direkt yazdırın. Müşterilerinizle paylaşın.
                        </p>
                        <button
                            onClick={() => window.print()}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '14px 24px',
                                background: colors.accentBlue,
                                color: 'white',
                                border: 'none',
                                borderRadius: 12,
                                fontSize: 15,
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            📊 Son Rapor
                        </button>
                    </div>
                </div>

                {/* Özellikler */}
                <div style={{
                    background: c.bgCard,
                    borderRadius: 20,
                    padding: 40,
                    marginBottom: 32
                }}>
                    <h3 style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 24,
                        fontWeight: 600,
                        marginBottom: 24,
                        color: c.textPrimary,
                        textAlign: 'center'
                    }}>⚡ Özellikler</h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: 20
                    }}>
                        {[
                            { icon: '🚀', title: 'Server-sız', desc: 'Localhost gerekmez' },
                            { icon: '💾', title: 'Kalıcı Veri', desc: 'localStorage ile kayıt' },
                            { icon: '🎨', title: 'Dark/Light', desc: 'Tema desteği' },
                            { icon: '📱', title: 'Responsive', desc: 'Mobil uyumlu' },
                            { icon: '📄', title: 'PDF Export', desc: 'Yazdırma desteği' },
                            { icon: '📊', title: 'CSV Export', desc: 'Excel uyumlu' },
                            { icon: '📈', title: 'Grafikler', desc: 'Görsel raporlar' },
                        ].map((feature, i) => (
                            <div key={i} style={{ textAlign: 'center', padding: 16 }}>
                                <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>{feature.icon}</span>
                                <div style={{ fontSize: 14, color: c.textSecondary, lineHeight: 1.5 }}>
                                    <strong style={{ color: c.textPrimary }}>{feature.title}</strong><br />
                                    {feature.desc}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <footer style={{
                    textAlign: 'center',
                    paddingTop: 32,
                    borderTop: `1px solid ${c.border}`,
                    color: c.textSecondary,
                    fontSize: 13
                }}>
                    <div><strong>NOCO CREATIVE DIGITAL STUDIOS</strong></div>
                    <div style={{ marginTop: 8 }}>Reklam Ticaret Limited Şirketi</div>
                    <div style={{ opacity: 0.5, marginTop: 12 }}>© 2026 - Rapor Sistemi v2.0</div>
                </footer>
            </div>
        </div>
    );
}
