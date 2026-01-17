'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Modal, Button, Input, Select, Textarea } from '@/components/ui';
import { createFeedback } from '@/lib/actions/feedback';

interface SidebarProps {
    userRole?: 'OWNER' | 'OPS' | 'STUDIO' | 'DIGITAL' | 'CLIENT';
}

interface NavItem {
    href: string;
    label: string;
    icon: string;
    roles?: string[];
    isSubmenu?: boolean;
    submenuItems?: NavItem[];
}

// Ana navigasyon öğeleri
const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Gösterge Paneli', icon: '📊' },
    { href: '/dashboard/projects', label: 'Projeler', icon: '📁' },
    { href: '/dashboard/deliverables', label: 'Teslimatlar', icon: '📦' },
    { href: '/dashboard/tasks', label: 'Görevler', icon: '✅' },
    { href: '/dashboard/calendar', label: 'Takvim', icon: '📅' },
    { href: '/dashboard/content-production', label: 'İçerik Prodüksiyon', icon: '🎬', roles: ['OWNER', 'OPS', 'DIGITAL'] },
    { href: '/dashboard/studio', label: 'Stüdyo', icon: '📸', roles: ['OWNER', 'OPS', 'STUDIO'] },
    { href: '/dashboard/clients', label: 'Müşteriler', icon: '👥', roles: ['OWNER', 'OPS'] },
    { href: '/dashboard/retainers', label: 'Retainer', icon: '⏱️', roles: ['OWNER', 'OPS'] },
    { href: '/dashboard/notifications', label: 'Bildirimler', icon: '🔔' },
    // Yönetim Paneli - Alt menü
    {
        href: '#',
        label: 'Yönetim Paneli',
        icon: '🏢',
        roles: ['OWNER', 'OPS'],
        isSubmenu: true,
        submenuItems: [
            { href: '/dashboard/proposals', label: 'Teklifler', icon: '📝' },
            { href: '/dashboard/invoices', label: 'Faturalar', icon: '💰' },
            { href: '/dashboard/accounting', label: 'Muhasebe', icon: '📈' },
            { href: '/dashboard/price-list', label: 'Fiyat Listesi', icon: '💵' },
            { href: '/dashboard/reports', label: 'Raporlar', icon: '📑' },
        ]
    },
    { href: '/dashboard/audit-log', label: 'Audit Log', icon: '📜', roles: ['OWNER', 'OPS'] },
    { href: '/dashboard/settings', label: 'Ayarlar', icon: '⚙️', roles: ['OWNER'] },
];

export function Sidebar({ userRole = 'OPS' }: SidebarProps) {
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
            alert('Geri bildiriminiz alındı, teşekkürler! 🚀');
        } catch (error) {
            console.error('Feedback error:', error);
            alert('Bir hata oluştu.');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredItems = navItems.filter((item) => {
        if (!item.roles) return true;
        return item.roles.includes(userRole);
    });

    return (
        <>
            <aside className="sidebar">
                <div className="sidebar-header">
                    <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                        <h1 style={{
                            fontSize: '24px',
                            fontWeight: 700,
                            color: 'var(--color-primary)',
                            fontFamily: 'var(--font-heading)'
                        }}>
                            NOCO Ops
                        </h1>
                        <span style={{
                            fontSize: 'var(--text-caption)',
                            color: 'var(--color-muted)'
                        }}>
                            Creative Operations System
                        </span>
                    </Link>
                </div>

                <nav className="sidebar-nav">
                    {filteredItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        const isSubmenuActive = item.submenuItems?.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/'));

                        // Submenu item
                        if (item.isSubmenu) {
                            return (
                                <div key={item.label}>
                                    <div
                                        className={`sidebar-link ${isSubmenuActive ? 'active' : ''}`}
                                        onClick={() => {
                                            const el = document.getElementById('submenu-' + item.label);
                                            if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                                        }}
                                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                                    >
                                        <span><span>{item.icon}</span> {item.label}</span>
                                        <span style={{ fontSize: '10px' }}>▼</span>
                                    </div>
                                    <div
                                        id={'submenu-' + item.label}
                                        style={{ display: isSubmenuActive ? 'block' : 'none', paddingLeft: '16px' }}
                                    >
                                        {item.submenuItems?.map(sub => {
                                            const subActive = pathname === sub.href;
                                            return (
                                                <Link
                                                    key={sub.href}
                                                    href={sub.href}
                                                    className={`sidebar-link ${subActive ? 'active' : ''}`}
                                                    style={{ fontSize: '13px', padding: '8px 12px' }}
                                                >
                                                    <span>{sub.icon}</span>
                                                    <span>{sub.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        }

                        // Normal item
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`sidebar-link ${isActive ? 'active' : ''}`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div style={{
                    padding: 'var(--space-2)',
                    borderTop: '1px solid var(--color-border)',
                    marginTop: 'auto'
                }}>
                    <Button
                        variant="ghost"
                        style={{ width: '100%', marginBottom: '12px', justifyContent: 'flex-start', color: 'var(--color-muted)' }}
                        onClick={() => setShowFeedback(true)}
                    >
                        💬 Geri Bildirim / Hata Bildir
                    </Button>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        padding: '10px 12px'
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: 'var(--text-body-sm)'
                        }}>
                            N
                        </div>
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
                title="💬 Geri Bildirim & Hata Bildirimi"
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
                            { value: 'BUG', label: '🐛 Hata (Bug)' },
                            { value: 'FEATURE', label: '✨ Yeni Özellik İsteği' },
                            { value: 'UX', label: '🎨 Tasarım/Kullanım Önerisi' },
                            { value: 'OTHER', label: '📝 Diğer' },
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
