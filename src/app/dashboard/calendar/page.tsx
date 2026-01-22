'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Badge, Modal, Input, Select, Textarea } from '@/components/ui';
import { brands, getBrandById, getBrandColor, getBrandName, eventTypes } from '@/lib/data';
import { getContentsAsCalendarEvents, createContent, updateContent as updateContentDB, deleteContent as deleteContentDB } from '@/lib/actions/content';
import { getMemberColors } from '@/lib/actions/userSettings';

// ===== TİPLER =====
interface CalendarEvent {
    id: string;
    title: string;
    description: string;
    date: string;
    endDate?: string;
    time?: string;
    type: 'TASK' | 'MEETING' | 'DEADLINE' | 'CONTENT' | 'SHOOT' | 'STUDIO' | 'REVIEW' | 'OTHER';
    allDay: boolean;
    relatedProject?: string;
    brandId?: string;
    assigneeId?: string;
    assigneeIds?: string[];
    sourceId?: string;
    sourceType?: 'task' | 'content';
    status?: string;
}

const calendarEventTypes = {
    TASK: { label: 'Görev', color: '#329FF5', icon: '📋' },
    MEETING: { label: 'Toplantı', color: '#00F5B0', icon: '🤝' },
    DEADLINE: { label: 'Son Tarih', color: '#FF4242', icon: '⏰' },
    CONTENT: { label: 'İçerik Yayını', color: '#F6D73C', icon: '📱' },
    SHOOT: { label: 'Çekim', color: '#9C27B0', icon: '📸' },
    STUDIO: { label: 'Stüdyo', color: '#E91E63', icon: '🎬' },
    REVIEW: { label: 'İnceleme', color: '#FF9800', icon: '👀' },
    OTHER: { label: 'Diğer', color: '#6B7B80', icon: '📌' },
};

// GERÇEK VERİLER - Takvim etkinlikleri (Aralık 2025 - Ocak 2026)
const initialEvents: CalendarEvent[] = [];

