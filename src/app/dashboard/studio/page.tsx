'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Badge, Modal, Input, Select, Textarea } from '@/components/ui';
import { brands, getBrandName, getBrandColor } from '@/lib/data';
import { getEquipment, getStudioCheckIns, createStudioCheckIn, completeStudioCheckOut, getTodayStudioStatus, calculatePaintCharge } from '@/lib/actions/studio';

// ===== STÜDYO BOOKING SİSTEMİ =====

interface Booking {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    client: string;
    brandId?: string;
    project: string;
    type: 'PHOTO' | 'VIDEO' | 'PODCAST' | 'OTHER';
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
    notes: string;
    waiverSigned: boolean;
    equipment: string[];
}

// Gerçek marka rezervasyonları
const initialBookings: Booking[] = [
    { id: 'b1', date: '2026-01-15', startTime: '10:00', endTime: '14:00', client: 'Valora Psikoloji', brandId: 'valora', project: 'Ürün Fotoğrafları', type: 'PHOTO', status: 'CONFIRMED', notes: 'Beyaz fon, ürün standları gerekli', waiverSigned: true, equipment: ['Softbox', 'Backdrop', 'Tripod'] },
    { id: 'b2', date: '2026-01-17', startTime: '09:00', endTime: '18:00', client: 'Zoks Studio', brandId: 'zoks', project: 'Konsept Çekim', type: 'VIDEO', status: 'CONFIRMED', notes: 'Full gün çekim, yemek dahil', waiverSigned: true, equipment: ['Kamera', 'Işık Seti', 'Mikrofon', 'Gimbal'] },
    { id: 'b3', date: '2026-01-20', startTime: '14:00', endTime: '16:00', client: 'Hair Chef', brandId: 'hairchef', project: 'Podcast Kaydı', type: 'PODCAST', status: 'PENDING', notes: '2 kişilik podcast kaydı', waiverSigned: false, equipment: ['Mikrofon x2', 'Mixer', 'Kulaklık x2'] },
    { id: 'b4', date: '2026-01-22', startTime: '10:00', endTime: '12:00', client: 'Zeytindalı Gıda', brandId: 'zeytindali', project: 'Kurumsal Fotoğraf', type: 'PHOTO', status: 'PENDING', notes: 'Yönetim kurulu fotoğrafları', waiverSigned: false, equipment: ['Portrait Lens', 'Softbox'] },
    { id: 'b5', date: '2026-01-25', startTime: '10:00', endTime: '14:00', client: 'İkra Giyim', brandId: 'ikra', project: 'Ürün Çekimi', type: 'PHOTO', status: 'CONFIRMED', notes: 'Yeni sezon kıyafet çekimi', waiverSigned: true, equipment: ['Backdrop', 'Softbox', 'Manken'] },
    { id: 'b6', date: '2026-01-28', startTime: '09:00', endTime: '13:00', client: 'Tevfik Usta', brandId: 'tevfik', project: 'Mekan Çekimi', type: 'VIDEO', status: 'CONFIRMED', notes: 'Restoran iç çekim', waiverSigned: true, equipment: ['Gimbal', 'Drone', 'Mikrofon'] },
];

const typeConfig: Record<string, { label: string; icon: string; color: string }> = {
    PHOTO: { label: 'Fotoğraf', icon: 'Fotoğraf', color: '#329FF5' },
    VIDEO: { label: 'Video', icon: '🎬', color: '#FF4242' },
    PODCAST: { label: 'Podcast', icon: '🎙️', color: '#9C27B0' },
    OTHER: { label: 'Diğer', icon: '📌', color: '#6B7B80' },
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    PENDING: { label: 'Onay Bekliyor', color: '#F6D73C', bgColor: '#FFF9E6' },
    CONFIRMED: { label: 'Onaylandı', color: '#00F5B0', bgColor: '#E8F5E9' },
    COMPLETED: { label: 'Tamamlandı', color: '#4CAF50', bgColor: '#E8F5E9' },
    CANCELLED: { label: 'İptal', color: '#6B7B80', bgColor: '#F5F5F5' },
};

