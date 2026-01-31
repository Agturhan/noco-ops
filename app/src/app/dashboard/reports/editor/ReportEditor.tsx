'use client';

import React, { useState } from 'react';
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

interface TopContent {
    id: number;
    title: string;
    type: string;
    reach: number;
    eng: number;
}

interface Campaign {
    id: number;
    name: string;
    objective: string;
    spend: number;
    metric1: number;
    metric2: number;
}

interface GrowthItem {
    id: number;
    period: string;
    value: number;
}

// Form Section Component
const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{
        background: colors.bgCard,
        borderRadius: 16,
        padding: 32,
        marginBottom: 24
    }}>
        <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 20,
            marginBottom: 24,
            color: colors.textPrimary
        }}>{title}</h2>
        {children}
    </div>
);

// Form Input Component
const FormInput = ({ label, type = 'text', value, onChange, placeholder }: {
    label: string;
    type?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) => (
    <div style={{ marginBottom: 16 }}>
        <label style={{
            display: 'block',
            fontWeight: 500,
            marginBottom: 8,
            fontSize: 13,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5
        }}>{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
                width: '100%',
                padding: '12px 16px',
                background: colors.bgPrimary,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                fontSize: 14,
                color: colors.textPrimary
            }}
        />
    </div>
);

export default function ReportEditor() {
    const router = useRouter();
    const [showSuccess, setShowSuccess] = useState(false);
    const [jsonOutput, setJsonOutput] = useState('');

    // Form State
    const [brandName, setBrandName] = useState('');
    const [brandPeriod, setBrandPeriod] = useState('');
    const [followers, setFollowers] = useState('');
    const [followersChange, setFollowersChange] = useState('');
    const [reach, setReach] = useState('');
    const [reachChange, setReachChange] = useState('');
    const [impressions, setImpressions] = useState('');
    const [impressionsChange, setImpressionsChange] = useState('');
    const [impressionsAdsPercent, setImpressionsAdsPercent] = useState('');
    const [engRate, setEngRate] = useState('');
    const [engChange, setEngChange] = useState('');
    const [profileVisits, setProfileVisits] = useState('');
    const [externalLinkTaps, setExternalLinkTaps] = useState('');
    const [addressTaps, setAddressTaps] = useState('');
    const [mixReels, setMixReels] = useState('');
    const [mixHikaye, setMixHikaye] = useState('');
    const [mixDesign, setMixDesign] = useState('');
    const [insights, setInsights] = useState('');
    const [nextActions, setNextActions] = useState('');
    const [serviceFee, setServiceFee] = useState('');

    // Dynamic Lists
    const [growthReach, setGrowthReach] = useState<GrowthItem[]>([]);
    const [growthImpressions, setGrowthImpressions] = useState<GrowthItem[]>([]);
    const [topContents, setTopContents] = useState<TopContent[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [reels, setReels] = useState<{ id: number; value: string }[]>([]);
    const [designs, setDesigns] = useState<{ id: number; value: string }[]>([]);

    const [nextId, setNextId] = useState(1);
    const getId = () => { const id = nextId; setNextId(nextId + 1); return id; };



    // Generate JSON
    const generateJSON = () => {
        const data = {
            brand: {
                name: brandName || 'Örnek Müşteri',
                period: brandPeriod || 'Ocak 2026'
            },
            summary: {
                followers: parseInt(followers) || 0,
                followers_change: parseFloat(followersChange) || 0,
                reach: parseInt(reach) || 0,
                reach_change: parseFloat(reachChange) || 0,
                impressions: parseInt(impressions) || 0,
                impressions_change: parseFloat(impressionsChange) || 0,
                impressions_ads_percent: parseFloat(impressionsAdsPercent) || 0,
                eng_rate: parseFloat(engRate) || 0,
                engagement_change: parseFloat(engChange) || 0
            },
            profile_actions: {
                profile_visits: parseInt(profileVisits) || 0,
                external_link_taps: parseInt(externalLinkTaps) || 0,
                address_taps: parseInt(addressTaps) || 0
            },
            content_mix: [
                { name: 'Reels', percent: parseInt(mixReels) || 0 },
                { name: 'Hikaye', percent: parseInt(mixHikaye) || 0 },
                { name: 'Tasarım', percent: parseInt(mixDesign) || 0 }
            ],
            growth_trend: {
                reach: growthReach.map(g => ({ period: g.period, value: g.value })),
                impressions: growthImpressions.map(g => ({ period: g.period, value: g.value }))
            },
            top_contents: topContents.map(c => ({
                title: c.title,
                type: c.type,
                reach: c.reach,
                eng: c.eng,
                rate: c.reach > 0 ? parseFloat(((c.eng / c.reach) * 100).toFixed(1)) : 0
            })),
            campaigns: campaigns.map(c => ({
                name: c.name,
                objective: c.objective,
                spend: c.spend,
                metric1: { label: 'Birincil', value: c.metric1 },
                metric2: { label: 'İkincil', value: c.metric2 }
            })),
            strategies: insights.split('\n').filter(l => l.trim()),
            recommendations: nextActions.split('\n').filter(l => l.trim()),
            deliverables: {
                reels: reels.map(r => r.value).filter(v => v),
                designs: designs.map(d => d.value).filter(v => v)
            },
            service_fee: {
                amount: parseInt(serviceFee) || 0,
                currency: 'TRY'
            },
            bank_info: {
                account_name: 'NOCO CREATIVE DIGITAL STUDIOS',
                bank_name: 'Garanti BBVA',
                iban: 'TR12 0006 2000 4720 0006 2968 14'
            }
        };

        const json = JSON.stringify(data, null, 2);
        setJsonOutput(json);
        localStorage.setItem('report_data', json);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const copyToClipboard = () => {
        if (jsonOutput) {
            navigator.clipboard.writeText(jsonOutput);
            alert('✅ JSON kopyalandı!');
        }
    };

    const downloadJSON = () => {
        if (!jsonOutput) return;
        const blob = new Blob([jsonOutput], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${brandName || 'rapor'}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const previewReport = () => {
        generateJSON();
        router.push('/dashboard/reports/viewer');
    };

    const btnStyle = {
        padding: '10px 20px',
        background: colors.accentBlue,
        color: 'white',
        border: 'none',
        borderRadius: 8,
        fontWeight: 500,
        cursor: 'pointer',
        fontSize: 14,
        transition: 'all 0.2s'
    };

    return (
        <div style={{
            background: colors.bgPrimary,
            color: colors.textPrimary,
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            lineHeight: 1.6,
            padding: '32px 24px',
            minHeight: '100vh'
        }}>
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                {/* Header */}
                <header style={{ textAlign: 'center', marginBottom: 48 }}>
                    <h1 style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 36,
                        fontWeight: 700,
                        marginBottom: 8
                    }}>📊 Noco Rapor - Veri Editörü</h1>
                    <p style={{ color: colors.textSecondary, fontSize: 16 }}>
                        Yeni metrikler ve reklam sistemi ile tam kontrol
                    </p>
                    <Link href="/dashboard/reports" style={{
                        display: 'inline-block',
                        marginTop: 16,
                        padding: '8px 16px',
                        background: colors.bgCard,
                        borderRadius: 8,
                        color: colors.textPrimary,
                        textDecoration: 'none',
                        fontSize: 14
                    }}>
                        ← Ana Sayfaya Dön
                    </Link>
                </header>

                {showSuccess && (
                    <div style={{
                        background: colors.accentGreen,
                        color: colors.textPrimary,
                        padding: 16,
                        borderRadius: 8,
                        textAlign: 'center',
                        marginBottom: 24,
                        fontWeight: 500
                    }}>
                        ✓ JSON başarıyla oluşturuldu!
                    </div>
                )}

                {/* Marka Bilgileri */}
                <FormSection title="🏢 Marka Bilgileri">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                        <FormInput label="Marka Adı" value={brandName} onChange={setBrandName} placeholder="Örnek Müşteri" />
                        <FormInput label="Rapor Dönemi" value={brandPeriod} onChange={setBrandPeriod} placeholder="Ocak 2026" />
                    </div>
                </FormSection>

                {/* Özet Metrikler */}
                <FormSection title="📈 Özet Metrikler (KPI)">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                        <FormInput label="Takipçi" type="number" value={followers} onChange={setFollowers} placeholder="950" />
                        <FormInput label="Değişim (%)" type="number" value={followersChange} onChange={setFollowersChange} placeholder="5.2" />
                        <FormInput label="Erişilen Hesap" type="number" value={reach} onChange={setReach} placeholder="125000" />
                        <FormInput label="Değişim (%)" type="number" value={reachChange} onChange={setReachChange} placeholder="9" />
                        <FormInput label="Görüntülemeler" type="number" value={impressions} onChange={setImpressions} placeholder="450000" />
                        <FormInput label="Değişim (%)" type="number" value={impressionsChange} onChange={setImpressionsChange} placeholder="5.0" />
                        <FormInput label="% Reklamdan" type="number" value={impressionsAdsPercent} onChange={setImpressionsAdsPercent} placeholder="15.5" />
                        <FormInput label="Etkileşim Oranı (%)" type="number" value={engRate} onChange={setEngRate} placeholder="8.2" />
                        <FormInput label="Değişim (%)" type="number" value={engChange} onChange={setEngChange} placeholder="0.9" />
                    </div>
                </FormSection>

                {/* Profil Hareketleri */}
                <FormSection title="👤 Profil Hareketleri">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                        <FormInput label="Profil Ziyaretleri" type="number" value={profileVisits} onChange={setProfileVisits} placeholder="15420" />
                        <FormInput label="Harici Bağlantılara Dokunmalar" type="number" value={externalLinkTaps} onChange={setExternalLinkTaps} placeholder="850" />
                        <FormInput label="İş Adresine Dokunmalar" type="number" value={addressTaps} onChange={setAddressTaps} placeholder="124" />
                    </div>
                </FormSection>

                {/* İçerik Dağılımı */}
                <FormSection title="📊 İçerik Dağılımı">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                        <FormInput label="Reels (%)" type="number" value={mixReels} onChange={setMixReels} placeholder="50" />
                        <FormInput label="Hikaye (%)" type="number" value={mixHikaye} onChange={setMixHikaye} placeholder="30" />
                        <FormInput label="Tasarım (%)" type="number" value={mixDesign} onChange={setMixDesign} placeholder="20" />
                    </div>
                </FormSection>

                {/* Büyüme Trendi - Erişilen Hesap */}
                <FormSection title="📈 Büyüme Trendi - Erişilen Hesap">
                    {growthReach.map((item, i) => (
                        <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12, marginBottom: 12 }}>
                            <input
                                placeholder="Dönem (Ocak 2026)"
                                value={item.period}
                                onChange={(e) => {
                                    const updated = [...growthReach];
                                    updated[i].period = e.target.value;
                                    setGrowthReach(updated);
                                }}
                                style={{ padding: '12px 16px', background: colors.bgPrimary, border: `1px solid ${colors.border}`, borderRadius: 8 }}
                            />
                            <input
                                type="number"
                                placeholder="Değer"
                                value={item.value}
                                onChange={(e) => {
                                    const updated = [...growthReach];
                                    updated[i].value = parseInt(e.target.value) || 0;
                                    setGrowthReach(updated);
                                }}
                                style={{ padding: '12px 16px', background: colors.bgPrimary, border: `1px solid ${colors.border}`, borderRadius: 8 }}
                            />
                            <button onClick={() => setGrowthReach(growthReach.filter((_, j) => j !== i))} style={{ ...btnStyle, background: colors.accentRed }}>Sil</button>
                        </div>
                    ))}
                    <button onClick={() => setGrowthReach([...growthReach, { id: getId(), period: '', value: 0 }])} style={btnStyle}>+ Dönem Ekle</button>
                </FormSection>

                {/* Büyüme Trendi - Görüntülemeler */}
                <FormSection title="📈 Büyüme Trendi - Görüntülemeler">
                    {growthImpressions.map((item, i) => (
                        <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12, marginBottom: 12 }}>
                            <input
                                placeholder="Dönem"
                                value={item.period}
                                onChange={(e) => {
                                    const updated = [...growthImpressions];
                                    updated[i].period = e.target.value;
                                    setGrowthImpressions(updated);
                                }}
                                style={{ padding: '12px 16px', background: colors.bgPrimary, border: `1px solid ${colors.border}`, borderRadius: 8 }}
                            />
                            <input
                                type="number"
                                placeholder="Değer"
                                value={item.value}
                                onChange={(e) => {
                                    const updated = [...growthImpressions];
                                    updated[i].value = parseInt(e.target.value) || 0;
                                    setGrowthImpressions(updated);
                                }}
                                style={{ padding: '12px 16px', background: colors.bgPrimary, border: `1px solid ${colors.border}`, borderRadius: 8 }}
                            />
                            <button onClick={() => setGrowthImpressions(growthImpressions.filter((_, j) => j !== i))} style={{ ...btnStyle, background: colors.accentRed }}>Sil</button>
                        </div>
                    ))}
                    <button onClick={() => setGrowthImpressions([...growthImpressions, { id: getId(), period: '', value: 0 }])} style={btnStyle}>+ Dönem Ekle</button>
                </FormSection>

                {/* En İyi İçerikler */}
                <FormSection title="🏆 En İyi İçerikler">
                    {topContents.map((content, i) => (
                        <div key={content.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 12, marginBottom: 12 }}>
                            <input placeholder="Başlık" value={content.title} onChange={(e) => { const u = [...topContents]; u[i].title = e.target.value; setTopContents(u); }} style={{ padding: '12px 16px', background: colors.bgPrimary, border: `1px solid ${colors.border}`, borderRadius: 8 }} />
                            <select value={content.type} onChange={(e) => { const u = [...topContents]; u[i].type = e.target.value; setTopContents(u); }} style={{ padding: '12px', background: colors.bgPrimary, border: `1px solid ${colors.border}`, borderRadius: 8 }}>
                                <option value="Reel">Reel</option>
                                <option value="Hikaye">Hikaye</option>
                                <option value="Tasarım">Tasarım</option>
                            </select>
                            <input type="number" placeholder="Erişim" value={content.reach} onChange={(e) => { const u = [...topContents]; u[i].reach = parseInt(e.target.value) || 0; setTopContents(u); }} style={{ padding: '12px', background: colors.bgPrimary, border: `1px solid ${colors.border}`, borderRadius: 8 }} />
                            <input type="number" placeholder="Etkileşim" value={content.eng} onChange={(e) => { const u = [...topContents]; u[i].eng = parseInt(e.target.value) || 0; setTopContents(u); }} style={{ padding: '12px', background: colors.bgPrimary, border: `1px solid ${colors.border}`, borderRadius: 8 }} />
                            <button onClick={() => setTopContents(topContents.filter((_, j) => j !== i))} style={{ ...btnStyle, background: colors.accentRed }}>Sil</button>
                        </div>
                    ))}
                    <button onClick={() => setTopContents([...topContents, { id: getId(), title: '', type: 'Reel', reach: 0, eng: 0 }])} style={btnStyle}>+ İçerik Ekle</button>
                </FormSection>

                {/* Kampanyalar */}
                <FormSection title="🎯 Reklam / Kampanya">
                    {campaigns.map((camp, i) => (
                        <div key={camp.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 12, marginBottom: 12 }}>
                            <input placeholder="Kampanya Adı" value={camp.name} onChange={(e) => { const u = [...campaigns]; u[i].name = e.target.value; setCampaigns(u); }} style={{ padding: '12px', background: colors.bgPrimary, border: `1px solid ${colors.border}`, borderRadius: 8 }} />
                            <select value={camp.objective} onChange={(e) => { const u = [...campaigns]; u[i].objective = e.target.value; setCampaigns(u); }} style={{ padding: '12px', background: colors.bgPrimary, border: `1px solid ${colors.border}`, borderRadius: 8 }}>
                                <option value="awareness">Bilinirlik</option>
                                <option value="traffic">Trafik</option>
                                <option value="engagement">Etkileşim</option>
                                <option value="leads">Potansiyel Müşteriler</option>
                                <option value="sales">Satışlar</option>
                            </select>
                            <input type="number" placeholder="Harcama (₺)" value={camp.spend} onChange={(e) => { const u = [...campaigns]; u[i].spend = parseInt(e.target.value) || 0; setCampaigns(u); }} style={{ padding: '12px', background: colors.bgPrimary, border: `1px solid ${colors.border}`, borderRadius: 8 }} />
                            <input type="number" placeholder="Metrik 1" value={camp.metric1} onChange={(e) => { const u = [...campaigns]; u[i].metric1 = parseFloat(e.target.value) || 0; setCampaigns(u); }} style={{ padding: '12px', background: colors.bgPrimary, border: `1px solid ${colors.border}`, borderRadius: 8 }} />
                            <input type="number" placeholder="Metrik 2" value={camp.metric2} onChange={(e) => { const u = [...campaigns]; u[i].metric2 = parseFloat(e.target.value) || 0; setCampaigns(u); }} style={{ padding: '12px', background: colors.bgPrimary, border: `1px solid ${colors.border}`, borderRadius: 8 }} />
                            <button onClick={() => setCampaigns(campaigns.filter((_, j) => j !== i))} style={{ ...btnStyle, background: colors.accentRed }}>Sil</button>
                        </div>
                    ))}
                    <button onClick={() => setCampaigns([...campaigns, { id: getId(), name: '', objective: 'awareness', spend: 0, metric1: 0, metric2: 0 }])} style={btnStyle}>+ Kampanya Ekle</button>
                </FormSection>

                {/* Stratejiler */}
                <FormSection title="💡 Stratejiler">
                    <textarea
                        value={insights}
                        onChange={(e) => setInsights(e.target.value)}
                        placeholder="Reels formatı en yüksek organik erişimi sağladı&#10;Hikaye paylaşımları marka görünürlüğünü artırdı"
                        rows={4}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: colors.bgPrimary,
                            border: `1px solid ${colors.border}`,
                            borderRadius: 8,
                            resize: 'vertical'
                        }}
                    />
                </FormSection>

                {/* Öneriler */}
                <FormSection title="🎯 Öneriler">
                    <textarea
                        value={nextActions}
                        onChange={(e) => setNextActions(e.target.value)}
                        placeholder="Şubat ayında Reels sayısını artırmak&#10;Influencer iş birlikleri için görüşmelere başlamak"
                        rows={4}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: colors.bgPrimary,
                            border: `1px solid ${colors.border}`,
                            borderRadius: 8,
                            resize: 'vertical'
                        }}
                    />
                </FormSection>

                {/* Teslim Edilen İçerikler */}
                <FormSection title="📦 Teslim Edilen İçerikler">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <div>
                            <h3 style={{ fontSize: 16, marginBottom: 12 }}>Paylaşılan Reels</h3>
                            {reels.map((reel, i) => (
                                <div key={reel.id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                    <input placeholder="Reel başlığı" value={reel.value} onChange={(e) => { const u = [...reels]; u[i].value = e.target.value; setReels(u); }} style={{ flex: 1, padding: '10px', background: colors.bgPrimary, border: `1px solid ${colors.border}`, borderRadius: 8 }} />
                                    <button onClick={() => setReels(reels.filter((_, j) => j !== i))} style={{ ...btnStyle, background: colors.accentRed, padding: '8px 12px' }}>✕</button>
                                </div>
                            ))}
                            <button onClick={() => setReels([...reels, { id: getId(), value: '' }])} style={btnStyle}>+ Reel Ekle</button>
                        </div>
                        <div>
                            <h3 style={{ fontSize: 16, marginBottom: 12 }}>Yapılan Tasarımlar</h3>
                            {designs.map((design, i) => (
                                <div key={design.id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                    <input placeholder="Tasarım başlığı" value={design.value} onChange={(e) => { const u = [...designs]; u[i].value = e.target.value; setDesigns(u); }} style={{ flex: 1, padding: '10px', background: colors.bgPrimary, border: `1px solid ${colors.border}`, borderRadius: 8 }} />
                                    <button onClick={() => setDesigns(designs.filter((_, j) => j !== i))} style={{ ...btnStyle, background: colors.accentRed, padding: '8px 12px' }}>✕</button>
                                </div>
                            ))}
                            <button onClick={() => setDesigns([...designs, { id: getId(), value: '' }])} style={btnStyle}>+ Tasarım Ekle</button>
                        </div>
                    </div>
                </FormSection>

                {/* Hizmet Bedeli */}
                <FormSection title="💰 Hizmet Bedeli">
                    <FormInput label="Tutar (₺)" type="number" value={serviceFee} onChange={setServiceFee} placeholder="67500" />
                </FormSection>

                {/* Aksiyonlar */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
                    <button onClick={generateJSON} style={{ ...btnStyle, background: colors.accentGreen, color: colors.textPrimary, minWidth: 160 }}>📝 JSON Oluştur</button>
                    <button onClick={copyToClipboard} style={{ ...btnStyle, minWidth: 160 }}>📋 Kopyala</button>
                    <button onClick={downloadJSON} style={{ ...btnStyle, minWidth: 160 }}>💾 JSON İndir</button>
                    <button onClick={previewReport} style={{ ...btnStyle, minWidth: 160 }}>👁️ Viewer da Gör</button>
                </div>

                {/* JSON Çıktı */}
                {jsonOutput && (
                    <FormSection title="📄 JSON Çıktı">
                        <pre style={{
                            background: colors.bgPrimary,
                            border: `1px solid ${colors.border}`,
                            borderRadius: 8,
                            padding: 16,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 12,
                            whiteSpace: 'pre',
                            overflowX: 'auto',
                            maxHeight: 400
                        }}>
                            {jsonOutput}
                        </pre>
                    </FormSection>
                )}
            </div>
        </div>
    );
}
