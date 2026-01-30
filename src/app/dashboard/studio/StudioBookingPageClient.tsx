'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Button, Badge, Modal, Input, Select, Textarea } from '@/components/ui';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { MagicBento } from '@/components/react-bits/MagicBento';
import { ShinyText } from '@/components/react-bits/TextAnimations';
import { brands, getBrandName, getBrandColor } from '@/lib/data';
import { getEquipment, getStudioCheckIns, createStudioCheckIn, completeStudioCheckOut, getTodayStudioStatus, calculatePaintCharge } from '@/lib/actions/studio';
import { Calendar, Clock, MapPin, Camera, Video, Mic, ChevronLeft, ChevronRight, Plus, AlertTriangle, CheckCircle, Info } from 'lucide-react';

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
    equipment: string[];
}

// Gerçek marka rezervasyonları
const initialBookings: Booking[] = [
    { id: 'b1', date: '2026-01-15', startTime: '10:00', endTime: '14:00', client: 'Valora Psikoloji', brandId: 'valora', project: 'Ürün Fotoğrafları', type: 'PHOTO', status: 'CONFIRMED', notes: 'Beyaz fon, ürün standları gerekli', equipment: ['Softbox', 'Backdrop', 'Tripod'] },
    { id: 'b2', date: '2026-01-17', startTime: '09:00', endTime: '18:00', client: 'Zoks Studio', brandId: 'zoks', project: 'Konsept Çekim', type: 'VIDEO', status: 'CONFIRMED', notes: 'Full gün çekim, yemek dahil', equipment: ['Kamera', 'Işık Seti', 'Mikrofon', 'Gimbal'] },
    { id: 'b3', date: '2026-01-20', startTime: '14:00', endTime: '16:00', client: 'Hair Chef', brandId: 'hairchef', project: 'Podcast Kaydı', type: 'PODCAST', status: 'PENDING', notes: '2 kişilik podcast kaydı', equipment: ['Mikrofon x2', 'Mixer', 'Kulaklık x2'] },
    { id: 'b4', date: '2026-01-22', startTime: '10:00', endTime: '12:00', client: 'Zeytindalı Gıda', brandId: 'zeytindali', project: 'Kurumsal Fotoğraf', type: 'PHOTO', status: 'PENDING', notes: 'Yönetim kurulu fotoğrafları', equipment: ['Portrait Lens', 'Softbox'] },
    { id: 'b5', date: '2026-01-25', startTime: '10:00', endTime: '14:00', client: 'İkra Giyim', brandId: 'ikra', project: 'Ürün Çekimi', type: 'PHOTO', status: 'CONFIRMED', notes: 'Yeni sezon kıyafet çekimi', equipment: ['Backdrop', 'Softbox', 'Manken'] },
    { id: 'b6', date: '2026-01-28', startTime: '09:00', endTime: '13:00', client: 'Tevfik Usta', brandId: 'tevfik', project: 'Mekan Çekimi', type: 'VIDEO', status: 'CONFIRMED', notes: 'Restoran iç çekim', equipment: ['Gimbal', 'Drone', 'Mikrofon'] },
];

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string; border: string }> = {
    PHOTO: { label: 'Fotoğraf', icon: <Camera size={14} />, color: 'rgba(50, 159, 245, 0.2)', border: '#329FF5' },
    VIDEO: { label: 'Video', icon: <Video size={14} />, color: 'rgba(255, 66, 66, 0.2)', border: '#FF4242' },
    PODCAST: { label: 'Podcast', icon: <Mic size={14} />, color: 'rgba(156, 39, 176, 0.2)', border: '#9C27B0' },
    OTHER: { label: 'Diğer', icon: <MapPin size={14} />, color: 'rgba(107, 123, 128, 0.2)', border: '#6B7B80' },
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    PENDING: { label: 'Onay Bekliyor', color: '#F6D73C', bgColor: 'rgba(246, 215, 60, 0.1)' },
    CONFIRMED: { label: 'Onaylandı', color: '#00F5B0', bgColor: 'rgba(0, 245, 176, 0.1)' },
    COMPLETED: { label: 'Tamamlandı', color: '#4CAF50', bgColor: 'rgba(76, 175, 80, 0.1)' },
    CANCELLED: { label: 'İptal', color: '#9CA3AF', bgColor: 'rgba(156, 163, 175, 0.1)' },
};

const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

