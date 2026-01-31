'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui'; // Keep basic UI
import { contentStatuses, brands, ContentStatus, ContentType, getSimpleStatus } from '@/lib/data';
import { ContentDetailPanel } from '@/components/content/ContentDetailPanel';
import { NewContentModal } from '@/components/content/NewContentModal';
import { ContentQueuePanel } from '@/components/content/ContentQueuePanel';
import { ContentFilterBar } from '@/components/content/ContentFilterBar';

import { getActiveTeamMembers, User as DBUser } from '@/lib/actions/users';
import { getContents, updateContent as updateContentDB, deleteContent as deleteContentDB } from '@/lib/actions/content';
import { getMemberColors } from '@/lib/actions/userSettings';

// ===== TIPI =====
export interface ContentItem {
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
    brandName?: string;
}

interface NoteHistoryEntry {
    id: string;
    contentId: string;
    user: string;
    action: string;
    note?: string;
    timestamp: string;
}

const initialContents: ContentItem[] = [];

export function ContentProductionPageClient() {
    // 1. STATE
    const [contents, setContents] = useState<ContentItem[]>(initialContents);
    const [isLoading, setIsLoading] = useState(true);

    // UI State
    const [showModal, setShowModal] = useState(false);
    const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'team' | 'archive' | 'tasks' | 'studio'>('list');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBrand, setFilterBrand] = useState('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'TODO' | 'DONE'>('all');
    const [filterAssignee, setFilterAssignee] = useState('all');

    // Data
    const [currentUser, setCurrentUser] = useState<{ name: string; id: string } | null>(null);
    const [activeTeam, setActiveTeam] = useState<DBUser[]>([]);
    const [teamMemberColors, setTeamMemberColors] = useState<Record<string, string>>({});
    const [noteHistory, setNoteHistory] = useState<NoteHistoryEntry[]>([]);
    const [editingNotes, setEditingNotes] = useState('');

    const searchParams = useSearchParams();

    // 2. DATA FETCHING
    useEffect(() => {
        // Load User
        const userStr = localStorage.getItem('currentUser');
        if (userStr) setCurrentUser(JSON.parse(userStr));

        // Load Team
        getActiveTeamMembers().then(setActiveTeam);

        // Load Colors & History
        getMemberColors().then(setTeamMemberColors).catch(console.error);
        const savedHistory = localStorage.getItem('noco_note_history');
        if (savedHistory) setNoteHistory(JSON.parse(savedHistory));

        // Load Contents
        const loadContents = async () => {
            setIsLoading(true);
            try {
                const dbContents = await getContents();
                if (dbContents) {
                    setContents(dbContents.map(c => ({
                        id: c.id,
                        title: c.title,
                        brandId: c.brandId,
                        status: c.status as ContentStatus,
                        type: c.type as ContentType,
                        notes: c.notes || '',
                        deliveryDate: c.deliveryDate,
                        publishDate: c.publishDate,
                        assigneeId: c.assigneeId,
                        assigneeIds: c.assigneeIds || (c.assigneeId ? [c.assigneeId] : []),
                    })));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadContents();
    }, []);

    // Open Modal from URL
    useEffect(() => {
        if (searchParams.get('action') === 'new') setShowModal(true);
    }, [searchParams]);

    // Update editing notes when selection changes
    useEffect(() => {
        if (selectedContent) setEditingNotes(selectedContent.notes || '');
    }, [selectedContent]);

    // 3. FILTER LOGIC
    const archivedStatuses: ContentStatus[] = ['PAYLASILD', 'TESLIM'];

    const filteredContents = contents.filter(c => {
        // Search
        if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        // Brand
        if (filterBrand !== 'all' && c.brandId !== filterBrand) return false;

        // Status Category
        if (filterStatus !== 'all' && getSimpleStatus(c.status) !== filterStatus) return false;

        // Assignee
        if (filterAssignee === 'me' && currentUser) {
            const ids = c.assigneeIds || [];
            if (!ids.includes(currentUser.id) && !ids.includes(currentUser.name) && c.assigneeId !== currentUser.id) return false;
        } else if (filterAssignee !== 'all' && filterAssignee !== 'me') {
            const ids = c.assigneeIds || [];
            if (!ids.includes(filterAssignee) && c.assigneeId !== filterAssignee) return false;
        }

        // View Mode Filtering
        if (viewMode === 'archive') return archivedStatuses.includes(c.status);
        if (archivedStatuses.includes(c.status)) return false; // Hide archived in normal views

        // Tab Logic (Placeholders to demonstrate functionality)
        if (viewMode === 'tasks') {
            // Show only things that are 'Pending' / TODO
            return getSimpleStatus(c.status) === 'TODO';
        }
        if (viewMode === 'studio') {
            // Show only Studio related types
            return ['VIDEO', 'FOTOGRAF', 'PODCAST'].includes(c.type);
        }

        return true;
    });

    // 4. HANDLERS
    const updateNotes = async (id: string, note: string) => {
        setContents(prev => prev.map(c => c.id === id ? { ...c, notes: note } : c));
        // Log & DB Update logic (simplified for brevity, kept same logic)
        try { await updateContentDB(id, { notes: note }); } catch (e) { console.error(e); }
    };

    const updateStatus = async (id: string, status: ContentStatus) => {
        setContents(prev => prev.map(c => c.id === id ? { ...c, status } : c));
        try { await updateContentDB(id, { status }); } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Silmek istediğinize emin misiniz?')) {
            try {
                await deleteContentDB(id);
                setContents(prev => prev.filter(c => c.id !== id));
                if (selectedContent?.id === id) setSelectedContent(null);
            } catch (e) { console.error(e); }
        }
    };

    // 5. RENDER
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[var(--color-background)]">
            {/* Header (Slim & Fixed) */}
            <div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-background)] z-20">
                <Header
                    title="Üretim Paneli"
                    subtitle="Üretim akışı ve teslimatlar"
                    actions={
                        <div className="flex items-center gap-3">
                            <Button variant="secondary" size="sm" onClick={() => { }}>Marka Ekle</Button>
                            <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>+ Yeni İçerik</Button>
                        </div>
                    }
                />

                {/* Filter Bar (Sticky below header) */}
                <div className="px-4 pb-2">
                    <ContentFilterBar
                        searchQuery={searchQuery} onSearchChange={setSearchQuery}
                        filterBrand={filterBrand} onFilterBrandChange={setFilterBrand}
                        filterStatus={filterStatus} onFilterStatusChange={(v: any) => setFilterStatus(v)}
                        filterAssignee={filterAssignee} onFilterAssigneeChange={setFilterAssignee}
                        viewMode={viewMode} onViewModeChange={setViewMode}
                        activeTeam={activeTeam}
                    />
                </div>
            </div>

            {/* MAIN CANVAS (Split View) */}
            <div className="flex-1 overflow-hidden">
                <div className="grid grid-cols-12 h-full">
                    {/* LEFT PANEL: Queue (Always visible on Desktop. On Mobile, visible if no selection) */}
                    <div className={`col-span-12 lg:col-span-8 h-full overflow-hidden flex flex-col border-r border-[var(--color-border)] bg-[var(--color-background)] px-4 pt-2 ${selectedContent ? 'hidden lg:flex' : 'flex'}`}>
                        <ContentQueuePanel
                            contents={filteredContents}
                            selectedId={selectedContent?.id || null}
                            onSelect={setSelectedContent}
                            activeTeam={activeTeam}
                            teamMemberColors={teamMemberColors}
                        />
                    </div>

                    {/* RIGHT PANEL: Detail (Visible on Desktop. On Mobile, acts as full page/sheet) */}
                    <div className={`col-span-12 lg:col-span-4 h-full bg-[var(--color-surface)] lg:block ${selectedContent ? 'block fixed inset-0 z-50 lg:static' : 'hidden'}`}>
                        {selectedContent ? (
                            <div className="h-full flex flex-col">
                                {/* Mobile Back Button */}
                                <div className="lg:hidden p-4 border-b border-[var(--color-border)] flex items-center gap-2 bg-[var(--color-surface)]">
                                    <button onClick={() => setSelectedContent(null)} className="p-2 -ml-2 text-[var(--color-muted)] hover:text-[var(--color-ink)]">
                                        ← Geri (Listeye Dön)
                                    </button>
                                </div>
                                <ContentDetailPanel
                                    content={selectedContent}
                                    onClose={() => setSelectedContent(null)}
                                    onUpdateStatus={updateStatus}
                                    onUpdateNotes={updateNotes}
                                    onDelete={handleDelete}
                                    noteHistory={noteHistory}
                                    teamMemberColors={teamMemberColors}
                                    activeTeam={activeTeam}
                                    currentUser={currentUser}
                                />
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-[var(--color-muted)] p-8 text-center">
                                <div className="w-12 h-12 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mb-4">
                                    <span className="text-2xl">👈</span>
                                </div>
                                <p className="font-medium">Detayları görmek için soldan bir içerik seçin.</p>
                                <p className="text-xs mt-2 opacity-60">Arama veya filtre ile listenizi daraltabilirsiniz.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODALS */}
            <NewContentModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={(savedContent) => {
                    if (selectedContent) {
                        setContents(prev => prev.map(c => c.id === savedContent.id ? { ...savedContent, notes: savedContent.notes || '' } as ContentItem : c));
                    } else {
                        setContents(prev => [savedContent as ContentItem, ...prev]);
                    }
                }}
                initialContent={null}
            />
        </div>
    );
}
