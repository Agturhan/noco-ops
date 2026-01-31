import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { NavItem } from '@/config/navigation';

interface SidebarItemProps {
    item: NavItem;
    userRole: string;
    onClose?: () => void;
    isDark?: boolean;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ item, userRole, onClose, isDark }) => {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(true); // Default open for submenus

    if (item.roles && !item.roles.includes(userRole)) return null;

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname === href || pathname.startsWith(href + '/');
    };

    const active = isActive(item.href);
    const hasSubmenu = item.isSubmenu && item.submenuItems && item.submenuItems.length > 0;
    const Icon = item.icon;

    if (hasSubmenu) {
        const isChildActive = item.submenuItems?.some(sub => isActive(sub.href));

        return (
            <div className="mb-1">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`sidebar-link w-full flex items-center justify-between group ${isChildActive ? 'active' : ''}`}
                    // Inline styles will be replaced by Tailwind classes in the final refactor
                    style={{
                        gap: '10px',
                        padding: '10px 12px',
                        color: 'var(--color-sub-ink)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-body-sm)',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                        background: isChildActive ? 'rgba(50, 159, 245, 0.1)' : 'transparent'
                    }}
                >
                    <div className="flex items-center gap-2.5">
                        <Icon size={18} strokeWidth={isChildActive ? 2 : 1.5} className="group-hover:text-[var(--color-ink)]" />
                        <span className="group-hover:text-[var(--color-ink)]">{item.label}</span>
                    </div>
                    <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {isOpen && (
                    <div className="pl-[34px] flex flex-col gap-1 mt-1 mb-1">
                        {item.submenuItems?.map(sub => (
                            <SidebarItem
                                key={sub.href}
                                item={sub}
                                userRole={userRole}
                                onClose={onClose}
                                isDark={isDark}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link
            href={item.href}
            onClick={onClose}
            className={`sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-md transition-all ${active ? 'active' : ''}`}
            style={{
                color: active ? 'var(--color-primary)' : 'var(--color-sub-ink)',
                background: active ? 'rgba(50, 159, 245, 0.1)' : 'transparent',
                fontSize: '13px',
                fontWeight: active ? 600 : 500
            }}
        >
            <Icon size={18} strokeWidth={active ? 2 : 1.5} />
            <span>{item.label}</span>
        </Link>
    );
};
