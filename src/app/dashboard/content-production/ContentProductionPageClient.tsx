'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Badge, Modal, Input, Select, Textarea, MiniCalendar, MultiSelect, ColorPicker } from '@/components/ui';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { AssigneeStack } from '@/components/ui/AssigneeStack';
import { brands, getBrandColor, getBrandName, contentStatuses, contentTypes, ContentStatus, ContentType, getSimpleStatus, getStagesForType } from '@/lib/data';
import { ContentDetailPanel } from '@/components/content/ContentDetailPanel';
import { NewContentModal } from '@/components/content/NewContentModal';

import { getActiveTeamMembers, User as DBUser } from '@/lib/actions/users';
import { getContents, createContent, updateContent as updateContentDB, deleteContent as deleteContentDB, ContentItem as DBContentItem, getBrandSuggestions, createContentWithBrand } from '@/lib/actions/content';
import { getMemberColors, saveMemberColors } from '@/lib/actions/userSettings';
import { StatusIcons, TypeIcons, Icons } from '@/components/content/icons';

// ===== TİPLER =====
interface ContentItem {
    id: string;
    title: string;
    brandId: string;
    status: ContentStatus;
    type: ContentType;
    notes: string;
    deliveryDate?: string;
    publishDate?: string;
    assigneeIds?: string[];  // Çoklu atama desteği
    assigneeId?: string;     // Geriye uyumluluk
    brandName?: string;      // UI helper
}

interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    action: string;
    target: string;
    timestamp: string;
}

interface NoteHistoryEntry {
    id: string;
    contentId: string;
    user: string;
    action: string;
    note?: string;
    timestamp: string;
}

// GERÇEK VERİLER - İçerik Takvimi 2025
const initialContents: ContentItem[] = [];

const initialActivities: ActivityLog[] = [
    { id: 'a1', userId: '3', userName: 'Şeyma Bora', action: 'video paylaştı', target: 'Valora Post 1', timestamp: '2025-11-18T14:30:00' },
    { id: 'a2', userId: '4', userName: 'Fatih Ustaosmanoğlu', action: 'çekim tamamladı', target: 'Tevfik Usta Çekim Günü', timestamp: '2025-12-01T17:00:00' },
    { id: 'a3', userId: '6', userName: 'Ahmet Gürkan Turhan', action: 'rapor teslim etti', target: 'Raporlar - Zoks, İkra, Zeytindalı, Valora', timestamp: '2025-12-03T10:00:00' },
    { id: 'a4', userId: '5', userName: 'Ayşegül Güler', action: 'video kurguladı', target: 'Zoks Video 3', timestamp: '2025-11-24T15:00:00' },
];

