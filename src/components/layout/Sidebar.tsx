'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Modal, Button, Input, Select, Textarea } from '@/components/ui';
import { createFeedback } from '@/lib/actions/feedback';

// Lucide Icons
import {
    LayoutDashboard,
    Clapperboard,
    ImageIcon,
    CheckSquare,
    Calendar,
    Camera,
    Users,
    Timer,
    Bell,
    Building2,
    FileText,
    Receipt,
    PieChart,
    BadgeDollarSign,
    BarChart3,
    Shield,
    Settings,
    Sun,
    Moon,
    MessageSquare,
    ChevronDown,
    X,
    type LucideIcon
} from 'lucide-react';

interface SidebarProps {
    userRole?: 'OWNER' | 'OPS' | 'STUDIO' | 'DIGITAL' | 'CLIENT';
    isOpen?: boolean;
    onClose?: () => void;
    onToggleTheme?: () => void;
    isDark?: boolean;
}

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    roles?: string[];
    isSubmenu?: boolean;
    submenuItems?: NavItem[];
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

// Gruplandırılmış navigasyon
const navGroups: NavGroup[] = [
    {
        title: 'ANA',
        items: [
            { href: '/dashboard', label: 'Gösterge Paneli', icon: LayoutDashboard },
            { href: '/dashboard/content-production', label: 'İş Yönetimi', icon: Clapperboard, roles: ['OWNER', 'OPS', 'DIGITAL'] },
            { href: '/dashboard/tasks', label: 'Görevler', icon: CheckSquare },
            { href: '/dashboard/calendar', label: 'Takvim', icon: Calendar },
            { href: '/dashboard/studio', label: 'Stüdyo', icon: Camera, roles: ['OWNER', 'OPS', 'STUDIO'] },
            { href: '/dashboard/clients', label: 'Müşteriler', icon: Users, roles: ['OWNER', 'OPS'] },
            { href: '/dashboard/retainers', label: 'Retainer', icon: Timer, roles: ['OWNER', 'OPS'] },
        ]
    },
    {
        title: 'FİNANS',
        items: [
            { href: '/dashboard/proposals', label: 'Teklifler', icon: FileText, roles: ['OWNER', 'OPS'] },
            { href: '/dashboard/invoices', label: 'Faturalar', icon: Receipt, roles: ['OWNER', 'OPS'] },
            { href: '/dashboard/accounting', label: 'Muhasebe', icon: PieChart, roles: ['OWNER', 'OPS'] },
            { href: '/dashboard/price-list', label: 'Fiyat Listesi', icon: BadgeDollarSign, roles: ['OWNER', 'OPS'] },
            { href: '/dashboard/reports', label: 'Raporlar', icon: BarChart3, roles: ['OWNER', 'OPS'] },
        ]
    },
    {
        title: 'SİSTEM',
        items: [
            { href: '/dashboard/notifications', label: 'Bildirimler', icon: Bell },
            { href: '/dashboard/audit-log', label: 'Denetim Kaydı', icon: Shield, roles: ['OWNER', 'OPS'] },
            { href: '/dashboard/settings', label: 'Ayarlar', icon: Settings, roles: ['OWNER'] },
        ]
    }
];