// Tab types
type StudioTab = 'calendar' | 'checkin' | 'equipment';

import { ContentFilterBar } from '@/components/content/ContentFilterBar';
import { getActiveTeamMembers } from '@/lib/actions/users';
import { createContent } from '@/lib/actions/content';

export function StudioBookingPageClient() {
    const [activeTab, setActiveTab] = useState<StudioTab>('calendar');

    // Filter Bar State
    const [filterBrand, setFilterBrand] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterAssignee, setFilterAssignee] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTeam, setActiveTeam] = useState<any[]>([]);

    useEffect(() => {
        getActiveTeamMembers().then(setActiveTeam);
    }, []);

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
    // const [formEndTime, setFormEndTime] = useState(''); // Removed in favor of duration
    const [formDuration, setFormDuration] = useState<number>(2);
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
        setFormDuration(2); // Default 2 hours
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

    // Stats for Bento Grid
    const statsItems = [
        {
            title: "Bu Hafta",
            value: bookingList.filter(b => weekDays.some(d => d.date === b.date)).length.toString(),
            subtitle: "Rezervasyon",
            icon: <Calendar size={24} className="text-[#329FF5]" />,
            type: "stat"
        },
        {
            title: "Bugün",
            value: todayBookings.length.toString(),
            subtitle: "Çekim",
            icon: <Camera size={24} className="text-[#00F5B0]" />,
            type: "stat"
        },
        {
            title: "Popüler",
            value: "Fotoğraf",
            subtitle: "En çok tercih edilen",
            icon: <Clock size={24} className="text-[#9C27B0]" />,
            type: "stat"
        },
        {
            title: "Doluluk",
            value: "%65",
            subtitle: "Bu hafta",
            icon: <CheckCircle size={24} className="text-[#F6D73C]" />,
            type: "stat"
        }
    ];

    return (
        <div className="h-full flex flex-col">
            <ContentFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterBrand={filterBrand}
                onFilterBrandChange={setFilterBrand}
                filterStatus={filterStatus}
                onFilterStatusChange={setFilterStatus}
                filterAssignee={filterAssignee}
                onFilterAssigneeChange={setFilterAssignee}
                viewMode="studio"
                onViewModeChange={() => { }}
                activeTeam={activeTeam}
            />
            <div className="p-4 md:p-6 min-h-screen pt-2">
                {/* Header Section */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-1 flex items-center gap-3">
                            <ShinyText text="Stüdyo Yönetimi" disabled={false} speed={3} className="text-[#2997FF]" />
                        </h1>
                        <p className="text-muted-foreground">
                            Çekim ve kayıt planlaması
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={prevWeek} className="glass-button"><ChevronLeft size={16} /></Button>
                        <Button variant="secondary" size="sm" onClick={() => setCurrentWeekStart(getCurrentWeekStart())} className="glass-button">Bu Hafta</Button>
                        <Button variant="secondary" size="sm" onClick={nextWeek} className="glass-button"><ChevronRight size={16} /></Button>
                        <Button variant="primary" onClick={() => { setSelectedSlot(null); setShowBookingModal(true); }} className="shadow-lg shadow-blue-500/20">
                            <Plus size={16} className="mr-2" /> Yeni Rezervasyon
                        </Button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <GlassSurface className="overflow-hidden p-0 backdrop-blur-3xl min-h-[600px] mt-4">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={prevWeek} className="h-8 w-8 p-0 rounded-full hover:bg-white/10 text-white/70">◀</Button>
                            <h2 className="font-semibold text-white/90 text-lg">
                                {currentWeekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - {weekDays[6].dayNum} {currentWeekStart.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                            </h2>
                            <Button variant="ghost" size="sm" onClick={nextWeek} className="h-8 w-8 p-0 rounded-full hover:bg-white/10 text-white/70">▶</Button>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={() => setCurrentWeekStart(getCurrentWeekStart())} className="glass-button">Bu Hafta</Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-white/5 auto-rows-[minmax(60px,auto)]">
                        {/* Header Row */}
                        <div className="p-4 bg-black/40 font-medium text-center text-xs text-muted-foreground flex items-center justify-center border-b border-r border-white/5">
                            Saat
                        </div>
                        {weekDays.map(day => (
                            <div key={day.date} className={`p-3 text-center border-b border-r border-white/5 ${day.isToday ? 'bg-[#329FF5]/10' : 'bg-black/40'}`}>
                                <p className={`${day.isToday ? 'text-[#329FF5]' : 'text-muted-foreground'} text-xs font-medium uppercase mb-1`}>{day.dayName}</p>
                                <p className={`${day.isToday ? 'text-[#329FF5]' : 'text-white'} text-xl font-bold`}>{day.dayNum}</p>
                            </div>
                        ))}

                        {/* Time Slots */}
                        {timeSlots.map(time => (
                            <React.Fragment key={time}>
                                <div className="p-2 bg-black/20 text-center text-xs text-muted-foreground flex items-start justify-center pt-3 border-r border-b border-white/5 font-medium">
                                    {time}
                                </div>
                                {weekDays.map(day => {
                                    const slotBookings = getBookingsForSlot(day.date, time);
                                    // Filter to find bookings starting at this slot
                                    const startingBookings = slotBookings.filter(b => b.startTime.startsWith(time.split(':')[0]));

                                    return (
                                        <div
                                            key={`${day.date}-${time}`}
                                            onClick={() => slotBookings.length === 0 && openBookingModal(day.date, time)}
                                            onDragOver={handleDragOver}
                                            onDrop={() => handleDrop(day.date, time)}
                                            className={`
                                            relative border-b border-r border-white/5 transition-all min-h-[60px] p-1
                                            ${slotBookings.length === 0 ? 'hover:bg-white/5 cursor-pointer bg-black/20' : 'bg-black/20'}
                                            ${day.isToday ? 'bg-white/[0.02]' : ''}
                                        `}
                                        >
                                            {/* Render only if booking starts here */}
                                            {startingBookings.map(booking => {
                                                const startHour = parseInt(booking.startTime.split(':')[0]);
                                                const endHour = parseInt(booking.endTime.split(':')[0]);
                                                const durationSlots = endHour - startHour;
                                                const heightPercentage = durationSlots * 100;

                                                return (
                                                    <div
                                                        key={booking.id}
                                                        draggable
                                                        onDragStart={() => handleDragStart(booking)}
                                                        onClick={(e) => { e.stopPropagation(); openDetailModal(booking); }}
                                                        className="absolute inset-x-1 top-1 rounded-lg text-xs font-medium cursor-move flex flex-col justify-center gap-1 shadow-lg border border-white/10 transform hover:scale-[1.02] transition-transform z-10 p-2"
                                                        style={{
                                                            height: `calc(${heightPercentage}% - 8px)`,
                                                            backgroundColor: typeConfig[booking.type].color.replace('0.2', '0.6'),
                                                            borderColor: typeConfig[booking.type].border,
                                                            color: 'white',
                                                            backdropFilter: 'blur(8px)'
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-1.5 font-bold">
                                                            <span>{typeConfig[booking.type].icon}</span>
                                                            <span className="truncate">{booking.client}</span>
                                                        </div>
                                                        {durationSlots > 1 && (
                                                            <div className="opacity-80 truncate text-[10px]">
                                                                {booking.project}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </GlassSurface>

                {/* Tip Legendi */}
                <div className="flex gap-4 mt-4 px-2">
                    {Object.entries(typeConfig).map(([key, config]) => (
                        <div key={key} className="flex items-center gap-2 text-xs text-muted-foreground bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.border }} />
                            <span>{config.label}</span>
                        </div>
                    ))}
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

                                const startHour = parseInt(formStartTime.split(':')[0]) || 9;
                                const endHour = startHour + formDuration;
                                // Ensure double digits
                                const formattedStart = `${startHour.toString().padStart(2, '0')}:00`;
                                const formattedEnd = `${endHour.toString().padStart(2, '0')}:00`;

                                const newBooking: Booking = {
                                    id: `b${Date.now()}`,
                                    date: selectedSlot ? selectedSlot.date : (document.querySelector('input[type="date"]') as HTMLInputElement)?.value || formatLocalDate(new Date()),
                                    startTime: formattedStart,
                                    endTime: formattedEnd,
                                    client: formClient,
                                    project: formProject || 'Genel Çekim',
                                    type: formType,
                                    status: 'PENDING',
                                    notes: formNotes,
                                    equipment: []
                                };
                                setBookingList([...bookingList, newBooking]);
                                setShowBookingModal(false);
                            }}>Hızlı Kaydet</Button>
                        </>
                    }
                >
                    <div className="flex flex-col gap-4">
                        {selectedSlot && (
                            <div className="p-3 bg-[#329FF5]/10 rounded-lg border border-[#329FF5]/20">
                                <p className="text-xs text-[#329FF5]/80 uppercase font-semibold">Seçilen Slot</p>
                                <p className="font-bold text-white flex items-center gap-2">
                                    <Calendar size={14} /> {selectedSlot.date}
                                    <span className="opacity-50">|</span>
                                    <Clock size={14} /> {selectedSlot.time}
                                </p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Müşteri *" value={formClient} onChange={(e) => setFormClient(e.target.value)} placeholder="Firma adı..." />
                            <Input label="Proje" value={formProject} onChange={(e) => setFormProject(e.target.value)} placeholder="Proje adı..." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase">Çekim Türü</label>
                            <div className="grid grid-cols-4 gap-2">
                                {Object.entries(typeConfig).map(([key, config]) => (
                                    <button
                                        key={key}
                                        onClick={() => setFormType(key as any)}
                                        className={`
                                        p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 transition-all
                                        ${formType === key
                                                ? `bg-[${config.border}]/20 border-[${config.border}] text-white`
                                                : 'bg-black/20 border-white/5 text-muted-foreground hover:bg-white/5'
                                            }
                                    `}
                                        style={formType === key ? { backgroundColor: config.color, borderColor: config.border } : {}}
                                    >
                                        {config.icon}
                                        {config.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-black/20 p-3 rounded-lg border border-white/5">
                            {!selectedSlot && <Input label="Tarih" type="date" />}
                            <Input label="Başlangıç" type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} />

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-white/60">Süre</label>
                                <select
                                    value={formDuration}
                                    onChange={(e) => setFormDuration(parseInt(e.target.value))}
                                    className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#329FF5] transition-colors"
                                >
                                    {[1, 2, 3, 4, 5, 6, 8, 10].map(h => (
                                        <option key={h} value={h} className="bg-black text-white">{h} Saat</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <Textarea label="Notlar" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={3} placeholder="Ekipman listesi, özel istekler..." />
                    </div>
                </Modal>

                {/* Detay Modal */}
                <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title={selectedBooking ? selectedBooking.project : 'Rezervasyon Detayı'}
                    size="md"
                    footer={
                        <div className="flex justify-between w-full">
                            {selectedBooking && (
                                <Button variant="danger" size="sm" onClick={() => handleDeleteBooking(selectedBooking.id)}>Sil</Button>
                            )}
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Kapat</Button>
                            </div>
                        </div>
                    }
                >
                    {selectedBooking && (
                        <div className="flex flex-col gap-6">
                            {/* Status Header */}
                            <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center`} style={{ backgroundColor: typeConfig[selectedBooking.type].color, border: `1px solid ${typeConfig[selectedBooking.type].border}` }}>
                                        {typeConfig[selectedBooking.type].icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{selectedBooking.client}</h3>
                                        <p className="text-xs text-muted-foreground">{selectedBooking.project}</p>
                                    </div>
                                </div>
                                <Badge style={{ backgroundColor: statusConfig[selectedBooking.status].bgColor, color: statusConfig[selectedBooking.status].color }}>
                                    {statusConfig[selectedBooking.status].label}
                                </Badge>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Tarih</p>
                                    <p className="font-medium flex items-center gap-2"><Calendar size={14} className="text-blue-400" /> {selectedBooking.date}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Saat</p>
                                    <p className="font-medium flex items-center gap-2"><Clock size={14} className="text-green-400" /> {selectedBooking.startTime} - {selectedBooking.endTime}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Süre</p>
                                    <p className="font-medium">{parseInt(selectedBooking.endTime) - parseInt(selectedBooking.startTime)} Saat</p>
                                </div>
                                <div className="space-y-1">
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedBooking.notes && (
                                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Notlar</p>
                                    <p className="text-sm">{selectedBooking.notes}</p>
                                </div>
                            )}

                            {/* Equipment */}
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Ekipman & Gereksinimler</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedBooking.equipment.length > 0 ? selectedBooking.equipment.map(eq => (
                                        <Badge key={eq} variant="info" className="bg-blue-500/10 text-blue-400 border-blue-500/20">{eq}</Badge>
                                    )) : <span className="text-xs text-muted-foreground italic">Ekipman belirtilmemiş</span>}
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    );
}
