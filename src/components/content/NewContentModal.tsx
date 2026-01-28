'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Input, Select, Textarea, MiniCalendar, MultiSelect } from '@/components/ui';
import { brands, contentStatuses, contentTypes, ContentStatus, ContentType, getStagesForType } from '@/lib/data';
import { getActiveTeamMembers, User as DBUser } from '@/lib/actions/users';
import { getBrandSuggestions, createContentWithBrand, updateContent as updateContentDB, ContentItem as DBContentItem } from '@/lib/actions/content';
import { getMemberColors } from '@/lib/actions/userSettings';

interface NewContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (content: any) => void;
    initialDate?: string;
    initialContent?: any; // For editing mode
}

export function NewContentModal({ isOpen, onClose, onSuccess, initialDate, initialContent }: NewContentModalProps) {
    // Form states
    const [formTitle, setFormTitle] = useState('');
    const [formBrand, setFormBrand] = useState('');
    const [brandSuggestions, setBrandSuggestions] = useState<{ id: string; name: string; clientId?: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [formType, setFormType] = useState<ContentType>('VIDEO');
    const [formStatus, setFormStatus] = useState<ContentStatus>('PLANLANDI');
    const [formNotes, setFormNotes] = useState('');
    const [formDeliveryDate, setFormDeliveryDate] = useState('');
    const [formPublishDate, setFormPublishDate] = useState('');
    const [formAssignees, setFormAssignees] = useState<string[]>([]);

    // Data states
    const [activeTeam, setActiveTeam] = useState<DBUser[]>([]);
    const [teamMemberColors, setTeamMemberColors] = useState<Record<string, string>>({});

    // Load team data
    useEffect(() => {
        if (isOpen) {
            getActiveTeamMembers().then(setActiveTeam);
            getMemberColors().then(setTeamMemberColors);
        }
    }, [isOpen]);

    // Initialize form with initial values when modal opens or initialDate changes
    useEffect(() => {
        if (isOpen) {
            if (initialContent) {
                setFormTitle(initialContent.title || '');
                setFormBrand(initialContent.brandName || initialContent.brandId || '');
                setFormType(initialContent.type || 'VIDEO');
                setFormStatus(initialContent.status || 'PLANLANDI');
                setFormNotes(initialContent.notes || '');
                setFormDeliveryDate(initialContent.deliveryDate || '');
                setFormPublishDate(initialContent.publishDate || '');
                setFormAssignees(initialContent.assigneeIds || (initialContent.assigneeId ? [initialContent.assigneeId] : []) || []);
            } else {
                setFormTitle('');
                setFormBrand('');
                setFormType('VIDEO');
                setFormStatus('PLANLANDI');
                setFormNotes('');
                setFormDeliveryDate(initialDate || '');
                setFormPublishDate('');
                setFormAssignees([]);
            }
        }
    }, [isOpen, initialDate, initialContent]);

    // Marka autocomplete handler
    const handleBrandInput = useCallback(async (value: string) => {
        setFormBrand(value);
        if (value.length >= 2) {
            const suggestions = await getBrandSuggestions(value);
            setBrandSuggestions(suggestions);
            setShowSuggestions(true);
        } else {
            setBrandSuggestions([]);
            setShowSuggestions(false);
        }
    }, []);

    const selectBrandSuggestion = (suggestion: { id: string; name: string }) => {
        setFormBrand(suggestion.name);
        setBrandSuggestions([]);
        setShowSuggestions(false);
    };

    const saveContent = async () => {
        if (!formTitle || !formBrand) {
            alert('Lütfen Başlık ve Marka alanlarını doldurunuz.');
            return;
        }

        const data = {
            title: formTitle,
            brandName: formBrand,
            type: formType,
            status: formStatus,
            notes: formNotes,
            deliveryDate: formDeliveryDate || undefined,
            publishDate: formPublishDate || undefined,
            assigneeIds: formAssignees.length > 0 ? formAssignees : undefined,
            assigneeId: formAssignees[0] || undefined,
        };

        try {
            let result;
            if (initialContent && initialContent.id) {
                // Update existing
                result = await updateContentDB(initialContent.id, {
                    title: formTitle,
                    brandName: formBrand,
                    type: formType,
                    status: formStatus,
                    notes: formNotes,
                    deliveryDate: formDeliveryDate || undefined,
                    publishDate: formPublishDate || undefined,
                    assigneeIds: formAssignees,
                    assigneeId: formAssignees[0]
                });
            } else {
                result = await createContentWithBrand(data);
            }

            if (onSuccess && result) {
                onSuccess(result);
            } else if (!result) {
                throw new Error('Kayıt başarısız (Sonuç boş)');
            }
            onClose();
            // Reset form
            setFormTitle('');
            setFormNotes('');
            setFormAssignees([]);
        } catch (error) {
            console.error('İçerik kaydedilemedi:', error);
            alert('Kaydedilirken bir hata oluştu: ' + error);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialContent ? '✏️ İçerik Düzenle' : '🎬 Yeni İçerik'}
            size="lg"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>İptal</Button>
                    <Button variant="primary" onClick={saveContent}>Kaydet</Button>
                </>
            }
        >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                {/* Sol Kolon - Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Input label="Başlık *" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
                    {/* Marka Autocomplete */}
                    <div style={{ position: 'relative' }}>
                        <Input
                            label="Marka *"
                            value={formBrand}
                            onChange={(e) => handleBrandInput(e.target.value)}
                            placeholder="Marka adı yazın..."
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            onFocus={() => formBrand.length >= 2 && brandSuggestions.length > 0 && setShowSuggestions(true)}
                        />
                        {showSuggestions && brandSuggestions.length > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                backgroundColor: 'var(--color-card)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)',
                                boxShadow: 'var(--shadow-lg)',
                                zIndex: 100,
                                maxHeight: 200,
                                overflowY: 'auto',
                            }}>
                                {brandSuggestions.map((s) => (
                                    <div
                                        key={s.id}
                                        onClick={() => selectBrandSuggestion(s)}
                                        style={{
                                            padding: '10px 12px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid var(--color-border)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <span style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: '50%',
                                            backgroundColor: s.clientId ? 'var(--color-success)' : 'var(--color-warning)',
                                        }} />
                                        <span>{s.name}</span>
                                        {s.clientId && <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>✓ Müşteri</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                        {formBrand && brandSuggestions.length === 0 && formBrand.length >= 2 && (
                            <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
                                💡 "{formBrand}" yeni marka olarak oluşturulacak
                            </p>
                        )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Select
                            label="Tür"
                            value={formType}
                            onChange={(e) => {
                                const newType = e.target.value as ContentType;
                                setFormType(newType);
                                setFormStatus('PLANLANDI');
                            }}
                            options={Object.entries(contentTypes).map(([k, v]) => ({ value: k, label: `${v.icon} ${v.label}` }))}
                        />
                        <Select
                            label="Durum"
                            value={formStatus}
                            onChange={(e) => setFormStatus(e.target.value as ContentStatus)}
                            options={getStagesForType(formType).map(stage => ({
                                value: stage,
                                label: `${contentStatuses[stage].icon} ${contentStatuses[stage].label}`
                            }))}
                        />
                    </div>
                    <MultiSelect
                        label="Sorumlular"
                        value={formAssignees}
                        onChange={setFormAssignees}
                        options={activeTeam.map(m => ({
                            value: m.id, // Use ID properly
                            label: m.name,
                            color: teamMemberColors[m.name] || teamMemberColors[m.id]
                        }))}
                        placeholder="Kişi seçiniz..."
                    />
                    <Textarea label="Notlar" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={3} />
                </div>

                {/* Sağ Kolon - Mini Takvim */}
                <div>
                    <p style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, marginBottom: 'var(--space-1)', color: 'var(--color-sub-ink)' }}>
                        📅 Teslim Tarihi Seç
                    </p>
                    <MiniCalendar
                        selectedDate={formDeliveryDate}
                        onSelectDate={(date) => setFormDeliveryDate(date)}
                    />
                </div>
            </div>
        </Modal>
    );
}
