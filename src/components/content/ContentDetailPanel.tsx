'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Button, Badge } from '@/components/ui';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { getBrandName, contentStatuses, contentTypes, ContentStatus, ContentType, getSimpleStatus, getStagesForType } from '@/lib/data';
import { StatusIcons, TypeIcons, Icons } from './icons';
import {
    Clock,
    Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';

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
    onDelete: (id: string) => Promise<void>;
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
    onDelete,
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
            <GlassCard style={{ position: 'sticky', top: 'var(--space-6)', height: 'fit-content' }} className="p-8 text-center" intensity="light">
                <div style={{ color: 'var(--color-muted)' }}>
                    <p style={{ fontSize: '48px', marginBottom: 'var(--space-4)', opacity: 0.5 }}>👈</p>
                    <p style={{ fontWeight: 600, marginBottom: '8px', fontSize: '18px', color: 'var(--color-ink)' }}>İçerik Seç</p>
                    <p style={{ fontSize: 'var(--text-body)', opacity: 0.7 }}>
                        Soldaki listeden bir içeriğe tıklayarak detaylarını görüntüleyebilirsin.
                    </p>
                </div>
            </GlassCard>
        );
    }

    const typeInfo = contentTypes[content.type] || { icon: '📋', label: 'Görev' };
    const statusInfo = contentStatuses[content.status] || { icon: '○', label: content.status, color: '#999' };
    const brandName = getBrandName(content.brandId) || content.project || 'Genel';

    // Icon resolve
    const TypeIcon = TypeIcons[content.type as ContentType] || TypeIcons['TEKLIF'];
    const StatusIcon = StatusIcons[content.status as ContentStatus] || <Clock size={18} />;

    return (
        <GlassCard style={{ position: 'sticky', top: 'var(--space-6)', height: 'fit-content', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto' }} className="p-0 overflow-hidden flex flex-col shadow-2xl mr-1" intensity="medium" glowOnHover glowColor="blue">
            <div className="p-6 border-b border-white/10 bg-white/5 sticky top-0 z-20 backdrop-blur-md">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3 text-lg font-bold">
                        <span className="bg-primary/20 p-2 rounded-lg text-primary scale-90">{TypeIcon}</span>
                        <span className="truncate max-w-[200px]" title={content.title}>{content.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={async () => {
                                if (confirm('Bu içeriği silmek istediğinize emin misiniz?')) {
                                    await onDelete(content.id);
                                }
                            }}
                            className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors text-muted-foreground mr-1"
                            title="Sil"
                        >
                            <Trash2 size={18} />
                        </button>
                        {onClose && <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-white">✕</button>}
                    </div>
                </div>
                <div className="text-sm text-muted-foreground ml-1">{brandName}</div>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar pb-10">
                {/* Tarihler */}
                <div className="grid grid-cols-2 gap-4">
                    <GlassSurface intensity="light" className="p-4 border-l-4 border-l-[#329FF5] bg-[#329FF5]/5">
                        <p className="text-xs text-[#329FF5] mb-2 flex items-center gap-2 font-medium uppercase tracking-wider">
                            {Icons.Camera} Çekim
                        </p>
                        <p className="font-bold text-lg">
                            {content.deliveryDate ? new Date(content.deliveryDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '---'}
                        </p>
                    </GlassSurface>

                    <GlassSurface intensity="light" className="p-4 border-l-4 border-l-[#00F5B0] bg-[#00F5B0]/5">
                        <p className="text-xs text-[#00F5B0] mb-2 flex items-center gap-2 font-medium uppercase tracking-wider">
                            {Icons.Activity} Paylaşım
                        </p>
                        <p className="font-bold text-lg">
                            {content.publishDate ? new Date(content.publishDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '-'}
                        </p>
                    </GlassSurface>
                </div>

                {/* Status Progress Bar (Aesthetic) */}
                <div className="mb-6">
                    <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wider font-semibold">
                        {Icons.Activity} Durum
                    </p>
                    <div className="flex items-center justify-between bg-black/40 p-1.5 rounded-2xl border border-white/10 relative">
                        {['PLANLANDI', 'CEKILDI', 'KURGULANDI', 'PAYLASILD'].map((stage, index) => {
                            const info = contentStatuses[stage as ContentStatus] || { label: stage, color: '#888' };
                            const isActive = content.status === stage;
                            const isPast = ['PLANLANDI', 'CEKILDI', 'KURGULANDI', 'PAYLASILD'].indexOf(content.status) > index;

                            return (
                                <button
                                    key={stage}
                                    onClick={() => onUpdateStatus(content.id, stage as ContentStatus)}
                                    className={`relative z-10 flex-1 py-3 px-2 rounded-xl text-[11px] font-bold transition-all duration-300 flex flex-col items-center gap-1.5 ${isActive ? 'bg-white/10 text-white shadow-lg ring-1 ring-white/20' : isPast ? 'text-white/60' : 'text-white/20 hover:bg-white/5'}`}
                                >
                                    <span style={{ color: isActive || isPast ? info.color : 'inherit', filter: isActive ? 'drop-shadow(0 0 8px currentColor)' : 'none' }}>
                                        {StatusIcons[stage as ContentStatus] || <Clock size={16} />}
                                    </span>
                                    <span>{info.label}</span>
                                    {isActive && (
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-current" style={{ color: info.color }} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Açıklama & Notlar */}
                <div>
                    <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wider font-semibold">
                        {Icons.FileText} Açıklama & Notlar
                        {content.notes && <span className="ml-auto text-[#4CAF50] bg-[#4CAF50]/10 px-2 py-0.5 rounded text-[10px] font-bold">KAYDEDİLDİ</span>}
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
                        className="w-full p-4 bg-black/20 border border-white/10 rounded-xl min-h-[140px] text-sm leading-relaxed resize-y focus:outline-none focus:border-primary/50 focus:bg-black/30 transition-all placeholder:text-white/20 text-white"
                    />
                </div>

                {/* Atanan Kişiler */}
                {(content.assigneeIds?.length > 0 || content.assigneeId) && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wider font-semibold">
                            {Icons.User} Atanan Ekip
                        </p>
                        <div className="flex gap-2 flex-wrap bg-black/20 p-3 rounded-xl border border-white/5">
                            {(content.assigneeIds || (content.assigneeId ? [content.assigneeId] : [])).map((assignee: string) => {
                                const member = activeTeam.find(t => t.id === assignee || t.name === assignee);
                                const displayName = member?.name || assignee;
                                const color = teamMemberColors[displayName] || teamMemberColors[assignee] || '#6B7B80';
                                return (
                                    <span key={assignee} style={{
                                        padding: '6px 14px',
                                        backgroundColor: color + '20',
                                        color: color,
                                        borderRadius: 20,
                                        border: `1px solid ${color}40`,
                                        fontWeight: 600,
                                        fontSize: 12
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
                    <div>
                        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wider font-semibold">{Icons.History} Son İşlemler</p>
                        <div className="bg-black/20 rounded-xl p-2 max-h-[150px] overflow-y-auto border border-white/5">
                            {noteHistory
                                .filter(n => n.contentId === content.id)
                                .slice(-5)
                                .reverse()
                                .map(n => (
                                    <div key={n.id} className="text-[11px] p-2 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold text-white/90">{n.user}</span>
                                            <span className="text-white/30">{new Date(n.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <span className="text-white/50">{n.action}</span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}
            </div>
        </GlassCard>
    );
}
