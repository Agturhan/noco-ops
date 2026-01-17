
/** NOCO OPS - Merkezi Görev Verileri
   * Dashboard ve Tasks sayfası bu dosyadan veri çekecek
       * Böylece senkronize kalırlar
           */

import { getBrandColor, getBrandName } from './data';

// Task interface
export interface SharedTask {
    id: string;
    title: string;
    description: string;
    status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    assignee: string;
    project: string;
    brand: string;
    dueDate: string;
    deadline?: string; // Saat
    createdAt: string;
    updatedAt: string;
}

// Merkezi görev listesi - Bu liste Tasks ve Dashboard'da kullanılır
export const sharedTasks: SharedTask[] = [
    {
        id: '1',
        title: 'Zeytindalı Logo Tasarımı',
        description: 'Yeni logo tasarımı ve varyasyonları',
        status: 'TODO',
        priority: 'HIGH',
        assignee: 'Ahmet',
        project: 'Zeytindalı Rebrand',
        brand: 'zeytindali',
        dueDate: '2026-01-20',
        deadline: '17:00',
        createdAt: '2026-01-10',
        updatedAt: '2026-01-13'
    },
    {
        id: '2',
        title: 'İkranur Sosyal Medya Görselleri',
        description: '12 adet Instagram post görseli',
        status: 'TODO',
        priority: 'NORMAL',
        assignee: 'Şeyma',
        project: 'İkranur Ocak Kampanyası',
        brand: 'ikra',
        dueDate: '2026-01-25',
        deadline: '18:00',
        createdAt: '2026-01-12',
        updatedAt: '2026-01-12'
    },
    {
        id: '3',
        title: 'Louvess Video Kurgu',
        description: 'Tanıtım videosu düzenleme ve efektler',
        status: 'IN_REVIEW',
        priority: 'URGENT',
        assignee: 'Fatih',
        project: 'Louvess Reklam',
        brand: 'louvess',
        dueDate: '2026-01-15',
        deadline: '15:00',
        createdAt: '2026-01-08',
        updatedAt: '2026-01-13'
    },
    {
        id: '4',
        title: 'Tevfik Usta Web Sitesi',
        description: 'Landing page tasarım ve geliştirme',
        status: 'BLOCKED',
        priority: 'HIGH',
        assignee: 'Ahmet',
        project: 'Tevfik Usta Digital',
        brand: 'tevfik',
        dueDate: '2026-01-30',
        deadline: '12:00',
        createdAt: '2026-01-05',
        updatedAt: '2026-01-11'
    },
    {
        id: '5',
        title: 'Hair Chef Reklam Metni',
        description: 'Instagram ve Facebook reklam copy',
        status: 'TODO',
        priority: 'NORMAL',
        assignee: 'Ayşegül',
        project: 'Hair Chef Kampanyası',
        brand: 'hairchef',
        dueDate: '2026-01-18',
        deadline: '20:00',
        createdAt: '2026-01-12',
        updatedAt: '2026-01-12'
    },
    {
        id: '6',
        title: 'Zeytindalı Kurumsal Kimlik',
        description: 'Kartvizit, antetli kağıt tasarımları',
        status: 'TODO',
        priority: 'NORMAL',
        assignee: 'Ahmet',
        project: 'Zeytindalı Rebrand',
        brand: 'zeytindali',
        dueDate: '2026-01-28',
        deadline: '19:00',
        createdAt: '2026-01-13',
        updatedAt: '2026-01-13'
    },
];

// Dashboard için formatlı görevler (sadece TODO ve IN_PROGRESS olanlar)
export const getTodayTasks = () => {
    return sharedTasks
        .filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS')
        .map(t => ({
            id: t.id,
            title: t.title,
            deadline: t.deadline || '18:00',
            priority: t.priority.toLowerCase(),
            brand: t.brand,
            completed: false
        }));
};

// Bu hafta deadline'lar (tüm tamamlanmamışlar)
export const getWeekDeadlines = () => {
    const today = new Date();
    return sharedTasks
        .filter(t => t.status !== 'DONE')
        .map(t => {
            const dueDate = new Date(t.dueDate);
            const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return {
                id: t.id,
                title: t.title,
                date: dueDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
                daysLeft,
                brand: t.brand
            };
        })
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 5); // İlk 5 deadline
};

// Tasks sayfası için formatlı görevler
export const getTasksForKanban = () => {
    return sharedTasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        assignee: t.assignee,
        project: t.project,
        dueDate: t.dueDate,
        subtasks: [],
        tags: [],
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
    }));
};

// Status config (yardımcı)
export const taskStatusConfig = {
    TODO: { label: 'Yapılacak', color: '#6B7B80', icon: '📋' },
    IN_PROGRESS: { label: 'Devam Ediyor', color: '#329FF5', icon: '🔄' },
    IN_REVIEW: { label: 'İncelemede', color: '#F6D73C', icon: '👀' },
    DONE: { label: 'Tamamlandı', color: '#00F5B0', icon: '✅' },
    BLOCKED: { label: 'Engellendi', color: '#FF4242', icon: '🚫' },
};

export const taskPriorityConfig = {
    LOW: { label: 'Düşük', color: '#6B7B80' },
    NORMAL: { label: 'Normal', color: '#329FF5' },
    HIGH: { label: 'Yüksek', color: '#F6D73C' },
    URGENT: { label: 'Acil', color: '#FF4242' },
};
