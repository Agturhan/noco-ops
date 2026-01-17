'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Badge, Modal, Input, Select, Textarea, MiniCalendar } from '@/components/ui';
import { brands, teamMembers, getBrandColor, getBrandName, getActiveTeamMembers, contentStatuses, contentTypes, ContentStatus, ContentType } from '@/lib/data';

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
    assigneeId?: string;
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
const initialContents: ContentItem[] = [
    // Tevfik Usta
    { id: '1', title: 'Tevfik Usta Video 1', brandId: 'tevfik', status: 'PAYLASILD', type: 'VIDEO', notes: 'Bir Akşam videosu', deliveryDate: '2025-11-19', publishDate: '2025-11-19' },
    { id: '2', title: 'Tevfik Usta Video 2', brandId: 'tevfik', status: 'PAYLASILD', type: 'VIDEO', notes: '15 Kasım - 15 Aralık 2. video', deliveryDate: '2025-11-22', publishDate: '2025-11-22' },
    { id: '3', title: 'Tevfik Usta Video 3', brandId: 'tevfik', status: 'PAYLASILD', type: 'VIDEO', notes: '15 Kasım - 15 Aralık 3. video', deliveryDate: '2025-11-25', publishDate: '2025-11-25' },
    { id: '4', title: 'Tevfik Usta Video 4', brandId: 'tevfik', status: 'PAYLASILD', type: 'VIDEO', notes: '', deliveryDate: '2025-12-01' },
    { id: '5', title: 'Tevfik Usta Video 5', brandId: 'tevfik', status: 'PAYLASILD', type: 'VIDEO', notes: '', deliveryDate: '2025-12-06' },
    { id: '6', title: 'Tevfik Usta Video 6', brandId: 'tevfik', status: 'PLANLANDI', type: 'VIDEO', notes: '', deliveryDate: '2025-12-11' },
    { id: '7', title: 'Tevfik Usta Doğum Günü', brandId: 'tevfik', status: 'PAYLASILD', type: 'VIDEO', notes: 'Geç paylaşıldı', deliveryDate: '2025-11-17', publishDate: '2025-11-17' },
    { id: '8', title: 'Tevfik Usta Çekim Günü', brandId: 'tevfik', status: 'CEKILDI', type: 'VIDEO', notes: '', deliveryDate: '2025-12-01' },

    // ByKasap
    { id: '10', title: 'ByKasap Video 1', brandId: 'bykasap', status: 'PAYLASILD', type: 'VIDEO', notes: 'Alo Buyrun', deliveryDate: '2025-11-17', publishDate: '2025-11-17' },
    { id: '11', title: 'ByKasap Video 2', brandId: 'bykasap', status: 'PAYLASILD', type: 'VIDEO', notes: '15 Kasım - 15 Aralık 2. video', deliveryDate: '2025-11-21', publishDate: '2025-11-21' },
    { id: '12', title: 'ByKasap Video 3', brandId: 'bykasap', status: 'PAYLASILD', type: 'VIDEO', notes: '15 Kasım - 15 Aralık 3. video', deliveryDate: '2025-11-24', publishDate: '2025-11-24' },
    { id: '13', title: 'ByKasap Video 4', brandId: 'bykasap', status: 'KURGULANIYOR', type: 'VIDEO', notes: '15 Kasım - 15 Aralık 4. video', deliveryDate: '2025-11-29', publishDate: '2025-11-29' },
    { id: '14', title: 'ByKasap Video 5', brandId: 'bykasap', status: 'PAYLASILD', type: 'VIDEO', notes: '', deliveryDate: '2025-12-03' },
    { id: '15', title: 'ByKasap Video 6', brandId: 'bykasap', status: 'PLANLANDI', type: 'VIDEO', notes: '', deliveryDate: '2025-12-07' },
    { id: '16', title: 'ByKasap Video 9', brandId: 'bykasap', status: 'PAYLASILD', type: 'VIDEO', notes: '15 Kasım deadline', deliveryDate: '2025-11-14', publishDate: '2025-11-14' },
    { id: '17', title: 'ByKasap Çekim', brandId: 'bykasap', status: 'PLANLANDI', type: 'VIDEO', notes: '', deliveryDate: '2025-12-08' },

    // İkra Giyim
    { id: '20', title: 'İkra Video 1', brandId: 'ikra', status: 'PAYLASILD', type: 'VIDEO', notes: '', deliveryDate: '2025-11-08', publishDate: '2025-11-08' },
    { id: '21', title: 'İkra Video 2', brandId: 'ikra', status: 'PAYLASILD', type: 'VIDEO', notes: '', deliveryDate: '2025-11-15', publishDate: '2025-11-15' },
    { id: '22', title: 'İkra Video 3', brandId: 'ikra', status: 'PAYLASILD', type: 'VIDEO', notes: '18 Kasım çekimi', deliveryDate: '2025-11-21', publishDate: '2025-11-21' },
    { id: '23', title: 'İkra Video 4', brandId: 'ikra', status: 'PAYLASILD', type: 'VIDEO', notes: '', deliveryDate: '2025-11-24', publishDate: '2025-11-24' },
    { id: '24', title: 'İkra Video 5', brandId: 'ikra', status: 'PAYLASILD', type: 'VIDEO', notes: '', deliveryDate: '2025-11-27', publishDate: '2025-11-27' },
    { id: '25', title: 'İkra Video 6', brandId: 'ikra', status: 'PAYLASILD', type: 'VIDEO', notes: '', deliveryDate: '2025-11-30', publishDate: '2025-11-30' },
    { id: '26', title: 'İkra Video Çekim', brandId: 'ikra', status: 'CEKILDI', type: 'VIDEO', notes: 'Dükkan içi çekim', deliveryDate: '2025-11-20' },
    { id: '27', title: 'Mevlit Paket Çekimi', brandId: 'ikra', status: 'CEKILDI', type: 'VIDEO', notes: 'Mevlit paketleri çekilecek', deliveryDate: '2025-11-25' },

    // Zeytindalı Gıda
    { id: '30', title: 'Zeytindalı Video 2', brandId: 'zeytindali', status: 'PAYLASILD', type: 'VIDEO', notes: 'PNG Video Paylaşım', deliveryDate: '2025-11-15', publishDate: '2025-11-15' },
    { id: '31', title: 'Zeytindalı Video 3', brandId: 'zeytindali', status: 'PAYLASILD', type: 'VIDEO', notes: 'Taytolon Video', deliveryDate: '2025-11-18', publishDate: '2025-11-18' },
    { id: '32', title: 'Zeytindalı Video 4', brandId: 'zeytindali', status: 'PAYLASILD', type: 'VIDEO', notes: 'Stüdyo Video', deliveryDate: '2025-11-22', publishDate: '2025-11-22' },
    { id: '33', title: 'Zeytindalı Video 5', brandId: 'zeytindali', status: 'PAYLASILD', type: 'VIDEO', notes: 'Arabaya Binme Video', deliveryDate: '2025-11-26', publishDate: '2025-11-22' },
    { id: '34', title: 'Zeytindalı Video 6', brandId: 'zeytindali', status: 'PAYLASILD', type: 'VIDEO', notes: 'Mahmut Abi Video', deliveryDate: '2025-12-01', publishDate: '2025-12-01' },
    { id: '35', title: 'Zeytindalı Video Çekim', brandId: 'zeytindali', status: 'CEKILDI', type: 'VIDEO', notes: '', deliveryDate: '2025-11-17' },
    { id: '36', title: 'Zeytindalı Stüdyo Çekim', brandId: 'zeytindali', status: 'PLANLANDI', type: 'FOTOGRAF', notes: '', deliveryDate: '2025-12-09', publishDate: '2025-12-09' },
    { id: '37', title: 'Zeytindalı Çekim Günü', brandId: 'zeytindali', status: 'CEKILDI', type: 'VIDEO', notes: '', deliveryDate: '2025-12-02' },
    { id: '38', title: 'Zeytindalı İhram Video', brandId: 'zeytindali', status: 'KURGULANIYOR', type: 'VIDEO', notes: '', deliveryDate: '2025-12-05', publishDate: '2025-12-05' },

    // Valora Psikoloji
    { id: '40', title: 'Valora Post 1', brandId: 'valora', status: 'PAYLASILD', type: 'POST', notes: 'Özşefkat içerik', deliveryDate: '2025-11-18', publishDate: '2025-11-18' },
    { id: '41', title: 'Valora Post 2', brandId: 'valora', status: 'PAYLASILD', type: 'POST', notes: '1 Kasım - 1 Aralık 2. Post', deliveryDate: '2025-11-27', publishDate: '2025-11-26' },
    { id: '42', title: 'Valora Video 1', brandId: 'valora', status: 'PAYLASILD', type: 'VIDEO', notes: '1 Kasım - 1 Aralık 1. Video', deliveryDate: '2025-11-11', publishDate: '2025-11-11' },
    { id: '43', title: 'Valora Video 2', brandId: 'valora', status: 'PAYLASILD', type: 'VIDEO', notes: 'Hiperaktif çocuk videosu', deliveryDate: '2025-11-22', publishDate: '2025-11-24' },
    { id: '44', title: 'Valora Video 3', brandId: 'valora', status: 'PAYLASILD', type: 'VIDEO', notes: '1 Kasım - 1 Aralık 3. Video', deliveryDate: '2025-12-02', publishDate: '2025-12-01' },
    { id: '45', title: 'Valora Çekim', brandId: 'valora', status: 'CEKILDI', type: 'VIDEO', notes: 'Çekim günü', deliveryDate: '2025-11-24' },
    { id: '46', title: 'Valora Video Aralık', brandId: 'valora', status: 'PAYLASILD', type: 'VIDEO', notes: '', deliveryDate: '2025-12-06' },

    // Zoks Studio
    { id: '50', title: 'Zoks Video 1', brandId: 'zoks', status: 'PAYLASILD', type: 'VIDEO', notes: 'Katılımcı Yorumu Workshop', deliveryDate: '2025-11-19', publishDate: '2025-11-19' },
    { id: '51', title: 'Zoks Video 2', brandId: 'zoks', status: 'PAYLASILD', type: 'VIDEO', notes: 'Seramik üretim süreci', deliveryDate: '2025-11-21', publishDate: '2025-11-21' },
    { id: '52', title: 'Zoks Video 3', brandId: 'zoks', status: 'KURGULANIYOR', type: 'VIDEO', notes: 'Koca Kafa Akımı', deliveryDate: '2025-11-24', publishDate: '2025-11-25' },
    { id: '53', title: 'Zoks Video 4', brandId: 'zoks', status: 'PAYLASILD', type: 'VIDEO', notes: 'Tornada yıkım', deliveryDate: '2025-11-27', publishDate: '2025-11-27' },
    { id: '54', title: 'Zoks Yılbaşı Video', brandId: 'zoks', status: 'PAYLASILD', type: 'VIDEO', notes: 'Yılbaşı Kampanyası', deliveryDate: '2025-12-04' },
    { id: '55', title: 'Zoks Şükufe Video', brandId: 'zoks', status: 'CEKILDI', type: 'VIDEO', notes: 'But Mama I am in love with a criminal', deliveryDate: '2025-12-11' },
    { id: '56', title: 'Zoks Konsept Çekim', brandId: 'zoks', status: 'PLANLANDI', type: 'FOTOGRAF', notes: '', deliveryDate: '2025-12-09' },

    // Ali Haydar Ocakbaşı
    { id: '60', title: 'Ali Haydar Video 1', brandId: 'alihaydar', status: 'PAYLASILD', type: 'VIDEO', notes: '', deliveryDate: '2025-11-07', publishDate: '2025-11-07' },
    { id: '61', title: 'Ali Haydar Video Teslim', brandId: 'alihaydar', status: 'TESLIM', type: 'VIDEO', notes: 'İncik video teslim edildi', deliveryDate: '2025-11-14' },

    // Hair Chef
    { id: '65', title: 'Hair Chef Podcast', brandId: 'hairchef', status: 'TESLIM', type: 'PODCAST', notes: 'Tüm gün kurgu süreci', deliveryDate: '2025-11-16' },

    // Ressam Ayşenur Saylan
    { id: '70', title: 'Ayşenur Stüdyo Video', brandId: 'aysenur', status: 'CEKILDI', type: 'VIDEO', notes: 'Perşembe sabah stüdyo çekimi', deliveryDate: '2025-11-23' },
    { id: '71', title: 'Ayşenur Fotoğraf Çekimi', brandId: 'aysenur', status: 'CEKILDI', type: 'FOTOGRAF', notes: '6 tablo bıraktı', deliveryDate: '2025-11-15' },
    { id: '72', title: 'Ayşenur Foto İletme', brandId: 'aysenur', status: 'PAYLASILD', type: 'FOTOGRAF', notes: '', deliveryDate: '2025-11-26' },
    { id: '73', title: 'Ayşenur Video Yapım', brandId: 'aysenur', status: 'TESLIM', type: 'VIDEO', notes: '', deliveryDate: '2025-11-28' },
    { id: '74', title: 'Ayşenur Revize', brandId: 'aysenur', status: 'TESLIM', type: 'VIDEO', notes: 'Revize', deliveryDate: '2025-12-03' },
    { id: '75', title: 'Ayşenur Sergi Çekim', brandId: 'aysenur', status: 'PLANLANDI', type: 'VIDEO', notes: '', deliveryDate: '2025-12-16' },

    // Hubeyb Karaca
    { id: '80', title: 'Hubeyb Video 1', brandId: 'hubeyb', status: 'TESLIM', type: 'VIDEO', notes: '', deliveryDate: '2025-12-05' },
    { id: '81', title: 'Hubeyb Video 2', brandId: 'hubeyb', status: 'CEKILDI', type: 'VIDEO', notes: 'Kaba kurgusu ve içerik metni', deliveryDate: '2025-12-07', publishDate: '2025-12-10' },
    { id: '82', title: 'Hubeyb Web Teklifi', brandId: 'hubeyb', status: 'PLANLANDI', type: 'TEKLIF', notes: '', deliveryDate: '2025-12-07' },

    // CEOTekmer
    { id: '85', title: 'CEOTekmer Çekim', brandId: 'ceotekmer', status: 'CEKILDI', type: 'VIDEO', notes: '', deliveryDate: '2025-12-04' },
    { id: '86', title: 'CEOTekmer Katalog', brandId: 'ceotekmer', status: 'PLANLANDI', type: 'POST', notes: '', deliveryDate: '2025-12-10' },

    // Dürümcü Dede
    { id: '90', title: 'Dürümcü Dede Video', brandId: 'durumcu', status: 'CEKILDI', type: 'VIDEO', notes: '', deliveryDate: '2025-12-09' },

    // Biradlı Suni Deri
    { id: '92', title: 'Biradlı Çekim', brandId: 'biradli', status: 'PLANLANDI', type: 'VIDEO', notes: '', deliveryDate: '2025-12-06', publishDate: '2025-11-25' },

    // NOCO Creative
    { id: '95', title: 'Web Site Tasarım', brandId: 'noco', status: 'KURGULANIYOR', type: 'WEB', notes: 'Web tasarımına devam', deliveryDate: '2025-12-09' },
    { id: '96', title: 'NOCO Sunumu', brandId: 'noco', status: 'PLANLANDI', type: 'TEKLIF', notes: '', deliveryDate: '2025-12-09', publishDate: '2025-12-03' },

    // Raporlar
    { id: '98', title: 'Raporlar - Tevfik & ByKasap', brandId: 'bykasap', status: 'PAYLASILD', type: 'RAPOR', notes: '', deliveryDate: '2025-11-25' },
    { id: '99', title: 'Raporlar - Zoks, İkra, Zeytindalı, Valora', brandId: 'zoks', status: 'TESLIM', type: 'RAPOR', notes: '', deliveryDate: '2025-12-03', publishDate: '2025-12-02' },
];

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
    const [showBrandModal, setShowBrandModal] = useState(false);
    const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
    const [filterBrand, setFilterBrand] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'team'>('list');

    // Marka yönetimi
    const [customBrands, setCustomBrands] = useState<typeof brands>([]);
    const [newBrandName, setNewBrandName] = useState('');
    const [newBrandColor, setNewBrandColor] = useState('#329FF5');

    // Form states
    const [formTitle, setFormTitle] = useState('');
    const [formBrand, setFormBrand] = useState('');
    const [formType, setFormType] = useState<ContentType>('VIDEO');
    const [formStatus, setFormStatus] = useState<ContentStatus>('PLANLANDI');
    const [formNotes, setFormNotes] = useState('');
    const [formDeliveryDate, setFormDeliveryDate] = useState('');
    const [formPublishDate, setFormPublishDate] = useState('');
    const [formAssignee, setFormAssignee] = useState('');

    // Inline editing states
    const [editingNotes, setEditingNotes] = useState('');
    const [noteHistory, setNoteHistory] = useState<NoteHistoryEntry[]>([]);

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

    // Marka ekleme
    const addBrand = () => {
        if (!newBrandName.trim()) return;
        const newBrand = {
            id: `custom_${Date.now()}`,
            name: newBrandName,
            color: newBrandColor,
            category: 'SOSYAL_MEDYA' as const,
            contractType: 'PROJECT' as const,
            active: true
        };
        setCustomBrands([...customBrands, newBrand]);
        setNewBrandName('');
        setNewBrandColor('#329FF5');
        setShowBrandModal(false);
    };

    // Marka arşivleme (silmek yerine inactive yap)
    const archiveBrand = (id: string) => {
        // Eğer custom marka ise
        if (id.startsWith('custom_')) {
            setCustomBrands(customBrands.map(b =>
                b.id === id ? { ...b, active: false } : b
            ));
        }
        // Varsayılan markalar arşivlenemez (data.ts'de sabit)
    };

    // localStorage'dan veri yükle (sayfa açıldığında)
    React.useEffect(() => {
        const savedContents = localStorage.getItem('noco_contents');
        if (savedContents) {
            try {
                setContents(JSON.parse(savedContents));
            } catch (e) {
                console.error('Contents yüklenemedi');
            }
        }
        const savedHistory = localStorage.getItem('noco_note_history');
        if (savedHistory) {
            try {
                setNoteHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error('Note history yüklenemedi');
            }
        }
    }, []);

    // contents değiştiğinde localStorage'a kaydet
    React.useEffect(() => {
        if (contents.length > 0) {
            localStorage.setItem('noco_contents', JSON.stringify(contents));
        }
    }, [contents]);

    // noteHistory değiştiğinde localStorage'a kaydet
    React.useEffect(() => {
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

    const filteredContents = contents.filter(c => {
        if (filterBrand !== 'all' && c.brandId !== filterBrand) return false;
        if (filterStatus !== 'all' && c.status !== filterStatus) return false;
        return true;
    });

    // activeBrands artık yukarıda tanımlı (allBrands ile)
    const activeTeam = getActiveTeamMembers();

    const openModal = (content?: ContentItem) => {
        if (content) {
            setSelectedContent(content);
            setFormTitle(content.title);
            setFormBrand(content.brandId);
            setFormType(content.type);
            setFormStatus(content.status);
            setFormNotes(content.notes);
            setFormDeliveryDate(content.deliveryDate || '');
            setFormPublishDate(content.publishDate || '');
            setFormAssignee(content.assigneeId || '');
        } else {
            setSelectedContent(null);
            setFormTitle('');
            setFormBrand('');
            setFormType('VIDEO');
            setFormStatus('PLANLANDI');
            setFormNotes('');
            setFormDeliveryDate('');
            setFormPublishDate('');
            setFormAssignee('');
        }
        setShowModal(true);
    };

    const saveContent = () => {
        if (!formTitle || !formBrand) return;
        const data: ContentItem = {
            id: selectedContent?.id || Date.now().toString(),
            title: formTitle,
            brandId: formBrand,
            type: formType,
            status: formStatus,
            notes: formNotes,
            deliveryDate: formDeliveryDate || undefined,
            publishDate: formPublishDate || undefined,
            assigneeId: formAssignee || undefined,
        };
        if (selectedContent) {
            setContents(contents.map(c => c.id === selectedContent.id ? data : c));
        } else {
            setContents([data, ...contents]);
        }
        setShowModal(false);
    };

    const updateStatus = (id: string, status: ContentStatus) => {
        setContents(contents.map(c => c.id === id ? { ...c, status } : c));
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
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <Button variant={viewMode === 'list' ? 'primary' : 'secondary'} size="sm" onClick={() => setViewMode('list')}>📋 Liste</Button>
                        <Button variant={viewMode === 'calendar' ? 'primary' : 'secondary'} size="sm" onClick={() => setViewMode('calendar')}>📅 Takvim</Button>
                        <Button variant={viewMode === 'team' ? 'primary' : 'secondary'} size="sm" onClick={() => setViewMode('team')}>👥 Ekip</Button>
                        <Button variant="secondary" size="sm" onClick={() => setShowBrandModal(true)}>🏷️ Marka Ekle</Button>
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
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                        <option value="all">Tüm Durumlar</option>
                        {Object.entries(contentStatuses).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
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

                {viewMode === 'list' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-3)' }}>
                        <div>
                            {filteredContents.map(content => {
                                const brandColor = getBrandColor(content.brandId);
                                const brandName = getBrandName(content.brandId);
                                const isSelected = selectedContent?.id === content.id;
                                return (
                                    <div key={content.id} onClick={() => setSelectedContent(content)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: isSelected ? 'var(--color-surface)' : 'var(--color-card)', borderRadius: 'var(--radius-sm)', marginBottom: 8, cursor: 'pointer', borderLeft: `4px solid ${brandColor}`, outline: isSelected ? '2px solid var(--color-primary)' : 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <span>{contentTypes[content.type].icon}</span>
                                            <div>
                                                <p style={{ fontWeight: 600 }}>{content.title}</p>
                                                <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                                                    <span style={{ backgroundColor: brandColor, color: 'white', padding: '1px 6px', borderRadius: 10, fontSize: 10, marginRight: 8 }}>{brandName}</span>
                                                    {content.deliveryDate && `📅 ${new Date(content.deliveryDate).toLocaleDateString('tr-TR')}`}
                                                    {content.notes && ` • ${content.notes.slice(0, 30)}...`}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Badge style={{ backgroundColor: contentStatuses[content.status].color, color: 'white' }}>{contentStatuses[content.status].icon} {contentStatuses[content.status].label}</Badge>
                                            <select value={content.status} onClick={(e) => e.stopPropagation()} onChange={(e) => updateStatus(content.id, e.target.value as ContentStatus)} style={{ padding: '4px', fontSize: 11, borderRadius: 4, border: '1px solid var(--color-border)' }}>
                                                {Object.entries(contentStatuses).map(([k, v]) => <option key={k} value={k}>{v.icon}</option>)}
                                            </select>
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
                                                    color: 'var(--color-muted)'
                                                }}
                                            >✏️</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* SAĞ PANEL: Seçili İçerik Detayları */}
                        <Card style={{ position: 'sticky', top: 'var(--space-2)', height: 'fit-content' }}>
                            {selectedContent ? (
                                <>
                                    <CardHeader
                                        title={`${contentTypes[selectedContent.type].icon} ${selectedContent.title}`}
                                        description={getBrandName(selectedContent.brandId)}
                                    />
                                    <CardContent>
                                        {/* Çekim ve Paylaşım Tarihleri */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                                            <div style={{ padding: 'var(--space-2)', backgroundColor: 'rgba(50, 159, 245, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #329FF5' }}>
                                                <p style={{ fontSize: 'var(--text-caption)', color: '#329FF5', marginBottom: '4px' }}>📸 Çekim Tarihi</p>
                                                <p style={{ fontWeight: 700, fontSize: 'var(--text-body)' }}>
                                                    {selectedContent.deliveryDate ? new Date(selectedContent.deliveryDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belirlenmedi'}
                                                </p>
                                            </div>
                                            <div style={{ padding: 'var(--space-2)', backgroundColor: 'rgba(0, 245, 176, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #00F5B0' }}>
                                                <p style={{ fontSize: 'var(--text-caption)', color: '#00F5B0', marginBottom: '4px' }}>📱 Paylaşım Tarihi</p>
                                                <p style={{ fontWeight: 700, fontSize: 'var(--text-body)' }}>
                                                    {selectedContent.publishDate ? new Date(selectedContent.publishDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belirlenmedi'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Durum - Tıklanabilir Dropdown */}
                                        <div style={{ marginBottom: 'var(--space-3)' }}>
                                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginBottom: '8px' }}>📊 Durum</p>
                                            <select
                                                value={selectedContent.status}
                                                onChange={(e) => {
                                                    const newStatus = e.target.value as ContentStatus;
                                                    updateStatus(selectedContent.id, newStatus);
                                                    // Not geçmişine ekle
                                                    const timestamp = new Date().toISOString();
                                                    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
                                                    setNoteHistory(prev => [...prev, {
                                                        id: Date.now().toString(),
                                                        contentId: selectedContent.id,
                                                        user: user.name || 'Anonim',
                                                        action: `Durumu '${contentStatuses[newStatus].label}' olarak değiştirdi`,
                                                        timestamp
                                                    }]);
                                                }}
                                                style={{
                                                    padding: '10px 16px',
                                                    fontSize: 'var(--text-body-sm)',
                                                    fontWeight: 600,
                                                    backgroundColor: contentStatuses[selectedContent.status].color,
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 'var(--radius-md)',
                                                    cursor: 'pointer',
                                                    minWidth: '180px'
                                                }}
                                            >
                                                {Object.entries(contentStatuses).map(([key, val]) => (
                                                    <option key={key} value={key} style={{ backgroundColor: 'white', color: '#333' }}>
                                                        {val.icon} {val.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Açıklama & Notlar - Düzenlenebilir */}
                                        <div style={{ marginBottom: 'var(--space-3)' }}>
                                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginBottom: '8px' }}>
                                                📝 Açıklama & Notlar
                                                {selectedContent.notes && <span style={{ marginLeft: '8px', color: '#4CAF50' }}>✓ İçerik Hazır</span>}
                                            </p>
                                            <textarea
                                                value={editingNotes}
                                                onChange={(e) => setEditingNotes(e.target.value)}
                                                onBlur={() => {
                                                    if (editingNotes !== selectedContent.notes) {
                                                        setContents(contents.map(c =>
                                                            c.id === selectedContent.id ? { ...c, notes: editingNotes } : c
                                                        ));
                                                        // Not geçmişine ekle
                                                        const timestamp = new Date().toISOString();
                                                        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
                                                        setNoteHistory(prev => [...prev, {
                                                            id: Date.now().toString(),
                                                            contentId: selectedContent.id,
                                                            user: user.name || 'Anonim',
                                                            action: 'Not güncelledi',
                                                            note: editingNotes,
                                                            timestamp
                                                        }]);
                                                    }
                                                }}
                                                placeholder="İçerik için not ekle..."
                                                style={{
                                                    width: '100%',
                                                    padding: 'var(--space-2)',
                                                    backgroundColor: 'var(--color-surface)',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    minHeight: '100px',
                                                    fontSize: 'var(--text-body)',
                                                    lineHeight: '1.6',
                                                    resize: 'vertical',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        </div>

                                        {/* Not Geçmişi */}
                                        {noteHistory.filter(n => n.contentId === selectedContent.id).length > 0 && (
                                            <div style={{ marginBottom: 'var(--space-3)' }}>
                                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginBottom: '8px' }}>📜 Değişiklik Geçmişi</p>
                                                <div style={{
                                                    maxHeight: '150px',
                                                    overflowY: 'auto',
                                                    backgroundColor: 'var(--color-surface)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    padding: '8px'
                                                }}>
                                                    {noteHistory
                                                        .filter(n => n.contentId === selectedContent.id)
                                                        .slice(-5)
                                                        .reverse()
                                                        .map(n => (
                                                            <div key={n.id} style={{
                                                                fontSize: '11px',
                                                                padding: '4px 0',
                                                                borderBottom: '1px solid var(--color-border)'
                                                            }}>
                                                                <span style={{ fontWeight: 600 }}>{n.user}</span>
                                                                <span style={{ color: 'var(--color-muted)' }}> • {new Date(n.timestamp).toLocaleString('tr-TR')}</span>
                                                                <br />
                                                                <span style={{ color: '#666' }}>{n.action}</span>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        )}

                                        {/* Atanan Kişi */}
                                        {selectedContent.assigneeId && (
                                            <div style={{ marginBottom: 'var(--space-3)' }}>
                                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginBottom: '8px' }}>👤 Atanan</p>
                                                <p style={{ fontWeight: 600 }}>
                                                    {activeTeam.find(t => t.id === selectedContent.assigneeId)?.name || 'Belirsiz'}
                                                </p>
                                            </div>
                                        )}

                                        {/* Hızlı Aksiyonlar */}
                                        <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                                            <Button variant="secondary" size="sm" onClick={() => updateStatus(selectedContent.id, 'KURGULANIYOR')}>🎬 Kurguya Al</Button>
                                            <Button variant="secondary" size="sm" onClick={() => updateStatus(selectedContent.id, 'PAYLASILD')}>✅ Paylaşıldı</Button>
                                        </div>
                                    </CardContent>
                                </>
                            ) : (
                                <CardContent>
                                    <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--color-muted)' }}>
                                        <p style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>👈</p>
                                        <p style={{ fontWeight: 600, marginBottom: '8px' }}>İçerik Seç</p>
                                        <p style={{ fontSize: 'var(--text-body-sm)' }}>
                                            Soldaki listeden bir içeriğe tıklayarak detaylarını görüntüleyebilirsin.
                                        </p>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    </div>
                )}

                {viewMode === 'calendar' && (
                    <Card>
                        <CardHeader title="📅 Teslim Takvimi" />
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
                                                <Badge style={{ backgroundColor: contentStatuses[c.status].color, color: 'white', fontSize: 10 }}>{contentStatuses[c.status].label}</Badge>
                                            </div>
                                            <p style={{ fontWeight: 600 }}>{contentTypes[c.type].icon} {c.title}</p>
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
                                                    <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>{contentStatuses[t.status].icon} {contentStatuses[t.status].label} {t.deliveryDate && `• 📅 ${new Date(t.deliveryDate).toLocaleDateString('tr-TR')}`}</p>
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

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={selectedContent ? '✏️ İçerik Düzenlese' : '🎬 Yeni İçerik'} size="lg" footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button><Button variant="primary" onClick={saveContent}>Kaydet</Button></>}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    {/* Sol Kolon - Form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <Input label="Başlık *" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
                        <Select label="Marka *" value={formBrand} onChange={(e) => setFormBrand(e.target.value)} options={[{ value: '', label: 'Seçin...' }, ...activeBrands.map(b => ({ value: b.id, label: b.name }))]} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <Select
                                label="Tür"
                                value={formType}
                                onChange={(e) => {
                                    const newType = e.target.value as ContentType;
                                    setFormType(newType);
                                    // Türe göre otomatik aşama belirleme - ilk aşama PLANLANDI
                                    setFormStatus('PLANLANDI');
                                }}
                                options={Object.entries(contentTypes).map(([k, v]) => ({ value: k, label: `${v.icon} ${v.label}` }))}
                            />
                            <Select label="Durum" value={formStatus} onChange={(e) => setFormStatus(e.target.value as ContentStatus)} options={Object.entries(contentStatuses).map(([k, v]) => ({ value: k, label: `${v.icon} ${v.label}` }))} />
                        </div>
                        <Select label="Sorumlu" value={formAssignee} onChange={(e) => setFormAssignee(e.target.value)} options={[{ value: '', label: 'Atanmadı' }, ...activeTeam.map(m => ({ value: m.id, label: m.name }))]} />
                        <Textarea label="Notlar" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={3} />
                    </div>

                    {/* Sağ Kolon - Mini Takvim */}
                    <div>
                        <p style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, marginBottom: 'var(--space-1)', color: 'var(--color-sub-ink)' }}>
                            📅 Teslim Tarihi Seç
                        </p>
                        <MiniCalendar
                            selectedDate={formDeliveryDate}
                            onSelectDate={(date) => setFormDeliveryDate(date)}
                        />

                        {formType === 'VIDEO' && (
                            <div style={{ marginTop: 'var(--space-2)', padding: 'var(--space-2)', backgroundColor: 'rgba(50, 159, 245, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                                <p style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '8px' }}>
                                    🎬 Video Akışı
                                </p>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    <Badge style={{ backgroundColor: '#6B7B80', color: 'white', fontSize: '10px' }}>1. Yazım</Badge>
                                    <span style={{ color: 'var(--color-muted)' }}>→</span>
                                    <Badge style={{ backgroundColor: '#FF9800', color: 'white', fontSize: '10px' }}>2. Çekim</Badge>
                                    <span style={{ color: 'var(--color-muted)' }}>→</span>
                                    <Badge style={{ backgroundColor: '#2196F3', color: 'white', fontSize: '10px' }}>3. Kurgu</Badge>
                                    <span style={{ color: 'var(--color-muted)' }}>→</span>
                                    <Badge style={{ backgroundColor: '#00F5B0', color: 'white', fontSize: '10px' }}>4. Paylaşım</Badge>
                                </div>
                            </div>
                        )}

                        {(formType === 'FOTOGRAF' || formType === 'POST') && (
                            <div style={{ marginTop: 'var(--space-2)', padding: 'var(--space-2)', backgroundColor: 'rgba(0, 245, 176, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                                <p style={{ fontSize: '12px', color: '#00F5B0', fontWeight: 600, marginBottom: '8px' }}>
                                    📷 Teslimat Akışı
                                </p>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    <Badge style={{ backgroundColor: '#6B7B80', color: 'white', fontSize: '10px' }}>1. Planla</Badge>
                                    <span style={{ color: 'var(--color-muted)' }}>→</span>
                                    <Badge style={{ backgroundColor: '#00F5B0', color: 'white', fontSize: '10px' }}>2. Teslim</Badge>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Marka Ekleme Modal */}
            <Modal
                isOpen={showBrandModal}
                onClose={() => setShowBrandModal(false)}
                title="🏷️ Yeni Marka Ekle"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowBrandModal(false)}>İptal</Button>
                        <Button variant="primary" onClick={addBrand}>Marka Ekle</Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <Input
                        label="Marka Adı *"
                        placeholder="Örn: Yeni Müşteri"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                    />
                    <div>
                        <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, marginBottom: '8px' }}>
                            Marka Rengi
                        </label>
                        <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                            {['#329FF5', '#00F5B0', '#F6D73C', '#FF4242', '#9C27B0', '#FF9800', '#795548', '#607D8B', '#E91E63', '#4CAF50'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => setNewBrandColor(color)}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        backgroundColor: color,
                                        border: newBrandColor === color ? '3px solid var(--color-ink)' : '2px solid transparent',
                                        cursor: 'pointer',
                                        transition: 'transform 0.15s'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Eklenen Markalar Listesi */}
                    {customBrands.filter(b => b.active).length > 0 && (
                        <div style={{ marginTop: 'var(--space-2)' }}>
                            <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, marginBottom: '8px' }}>
                                📋 Eklediğiniz Markalar
                            </label>
                            <div style={{
                                backgroundColor: 'var(--color-surface)',
                                borderRadius: 'var(--radius-sm)',
                                padding: 'var(--space-1)',
                                maxHeight: '150px',
                                overflowY: 'auto'
                            }}>
                                {customBrands.filter(b => b.active).map(brand => (
                                    <div key={brand.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '8px',
                                        borderBottom: '1px solid var(--color-border)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                                width: 16,
                                                height: 16,
                                                borderRadius: '50%',
                                                backgroundColor: brand.color,
                                                display: 'inline-block'
                                            }} />
                                            <span style={{ fontSize: 'var(--text-body-sm)' }}>{brand.name}</span>
                                        </div>
                                        <button
                                            onClick={() => archiveBrand(brand.id)}
                                            title="Markayı Kaldır"
                                            style={{
                                                padding: '4px 8px',
                                                backgroundColor: 'rgba(255, 66, 66, 0.1)',
                                                color: '#FF4242',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '11px'
                                            }}
                                        >🗑️ Kaldır</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginTop: 'var(--space-1)' }}>
                        💡 Eklediğiniz markalar içerik seçiminde görünecektir.
                    </p>
                </div>
            </Modal>
        </>
    );
}
