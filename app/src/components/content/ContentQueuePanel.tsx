import React from 'react';
import { ContentItem } from '@/app/dashboard/content-production/ContentProductionPageClient';
import { contentStatuses, getBrandColor, getBrandName } from '@/lib/data';
import { AssigneeStack } from '@/components/ui/AssigneeStack';
import { cn } from '@/lib/utils';

interface ContentQueuePanelProps {
    contents: ContentItem[];
    selectedId: string | null;
    onSelect: (content: ContentItem) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activeTeam: any[];
    teamMemberColors: Record<string, string>;
}

export function ContentQueuePanel({ contents, selectedId, onSelect, activeTeam, teamMemberColors }: ContentQueuePanelProps) {
    // KPI Data Calculation
    const stats = {
        total: contents.length,
        shot: contents.filter(c => c.status === 'CEKILDI').length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        editing: contents.filter(c => c.status === 'KURGULANIYOR' || (c.status as any) === 'REVİZE').length,
        shared: contents.filter(c => c.status === 'PAYLASILD').length,
        planning: contents.filter(c => c.status === 'PLANLANDI').length,
    };

    return (
        <div className="flex flex-col h-full gap-4">
            {/* 2.1 KPI Strip - Scrollable on mobile */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <KPICard label="Toplam" value={stats.total} />
                <KPICard label="Planlanacak" value={stats.planning} color="text-amber-500" bg="bg-amber-500/10" />
                <KPICard label="Çekildi" value={stats.shot} color="text-blue-500" bg="bg-blue-500/10" />
                <KPICard label="Kurgu" value={stats.editing} color="text-purple-500" bg="bg-purple-500/10" />
                <KPICard label="Paylaşıldı" value={stats.shared} color="text-emerald-500" bg="bg-emerald-500/10" />
            </div>

            {/* 2.2 List Controls */}
            <div className="flex items-center justify-between text-xs text-[var(--color-muted)] px-2 pt-2">
                <span className="font-medium opacity-70">Sıralama: Yaklaşan Teslimat</span>
                <button className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-[var(--color-surface-2)] transition-colors text-[var(--color-ink)]" title="Bugün ve yarın teslim edilmesi gerekenler">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]"></div>
                    Sadece Bugün/Yarın
                </button>
            </div>

            {/* 2.3 Queue List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 mt-1">
                {contents.map(content => {
                    const brandColor = getBrandColor(content.brandId);
                    const isSelected = selectedId === content.id;

                    return (
                        <div
                            key={content.id}
                            onClick={() => onSelect(content)}
                            className={cn(
                                "group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border",
                                isSelected
                                    ? "bg-[var(--surface-bg-2)] border-[var(--color-primary)]/20 shadow-sm ring-1 ring-[var(--color-primary)]/10"
                                    : "bg-[var(--surface-bg)] border-transparent hover:bg-[var(--hover-bg)] hover:border-white/5 opacity-90 hover:opacity-100"
                            )}
                            style={{
                                borderLeft: isSelected ? `3px solid ${brandColor}` : '3px solid transparent'
                            }}
                        >
                            {/* Status Dot */}
                            <div
                                className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white/10"
                                style={{ backgroundColor: contentStatuses[content.status]?.color || '#ccc' }}
                                title={`Durum: ${contentStatuses[content.status]?.label || content.status}`}
                            />

                            {/* Main Info */}
                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span
                                        className={cn("text-sm font-medium truncate", isSelected ? "text-[var(--ink)]" : "text-[var(--ink)]/90")}
                                        title={content.title}
                                    >
                                        {content.title}
                                    </span>
                                    {/* Date Pill */}
                                    {content.deliveryDate && (
                                        <span className={cn(
                                            "text-[10px] font-medium px-1.5 py-0.5 rounded ml-auto shrink-0 border",
                                            new Date(content.deliveryDate) < new Date() ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-[var(--surface-bg)] text-[var(--muted)] border-[var(--surface-border)]"
                                        )}>
                                            {new Date(content.deliveryDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
                                    <span
                                        style={{ color: brandColor }}
                                        className="font-medium truncate max-w-[120px]"
                                        title={getBrandName(content.brandId)}
                                    >
                                        {getBrandName(content.brandId)}
                                    </span>
                                    {/* Additional info if needed */}
                                </div>
                            </div>

                            {/* Avatar Stack */}
                            <div className="shrink-0 flex -space-x-1.5">
                                <AssigneeStack
                                    assignees={(content.assigneeIds || [content.assigneeId || '']).filter(Boolean).map(id => {
                                        const user = activeTeam.find(u => u.id === id) || { name: id };
                                        return {
                                            id: id,
                                            name: user.name,
                                            color: teamMemberColors[user.name] || teamMemberColors[id] || '#888'
                                        };
                                    })}
                                    size={20}
                                    max={2}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function KPICard({ label, value, color = "text-[var(--color-ink)]", bg = "bg-[var(--color-card)]" }: { label: string, value: number, color?: string, bg?: string }) {
    return (
        <div className={cn(
            "border border-[var(--color-border)] rounded-xl p-2 flex flex-col items-center justify-center text-center h-[60px] transition-all hover:scale-105 cursor-default",
            bg === "bg-[var(--color-card)]" ? "bg-[var(--color-card)] hover:bg-[var(--color-surface-2)]" : bg
        )}>
            <span className={cn("text-lg font-bold leading-none mb-1.5", color)}>{value}</span>
            <span className={cn("text-[9px] font-medium uppercase tracking-wider leading-none opacity-80", color.replace('text-', 'text-'))}>{label}</span>
        </div>
    );
}
