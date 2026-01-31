import React from 'react';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/content/icons';
import { cn } from '@/lib/utils';
import { brands } from '@/lib/data';

interface ContentFilterBarProps {
    searchQuery: string;
    onSearchChange: (val: string) => void;
    filterBrand: string;
    onFilterBrandChange: (val: string) => void;
    filterStatus: string;
    onFilterStatusChange: (val: string) => void;
    filterAssignee: string;
    onFilterAssigneeChange: (val: string) => void;
    viewMode: 'list' | 'calendar' | 'team' | 'archive' | 'tasks' | 'studio';
    onViewModeChange: (mode: 'list' | 'calendar' | 'team' | 'archive' | 'tasks' | 'studio') => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activeTeam?: any[];
}

export function ContentFilterBar({
    searchQuery, onSearchChange,
    filterBrand, onFilterBrandChange,
    filterStatus, onFilterStatusChange,
    filterAssignee, onFilterAssigneeChange,
    viewMode, onViewModeChange
}: ContentFilterBarProps) {
    const router = useRouter(); // Navigation active

    const handleNavigation = (target: string) => {
        if (target === 'tasks') router.push('/dashboard/tasks');
        else if (target === 'calendar') router.push('/dashboard/calendar');
        else if (target === 'studio') router.push('/dashboard/studio');
        else if (target === 'list' || target === 'archive') {
            // If we are already on content-production, we might want to switch view (handled by parent if parent is ContentProduction)
            // But if we are on Tasks/Calendar, we MUST navigate.
            // We can check pathname if we want, but simpler to just push if viewMode is not matching.
            // Actually, the parent passes `onViewModeChange`.
            // If the parent IS `ContentProductionPageClient`, it handles it.
            // If the parent IS `TasksPageClient` (viewMode='tasks'), calling `onViewModeChange` does nothing (empty function).
            // So we should navigate.
            if (viewMode === 'tasks' || viewMode === 'calendar' || viewMode === 'studio') {
                router.push('/dashboard/content-production');
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onViewModeChange(target as any);
            }
        }
    };

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-1 mb-4 sticky top-0 z-30 backdrop-blur-md bg-[var(--color-background)]/80">
            {/* LEFT: Search & Filters */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                {/* Search */}
                <div className="relative w-full md:w-64 shrink-0 group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--color-muted)] group-focus-within:text-[var(--color-primary)] transition-colors">
                        {Icons.Search}
                    </div>
                    <input
                        type="text"
                        placeholder="İçerik ara..."
                        className="w-full h-10 pl-9 pr-3 text-sm bg-[var(--control-bg)] border border-[var(--control-border)] rounded-lg focus:outline-none focus:border-[var(--color-primary)] placeholder:text-[var(--color-muted)] transition-all text-[var(--control-text)]"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                <div className="h-6 w-[1px] bg-[var(--divider)] mx-1 hidden md:block"></div>

                <Select
                    value={filterBrand}
                    onChange={onFilterBrandChange}
                    options={[
                        { value: 'all', label: 'Tüm Markalar' },
                        ...brands.map(b => ({ value: b.id, label: b.name }))
                    ]}
                />
                <Select
                    value={filterStatus}
                    onChange={onFilterStatusChange}
                    options={[
                        { value: 'all', label: 'Tüm Durumlar' },
                        { value: 'TODO', label: 'Yapılacaklar' },
                        { value: 'DONE', label: 'Tamamlananlar' }
                    ]}
                />

                {/* Reset Link */}
                {(filterBrand !== 'all' || filterStatus !== 'all' || filterAssignee !== 'all') && (
                    <button
                        onClick={() => {
                            onFilterBrandChange('all');
                            onFilterStatusChange('all');
                            onFilterAssigneeChange('all');
                        }}
                        className="text-xs text-[var(--color-muted)] hover:text-[var(--color-error)] underline whitespace-nowrap px-2"
                    >
                        Sıfırla
                    </button>
                )}
            </div>

            {/* RIGHT: View Modes (Switchers) */}
            <div className="flex items-center gap-2 shrink-0 overflow-x-auto no-scrollbar">
                <div className="flex items-center bg-[var(--control-bg)] p-1 rounded-lg border border-[var(--control-border)] h-10">
                    <ViewBtn active={viewMode === 'list'} onClick={() => handleNavigation('list')} label="Liste" />
                    <ViewBtn active={viewMode === 'tasks'} onClick={() => handleNavigation('tasks')} label="Görevler" />
                    <ViewBtn active={viewMode === 'calendar'} onClick={() => handleNavigation('calendar')} label="Takvim" />
                    <ViewBtn active={viewMode === 'studio'} onClick={() => handleNavigation('studio')} label="Stüdyo" />
                    <div className="w-[1px] h-4 bg-[var(--divider)] mx-1"></div>
                    <ViewBtn active={viewMode === 'archive'} onClick={() => handleNavigation('archive')} label="Arşiv" />
                </div>
            </div>

            {/* Mobile Filter Toggle (Visible only on mobile) */}
            <button className="md:hidden p-2 text-[var(--color-text)] border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
                Filtreler
            </button>
        </div>
    );
}

function Select({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: { value: string, label: string }[] }) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-9 pl-3 pr-8 text-xs font-medium bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg appearance-none text-[var(--color-ink)] hover:bg-[var(--color-surface-2)] cursor-pointer focus:outline-none focus:border-[var(--color-primary)] min-w-[120px]"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-muted)]">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
        </div>
    );
}

function ViewBtn({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                active
                    ? "bg-[var(--color-card)] text-[var(--color-primary)] shadow-sm"
                    : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            )}
        >
            {label}
        </button>
    );
}
