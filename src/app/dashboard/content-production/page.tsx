'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Badge, Modal, Input, Select, Textarea, MiniCalendar, MultiSelect, ColorPicker } from '@/components/ui';
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

export default function ContentProductionPage() {
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
        getActiveTeamMembers().then(setActiveTeam);
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
        if (filterAssignee === 'me' && currentUser) {
            if (c.assigneeId !== currentUser.name) return false;
        } else if (filterAssignee !== 'all' && filterAssignee !== 'me') {
            if (c.assigneeId !== filterAssignee) return false;
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

    // İstatistikler
    const stats = {
        total: contents.length,
        cekildi: contents.filter(c => c.status === 'CEKILDI').length,
        kurgulaniyor: contents.filter(c => c.status === 'KURGULANIYOR').length,
        paylasild: contents.filter(c => c.status === 'PAYLASILD').length,
        planlandi: contents.filter(c => c.status === 'PLANLANDI').length,
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    <Card><CardContent><div style={{ textAlign: 'center' }}><p style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-primary)' }}>{stats.total}</p><p style={{ color: 'var(--color-muted)', fontSize: 12 }}>Toplam</p></div></CardContent></Card>
                    <Card><CardContent><div style={{ textAlign: 'center' }}><p style={{ fontSize: 32, fontWeight: 700, color: '#6B7B80' }}>{stats.cekildi}</p><p style={{ color: 'var(--color-muted)', fontSize: 12 }}>Çekildi</p></div></CardContent></Card>
                    <Card><CardContent><div style={{ textAlign: 'center' }}><p style={{ fontSize: 32, fontWeight: 700, color: '#FF9800' }}>{stats.kurgulaniyor}</p><p style={{ color: 'var(--color-muted)', fontSize: 12 }}>Kurgulanıyor</p></div></CardContent></Card>
                    <Card><CardContent><div style={{ textAlign: 'center' }}><p style={{ fontSize: 32, fontWeight: 700, color: '#00F5B0' }}>{stats.paylasild}</p><p style={{ color: 'var(--color-muted)', fontSize: 12 }}>Paylaşıldı</p></div></CardContent></Card>
                    <Card><CardContent><div style={{ textAlign: 'center' }}><p style={{ fontSize: 32, fontWeight: 700, color: '#329FF5' }}>{stats.planlandi}</p><p style={{ color: 'var(--color-muted)', fontSize: 12 }}>Planlanacak</p></div></CardContent></Card>
                </div>

                {/* Filtreler */}
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                        <option value="all">Tüm Markalar</option>
                        {activeBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'all' | 'TODO' | 'DONE')} style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                        <option value="all">Tüm Durumlar</option>
                        <option value="TODO">Yapılacaklar</option>
                        <option value="DONE">Tamamlananlar</option>
                    </select>
                    {/* Sorumlu filtresi */}
                    <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: filterAssignee === 'me' ? '2px solid #00F5B0' : '1px solid var(--color-border)', backgroundColor: filterAssignee === 'me' ? 'rgba(0, 245, 176, 0.1)' : 'transparent' }}>
                        <option value="all">Tüm Sorumlular</option>
                        <option value="me">Bana Atananlar</option>
                        {activeTeam.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                    {/* Hızlı marka filtreleri */}
                    <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', flexWrap: 'wrap' }}>
                        {contentsByBrand.slice(0, 6).map(b => (
                            <button key={b.id} onClick={() => setFilterBrand(filterBrand === b.id ? 'all' : b.id)} style={{ padding: '4px 10px', borderRadius: 20, border: filterBrand === b.id ? `2px solid ${b.color}` : '1px solid var(--color-border)', backgroundColor: filterBrand === b.id ? b.color + '20' : 'white', fontSize: 12, cursor: 'pointer' }}>
                                {b.name.split(' ')[0]} ({b.count})
                            </button>
                        ))}
                    </div>
                </div>

                {(viewMode === 'list' || viewMode === 'archive') && (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-3)' }}>
                        <div>
                            {filteredContents.map(content => {
                                const brandColor = getBrandColor(content.brandId);
                                const brandName = getBrandName(content.brandId);
                                const isSelected = selectedContent?.id === content.id;
                                return (
                                    <div key={content.id} onClick={() => setSelectedContent(content)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: isSelected ? 'var(--color-surface)' : 'var(--color-card)', borderRadius: 'var(--radius-sm)', marginBottom: 8, cursor: 'pointer', borderLeft: `4px solid ${brandColor}`, outline: isSelected ? '2px solid var(--color-primary)' : 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <span style={{ color: 'var(--color-muted)' }}>{TypeIcons[content.type as ContentType] || TypeIcons['VIDEO']}</span>
                                            <div>
                                                <p style={{ fontWeight: 600 }}>{content.title}</p>
                                                <p style={{ fontSize: 12, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                    <span style={{ backgroundColor: brandColor, color: 'white', padding: '1px 6px', borderRadius: 10, fontSize: 10 }}>{brandName}</span>
                                                    {content.deliveryDate && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{Icons.Calendar} {new Date(content.deliveryDate).toLocaleDateString('tr-TR')}</span>}
                                                    {/* Atanan kişiler */}
                                                    {(content.assigneeIds || (content.assigneeId ? [content.assigneeId] : [])).map(assignee => (
                                                        <span
                                                            key={assignee}
                                                            style={{
                                                                fontSize: 10,
                                                                padding: '2px 6px',
                                                                backgroundColor: (teamMemberColors[assignee] || '#6B7B80') + '20',
                                                                color: teamMemberColors[assignee] || '#6B7B80',
                                                                borderRadius: 10,
                                                                fontWeight: 500
                                                            }}
                                                        >
                                                            {assignee.split(' ')[0]}
                                                        </span>
                                                    ))}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {isOverdue(content) && <Badge style={{ backgroundColor: '#E13A3A', color: 'white', fontWeight: 700 }}>ACİL</Badge>}
                                            <Badge style={{ backgroundColor: contentStatuses[content.status].color, color: 'white' }}>{contentStatuses[content.status].label}</Badge>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openModal(content); }}
                                                title="Düzenle"
                                                style={{
                                                    padding: '4px 8px',
                                                    backgroundColor: 'transparent',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: 4,
                                                    cursor: 'pointer',
                                                    fontSize: 12,
                                                    color: 'var(--color-muted)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >{Icons.Edit}</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* SAĞ PANEL: Seçili İçerik Detayları */}
                        <ContentDetailPanel
                            content={selectedContent}
                            onClose={() => setSelectedContent(null)}
                            onUpdateStatus={updateStatus}
                            onUpdateNotes={updateNotes}
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
                            const tasks = contents.filter(c => c.assigneeId === member.id && c.status !== 'PAYLASILD');
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

            {/* Marka ve Renk Modalleri Kaldırıldı (Moved to System) */}
        </>
    );

}
