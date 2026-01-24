'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Badge, Modal, Input, Select, Textarea } from '@/components/ui';
import { NewContentModal } from '@/components/content/NewContentModal';
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

export function CalendarPageClient() {
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

    // Form state removed - handled by NewContentModal

    // State for modal
    const [formDate, setFormDate] = useState<string>('');
    // getId removed

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

    // Open New Content Modal
    const openNewEventModal = (dateOrEvent?: string | React.MouseEvent) => {
        setEditingEvent(null);
        if (typeof dateOrEvent === 'string') {
            setFormDate(dateOrEvent);
        } else {
            setFormDate(new Date().toISOString().split('T')[0]);
        }
        setShowModal(true);
    };

    const openEditEventModal = (event: CalendarEvent) => {
        setEditingEvent(event);
        // Map CalendarEvent to ContentItem-like object for modal
        const mappedContent = {
            id: event.sourceId || (event.id.startsWith('content-') ? event.id.replace('content-', '') : event.id),
            title: event.title,
            brandId: event.brandId,
            type: event.type,
            status: event.status,
            notes: event.description,
            deliveryDate: event.date,
            // time:? NewContentModal doesn't support time yet
            assigneeIds: event.assigneeIds || (event.assigneeId ? [event.assigneeId] : [])
        };
        // Reuse NewContentModal via showModal
        // But NewContentModal uses 'formDate' or 'initialContent'.
        // We can pass 'initialContent' via a state?
        // We haven't added 'initialContent' state to CalendarPage yet. 
        // We currently use 'editingEvent' state. 
        // I need to update the NewContentModal usage in JSX to pass 'initialContent'.
        setShowModal(true);
    };

    // saveEvent removed - handled by NewContentModal onSuccess

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
                actions={<Button variant="primary" onClick={(e) => openNewEventModal(e)}>+ Etkinlik</Button>}
            />

            <div className="calendar-layout" style={{ padding: 'var(--space-3)', gap: 'var(--space-3)' }}>
                {/* Ana Takvim */}
                <Card>
                    <CardContent>


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
                                        onClick={() => {
                                            if (day) {
                                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                openNewEventModal(dateStr);
                                            }
                                        }}
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
                                            border: isToday(day) ? '2px solid var(--color-primary)' : 'none',
                                            cursor: day ? 'pointer' : 'default'
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
                                        const typeInfo = calendarEventTypes[event.type] || calendarEventTypes['OTHER'];
                                        return (
                                            <div key={event.id} onClick={() => openEventDetail(event)} style={{ padding: 10, backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${eventColor}`, cursor: 'pointer' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{event.title}</span>
                                                    <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{new Date(event.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                    <Badge style={{ backgroundColor: typeInfo.color, color: 'white', fontSize: 9 }}>{typeInfo.label}</Badge>
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
            {/* Yeni İçerik Modal (Calendar Integration) */}
            <NewContentModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                initialDate={formDate}
                initialContent={editingEvent ? {
                    id: editingEvent.sourceId || (editingEvent.id.startsWith('content-') ? editingEvent.id.replace('content-', '') : editingEvent.id),
                    title: editingEvent.title,
                    brandId: editingEvent.brandId,
                    type: editingEvent.type,
                    status: editingEvent.status,
                    notes: editingEvent.description,
                    deliveryDate: editingEvent.date,
                    assigneeIds: editingEvent.assigneeIds || (editingEvent.assigneeId ? [editingEvent.assigneeId] : [])
                } : undefined}
                onSuccess={(newContent) => {
                    // Check if update or create based on editingEvent
                    const eventId = `content-${newContent.id}`;

                    const newEvent: CalendarEvent = {
                        id: eventId,
                        sourceId: newContent.id,
                        title: newContent.title,
                        description: newContent.notes || '',
                        date: newContent.deliveryDate || formDate,
                        type: newContent.type || 'TASK',
                        allDay: true,
                        brandId: newContent.brandId || undefined,
                        status: newContent.status,
                        assigneeIds: newContent.assigneeIds
                    };

                    if (editingEvent) {
                        setEvents(events.map(e => e.id === editingEvent.id ? newEvent : e));
                    } else {
                        setEvents([...events, newEvent]);
                    }
                }}
            />

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
