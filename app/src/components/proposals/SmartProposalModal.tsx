'use client';

import React, { useState } from 'react';
import { Modal, Button, Input, Select, Card, Badge, Textarea } from '@/components/ui';
import { SERVICES, SM_PACKAGES, STUDIO_REELS_PACKAGES, formatCurrency, VAT_RATE } from '@/lib/constants/pricing';
import { Sparkles, Calculator, Camera, Film, Radio, Share2, Loader2, Check, ArrowRight, ArrowLeft, Lightbulb, FileText, Percent } from 'lucide-react';

interface ProposalItem {
    serviceId: string;
    serviceName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    unit: string;
    reasoning?: string;
}

interface SmartProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (items: ProposalItem[], notes: string, discount: number) => void;
}

type ProjectType = 'VIDEO' | 'PHOTO' | 'SOCIAL' | 'PODCAST' | null;
type Step = 'type' | 'details' | 'ai' | 'review';

export function SmartProposalModal({ isOpen, onClose, onGenerate }: SmartProposalModalProps) {
    const [step, setStep] = useState<Step>('type');
    const [projectType, setProjectType] = useState<ProjectType>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Quantity inputs
    const [videoCount, setVideoCount] = useState(6);
    const [productCount, setProductCount] = useState(10);
    const [anglesPerProduct, setAnglesPerProduct] = useState(5);
    const [detailedRetouch, setDetailedRetouch] = useState(false);
    const [monthCount, setMonthCount] = useState(3);
    const [podcastHours, setPodcastHours] = useState(2);

    // AI input
    const [aiInput, setAiInput] = useState('');

    // Results
    const [generatedItems, setGeneratedItems] = useState<ProposalItem[]>([]);
    const [aiNotes, setAiNotes] = useState('');
    const [suggestedDiscount, setSuggestedDiscount] = useState(0);

    const projectTypes = [
        { id: 'VIDEO', label: 'Video Çekimi', icon: <Film size={24} />, color: '#329FF5', desc: 'Studio Reels paketi' },
        { id: 'PHOTO', label: 'Ürün Fotoğrafı', icon: <Camera size={24} />, color: '#00F5B0', desc: 'Stüdyo + Retouch' },
        { id: 'SOCIAL', label: 'Sosyal Medya', icon: <Share2 size={24} />, color: '#F6D73C', desc: 'Aylık yönetim paketi' },
        { id: 'PODCAST', label: 'Podcast', icon: <Radio size={24} />, color: '#FF6B6B', desc: 'Stüdyo + Operatör' },
    ];

    const reset = () => {
        setStep('type');
        setProjectType(null);
        setGeneratedItems([]);
        setAiNotes('');
        setSuggestedDiscount(0);
        setAiInput('');
        setError(null);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const calculateFromRules = async () => {
        setLoading(true);
        setError(null);

        try {
            const quantities: Record<string, number | boolean> = {};

            switch (projectType) {
                case 'VIDEO':
                    quantities.videos = videoCount;
                    break;
                case 'PHOTO':
                    quantities.products = productCount;
                    quantities.angles = anglesPerProduct;
                    quantities.detailedRetouch = detailedRetouch;
                    break;
                case 'SOCIAL':
                    quantities.videos = 4; // Default for package matching
                    quantities.months = monthCount;
                    break;
                case 'PODCAST':
                    quantities.hours = podcastHours;
                    break;
            }

            const response = await fetch('/api/ai/proposal-suggestion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectType, quantities }),
            });

            const data = await response.json();

            if (data.success && data.suggestion) {
                setGeneratedItems(data.suggestion.items);
                setAiNotes(data.suggestion.aiNotes || '');
                setSuggestedDiscount(data.suggestion.suggestedDiscount || 0);
                setStep('review');
            } else {
                setError(data.error || 'Hesaplama başarısız');
            }
        } catch (err) {
            setError('Bağlantı hatası');
        } finally {
            setLoading(false);
        }
    };

    const calculateFromAI = async () => {
        if (!aiInput.trim()) {
            setError('Lütfen proje detaylarını yazın');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ai/proposal-suggestion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: aiInput }),
            });

            const data = await response.json();

            if (data.success && data.suggestion) {
                setGeneratedItems(data.suggestion.items);
                setAiNotes(data.suggestion.aiNotes || '');
                setSuggestedDiscount(data.suggestion.suggestedDiscount || 0);
                setStep('review');
            } else {
                setError(data.error || 'AI önerisi oluşturulamadı');
            }
        } catch (err) {
            setError('Bağlantı hatası');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = () => {
        onGenerate(generatedItems, aiNotes, suggestedDiscount);
        handleClose();
    };

    const totalEstimate = generatedItems.reduce((sum, item) => sum + item.total, 0);
    const kdv = totalEstimate * VAT_RATE;
    const grandTotal = totalEstimate + kdv;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title=""
            size="lg"
        >
            <div style={{
                minHeight: 420,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                padding: 'var(--space-1)'
            }}>
                {/* Header with icon */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    paddingBottom: 'var(--space-2)',
                    borderBottom: '1px solid var(--color-border)'
                }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, #6366F1 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Calculator size={20} color="white" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Akıllı Teklif Hesaplayıcı</h2>
                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', margin: 0 }}>
                            Proje detaylarına göre otomatik fiyatlandırma
                        </p>
                    </div>
                </div>

                {/* Step Indicator - Improved */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2)',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-md)'
                }}>
                    {[
                        { key: 'type', label: 'Proje Tipi', icon: <Film size={14} /> },
                        { key: 'details', label: 'Detaylar', icon: <Calculator size={14} /> },
                        { key: 'review', label: 'Önizleme', icon: <Check size={14} /> }
                    ].map((item, i) => {
                        const stepMap: Step[] = ['type', 'details', 'review'];
                        const stepIndex = stepMap.indexOf(step);
                        const isActive = stepIndex >= i || (step === 'ai' && i <= 1);
                        const isCurrent = stepMap[i] === step || (step === 'ai' && i === 1);
                        return (
                            <div
                                key={item.key}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: 'var(--space-1) var(--space-2)',
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: isCurrent ? 'var(--color-primary)' : isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                    color: isCurrent ? 'white' : isActive ? 'var(--color-primary)' : 'var(--color-muted)',
                                    fontSize: 'var(--text-caption)',
                                    fontWeight: isCurrent ? 600 : 400,
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Step 1: AI Input (Primary) */}
                {step === 'type' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {/* AI Input - Primary */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-3)',
                            border: '1px solid rgba(99, 102, 241, 0.3)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
                                <Sparkles size={20} style={{ color: '#6366F1' }} />
                                <span style={{ fontWeight: 600 }}>Proje Detaylarını Yaz</span>
                            </div>

                            <Textarea
                                value={aiInput}
                                onChange={(e) => setAiInput(e.target.value)}
                                placeholder="Örnek: 6 videoluk sosyal medya paketi, 3 ay süreli, reklam yönetimi dahil. Müşteri yeni restoran açacak..."
                                rows={3}
                                style={{ marginBottom: 'var(--space-2)' }}
                            />

                            {error && <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-1)' }}>{error}</p>}

                            <Button
                                variant="primary"
                                onClick={calculateFromAI}
                                disabled={loading || !aiInput.trim()}
                                style={{ width: '100%' }}
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                <span style={{ marginLeft: '8px' }}>{loading ? 'Hesaplanıyor...' : 'Teklif Oluştur'}</span>
                            </Button>
                        </div>

                        {/* Divider */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            color: 'var(--color-muted)',
                            fontSize: 'var(--text-caption)'
                        }}>
                            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
                            <span>veya proje tipi seç</span>
                            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
                        </div>

                        {/* Quick Type Selection - Secondary */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-1)' }}>
                            {projectTypes.map(pt => (
                                <button
                                    key={pt.id}
                                    onClick={() => {
                                        setProjectType(pt.id as ProjectType);
                                        setStep('details');
                                    }}
                                    style={{
                                        padding: 'var(--space-2)',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: 'transparent',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.borderColor = pt.color;
                                        e.currentTarget.style.backgroundColor = `${pt.color}15`;
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--color-border)';
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <div style={{ color: pt.color, marginBottom: '4px' }}>{pt.icon}</div>
                                    <span style={{ fontSize: 'var(--text-caption)', fontWeight: 500 }}>{pt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Details (Rule-based) */}
                {step === 'details' && projectType && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-1)' }}>
                            <Badge style={{ backgroundColor: projectTypes.find(p => p.id === projectType)?.color }}>
                                {projectTypes.find(p => p.id === projectType)?.label}
                            </Badge>
                        </div>

                        {projectType === 'VIDEO' && (
                            <Input
                                label="Kaç video üretilecek?"
                                type="number"
                                value={videoCount}
                                onChange={(e) => setVideoCount(parseInt(e.target.value) || 1)}
                                min={1}
                                max={50}
                            />
                        )}

                        {projectType === 'PHOTO' && (
                            <>
                                <Input
                                    label="Kaç ürün fotoğraflanacak?"
                                    type="number"
                                    value={productCount}
                                    onChange={(e) => setProductCount(parseInt(e.target.value) || 1)}
                                    min={1}
                                />
                                <Input
                                    label="Her ürün için kaç açı?"
                                    type="number"
                                    value={anglesPerProduct}
                                    onChange={(e) => setAnglesPerProduct(parseInt(e.target.value) || 1)}
                                    min={1}
                                    max={10}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                    <input
                                        type="checkbox"
                                        id="detailedRetouch"
                                        checked={detailedRetouch}
                                        onChange={(e) => setDetailedRetouch(e.target.checked)}
                                    />
                                    <label htmlFor="detailedRetouch">Detaylı Retouch (₺1,450/kare yerine ₺320)</label>
                                </div>
                            </>
                        )}

                        {projectType === 'SOCIAL' && (
                            <Input
                                label="Kaç aylık anlaşma?"
                                type="number"
                                value={monthCount}
                                onChange={(e) => setMonthCount(parseInt(e.target.value) || 1)}
                                min={1}
                                max={24}
                            />
                        )}

                        {projectType === 'PODCAST' && (
                            <Input
                                label="Kaç saatlik çekim?"
                                type="number"
                                value={podcastHours}
                                onChange={(e) => setPodcastHours(parseInt(e.target.value) || 1)}
                                min={1}
                                max={10}
                            />
                        )}

                        {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

                        <div style={{ display: 'flex', gap: 'var(--space-1)', marginTop: 'var(--space-2)' }}>
                            <Button variant="secondary" onClick={() => setStep('type')}>
                                <ArrowLeft size={16} /> Geri
                            </Button>
                            <Button variant="primary" onClick={calculateFromRules} disabled={loading} style={{ flex: 1 }}>
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
                                {loading ? 'Hesaplanıyor...' : 'Hesapla'}
                            </Button>
                        </div>
                    </div>
                )}



                {/* Step 3: Review */}
                {step === 'review' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-1)' }}>
                            <Check size={20} style={{ color: 'var(--color-success)' }} />
                            <span style={{ fontWeight: 600 }}>Önerilen Hizmetler</span>
                        </div>

                        <div className="table-container" style={{ maxHeight: 200, overflowY: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Hizmet</th>
                                        <th style={{ textAlign: 'right' }}>Miktar</th>
                                        <th style={{ textAlign: 'right' }}>Birim</th>
                                        <th style={{ textAlign: 'right' }}>Toplam</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {generatedItems.map((item, i) => (
                                        <tr key={i}>
                                            <td>
                                                {item.serviceName}
                                                {item.reasoning && (
                                                    <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                                                        {item.reasoning}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                                            <td style={{ textAlign: 'right' }}>{item.unit}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'right' }}>Ara Toplam</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(totalEstimate)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'right' }}>KDV (%{VAT_RATE * 100})</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(kdv)}</td>
                                    </tr>
                                    <tr style={{ backgroundColor: 'var(--color-surface)' }}>
                                        <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700 }}>GENEL TOPLAM</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
                                            {formatCurrency(grandTotal)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {aiNotes && (
                            <div style={{
                                backgroundColor: 'var(--color-surface)',
                                padding: 'var(--space-2)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 'var(--text-body-sm)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 'var(--space-1)'
                            }}>
                                <FileText size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                                <span><strong>Not:</strong> {aiNotes}</span>
                            </div>
                        )}

                        {suggestedDiscount > 0 && (
                            <div style={{
                                backgroundColor: 'rgba(246, 215, 60, 0.15)',
                                padding: 'var(--space-2)',
                                borderRadius: 'var(--radius-sm)',
                                color: '#F6D73C',
                                fontSize: 'var(--text-body-sm)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-1)',
                                border: '1px solid rgba(246, 215, 60, 0.3)'
                            }}>
                                <Percent size={14} />
                                <span><strong>Önerilen İndirim:</strong> %{suggestedDiscount}</span>
                            </div>
                        )}

                        {/* Revision Input */}
                        <div style={{
                            backgroundColor: 'var(--color-surface)',
                            padding: 'var(--space-2)',
                            borderRadius: 'var(--radius-sm)',
                            marginTop: 'var(--space-1)'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-1)',
                                marginBottom: 'var(--space-1)',
                                fontSize: 'var(--text-caption)',
                                color: 'var(--color-muted)'
                            }}>
                                <ArrowRight size={12} />
                                <span>Düzeltme gerekiyorsa açıklama yaz:</span>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                                <input
                                    type="text"
                                    value={aiInput}
                                    onChange={(e) => setAiInput(e.target.value)}
                                    placeholder="Örn: Kurgu süreleri 2dk olmalı, 1 çekim günü fazla..."
                                    style={{
                                        flex: 1,
                                        padding: 'var(--space-1) var(--space-2)',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: 'var(--color-bg)',
                                        fontSize: 'var(--text-body-sm)'
                                    }}
                                />
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={calculateFromAI}
                                    disabled={loading || !aiInput.trim()}
                                >
                                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    <span style={{ marginLeft: '4px' }}>Revize Et</span>
                                </Button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
                            <Button variant="secondary" onClick={reset}>
                                <ArrowLeft size={16} /> Yeniden Başla
                            </Button>
                            <Button variant="success" onClick={handleGenerate} style={{ flex: 1 }}>
                                <Check size={16} style={{ marginRight: '6px' }} />
                                Teklife Ekle
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
