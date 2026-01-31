import {
    LayoutDashboard,
    Clapperboard,
    Users,
    Timer,
    Building2,
    FileText,
    Receipt,
    PieChart,
    BadgeDollarSign,
    BarChart3,
    Shield,
    Settings,
    type LucideIcon
} from 'lucide-react';

export interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    roles?: string[];
    isSubmenu?: boolean;
    submenuItems?: NavItem[];
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export const navGroups: NavGroup[] = [
    {
        title: 'ANA',
        items: [
            { href: '/dashboard', label: 'Gösterge Paneli', icon: LayoutDashboard },
        ]
    },
    {
        title: 'OPERASYON',
        items: [
            {
                href: '/dashboard/content-production',
                label: 'Üretim Paneli',
                icon: Clapperboard,
                roles: ['OWNER', 'OPS', 'DIGITAL', 'STUDIO']
            },
            // { href: '/dashboard/clients', label: 'Müşteriler', icon: Users, roles: ['OWNER', 'OPS'] }, // Moved to System
            { href: '/dashboard/retainers', label: 'Retainer', icon: Timer, roles: ['OWNER', 'OPS'] },
        ]
    },
    {
        title: 'FİNANS',
        items: [
            { href: '/dashboard/finance', label: 'Finans Yönetimi', icon: PieChart, roles: ['OWNER', 'OPS'] },
            { href: '/dashboard/proposals', label: 'Teklifler', icon: FileText, roles: ['OWNER', 'OPS'] },
            { href: '/dashboard/invoices', label: 'Faturalar', icon: Receipt, roles: ['OWNER', 'OPS'] },
            { href: '/dashboard/price-list', label: 'Fiyat Listesi', icon: BadgeDollarSign, roles: ['OWNER', 'OPS'] },
            { href: '/dashboard/reports', label: 'Raporlar', icon: BarChart3, roles: ['OWNER', 'OPS'] },
        ]
    },
    {
        title: 'SİSTEM',
        items: [
            { href: '/dashboard/system/clients', label: 'Müşteriler', icon: Building2, roles: ['OWNER', 'OPS'] },
            { href: '/dashboard/system/users', label: 'Kullanıcılar', icon: Users, roles: ['OWNER', 'OPS'] },
            { href: '/dashboard/system/settings', label: 'Ayarlar', icon: Settings, roles: ['OWNER'] },
            { href: '/dashboard/audit-log', label: 'Denetim Kaydı', icon: Shield, roles: ['OWNER', 'OPS'] },
            // { href: '/dashboard/notifications', label: 'Bildirimler', icon: Bell }, // Less important
        ]
    }
];