const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

// Tab types
type StudioTab = 'calendar' | 'checkin' | 'equipment';

export default function StudioBookingPage() {
    const [activeTab, setActiveTab] = useState<StudioTab>('calendar');

    // Dinamik olarak haftanın başlangıcını (Pazartesi) hesapla
    const getCurrentWeekStart = () => {
        const d = new Date();
        const day = d.getDay(); // 0 (Pazar) - 6 (Cmt)
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Pazar ise -6, diğerleri için +1 (Pzt)
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0); // Saati sıfırla
        return monday;
    };

    const [currentWeekStart, setCurrentWeekStart] = useState(getCurrentWeekStart());
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);

    // Bookings State (DnD için)
    const [bookingList, setBookingList] = useState<Booking[]>(initialBookings);
    const [draggedBooking, setDraggedBooking] = useState<Booking | null>(null);

    // Check-in states
    const [equipmentList, setEquipmentList] = useState<any[]>([]);
    const [checkInList, setCheckInList] = useState<any[]>([]);
    const [showCheckInModal, setShowCheckInModal] = useState(false);
    const [showCheckOutModal, setShowCheckOutModal] = useState(false);
    const [selectedCheckIn, setSelectedCheckIn] = useState<any>(null);
    const [studioStatus, setStudioStatus] = useState<any>(null);

    // Helper for correct local date string "YYYY-MM-DD"
    const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                // LocalStorage'dan verileri çek
                if (typeof window !== 'undefined') {
                    const savedBookings = localStorage.getItem('studioBookings');
                    if (savedBookings) {
                        try {
                            const parsed = JSON.parse(savedBookings);
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                setBookingList(parsed);
                            }
                        } catch (e) {
                            console.error('LocalStorage parse error:', e);
                        }
                    }
                }

                const [equipment, checkIns, status] = await Promise.all([
                    getEquipment(),
                    getStudioCheckIns(),
                    getTodayStudioStatus(),
                ]);
                setEquipmentList(equipment);
                setCheckInList(checkIns);
                setStudioStatus(status);
            } catch (error) {
                console.error('Studio data loading error:', error);
            }
        };
        loadData();
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        if (typeof window !== 'undefined' && bookingList !== initialBookings) {
            localStorage.setItem('studioBookings', JSON.stringify(bookingList));
        }
    }, [bookingList]);

    const handleDeleteBooking = (id: string) => {
        if (confirm('Bu rezervasyonu silmek istediğinize emin misiniz?')) {
            const newList = bookingList.filter(b => b.id !== id);
            setBookingList(newList);
            localStorage.setItem('studioBookings', JSON.stringify(newList));
            setShowDetailModal(false);
            setSelectedBooking(null);
        }
    };

    // Form state
    const [formClient, setFormClient] = useState('');
    const [formProject, setFormProject] = useState('');
    const [formType, setFormType] = useState<Booking['type']>('PHOTO');
    const [formStartTime, setFormStartTime] = useState('');
    const [formEndTime, setFormEndTime] = useState('');
    const [formNotes, setFormNotes] = useState('');

    // DnD Handlers
    const handleDragStart = (booking: Booking) => {
        setDraggedBooking(booking);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (date: string, time: string) => {
        if (!draggedBooking) return;

        // Süreyi koruyarak yeni saat aralığını hesapla
        const startHour = parseInt(draggedBooking.startTime.split(':')[0]);
        const endHour = parseInt(draggedBooking.endTime.split(':')[0]);
        const duration = endHour - startHour;

        const newStartHour = parseInt(time.split(':')[0]);
        const newEndHour = newStartHour + duration;

        const newStartTime = `${newStartHour.toString().padStart(2, '0')}:00`;
        const newEndTime = `${newEndHour.toString().padStart(2, '0')}:00`;

        setBookingList(prev => prev.map(b =>
            b.id === draggedBooking.id
                ? { ...b, date, startTime: newStartTime, endTime: newEndTime }
                : b
        ));
        setDraggedBooking(null);
    };

    // Hafta günlerini oluştur
    interface WeekDay {
        date: string;
        dayName: string;
        dayNum: number;
        isToday: boolean;
    }
    const weekDays: WeekDay[] = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + i);
        weekDays.push({
            date: formatLocalDate(date),
            dayName: date.toLocaleDateString('tr-TR', { weekday: 'short' }),
            dayNum: date.getDate(),
            isToday: date.toDateString() === new Date().toDateString(),
        });
    }

    const getBookingsForSlot = (date: string, time: string) => {
        return bookingList.filter(b => {
            if (b.date !== date) return false;
            const start = parseInt(b.startTime.split(':')[0]);
            const end = parseInt(b.endTime.split(':')[0]);
            const slotHour = parseInt(time.split(':')[0]);
            return slotHour >= start && slotHour < end;
        });
    };

    const openBookingModal = (date: string, time: string) => {
        setSelectedSlot({ date, time });
        setFormClient('');
        setFormProject('');
        setFormType('PHOTO');
        setFormStartTime(time);
        setFormEndTime(`${parseInt(time.split(':')[0]) + 2}:00`);
        setFormNotes('');
        setShowBookingModal(true);
    };

    const openDetailModal = (booking: Booking) => {
        setSelectedBooking(booking);
        setShowDetailModal(true);
    };

    const prevWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentWeekStart(newDate);
    };

    const nextWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentWeekStart(newDate);
    };

    const pendingCount = bookingList.filter(b => b.status === 'PENDING').length;
    const todayBookings = bookingList.filter(b => b.date === formatLocalDate(new Date()));

    return (
        <>
            <Header
                title="Stüdyo Rezervasyonu"
                subtitle="Çekim ve kayıt planlaması"
                actions={
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <Button variant="secondary" size="sm" onClick={prevWeek}>◀ Önceki</Button>
                        <Button variant="secondary" size="sm" onClick={() => setCurrentWeekStart(getCurrentWeekStart())}>Bu Hafta</Button>
                        <Button variant="secondary" size="sm" onClick={nextWeek}>Sonraki ▶</Button>
                        <Button variant="primary" onClick={() => { setSelectedSlot(null); setShowBookingModal(true); }}>+ Yeni Rezervasyon</Button>
                    </div>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* Uyarılar */}
                {pendingCount > 0 && (
                    <Card style={{ marginBottom: 'var(--space-2)', backgroundColor: '#FFF9E6', borderLeft: '4px solid #F6D73C' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{ fontSize: '24px' }}>⏳</span>
                            <div>
                                <p style={{ fontWeight: 600, color: '#F57F17' }}>{pendingCount} rezervasyon onay bekliyor</p>
                                <p style={{ fontSize: 'var(--text-caption)', color: '#F9A825' }}>
                                    Feragatname imzalanmadan rezervasyon onaylanamaz
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Üst Kartlar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>BU HAFTA</p>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-primary)' }}>
                                {bookingList.filter(b => weekDays.some(d => d.date === b.date)).length}
                            </p>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>rezervasyon</p>
                        </div>
                    </Card>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>BUGÜN</p>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: todayBookings.length > 0 ? '#00F5B0' : 'var(--color-muted)' }}>
                                {todayBookings.length}
                            </p>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>çekim</p>
                        </div>
                    </Card>
                    <Card style={{ background: '#E3F2FD' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>EN POPÜLER</p>
                            <p style={{ fontSize: '28px' }}>Fotoğraf</p>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Fotoğraf</p>
                        </div>
                    </Card>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>DOLULUK</p>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-success)' }}>%65</p>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>bu hafta</p>
                        </div>
                    </Card>
                </div>

                {/* Haftalık Takvim Grid */}
                <Card>
                    <CardHeader
                        title={`Tarih: ${currentWeekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - ${weekDays[6].dayNum} ${currentWeekStart.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}`}
                    />
                    <CardContent>
                        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', gap: '1px', backgroundColor: 'var(--color-border)' }}>
                            {/* Header Row */}
                            <div style={{ padding: '12px', backgroundColor: 'var(--color-surface)', fontWeight: 600, textAlign: 'center' }}>Saat</div>
                            {weekDays.map(day => (
                                <div key={day.date} style={{
                                    padding: '12px',
                                    backgroundColor: day.isToday ? 'rgba(50, 159, 245, 0.1)' : 'var(--color-surface)',
                                    fontWeight: 600,
                                    textAlign: 'center'
                                }}>
                                    <p style={{ color: day.isToday ? 'var(--color-primary)' : 'inherit' }}>{day.dayName}</p>
                                    <p style={{ fontSize: '18px', color: day.isToday ? 'var(--color-primary)' : 'inherit' }}>{day.dayNum}</p>
                                </div>
                            ))}

                            {/* Time Slots */}
                            {timeSlots.map(time => (
                                <React.Fragment key={time}>
                                    <div style={{ padding: '8px', backgroundColor: 'var(--color-card)', textAlign: 'center', fontSize: 'var(--text-caption)' }}>
                                        {time}
                                    </div>
                                    {weekDays.map(day => {
                                        const slotBookings = getBookingsForSlot(day.date, time);
                                        return (
                                            <div
                                                key={`${day.date}-${time}`}
                                                onClick={() => slotBookings.length === 0 && openBookingModal(day.date, time)}
                                                onDragOver={handleDragOver}
                                                onDrop={() => handleDrop(day.date, time)}
                                                style={{
                                                    padding: '4px',
                                                    backgroundColor: 'var(--color-card)',
                                                    minHeight: 40,
                                                    cursor: slotBookings.length === 0 ? 'pointer' : 'default',
                                                    transition: 'background-color 0.2s'
                                                }}
                                            >
                                                {slotBookings.map(booking => (
                                                    <div
                                                        key={booking.id}
                                                        draggable
                                                        onDragStart={() => handleDragStart(booking)}
                                                        onClick={(e) => { e.stopPropagation(); openDetailModal(booking); }}
                                                        style={{
                                                            padding: '4px 6px',
                                                            backgroundColor: typeConfig[booking.type].color,
                                                            color: 'white',
                                                            borderRadius: '4px',
                                                            fontSize: '10px',
                                                            fontWeight: 500,
                                                            cursor: 'move',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            marginBottom: '2px',
                                                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                                        }}
                                                    >
                                                        {!booking.waiverSigned && <span>⚠️</span>}
                                                        <span>{typeConfig[booking.type].icon}</span>
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{booking.client}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Tip Legendi */}
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    {Object.entries(typeConfig).map(([key, config]) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-caption)' }}>
                            <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: config.color }} />
                            <span>{config.icon} {config.label}</span>
                        </div>
                    ))}
                    <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginLeft: 'auto' }}>
                        ⚠️ = Feragatname imzalanmamış
                    </span>
                </div>
            </div>

            {/* Rezervasyon Modal */}
            <Modal
                isOpen={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                title="Yeni Rezervasyon"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowBookingModal(false)}>İptal</Button>
                        <Button variant="primary" onClick={() => {
                            if (!formClient) { alert('Müşteri adı zorunludur'); return; }

                            const newBooking: Booking = {
                                id: `b${Date.now()}`,
                                date: selectedSlot ? selectedSlot.date : (document.querySelector('input[type="date"]') as HTMLInputElement)?.value || formatLocalDate(new Date()),
                                startTime: selectedSlot ? selectedSlot.time : formStartTime,
                                endTime: selectedSlot ? `${parseInt(selectedSlot.time.split(':')[0]) + 2}:00` : formEndTime,
                                client: formClient,
                                project: formProject || 'Genel Çekim',
                                type: formType,
                                status: 'PENDING',
                                notes: formNotes,
                                waiverSigned: false,
                                equipment: []
                            };
                            setBookingList([...bookingList, newBooking]);
                            setShowBookingModal(false);
                        }}>Hızlı Kaydet</Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {selectedSlot && (
                        <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Seçilen Tarih</p>
                            <p style={{ fontWeight: 600 }}>{selectedSlot.date} • {selectedSlot.time}</p>
                        </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                        <Input label="Müşteri *" value={formClient} onChange={(e) => setFormClient(e.target.value)} />
                        <Input label="Proje *" value={formProject} onChange={(e) => setFormProject(e.target.value)} />
                    </div>
                    <Select
                        label="Çekim Türü"
                        value={formType}
                        onChange={(e) => setFormType(e.target.value as Booking['type'])}
                        options={Object.entries(typeConfig).map(([k, v]) => ({ value: k, label: `${v.icon} ${v.label}` }))}
                    />
                    {!selectedSlot && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}>
                            <Input label="Tarih" type="date" />
                            <Input label="Başlangıç" type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} />
                            <Input label="Bitiş" type="time" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} />
                        </div>
                    )}
                    <Textarea label="Notlar" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} placeholder="Ekipman, özel gereksinimler..." />
                    <div style={{ padding: 'var(--space-2)', backgroundColor: '#FFF3E0', borderRadius: 'var(--radius-sm)' }}>
                        <p style={{ fontSize: 'var(--text-caption)', color: '#E65100' }}>
                            ⚠️ Rezervasyon onayı için feragatname (sorumluluk belgesi) imzalanmalıdır.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Detay Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title={selectedBooking ? `${typeConfig[selectedBooking.type].icon} ${selectedBooking.project}` : 'Rezervasyon'}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Kapat</Button>
                        {selectedBooking && (
                            <Button variant="ghost" style={{ color: '#d32f2f', marginRight: 'auto' }} onClick={() => handleDeleteBooking(selectedBooking.id)}>Sil</Button>
                        )}
                        {selectedBooking?.status === 'PENDING' && !selectedBooking.waiverSigned && (
                            <Button variant="warning">Feragatname Gönder</Button>
                        )}
                        {selectedBooking?.status === 'PENDING' && selectedBooking.waiverSigned && (
                            <Button variant="success">✅ Onayla</Button>
                        )}
                    </>
                }
            >
                {selectedBooking && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                            <Badge style={{ backgroundColor: statusConfig[selectedBooking.status].bgColor, color: statusConfig[selectedBooking.status].color }}>
                                {statusConfig[selectedBooking.status].label}
                            </Badge>
                            <Badge style={{ backgroundColor: typeConfig[selectedBooking.type].color, color: 'white' }}>
                                {typeConfig[selectedBooking.type].icon} {typeConfig[selectedBooking.type].label}
                            </Badge>
                            {!selectedBooking.waiverSigned && <Badge variant="error">Feragatname Yok</Badge>}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                            <div>
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Müşteri</p>
                                <p style={{ fontWeight: 600 }}>🏢 {selectedBooking.client}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Tarih</p>
                                <p>Tarih: {selectedBooking.date}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Saat</p>
                                <p>🕐 {selectedBooking.startTime} - {selectedBooking.endTime}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Süre</p>
                                <p>{parseInt(selectedBooking.endTime) - parseInt(selectedBooking.startTime)} saat</p>
                            </div>
                        </div>

                        {selectedBooking.notes && (
                            <div>
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Notlar</p>
                                <p>{selectedBooking.notes}</p>
                            </div>
                        )}

                        <div>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginBottom: '8px' }}>Ekipman</p>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {selectedBooking.equipment.map(eq => (
                                    <Badge key={eq} variant="info">{eq}</Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}
