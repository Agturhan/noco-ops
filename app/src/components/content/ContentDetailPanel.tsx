'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { getBrandName, contentStatuses, ContentStatus, ContentType, getStagesForType } from '@/lib/data';
import { StatusIcons, TypeIcons, Icons } from './icons';
import { Clock, Trash2 } from 'lucide-react';

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
    const [optimisticStatus, setOptimisticStatus] = useState<ContentStatus | null>(null);

    useEffect(() => {
        if (content) {
            setEditingNotes(content.notes || content.description || '');
            setOptimisticStatus(content.status);
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

    const brandName = getBrandName(content.brandId) || content.project || 'Genel';

    // Icon resolve
    const TypeIcon = TypeIcons[content.type as ContentType] || TypeIcons['TEKLIF'];

    return (
        <div className="h-full flex flex-col bg-[var(--surface-bg)] border-l border-white/5 shadow-2xl relative z-40">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-white/5 bg-[var(--surface-bg)] relative md:sticky md:top-0 z-20">
                <div className="flex flex-col gap-3 mb-2">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 text-lg font-bold text-[var(--ink)] min-w-0 flex-1">
                            <span className="bg-[var(--color-primary-light)] p-2 rounded-lg text-[var(--color-primary)] scale-90 shrink-0 mt-0.5">{TypeIcon}</span>
                            <span className="text-base md:text-lg leading-tight break-words whitespace-normal line-clamp-3 md:line-clamp-none">{content.title}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                onClick={async () => {
                                    if (confirm('Bu içeriği silmek istediğinize emin misiniz?')) {
                                        await onDelete(content.id);
                                    }
                                }}
                                className="p-2 hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)] rounded-full transition-colors text-[var(--muted)]"
                                title="Sil"
                            >
                                <Trash2 size={18} />
                            </button>
                            {onClose && <button onClick={onClose} className="p-2 hover:bg-[var(--hover-bg)] rounded-full transition-colors text-[var(--muted)] hover:text-[var(--ink)]">✕</button>}
                        </div>
                    </div>
                    <div className="text-sm text-[var(--muted)] ml-1 truncate">{brandName}</div>
                </div>
            </div>

            <div className="p-4 md:p-5 space-y-6 overflow-y-auto custom-scrollbar flex-1 pb-32 md:pb-20">
                {/* Tarihler */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 md:p-4 border-l-4 border-l-[#329FF5] bg-[#329FF5]/5 rounded-r-lg">
                        <p className="text-xs text-[#329FF5] mb-1 flex items-center gap-2 font-medium uppercase tracking-wider">
                            {Icons.Camera} Çekim
                        </p>
                        <p className="font-bold text-lg text-[var(--ink)]">
                            {content.deliveryDate ? new Date(content.deliveryDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '---'}
                        </p>
                    </div>

                    <div className="p-3 md:p-4 border-l-4 border-l-[#00F5B0] bg-[#00F5B0]/5 rounded-r-lg">
                        <p className="text-xs text-[#00F5B0] mb-1 flex items-center gap-2 font-medium uppercase tracking-wider">
                            {Icons.Activity} Paylaşım
                        </p>
                        <p className="font-bold text-lg text-[var(--ink)]">
                            {content.publishDate ? new Date(content.publishDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '-'}
                        </p>
                    </div>
                </div>

                {/* Status Progress Bar */}
                <div className="mb-6">
                    <p className="text-xs text-[var(--muted)] mb-3 flex items-center gap-2 uppercase tracking-wider font-semibold">
                        {Icons.Activity} Durum
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {(getStagesForType(content.type) || []).map((stage, index) => {
                            const info = contentStatuses[stage as ContentStatus] || { label: stage, color: '#888' };
                            const currentStatus = optimisticStatus || content.status;
                            const isActive = currentStatus === stage;
                            const isPast = (getStagesForType(content.type) || []).indexOf(currentStatus) > index;
                            const isWorkingStage = ['CEKILIYOR', 'KURGULANIYOR', 'TASARLANIYOR'].includes(stage);

                            return (
                                <button
                                    key={stage}
                                    onClick={async () => {
                                        setOptimisticStatus(stage as ContentStatus); // Instant update
                                        await onUpdateStatus(content.id, stage as ContentStatus);
                                        if (currentUser) {
                                            if (isWorkingStage) {
                                                const { startTimeLog } = await import('@/lib/actions/timelogs');
                                                await startTimeLog(content.id, currentUser.id, info.label);
                                            } else {
                                                const { stopActiveTimer } = await import('@/lib/actions/timelogs');
                                                await stopActiveTimer(currentUser.id);
                                            }
                                        }
                                    }}
                                    className={`
                                        relative group flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all duration-200
                                        ${isActive
                                            ? 'bg-white/[0.03] scale-[1.02]'
                                            : 'bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/5 opacity-60 hover:opacity-100'
                                        }
                                    `}
                                    style={{
                                        borderColor: isActive ? info.color : 'transparent',
                                        boxShadow: isActive ? `0 0 0 1px ${info.color}40` : 'none',
                                    }}
                                >
                                    <span
                                        style={{ color: isActive || isPast ? info.color : 'currentColor' }}
                                        className={`transition-colors ${isActive ? 'scale-110' : ''}`}
                                    >
                                        {StatusIcons[stage as ContentStatus] || <Clock size={18} />}
                                    </span>

                                    <span className={`text-[10px] font-medium tracking-wide text-center leading-tight ${isActive ? 'text-[var(--ink)]' : 'text-[var(--muted)]'}`}>
                                        {info.label}
                                    </span>

                                    {/* Active/Recording Dot */}
                                    {isActive && (
                                        <div className="absolute top-2 right-2">
                                            {isWorkingStage ? (
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                </span>
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: info.color }} />
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Time Tracker - Otomatik (Gizli) */}
                {currentUser && content.id && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between text-xs text-[var(--muted)] bg-[var(--control-bg)] p-2 rounded-lg border border-white/5">
                            <div className="flex items-center gap-2">
                                <Clock size={12} />
                                <span className="uppercase tracking-wider font-bold">Toplam Efor</span>
                            </div>
                            <TotalDurationDisplay taskId={content.id} />
                        </div>
                    </div>
                )}

                {/* Açıklama & Notlar */}
                <div>
                    <p className="text-[13px] text-[var(--muted)] mb-3 flex items-center gap-2 uppercase tracking-wider font-semibold">
                        {Icons.FileText} Açıklama & Notlar
                        {content.notes && <span className="ml-auto text-[#4CAF50] bg-[#4CAF50]/5 px-2 py-0.5 rounded text-[10px] font-bold opacity-80">KAYDEDİLDİ</span>}
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
                        className="w-full p-4 bg-[var(--control-bg)] border border-white/5 rounded-xl min-h-[140px] text-sm leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]/50 transition-all placeholder:text-[var(--muted)] text-[var(--control-text)]"
                    />
                </div>

                {/* Atanan Kişiler */}
                {(content.assigneeIds?.length > 0 || content.assigneeId) && (
                    <div>
                        <p className="text-xs text-[var(--muted)] mb-3 flex items-center gap-2 uppercase tracking-wider font-semibold">
                            {Icons.User} Atanan Ekip
                        </p>
                        <div className="flex gap-2 flex-wrap bg-[var(--control-bg)] p-3 rounded-xl border border-white/5">
                            {(content.assigneeIds || (content.assigneeId ? [content.assigneeId] : [])).map((assignee: string) => {
                                const member = activeTeam.find(t => t.id === assignee || t.name === assignee);
                                const displayName = member?.name || assignee;
                                const color = teamMemberColors[displayName] || teamMemberColors[assignee] || '#6B7B80';
                                return (
                                    <span key={assignee} style={{
                                        padding: '6px 14px',
                                        backgroundColor: color + '15',
                                        color: color,
                                        borderRadius: 6,
                                        border: `1px solid ${color}30`,
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
                        <p className="text-xs text-[var(--muted)] mb-3 flex items-center gap-2 uppercase tracking-wider font-semibold">{Icons.History} Son İşlemler</p>
                        <div className="bg-[var(--control-bg)] rounded-xl p-2 max-h-[150px] overflow-y-auto border border-[var(--control-border)]">
                            {noteHistory
                                .filter(n => n.contentId === content.id)
                                .slice(-5)
                                .reverse()
                                .map(n => (
                                    <div key={n.id} className="text-[11px] p-2 border-b border-[var(--divider)] last:border-0 hover:bg-[var(--hover-bg)] transition-colors">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold text-[var(--ink)]">{n.user}</span>
                                            <span className="text-[var(--sub-ink)]">{new Date(n.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <span className="text-[var(--muted)]">{n.action}</span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function TotalDurationDisplay({ taskId }: { taskId: string }) {
    const [totalMinutes, setTotalMinutes] = useState<number | null>(null);

    useEffect(() => {
        let mounted = true;
        // Dynamic import to avoid circular dependencies if any, or just standard import
        import('@/lib/actions/timelogs').then(async ({ getTaskLogs }) => {
            const res = await getTaskLogs(taskId);
            if (mounted && res.success) {
                const total = res.data.reduce((acc: number, log: { durationMinutes?: number }) => acc + (log.durationMinutes || 0), 0);
                setTotalMinutes(total);
            }
        });
        return () => { mounted = false; };
    }, [taskId]);

    if (totalMinutes === null) return <span className="animate-pulse">...</span>;
    return <span className="font-mono text-[var(--ink)] font-bold">{(totalMinutes / 60).toFixed(1)} Saat</span>;
}