export function Sidebar({ userRole = 'OPS', isOpen = true, onClose, onToggleTheme, isDark = false }: SidebarProps) {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackType, setFeedbackType] = useState('BUG');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackUrl, setFeedbackUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) {
                console.error('Kullanıcı verisi okunamadı');
            }
        }
        setFeedbackUrl(window.location.href);
    }, [pathname]);

    const handleFeedbackSubmit = async () => {
        if (!feedbackMessage || !user) return;

        try {
            setSubmitting(true);
            await createFeedback({
                userId: user.id || 'anonymous',
                userName: user.name || 'Anonymous',
                type: feedbackType as any,
                message: feedbackMessage,
                url: feedbackUrl,
            });
            setShowFeedback(false);
            setFeedbackMessage('');
            setFeedbackType('BUG');
            alert('Geri bildiriminiz alındı, teşekkürler!');
        } catch (error) {
            console.error('Feedback error:', error);
            alert('Bir hata oluştu.');
        } finally {
            setSubmitting(false);
        }
    };

    const isItemVisible = (item: NavItem) => {
        if (!item.roles) return true;
        return item.roles.includes(userRole);
    };

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname === href || pathname.startsWith(href + '/');
    };

    return (
        <>
            {/* Mobil overlay */}
            {isOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={onClose}
                />
            )}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Image
                            src="/noco-logo-icon.jpg"
                            alt="NOCO"
                            width={40}
                            height={40}
                            style={{ borderRadius: '8px' }}
                        />
                        <div>
                            <h1 style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                color: 'var(--color-primary)',
                                fontFamily: 'var(--font-heading)',
                                margin: 0
                            }}>
                                NOCO Ops
                            </h1>
                            <span style={{
                                fontSize: 'var(--text-caption)',
                                color: 'var(--color-muted)'
                            }}>
                                Creative Operations
                            </span>
                        </div>
                    </Link>

                    {/* Mobilde kapatma butonu */}
                    <button
                        className="sidebar-close"
                        onClick={onClose}
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navGroups.map((group) => {
                        const visibleItems = group.items.filter(isItemVisible);
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={group.title} style={{ marginBottom: 'var(--space-2)' }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: 'var(--color-muted)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    padding: '8px 12px 4px',
                                    marginTop: group.title !== 'ANA' ? '8px' : 0
                                }}>
                                    {group.title}
                                </div>
                                {visibleItems.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`sidebar-link ${active ? 'active' : ''}`}
                                            onClick={onClose}
                                            style={{ gap: '10px' }}
                                        >
                                            <Icon size={18} strokeWidth={active ? 2 : 1.5} />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>

                <div style={{
                    padding: 'var(--space-2)',
                    borderTop: '1px solid var(--color-border)',
                    marginTop: 'auto'
                }}>
                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        style={{ width: '100%', marginBottom: '8px', justifyContent: 'flex-start', color: 'var(--color-muted)', gap: '10px' }}
                        onClick={onToggleTheme}
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        {isDark ? 'Açık Tema' : 'Koyu Tema'}
                    </Button>

                    <Button
                        variant="ghost"
                        style={{ width: '100%', marginBottom: '12px', justifyContent: 'flex-start', color: 'var(--color-muted)', gap: '10px' }}
                        onClick={() => setShowFeedback(true)}
                    >
                        <MessageSquare size={18} />
                        Geri Bildirim
                    </Button>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        padding: '10px 12px'
                    }}>
                        <Image
                            src="/noco-logo-icon.jpg"
                            alt="NOCO"
                            width={32}
                            height={32}
                            style={{ borderRadius: '50%' }}
                        />
                        <div>
                            <div style={{ fontWeight: 500, fontSize: 'var(--text-body-sm)' }}>
                                NOCO Digital
                            </div>
                            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                                {userRole}
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <Modal
                isOpen={showFeedback}
                onClose={() => setShowFeedback(false)}
                title="Geri Bildirim & Hata Bildirimi"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowFeedback(false)}>İptal</Button>
                        <Button
                            variant="primary"
                            onClick={handleFeedbackSubmit}
                            disabled={submitting || !feedbackMessage}
                        >
                            {submitting ? 'Gönderiliyor...' : 'Gönder'}
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <Select
                        label="Bildirim Tipi"
                        value={feedbackType}
                        onChange={(e) => setFeedbackType(e.target.value)}
                        options={[
                            { value: 'BUG', label: 'Hata (Bug)' },
                            { value: 'FEATURE', label: 'Yeni Özellik İsteği' },
                            { value: 'UX', label: 'Tasarım/Kullanım Önerisi' },
                            { value: 'OTHER', label: 'Diğer' },
                        ]}
                    />
                    <Textarea
                        placeholder="Lütfen yaşadığınız durumu veya önerinizi detaylıca anlatın..."
                        value={feedbackMessage}
                        onChange={(e) => setFeedbackMessage(e.target.value)}
                        rows={4}
                    />
                    <Input
                        label="İlgili Sayfa URL"
                        value={feedbackUrl}
                        onChange={(e) => setFeedbackUrl(e.target.value)}
                        disabled
                    />
                </div>
            </Modal>
        </>
    );
}

export default Sidebar;