export default function CalendarPage() {
    const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
    const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1));
    const [showModal, setShowModal] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);

    // Filtreler
    const [filterBrand, setFilterBrand] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');

    // Kişi renkleri (atanan kişiye göre renklendirme için)
    const [memberColors, setMemberColors] = useState<Record<string, string>>({});

    // Kişi renklerini yükle
    useEffect(() => {
        getMemberColors().then(colors => {
            setMemberColors(colors || {});
        }).catch(() => {
            setMemberColors({});
        });
    }, []);

    // Etkinlik rengini belirle - ATANAN KİŞİ(LER)E GÖRE
    const getEventColor = (event: CalendarEvent): string => {
        // Atanan kişi(ler) varsa, onların rengini kullan
        const assignees = event.assigneeIds || (event.assigneeId ? [event.assigneeId] : []);
        if (assignees.length > 0) {
            // İlk atanan kişinin rengini kullan
            const firstAssignee = assignees[0];
            return memberColors[firstAssignee] || '#6B7B80';
        }
        // Atanan yoksa, tip rengini kullan (fallback)
        return calendarEventTypes[event.type]?.color || '#6B7B80';
    };

    // İş Yönetimi (Content Production) verilerini yükle - Supabase'ten
    useEffect(() => {
        const loadContentEvents = async () => {
            try {
                console.log('[Calendar] Loading content events from Supabase...');
                const contentEvents = await getContentsAsCalendarEvents();
                console.log('[Calendar] Loaded content events:', contentEvents.length, contentEvents);
                // Mevcut takvim events + Content Production içerikleri
                setEvents(prev => {
                    // Duplicate önleme - content- prefix ile
                    const newEvents = [...prev.filter(e => !e.id.startsWith('content-')), ...contentEvents.map(e => ({
                        ...e,
                        description: e.description || '',
                    })) as CalendarEvent[]];
                    console.log('[Calendar] Total events after merge:', newEvents.length);
                    return newEvents;
                });
            } catch (error) {
                console.error('Content events yüklenemedi:', error);
            }
        };
        loadContentEvents();
    }, []);

    // Form state
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formDate, setFormDate] = useState('');
    const [formTime, setFormTime] = useState('');
    const [formType, setFormType] = useState<CalendarEvent['type']>('TASK');
    const [formProject, setFormProject] = useState('');
    const [formBrand, setFormBrand] = useState('');
    const [formStatus, setFormStatus] = useState<string>('PLANLANDI');
    const [formAllDay, setFormAllDay] = useState(true);

    const [nextId, setNextId] = useState(200);
    const getId = () => { const id = nextId; setNextId(nextId + 1); return id.toString(); };

    // Takvim hesaplamaları
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const daysInMonth = lastDay.getDate();

    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);
    while (calendarDays.length < 42) calendarDays.push(null);

    // Filtrelenmiş etkinlikler
    const filteredEvents = events.filter(e => {
        if (filterBrand !== 'all' && e.brandId !== filterBrand) return false;
        if (filterType !== 'all' && e.type !== filterType) return false;
        return true;
    });

    const getEventsForDay = (day: number | null) => {
        if (!day) return [];
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return filteredEvents.filter(e => e.date === dateStr);
    };

    // Marka bazlı etkinlik sayıları (hızlı filtre için)
    const brandEventCounts = brands.filter(b => b.active).map(b => ({
        ...b,
        count: events.filter(e => {
            const eventMonth = new Date(e.date).getMonth();
            const eventYear = new Date(e.date).getFullYear();
            return e.brandId === b.id && eventMonth === month && eventYear === year;
        }).length
    })).filter(b => b.count > 0).sort((a, b) => b.count - a.count);

    const goToPreviousMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToToday = () => setCurrentDate(new Date());

    const openNewEventModal = () => {
        setEditingEvent(null);
        setFormTitle('');
        setFormDescription('');
        setFormDate('');
        setFormTime('');
        setFormType('TASK');
        setFormBrand('');
        setFormStatus('PLANLANDI');
        setFormAllDay(true);
        setShowModal(true);
    };

    const openEditEventModal = (event: CalendarEvent) => {
        setEditingEvent(event);
        setFormTitle(event.title);
        setFormDescription(event.description);
        setFormDate(event.date);
        setFormTime(event.time || '');
        setFormType(event.type);
        setFormBrand(event.brandId || '');
        setFormStatus(event.status || 'PLANLANDI');
        setFormAllDay(event.allDay);
        setShowModal(true);
    };

    const saveEvent = async () => {
        if (!formTitle || !formDate) return;

        const brandColor = formBrand ? getBrandColor(formBrand) : calendarEventTypes[formType].color;

        try {
            // Optimistic Id
            const tempId = editingEvent?.id || getId();

            // Server Action Data Preparation
            const contentData = {
                title: formTitle,
                notes: formDescription,
                description: formDescription,
                deliveryDate: formDate,
                type: formType === 'TASK' ? 'VIDEO' : 'VIDEO', // Default to VIDEO or map correctly if we have types
                // Map calendar types to content types if possible, or just store as is if DB supports it.
                // Our DB `Task` table `contentType` is string.
                status: formStatus,
                brandId: formBrand,
                assigneeId: undefined, // Add user selection if needed later
            };

            // DB IDs
            const dbId = editingEvent?.sourceId || (editingEvent?.id.startsWith('content-') ? editingEvent.id.replace('content-', '') : editingEvent?.id);

            if (editingEvent && dbId) {
                // UPDATE
                await updateContentDB(dbId, contentData);

                // Update Local State
                const updatedEvent: CalendarEvent = {
                    ...editingEvent,
                    title: formTitle,
                    description: formDescription,
                    date: formDate,
                    time: formAllDay ? undefined : formTime,
                    type: formType,
                    allDay: formAllDay,
                    brandId: formBrand || undefined,
                };
                setEvents(events.map(e => e.id === editingEvent.id ? updatedEvent : e));
            } else {
                // CREATE
                const newContent = await createContent(contentData as any); // Cast as any to bypass strict type check for now if needed, or match interface
                if (newContent) {
                    const newEvent: CalendarEvent = {
                        id: `content-${newContent.id}`,
                        sourceId: newContent.id,
                        title: newContent.title,
                        description: newContent.notes || '',
                        date: newContent.deliveryDate || formDate,
                        time: formAllDay ? undefined : formTime,
                        type: 'TASK', // Default or derived
                        allDay: formAllDay,
                        brandId: newContent.brandId || undefined,
                        status: newContent.status,
                    };
                    setEvents([...events, newEvent]);
                }
            }
            setShowModal(false);
        } catch (error) {
            console.error('Save event error:', error);
            alert('Kaydedilirken bir hata oluştu.');
        }
    };

    const deleteEvent = async () => {
        if (editingEvent) {
            try {
                const dbId = editingEvent.sourceId || (editingEvent.id.startsWith('content-') ? editingEvent.id.replace('content-', '') : editingEvent.id);
                if (dbId) {
                    await deleteContentDB(dbId);
                }
                setEvents(events.filter(e => e.id !== editingEvent.id));
                setShowModal(false);
            } catch (error) {
                console.error('Delete error', error);
                alert('Silinirken hata oluştu');
            }
        }
    };

    // Drag & Drop
    const handleDragStart = (event: CalendarEvent) => setDraggedEvent(event);
    const handleDragEnd = () => setDraggedEvent(null);
    const handleDrop = async (day: number) => {
        if (!draggedEvent || !day) return;

        console.log('Dropping event', draggedEvent, 'to day', day);
        const newDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Optimistic update
        const updatedEvent = { ...draggedEvent, date: newDate };
        // Update local state immediately
        setEvents(prev => prev.map(e => e.id === draggedEvent.id ? updatedEvent : e));

        const eventToUpdate = draggedEvent; // Capture for async
        setDraggedEvent(null);

        // DB Update
        try {
            const dbId = eventToUpdate.sourceId || (eventToUpdate.id.startsWith('content-') ? eventToUpdate.id.replace('content-', '') : eventToUpdate.id);
            if (dbId) {
                console.log('Updating DB for', dbId, newDate);
                await updateContentDB(dbId, { deliveryDate: newDate });
                console.log('DB Update success');
            } else {
                console.warn('No DB ID found for event', eventToUpdate);
            }
        } catch (error) {
            console.error('Drag drop save error:', error);
            alert('Tarih güncellenirken hata oluştu. Lütfen sayfayı yenileyin.');
            // Revert could go here, but reload is better advice if state de-synced
        }
    };

    const openEventDetail = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setShowEventModal(true);
    };

    const today = new Date();
    const isToday = (day: number | null) => day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

    // Yaklaşan etkinlikler (bu ay)
    const upcomingEvents = events
        .filter(e => {
            const eventDate = new Date(e.date);
            return eventDate >= today && eventDate.getMonth() === month && eventDate.getFullYear() === year;
        })
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 8);

    return (
        <>
            <Header
                title="Takvim"
                subtitle="Sürükle & Bırak ile Planlama"
                actions={<Button variant="primary" onClick={openNewEventModal}>+ Etkinlik</Button>}
            />

            <div className="calendar-layout" style={{ padding: 'var(--space-3)', gap: 'var(--space-3)' }}>
                {/* Ana Takvim */}
                <Card>
                    <CardContent>
                        {/* Filtreler */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
                            {/* Dropdown Filtreleri */}
                            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                                <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', minWidth: 150 }}>
                                    <option value="all">Tüm Markalar</option>
                                    {brands.filter(b => b.active).map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', minWidth: 120 }}>
                                    <option value="all">Tüm Tipler</option>
                                    {Object.entries(calendarEventTypes).map(([key, val]) => (
                                        <option key={key} value={key}>{val.icon} {val.label}</option>
                                    ))}
                                </select>
                                {(filterBrand !== 'all' || filterType !== 'all') && (
                                    <Button variant="ghost" size="sm" onClick={() => { setFilterBrand('all'); setFilterType('all'); }}>
                                        ✕ Temizle
                                    </Button>
                                )}
                            </div>
                            {/* Hızlı Marka Chip'leri */}
                            {brandEventCounts.length > 0 && (
                                <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                                    {brandEventCounts.slice(0, 6).map(b => (
                                        <button key={b.id} onClick={() => setFilterBrand(filterBrand === b.id ? 'all' : b.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 11, border: filterBrand === b.id ? `2px solid ${b.color}` : '1px solid var(--color-border)', borderRadius: 12, background: filterBrand === b.id ? b.color + '20' : 'var(--color-card)', cursor: 'pointer' }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: b.color }}></span>
                                            {b.name.split(' ')[0]} ({b.count})
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Tip Efsanesi */}
                        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', flexWrap: 'wrap', fontSize: 11 }}>
                            {Object.entries(calendarEventTypes).map(([key, val]) => (
                                <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: filterType === 'all' || filterType === key ? 1 : 0.4 }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: val.color }}></span>
                                    {val.label}
                                </span>
                            ))}
                        </div>

                        {/* Ay navigasyonu */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                            <Button variant="secondary" size="sm" onClick={goToToday}>Bugün</Button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <Button variant="secondary" size="sm" onClick={goToPreviousMonth}>◀</Button>
                                <h3 style={{ fontWeight: 600, minWidth: 150, textAlign: 'center' }}>{monthNames[month]} {year}</h3>
                                <Button variant="secondary" size="sm" onClick={goToNextMonth}>▶</Button>
                            </div>
                            <div style={{ width: 60 }}></div>
                        </div>

                        {/* Takvim Grid */}
                        <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 1, backgroundColor: 'var(--color-border)' }}>
                            {dayNames.map(day => (
                                <div key={day} style={{ padding: 'var(--space-1)', backgroundColor: 'var(--color-surface)', textAlign: 'center', fontWeight: 600, fontSize: 'var(--text-caption)' }}>{day}</div>
                            ))}
                            {calendarDays.map((day, index) => {
                                const dayEvents = getEventsForDay(day);
                                return (
                                    <div
                                        key={index}
                                        onDragOver={(e) => {
                                            if (day) {
                                                e.preventDefault();
                                                e.dataTransfer.dropEffect = 'move';
                                            }
                                        }}
                                        onDrop={(e) => {
                                            if (day) {
                                                e.preventDefault();
                                                handleDrop(day);
                                            }
                                        }}
                                        style={{
                                            minHeight: 120, // Increased height
                                            padding: 'var(--space-1)',
                                            backgroundColor: day ? (isToday(day) ? 'var(--color-primary-light)' : 'var(--color-card)') : 'var(--color-surface)',
                                            borderRadius: isToday(day) ? 'var(--radius-sm)' : 0,
                                            border: isToday(day) ? '2px solid var(--color-primary)' : 'none'
                                        }}
                                    >
                                        {day && (
                                            <>
                                                <div style={{ fontWeight: isToday(day) ? 700 : 500, color: isToday(day) ? 'var(--color-primary)' : 'inherit', marginBottom: 4 }}>{day}</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    {dayEvents.slice(0, 4).map(event => {
                                                        const eventColor = getEventColor(event);
                                                        return (
                                                            <div
                                                                key={event.id}
                                                                draggable
                                                                onDragStart={() => handleDragStart(event)}
                                                                onDragEnd={handleDragEnd}
                                                                onClick={() => openEventDetail(event)}
                                                                style={{
                                                                    padding: '3px 6px',
                                                                    backgroundColor: eventColor,
                                                                    color: 'white',
                                                                    borderRadius: 4,
                                                                    fontSize: 10,
                                                                    cursor: 'grab',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 4,
                                                                    maxWidth: '100%'
                                                                }}
                                                                title={event.title}
                                                            >
                                                                <span>{calendarEventTypes[event.type].icon}</span>
                                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</span>
                                                            </div>
                                                        );
                                                    })}
                                                    {dayEvents.length > 4 && (
                                                        <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>+{dayEvents.length - 4} daha</div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Sağ Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {/* Yaklaşan Etkinlikler */}
                    <Card>
                        <CardHeader title="Yaklaşan Etkinlikler" />
                        <CardContent>
                            {upcomingEvents.length === 0 ? (
                                <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-caption)', textAlign: 'center' }}>Bu ay etkinlik yok</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {upcomingEvents.map(event => {
                                        const eventColor = getEventColor(event);
                                        return (
                                            <div key={event.id} onClick={() => openEventDetail(event)} style={{ padding: 10, backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${eventColor}`, cursor: 'pointer' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{event.title}</span>
                                                    <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{new Date(event.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                    <Badge style={{ backgroundColor: calendarEventTypes[event.type].color, color: 'white', fontSize: 9 }}>{calendarEventTypes[event.type].label}</Badge>
                                                    {event.brandId && (
                                                        <span style={{ fontSize: 10, color: eventColor, fontWeight: 500 }}>
                                                            {getBrandName(event.brandId)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Marka İstatistikleri */}
                    <Card>
                        <CardHeader title="Bu Ay" />
                        <CardContent>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {brandEventCounts.slice(0, 8).map(b => (
                                    <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: b.color, flexShrink: 0 }}></span>
                                        <span style={{ flex: 1, fontSize: 12 }}>{b.name}</span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: b.color }}>{b.count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Etkinlik Oluştur/Düzenle Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingEvent ? 'Etkinlik Düzenle' : 'Yeni Etkinlik'} size="md" footer={
                <>
                    {editingEvent && <Button variant="danger" onClick={deleteEvent} style={{ marginRight: 'auto' }}>Sil</Button>}
                    <Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button>
                    <Button variant="primary" onClick={saveEvent}>Kaydet</Button>
                </>
            }>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <Input label="Başlık *" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Etkinlik adı" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                        <Input label="Tarih *" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
                        {!formAllDay && <Input label="Saat" type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} />}
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        <input type="checkbox" checked={formAllDay} onChange={(e) => setFormAllDay(e.target.checked)} />
                        Tüm gün
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                        <Select label="Tip" value={formType} onChange={(e) => setFormType(e.target.value as CalendarEvent['type'])} options={Object.entries(calendarEventTypes).map(([k, v]) => ({ value: k, label: `${v.icon} ${v.label}` }))} />
                        <Select
                            label="Durum"
                            value={formStatus}
                            onChange={(e) => setFormStatus(e.target.value)}
                            options={[
                                { value: 'PLANLANDI', label: '📅 Planlandı' },
                                { value: 'CEKILDI', label: '📸 Çekildi' },
                                { value: 'KURGULANIYOR', label: '🎬 Kurgulanıyor' },
                                { value: 'PAYLASILD', label: '✅ Paylaşıldı' },
                                { value: 'TESLIM', label: '📦 Teslim' },
                            ]}
                        />
                    </div>
                    <Select label="Marka" value={formBrand} onChange={(e) => setFormBrand(e.target.value)} options={[{ value: '', label: 'Seçiniz...' }, ...brands.filter(b => b.active).map(b => ({ value: b.id, label: b.name }))]} />
                    <Textarea label="Açıklama" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} />
                </div>
            </Modal>

            {/* Etkinlik Detay Modal */}
            <Modal isOpen={showEventModal} onClose={() => setShowEventModal(false)} title={selectedEvent?.title || ''} size="sm" footer={
                <>
                    <Button variant="secondary" onClick={() => setShowEventModal(false)}>Kapat</Button>
                    <Button variant="primary" onClick={() => { setShowEventModal(false); selectedEvent && openEditEventModal(selectedEvent); }}>Düzenle</Button>
                </>
            }>
                {selectedEvent && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <Badge style={{ backgroundColor: calendarEventTypes[selectedEvent.type].color, color: 'white' }}>
                                {calendarEventTypes[selectedEvent.type].icon} {calendarEventTypes[selectedEvent.type].label}
                            </Badge>
                            {selectedEvent.brandId && (
                                <Badge style={{ backgroundColor: getBrandColor(selectedEvent.brandId), color: 'white' }}>
                                    {getBrandName(selectedEvent.brandId)}
                                </Badge>
                            )}
                        </div>
                        <p><strong>Tarih:</strong> {new Date(selectedEvent.date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        {selectedEvent.time && <p><strong>Saat:</strong> {selectedEvent.time}</p>}
                        {selectedEvent.description && <p><strong>Açıklama:</strong> {selectedEvent.description}</p>}
                    </div>
                )}
            </Modal>
        </>
    );
}
