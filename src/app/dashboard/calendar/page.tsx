'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Badge, Modal, Input, Select, Textarea } from '@/components/ui';
import { brands, getBrandById, getBrandColor, getBrandName, eventTypes, teamMembers, getActiveTeamMembers } from '@/lib/data';

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
const initialEvents: CalendarEvent[] = [
    // Ocak 2026 - Gerçek planlamalar
    { id: '1', title: 'Tevfik Usta Video 1', type: 'CONTENT', date: '2026-01-20', allDay: true, description: 'Aralık dönemi 1. video', brandId: 'tevfik' },
    { id: '2', title: 'Tevfik Usta Video 2', type: 'CONTENT', date: '2026-01-25', allDay: true, description: 'Aralık dönemi 2. video', brandId: 'tevfik' },
    { id: '3', title: 'Tevfik Usta Video 3', type: 'CONTENT', date: '2026-01-30', allDay: true, description: 'Aralık dönemi 3. video', brandId: 'tevfik' },

    { id: '10', title: 'ByKasap Video 1', type: 'CONTENT', date: '2026-01-20', allDay: true, description: 'Aralık dönemi 1. video', brandId: 'bykasap' },
    { id: '11', title: 'ByKasap Video 2', type: 'CONTENT', date: '2026-01-24', allDay: true, description: 'Aralık dönemi 2. video', brandId: 'bykasap' },
    { id: '12', title: 'ByKasap Video 3', type: 'CONTENT', date: '2026-01-28', allDay: true, description: 'Aralık dönemi 3. video', brandId: 'bykasap' },

    { id: '20', title: 'İkra Video 1', type: 'CONTENT', date: '2026-01-07', allDay: true, description: 'Ocak 1. video', brandId: 'ikra' },
    { id: '21', title: 'İkra Video 2', type: 'CONTENT', date: '2026-01-11', allDay: true, description: 'Ocak 2. video', brandId: 'ikra' },
    { id: '22', title: 'İkra Video 3', type: 'CONTENT', date: '2026-01-16', allDay: true, description: 'Ocak 3. video', brandId: 'ikra' },
    { id: '23', title: 'İkra Video 4', type: 'CONTENT', date: '2026-01-21', allDay: true, description: 'Ocak 4. video', brandId: 'ikra' },

    { id: '30', title: 'Zeytindalı Stüdyo Çekim', type: 'SHOOT', date: '2026-01-15', time: '10:00', allDay: false, description: 'Ürün fotoğraf çekimi', brandId: 'zeytindali' },
    { id: '31', title: 'Zeytindalı Video 1', type: 'CONTENT', date: '2026-01-18', allDay: true, description: 'Ocak 1. video', brandId: 'zeytindali' },
    { id: '32', title: 'Zeytindalı Video 2', type: 'CONTENT', date: '2026-01-25', allDay: true, description: 'Ocak 2. video', brandId: 'zeytindali' },

    { id: '40', title: 'Valora Post 1', type: 'CONTENT', date: '2026-01-10', allDay: true, description: 'Ocak 1. post', brandId: 'valora' },
    { id: '41', title: 'Valora Post 2', type: 'CONTENT', date: '2026-01-14', allDay: true, description: 'Ocak 2. post', brandId: 'valora' },
    { id: '42', title: 'Valora Video 1', type: 'CONTENT', date: '2026-01-17', allDay: true, description: 'Ocak 1. video', brandId: 'valora' },
    { id: '43', title: 'Valora Post 3', type: 'CONTENT', date: '2026-01-22', allDay: true, description: 'Ocak 3. post', brandId: 'valora' },

    { id: '50', title: 'Zoks Video 1', type: 'CONTENT', date: '2026-01-08', allDay: true, description: 'Ocak 1. video', brandId: 'zoks' },
    { id: '51', title: 'Zoks Video 2', type: 'CONTENT', date: '2026-01-15', allDay: true, description: 'Ocak 2. video', brandId: 'zoks' },
    { id: '52', title: 'Zoks Video 3', type: 'CONTENT', date: '2026-01-22', allDay: true, description: 'Ocak 3. video', brandId: 'zoks' },

    { id: '60', title: 'Ali Haydar Video 1', type: 'CONTENT', date: '2026-01-12', allDay: true, description: 'Ocak 1. video', brandId: 'alihaydar' },
    { id: '61', title: 'Ali Haydar Çekim', type: 'SHOOT', date: '2026-01-19', time: '14:00', allDay: false, description: 'Mekan içi çekim', brandId: 'alihaydar' },

    // Genel etkinlikler
    { id: '90', title: 'Haftalık Ekip Toplantısı', type: 'MEETING', date: '2026-01-06', time: '09:00', allDay: false, description: 'Haftalık durum değerlendirme', brandId: 'noco' },
    { id: '91', title: 'Haftalık Ekip Toplantısı', type: 'MEETING', date: '2026-01-13', time: '09:00', allDay: false, description: 'Haftalık durum değerlendirme', brandId: 'noco' },
    { id: '92', title: 'Haftalık Ekip Toplantısı', type: 'MEETING', date: '2026-01-20', time: '09:00', allDay: false, description: 'Haftalık durum değerlendirme', brandId: 'noco' },
    { id: '93', title: 'Haftalık Ekip Toplantısı', type: 'MEETING', date: '2026-01-27', time: '09:00', allDay: false, description: 'Haftalık durum değerlendirme', brandId: 'noco' },

    { id: '95', title: 'Raporlar Teslim', type: 'DEADLINE', date: '2026-01-16', allDay: true, description: 'Tevfik Usta | ByKasap | Zeytindalı raporları', brandId: 'noco' },
    { id: '96', title: 'Fatura Kesim', type: 'DEADLINE', date: '2026-01-05', allDay: true, description: 'Aylık faturaların kesilmesi', brandId: 'noco' },
    { id: '97', title: 'Muhasebe & Kira', type: 'DEADLINE', date: '2026-01-05', allDay: true, description: 'Muhasebe ve kira ödemeleri', brandId: 'noco' },

    // 🎬 STÜDYO REZERVASYONLARı (Stüdyo sayfasıyla senkronize)
    { id: 's1', title: '🎬 Stüdyo: Valora Psikoloji', type: 'STUDIO', date: '2026-01-15', time: '10:00', allDay: false, description: 'Ürün Fotoğrafları - 10:00-14:00', brandId: 'valora' },
    { id: 's2', title: '🎬 Stüdyo: Zoks Studio', type: 'STUDIO', date: '2026-01-17', time: '09:00', allDay: false, description: 'Konsept Çekim - Full gün', brandId: 'zoks' },
    { id: 's3', title: '🎬 Stüdyo: Hair Chef', type: 'STUDIO', date: '2026-01-20', time: '14:00', allDay: false, description: 'Podcast Kaydı - 14:00-16:00', brandId: 'hairchef' },
    { id: 's4', title: '🎬 Stüdyo: Zeytindalı Gıda', type: 'STUDIO', date: '2026-01-22', time: '10:00', allDay: false, description: 'Kurumsal Fotoğraf - 10:00-12:00', brandId: 'zeytindali' },
    { id: 's5', title: '🎬 Stüdyo: İkra Giyim', type: 'STUDIO', date: '2026-01-25', time: '10:00', allDay: false, description: 'Ürün Çekimi - 10:00-14:00', brandId: 'ikra' },
    { id: 's6', title: '🎬 Stüdyo: Tevfik Usta', type: 'STUDIO', date: '2026-01-28', time: '09:00', allDay: false, description: 'Mekan Çekimi - 09:00-13:00', brandId: 'tevfik' },
];

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

    // Form state
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formDate, setFormDate] = useState('');
    const [formTime, setFormTime] = useState('');
    const [formType, setFormType] = useState<CalendarEvent['type']>('TASK');
    const [formProject, setFormProject] = useState('');
    const [formBrand, setFormBrand] = useState('');
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
        setFormAllDay(event.allDay);
        setShowModal(true);
    };

    const saveEvent = () => {
        if (!formTitle || !formDate) return;

        const brandColor = formBrand ? getBrandColor(formBrand) : calendarEventTypes[formType].color;

        const eventData: CalendarEvent = {
            id: editingEvent?.id || getId(),
            title: formTitle,
            description: formDescription,
            date: formDate,
            time: formAllDay ? undefined : formTime,
            type: formType,
            allDay: formAllDay,
            relatedProject: formProject,
            brandId: formBrand || undefined,
        };

        if (editingEvent) {
            setEvents(events.map(e => e.id === editingEvent.id ? eventData : e));
        } else {
            setEvents([...events, eventData]);
        }
        setShowModal(false);
    };

    const deleteEvent = () => {
        if (editingEvent) {
            setEvents(events.filter(e => e.id !== editingEvent.id));
            setShowModal(false);
        }
    };

    // Drag & Drop
    const handleDragStart = (event: CalendarEvent) => setDraggedEvent(event);
    const handleDragEnd = () => setDraggedEvent(null);
    const handleDrop = (day: number) => {
        if (draggedEvent && day) {
            const newDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            setEvents(events.map(e => e.id === draggedEvent.id ? { ...e, date: newDate } : e));
            setDraggedEvent(null);
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

            <div style={{ padding: 'var(--space-3)', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--space-3)' }}>
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, backgroundColor: 'var(--color-border)' }}>
                            {dayNames.map(day => (
                                <div key={day} style={{ padding: 'var(--space-1)', backgroundColor: 'var(--color-surface)', textAlign: 'center', fontWeight: 600, fontSize: 'var(--text-caption)' }}>{day}</div>
                            ))}
                            {calendarDays.map((day, index) => {
                                const dayEvents = getEventsForDay(day);
                                return (
                                    <div
                                        key={index}
                                        onDragOver={(e) => day && e.preventDefault()}
                                        onDrop={() => day && handleDrop(day)}
                                        style={{
                                            minHeight: 100,
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
                                                    {dayEvents.slice(0, 3).map(event => {
                                                        const brandColor = event.brandId ? getBrandColor(event.brandId) : calendarEventTypes[event.type].color;
                                                        return (
                                                            <div
                                                                key={event.id}
                                                                draggable
                                                                onDragStart={() => handleDragStart(event)}
                                                                onDragEnd={handleDragEnd}
                                                                onClick={() => openEventDetail(event)}
                                                                style={{
                                                                    padding: '3px 6px',
                                                                    backgroundColor: brandColor,
                                                                    color: 'white',
                                                                    borderRadius: 4,
                                                                    fontSize: 10,
                                                                    cursor: 'grab',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 4
                                                                }}
                                                            >
                                                                <span>{calendarEventTypes[event.type].icon}</span>
                                                                <span>{event.title}</span>
                                                            </div>
                                                        );
                                                    })}
                                                    {dayEvents.length > 3 && (
                                                        <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>+{dayEvents.length - 3} daha</div>
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
                        <CardHeader title="📅 Yaklaşan Etkinlikler" />
                        <CardContent>
                            {upcomingEvents.length === 0 ? (
                                <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-caption)', textAlign: 'center' }}>Bu ay etkinlik yok</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {upcomingEvents.map(event => {
                                        const brandColor = event.brandId ? getBrandColor(event.brandId) : calendarEventTypes[event.type].color;
                                        return (
                                            <div key={event.id} onClick={() => openEventDetail(event)} style={{ padding: 10, backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${brandColor}`, cursor: 'pointer' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{event.title}</span>
                                                    <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{new Date(event.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                    <Badge style={{ backgroundColor: calendarEventTypes[event.type].color, color: 'white', fontSize: 9 }}>{calendarEventTypes[event.type].label}</Badge>
                                                    {event.brandId && (
                                                        <span style={{ fontSize: 10, color: brandColor, fontWeight: 500 }}>
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
                        <CardHeader title="📊 Bu Ay" />
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
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingEvent ? '✏️ Etkinlik Düzenle' : '📅 Yeni Etkinlik'} size="md" footer={
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
                        <Select label="Marka" value={formBrand} onChange={(e) => setFormBrand(e.target.value)} options={[{ value: '', label: 'Seçiniz...' }, ...brands.filter(b => b.active).map(b => ({ value: b.id, label: b.name }))]} />
                    </div>
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