export function ContentProductionPageClient() {
    const [contents, setContents] = useState<ContentItem[]>(initialContents);
    const [activities] = useState<ActivityLog[]>(initialActivities);
    const [showModal, setShowModal] = useState(false);
    // const [showBrandModal, setShowBrandModal] = useState(false); // Removed
    const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
    const [filterBrand, setFilterBrand] = useState('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'TODO' | 'DONE'>('all');
    const [filterAssignee, setFilterAssignee] = useState('all'); // 'all', 'me', veya kişi ismi
    const [currentUser, setCurrentUser] = useState<{ name: string; id: string } | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'team' | 'archive'>('list');

    // URL Query Params handling for auto-opening modal
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const action = searchParams.get('action');
        if (action === 'new') {
            setShowModal(true);
            // URL'den parametreyi temizle (opsiyonel, sayfa yenilendiğinde tekrar açılmasın diye)
            // router.replace('/dashboard/content-production'); 
            // Not: Kullanıcı geri gelirse modal açık kalsın mı? Şimdilik kalsın.
        }
    }, [searchParams]);

    // Kullanıcı bilgilerini localStorage'dan al
    React.useEffect(() => {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
        }
    }, []);

    // Marka yönetimi
    // Marka yönetimi
    const [customBrands, setCustomBrands] = useState<typeof brands>([]);
    // const [newBrandName, setNewBrandName] = useState(''); // Removed
    // const [newBrandColor, setNewBrandColor] = useState('#329FF5'); // Removed

    // Form states moved to NewContentModal

    // Inline editing states
    const [editingNotes, setEditingNotes] = useState('');
    const [noteHistory, setNoteHistory] = useState<NoteHistoryEntry[]>([]);

    // Kişi renkleri (Supabase'ten yükle)
    // Kişi renkleri state
    // Kişi renkleri state
    const [teamMemberColors, setTeamMemberColors] = useState<Record<string, string>>({});
    // const [showColorSettings, setShowColorSettings] = useState(false); // Removed
    const [activeTeam, setActiveTeam] = useState<DBUser[]>([]);

    useEffect(() => {
        getActiveTeamMembers().then(data => {
            console.log('Active Team Loaded:', data);
            setActiveTeam(data);
        });
    }, []);

    // Tüm markalar = varsayılan + custom
    const allBrands = [...brands, ...customBrands];
    const activeBrands = allBrands.filter(b => b.active);

    // Custom brands localStorage'dan yükle
    React.useEffect(() => {
        const savedBrands = localStorage.getItem('noco_custom_brands');
        if (savedBrands) {
            try {
                setCustomBrands(JSON.parse(savedBrands));
            } catch (e) {
                console.error('Custom brands yüklenemedi');
            }
        }
    }, []);

    // Custom brands değiştiğinde kaydet
    React.useEffect(() => {
        if (customBrands.length > 0) {
            localStorage.setItem('noco_custom_brands', JSON.stringify(customBrands));
        }
    }, [customBrands]);

    // Helper functions removed (moved to System)
    // Brands loaded for display only.

    // Supabase'den veri yükle (sayfa açıldığında)
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadContents = async () => {
            try {
                setIsLoading(true);
                const dbContents = await getContents();
                if (dbContents && dbContents.length > 0) {
                    // Supabase'ten gelen verileri kullan
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
                // Note history için localStorage kullanmaya devam et
                const savedHistory = localStorage.getItem('noco_note_history');
                if (savedHistory) {
                    try {
                        setNoteHistory(JSON.parse(savedHistory));
                    } catch (e) {
                        console.error('Note history yüklenemedi');
                    }
                }
                // Member colors Supabase'ten yükle
                try {
                    const colors = await getMemberColors();
                    setTeamMemberColors(colors);
                } catch (e) {
                    console.error('Member colors yüklenemedi:', e);
                }
            } catch (error) {
                console.error('Supabase veri yüklenemedi:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadContents();
    }, []);

    // noteHistory değiştiğinde localStorage'a kaydet
    useEffect(() => {
        if (noteHistory.length > 0) {
            localStorage.setItem('noco_note_history', JSON.stringify(noteHistory));
        }
    }, [noteHistory]);

    // selectedContent değiştiğinde editingNotes'u güncelle
    React.useEffect(() => {
        if (selectedContent) {
            setEditingNotes(selectedContent.notes || '');
        }
    }, [selectedContent]);
    // Bugünün tarihini al
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Tamamlanmış durumlar (arşive gidecekler)
    const archivedStatuses: ContentStatus[] = ['PAYLASILD', 'TESLIM'];

    // Geçmiş tarihli mi kontrol et (ACİL badge için)
    const isOverdue = (content: ContentItem) => {
        if (!content.deliveryDate) return false;
        const deliveryDate = new Date(content.deliveryDate);
        deliveryDate.setHours(0, 0, 0, 0);
        return deliveryDate < today && !archivedStatuses.includes(content.status);
    };

    const filteredContents = contents.filter(c => {
        if (filterBrand !== 'all' && c.brandId !== filterBrand) return false;
        if (filterStatus !== 'all' && getSimpleStatus(c.status) !== filterStatus) return false;
        // Atanan kişi filtresi
        // Atanan kişi filtresi
        if (filterAssignee === 'me' && currentUser) {
            // Check both ID (new standard) and Name (legacy)
            if (c.assigneeId !== currentUser.id && c.assigneeId !== currentUser.name) {
                // Check array as well
                if (!c.assigneeIds?.includes(currentUser.id) && !c.assigneeIds?.includes(currentUser.name)) return false;
            }
        } else if (filterAssignee !== 'all' && filterAssignee !== 'me') {
            // filterAssignee is now an ID (e.g., 'user-studio')
            if (c.assigneeId !== filterAssignee && !c.assigneeIds?.includes(filterAssignee)) return false;
        }

        // Arşiv modu: Sadece PAYLASILD veya TESLIM olanlar
        if (viewMode === 'archive') {
            return archivedStatuses.includes(c.status);
        }

        // Normal modlarda: Arşivdekileri gösterme
        if (archivedStatuses.includes(c.status)) {
            return false;
        }

        return true;
    });


    const openModal = (content?: ContentItem) => {
        setSelectedContent(content || null);
        setShowModal(true);
    };

    const handleBrandInput = useCallback(async (value: string) => {
        // ... (unused handlers can be removed later but keeping for safety if referenced elsewhere, checking...)
        // Actually handleBrandInput is passed to Input which is removed. Removing handlers too.
    }, []);

    // Handlers moved to NewContentModal

    // saveContent moved to NewContentModal

    const updateNotes = async (id: string, note: string) => {
        // Optimistic update
        setContents(prev => prev.map(c => c.id === id ? { ...c, notes: note } : c));

        // Log history
        const timestamp = new Date().toISOString();
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        setNoteHistory(prev => [...prev, {
            id: Date.now().toString(),
            contentId: id,
            user: user.name || 'Anonim',
            action: 'Not güncelledi',
            note: note,
            timestamp
        }]);

        try {
            await updateContentDB(id, { notes: note });
        } catch (error) {
            console.error('Not güncellenemedi:', error);
        }
    };

    const updateStatus = async (id: string, status: ContentStatus) => {
        // Önce UI'ı güncelle (iyimser güncelleme)
        setContents(contents.map(c => c.id === id ? { ...c, status } : c));
        // Sonra DB'ye kaydet
        try {
            await updateContentDB(id, { status });
        } catch (error) {
            console.error('Status güncellenemedi:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteContentDB(id);
            setContents(prev => prev.filter(c => c.id !== id));
            if (selectedContent?.id === id) {
                setSelectedContent(null);
            }
        } catch (error) {
            console.error('İçerik silinemedi:', error);
            alert('Silme işlemi başarısız oldu.');
        }
    };

    // İstatistikler
    const stats = {
        total: contents.length,
        planned: contents.filter(c => c.status === 'PLANLANDI').length,
        edited: contents.filter(c => c.status === 'KURGULANDI').length,
        published: contents.filter(c => c.status === 'PAYLASILD' || c.status === 'TESLIM').length,
    };

    // Marka bazlı grupla
    const contentsByBrand = activeBrands.map(b => ({
        ...b,
        contents: contents.filter(c => c.brandId === b.id),
        count: contents.filter(c => c.brandId === b.id).length
    })).filter(b => b.count > 0).sort((a, b) => b.count - a.count);

    return (
        <>
            <Header
                title="İş Yönetimi"
                subtitle="Merkezi İçerik Takibi"
                actions={
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                        {/* View Mode - Segmented Control */}
                        <div style={{
                            display: 'flex',
                            backgroundColor: 'var(--color-surface)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '2px',
                            border: '1px solid var(--color-border)'
                        }}>
                            <Button variant={viewMode === 'list' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>Liste</Button>
                            <Button variant={viewMode === 'calendar' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('calendar')}>Takvim</Button>
                            <Button variant={viewMode === 'team' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('team')}>Ekip</Button>
                            <Button variant={viewMode === 'archive' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('archive')} style={{ opacity: 0.7 }}>Arşiv</Button>
                        </div>
                        {/* Separator */}
                        {/* Separator */}
                        <div style={{ width: 1, height: 24, backgroundColor: 'var(--color-border)' }} />
                        {/* Actions */}
                        {/* Renk ve Marka ayarları System paneline taşındı */}
                        <Button variant="primary" onClick={() => openModal()}>+ Yeni İçerik</Button>
                    </div>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* İstatistikler */}
                {/* İstatistikler */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <GlassCard className="py-5 px-3 flex flex-col items-center justify-center text-center scale-95 hover:scale-100 transition-transform duration-300 relative overflow-hidden group" glowOnHover glowColor="blue">
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="text-3xl font-bold text-white mb-1 group-hover:scale-110 transition-transform duration-300">{stats.total}</div>
                        <div className="text-[10px] font-bold text-white/40 tracking-widest uppercase">TOPLAM</div>
                    </GlassCard>

                    <GlassCard className="py-5 px-3 flex flex-col items-center justify-center text-center scale-95 hover:scale-100 transition-transform duration-300 relative overflow-hidden group" glowOnHover glowColor="blue">
                        <div className="absolute inset-0 bg-[#329FF5]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="text-3xl font-bold text-[#329FF5] mb-1 group-hover:scale-110 transition-transform duration-300">{stats.planned}</div>
                        <div className="text-[10px] font-bold text-[#329FF5]/60 tracking-widest uppercase">PLANLANACAK</div>
                    </GlassCard>

                    <GlassCard className="py-5 px-3 flex flex-col items-center justify-center text-center scale-95 hover:scale-100 transition-transform duration-300 relative overflow-hidden group" glowOnHover glowColor="blue">
                        <div className="absolute inset-0 bg-[#F6D73C]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="text-3xl font-bold text-[#F6D73C] mb-1 group-hover:scale-110 transition-transform duration-300">{stats.edited}</div>
                        <div className="text-[10px] font-bold text-[#F6D73C]/60 tracking-widest uppercase">KURGULANDI</div>
                    </GlassCard>

                    <GlassCard className="py-5 px-3 flex flex-col items-center justify-center text-center scale-95 hover:scale-100 transition-transform duration-300 relative overflow-hidden group" glowOnHover glowColor="green">
                        <div className="absolute inset-0 bg-[#00F5B0]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="text-3xl font-bold text-[#00F5B0] mb-1 group-hover:scale-110 transition-transform duration-300">{stats.published}</div>
                        <div className="text-[10px] font-bold text-[#00F5B0]/60 tracking-widest uppercase">PAYLAŞILDI</div>
                    </GlassCard>
                </div>

                {/* Filtreler */}
                <GlassSurface className="flex flex-wrap items-center gap-4 p-4 rounded-2xl mb-6 relative z-10" intensity="light">
                    <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50 text-white min-w-[140px] transition-colors hover:bg-white/10">
                        <option value="all" className="bg-slate-900">Tüm Markalar</option>
                        {activeBrands.map(b => <option key={b.id} value={b.id} className="bg-slate-900">{b.name}</option>)}
                    </select>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'all' | 'TODO' | 'DONE')} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50 text-white min-w-[140px] transition-colors hover:bg-white/10">
                        <option value="all" className="bg-slate-900">Tüm Durumlar</option>
                        <option value="TODO" className="bg-slate-900">Yapılacaklar</option>
                        <option value="DONE" className="bg-slate-900">Tamamlananlar</option>
                    </select>
                    {/* Sorumlu filtresi */}
                    <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50 text-white min-w-[140px] transition-colors hover:bg-white/10" style={{ border: filterAssignee === 'me' ? '1px solid #00F5B0' : '1px solid rgba(255,255,255,0.1)' }}>
                        <option value="all" className="bg-slate-900">Tüm Sorumlular</option>
                        <option value="me" className="bg-slate-900">Bana Atananlar</option>
                        {activeTeam.map(t => <option key={t.id} value={t.id} className="bg-slate-900">{t.name}</option>)}
                    </select>
                    {/* Hızlı marka filtreleri */}
                    <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
                        {contentsByBrand.slice(0, 6).map(b => (
                            <button key={b.id} onClick={() => setFilterBrand(filterBrand === b.id ? 'all' : b.id)} style={{ padding: '6px 12px', borderRadius: 20, border: filterBrand === b.id ? `2px solid ${b.color}` : '1px solid var(--color-border)', backgroundColor: filterBrand === b.id ? b.color + '20' : 'rgba(255,255,255,0.05)', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}>
                                {b.name.split(' ')[0]} ({b.count})
                            </button>
                        ))}
                    </div>
                </GlassSurface>

                {(viewMode === 'list' || viewMode === 'archive') && (
                    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
                        <div>
                            {filteredContents.map(content => {
                                const brandColor = getBrandColor(content.brandId);
                                const brandName = getBrandName(content.brandId);
                                const isSelected = selectedContent?.id === content.id;
                                return (
                                    <GlassSurface
                                        key={content.id}
                                        onClick={() => setSelectedContent(content)}
                                        className={`group relative flex items-center justify-between p-4 mb-3 rounded-xl cursor-pointer transition-all duration-300 border-l-[4px] border-l-[${brandColor}] hover:translate-y-[-2px] hover:shadow-lg`}
                                        style={{ borderLeftColor: brandColor }}
                                        intensity="light"
                                        glowOnHover
                                        glowColor="blue"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <span className="text-muted-foreground bg-white/5 p-3 rounded-lg flex items-center justify-center w-10 h-10 group-hover:bg-white/10 transition-colors">{TypeIcons[content.type as ContentType] || TypeIcons['VIDEO']}</span>
                                            <div>
                                                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{content.title}</p>
                                                <div style={{ fontSize: 12, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                                    <span style={{ backgroundColor: brandColor + '20', color: brandColor, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 500 }}>{brandName}</span>
                                                    {content.deliveryDate && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="text-white/60 font-medium">{Icons.Calendar} {new Date(content.deliveryDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>}
                                                    {/* Atanan kişiler */}
                                                    <div className="flex -space-x-2 ml-1">
                                                        <AssigneeStack
                                                            assignees={(content.assigneeIds || (content.assigneeId ? [content.assigneeId] : [])).map((id: string) => {
                                                                // Find user in activeTeam to get real name
                                                                const user = activeTeam.find(u => u.id === id);
                                                                const name = user ? user.name : id;
                                                                return {
                                                                    id: id,
                                                                    name: name,
                                                                    color: teamMemberColors[name] || teamMemberColors[id]
                                                                };
                                                            })}
                                                            size={24}
                                                            max={4}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {isOverdue(content) && <Badge style={{ backgroundColor: '#E13A3A', color: 'white', fontWeight: 700, padding: '4px 8px', fontSize: 10 }}>ACİL</Badge>}
                                            <Badge style={{ backgroundColor: contentStatuses[content.status].color + '20', color: contentStatuses[content.status].color, border: `1px solid ${contentStatuses[content.status].color}40`, padding: '4px 8px', fontSize: 11 }}>{contentStatuses[content.status].label}</Badge>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openModal({ ...content, brandName }); }}
                                                title="Düzenle"
                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-white"
                                            >{Icons.Edit}</button>
                                        </div>
                                    </GlassSurface>
                                );
                            })}
                        </div>

                        {/* SAĞ PANEL: Seçili İçerik Detayları */}
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
                )}

                {viewMode === 'calendar' && (
                    <Card>
                        <CardHeader title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{Icons.Calendar} Teslim Takvimi</div>} />
                        <CardContent>
                            {filteredContents.filter(c => c.deliveryDate).sort((a, b) => (a.deliveryDate || '').localeCompare(b.deliveryDate || '')).map(c => {
                                const brandColor = getBrandColor(c.brandId);
                                const brandName = getBrandName(c.brandId);
                                return (
                                    <div key={c.id} style={{ display: 'flex', gap: 16, padding: 12, backgroundColor: 'var(--color-surface)', borderRadius: 8, marginBottom: 8, borderLeft: `4px solid ${brandColor}` }}>
                                        <div style={{ minWidth: 60, textAlign: 'center', padding: 8, backgroundColor: 'var(--color-card)', borderRadius: 8 }}>
                                            <p style={{ fontSize: 20, fontWeight: 700 }}>{new Date(c.deliveryDate!).getDate()}</p>
                                            <p style={{ fontSize: 10, color: 'var(--color-muted)' }}>{new Date(c.deliveryDate!).toLocaleString('tr-TR', { month: 'short' })}</p>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <span style={{ backgroundColor: brandColor, color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>{brandName}</span>
                                                {isOverdue(c) && <Badge style={{ backgroundColor: '#E13A3A', color: 'white', fontSize: 10, fontWeight: 700 }}>ACİL</Badge>}
                                                <Badge style={{ backgroundColor: contentStatuses[c.status].color, color: 'white', fontSize: 10 }}>{contentStatuses[c.status].label}</Badge>
                                            </div>
                                            <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>{TypeIcons[c.type as ContentType]} {c.title}</p>
                                            {c.notes && <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>{c.notes}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}

                {viewMode === 'team' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
                        {activeTeam.map(member => {
                            const tasks = contents.filter(c => {
                                if (c.status === 'PAYLASILD') return false;
                                const assignees = c.assigneeIds || (c.assigneeId ? [c.assigneeId] : []);
                                return assignees.some(id => id === member.id || id === member.name);
                            });
                            return (
                                <Card key={member.id}>
                                    <CardHeader title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{member.name.charAt(0)}</span><div><p style={{ fontWeight: 600 }}>{member.name}</p><p style={{ fontSize: 11, color: 'var(--color-muted)' }}>{member.email}</p></div></div>} action={<Badge variant={member.role === 'OPS' ? 'warning' : 'info'}>{member.role}</Badge>} />
                                    <CardContent>
                                        {tasks.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: 12 }}>Atanmış görev yok</p> : tasks.map(t => {
                                            const brandColor = getBrandColor(t.brandId);
                                            const brandName = getBrandName(t.brandId);
                                            return (
                                                <div key={t.id} style={{ padding: 10, backgroundColor: 'var(--color-surface)', borderRadius: 8, marginBottom: 8, borderLeft: `3px solid ${contentStatuses[t.status].color}` }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontWeight: 500, fontSize: 13 }}>{t.title}</span>
                                                        <Badge style={{ backgroundColor: brandColor, color: 'white', fontSize: 10 }}>{brandName.split(' ')[0]}</Badge>
                                                    </div>
                                                    <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        {StatusIcons[t.status as ContentStatus] || Icons.Activity} {contentStatuses[t.status].label} {t.deliveryDate && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>• {Icons.Calendar} {new Date(t.deliveryDate).toLocaleDateString('tr-TR')}</span>}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                        <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 12, textAlign: 'right' }}>{tasks.length} aktif görev</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <NewContentModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={(savedContent) => {
                    // Update local state based on saved content
                    if (selectedContent) {
                        setContents(prev => prev.map(c => c.id === savedContent.id ? { ...savedContent, notes: savedContent.notes || '' } as ContentItem : c));
                    } else {
                        setContents(prev => [savedContent as ContentItem, ...prev]);
                    }
                }}
                initialContent={selectedContent}
            />
        </>
    );

}
