'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Button, Badge } from '@/components/ui';
import { getBrandName, contentStatuses, contentTypes, ContentStatus, ContentType, getSimpleStatus, getStagesForType } from '@/lib/data';
import { StatusIcons, TypeIcons, Icons } from './icons';
import {
    Clock
} from 'lucide-react';

interface ContentItem {
    id: string;
    title: string;
    brandId: string;
    status: ContentStatus;
    type: ContentType;
    notes: string;
    deliveryDate?: string;
    publishDate?: string;
    assigneeIds?: string[];
    assigneeId?: string;
    // Task-specific fields
    priority?: string;
    description?: string;
    project?: string;
}

interface NoteHistoryEntry {
    id: string;
    contentId: string;
    user: string;
    action: string;
    note?: string;
    timestamp: string;
}

interface ContentDetailPanelProps {
    content: ContentItem | null;
    onClose?: () => void;
    onUpdateStatus: (id: string, status: ContentStatus) => Promise<void>;
    onUpdateNotes: (id: string, note: string) => void; // Debounced update
    noteHistory: NoteHistoryEntry[];
    teamMemberColors: Record<string, string>;
    activeTeam: { id: string; name: string }[];
    currentUser?: { name: string; id: string } | null;
}

export function ContentDetailPanel({
    content,
    onClose,
    onUpdateStatus,
    onUpdateNotes,
    noteHistory,
    teamMemberColors,
    activeTeam,
    currentUser
}: ContentDetailPanelProps) {
    const [editingNotes, setEditingNotes] = useState('');

    useEffect(() => {
        if (content) {
            // eslint-disable-next-line
            setEditingNotes(content.notes || content.description || '');
        }
    }, [content]);

    if (!content) {
        return (
            <Card style={{ position: 'sticky', top: 'var(--space-2)', height: 'fit-content' }}>
                <CardContent>
                    <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--color-muted)' }}>
                        <p style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>👈</p>
                        <p style={{ fontWeight: 600, marginBottom: '8px' }}>İçerik Seç</p>
                        <p style={{ fontSize: 'var(--text-body-sm)' }}>
                            Soldaki listeden bir içeriğe tıklayarak detaylarını görüntüleyebilirsin.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const typeInfo = contentTypes[content.type] || { icon: '📋', label: 'Görev' };
    const statusInfo = contentStatuses[content.status] || { icon: '○', label: content.status, color: '#999' };
    const brandName = getBrandName(content.brandId) || content.project || 'Genel';

    // Icon resolve
    const TypeIcon = TypeIcons[content.type as ContentType] || TypeIcons['TEKLIF'];
    const StatusIcon = StatusIcons[content.status as ContentStatus] || <Clock size={18} />;

    return (
        <Card style={{ position: 'sticky', top: 'var(--space-2)', height: 'fit-content', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
            <CardHeader
                title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{TypeIcon} <span>{content.title}</span></div>}
                description={brandName}
                action={onClose && <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>}
            />
            <CardContent>
                {/* Tarihler */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    <div style={{ padding: 'var(--space-2)', backgroundColor: 'rgba(50, 159, 245, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #329FF5' }}>
                        <p style={{ fontSize: 'var(--text-caption)', color: '#329FF5', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {Icons.Camera} Çekim/Teslim
                        </p>
                        <p style={{ fontWeight: 700, fontSize: 'var(--text-body)' }}>
                            {content.deliveryDate ? new Date(content.deliveryDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belirlenmedi'}
                        </p>
                    </div>
                    {(content.publishDate || (content.type as string) !== 'TASARIM') && (
                        <div style={{ padding: 'var(--space-2)', backgroundColor: 'rgba(0, 245, 176, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #00F5B0' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: '#00F5B0', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {Icons.Activity} Paylaşım
                            </p>
                            <p style={{ fontWeight: 700, fontSize: 'var(--text-body)' }}>
                                {content.publishDate ? new Date(content.publishDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Status Dropdown */}
                <div style={{ marginBottom: 'var(--space-3)' }}>
                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {Icons.Activity} Durum
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', border: `1px solid ${statusInfo.color}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: statusInfo.color }}>{StatusIcon}</span>
                            <div>
                                <p style={{ fontWeight: 600 }}>{getSimpleStatus(content.status) === 'DONE' ? 'Tamamlandı' : 'Yapılacak'}</p>
                                <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{contentStatuses[content.status]?.label}</p>
                            </div>
                        </div>
                        {/* Hızlı Aksiyon Butonları */}
                        <div style={{ display: 'flex', gap: 4 }}>
                            {getSimpleStatus(content.status) === 'TODO' ? (
                                <button
                                    onClick={() => onUpdateStatus(content.id, 'PAYLASILD')}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#00F5B0',
                                        color: '#004D40',
                                        border: 'none',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    ✓ Tamamla
                                </button>
                            ) : (
                                <button
                                    onClick={() => onUpdateStatus(content.id, 'PLANLANDI')}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#FF9800',
                                        color: '#3E2723',
                                        border: 'none',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    ↩ Geri Al
                                </button>
                            )}
                        </div>
                    </div>
                    {/* Detaylı Durum Seçimi (Opsiyonel / İkincil) */}
                    <details style={{ marginTop: '8px' }}>
                        <summary style={{ fontSize: '11px', color: 'var(--color-muted)', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {Icons.ChevronDown} Detaylı durum değiştir
                        </summary>
                        <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                            {getStagesForType(content.type).map((stage) => {
                                const info = contentStatuses[stage];
                                return (
                                    <button
                                        key={stage}
                                        onClick={() => onUpdateStatus(content.id, stage)}
                                        style={{
                                            padding: '6px',
                                            backgroundColor: content.status === stage ? info.color + '20' : 'transparent',
                                            border: content.status === stage ? `1px solid ${info.color}` : '1px solid var(--color-border)',
                                            borderRadius: 4,
                                            fontSize: '11px',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6
                                        }}
                                    >
                                        <span style={{ color: content.status === stage ? info.color : 'var(--color-muted)' }}>
                                            {StatusIcons[stage] || <Clock size={16} />}
                                        </span>
                                        <span style={{ color: content.status === stage ? info.color : 'inherit' }}>{info.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </details>
                </div>

                {/* Açıklama & Notlar */}
                <div style={{ marginBottom: 'var(--space-3)' }}>
                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {Icons.FileText} Açıklama & Notlar
                        {content.notes && <span style={{ marginLeft: '8px', color: '#4CAF50', display: 'flex', alignItems: 'center', gap: 4 }}>{Icons.Check} İçerik Hazır</span>}
                    </p>
                    <textarea
                        value={editingNotes}
                        onChange={(e) => setEditingNotes(e.target.value)}
                        onBlur={() => {
                            if (editingNotes !== content.notes && editingNotes !== content.description) {
                                onUpdateNotes(content.id, editingNotes);
                            }
                        }}
                        placeholder="İçerik için not ekle..."
                        style={{
                            width: '100%',
                            padding: 'var(--space-2)',
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            minHeight: '100px',
                            fontSize: 'var(--text-body)',
                            lineHeight: '1.6',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>

                {/* Atanan Kişiler */}
                {(content.assigneeIds?.length > 0 || content.assigneeId) && (
                    <div style={{ marginBottom: 'var(--space-3)' }}>
                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {Icons.User} Atanan
                        </p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {(content.assigneeIds || (content.assigneeId ? [content.assigneeId] : [])).map((assignee: string) => {
                                const member = activeTeam.find(t => t.id === assignee || t.name === assignee);
                                const displayName = member?.name || assignee;
                                const color = teamMemberColors[displayName] || teamMemberColors[assignee] || '#6B7B80';
                                return (
                                    <span key={assignee} style={{
                                        padding: '4px 12px',
                                        backgroundColor: color + '20',
                                        color: color,
                                        borderRadius: 16,
                                        fontWeight: 500,
                                        fontSize: 13
                                    }}>
                                        {displayName}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Not Geçmişi */}
                {noteHistory && noteHistory.filter(n => n.contentId === content.id).length > 0 && (
                    <div style={{ marginBottom: 'var(--space-3)' }}>
                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 6 }}>{Icons.History} Değişiklik Geçmişi</p>
                        <div style={{
                            maxHeight: '150px',
                            overflowY: 'auto',
                            backgroundColor: 'var(--color-surface)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '8px'
                        }}>
                            {noteHistory
                                .filter(n => n.contentId === content.id)
                                .slice(-5)
                                .reverse()
                                .map(n => (
                                    <div key={n.id} style={{
                                        fontSize: '11px',
                                        padding: '4px 0',
                                        borderBottom: '1px solid var(--color-border)'
                                    }}>
                                        <span style={{ fontWeight: 600 }}>{n.user}</span>
                                        <span style={{ color: 'var(--color-muted)' }}> • {new Date(n.timestamp).toLocaleString('tr-TR')}</span>
                                        <br />
                                        <span style={{ color: '#666' }}>{n.action}</span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
