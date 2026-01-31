'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, UserCog, TrendingUp } from 'lucide-react';

const navItems = [
    { name: 'Genel Bakış', href: '/dashboard/finance', icon: LayoutDashboard, exact: true },
    { name: 'Müşteriler', href: '/dashboard/finance/clients', icon: Users },
    { name: 'Ekip Maliyetleri', href: '/dashboard/finance/team', icon: UserCog },
    { name: 'Kârlılık Raporu', href: '/dashboard/finance/profitability', icon: TrendingUp },
];

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-[#0A0A0A] p-6 lg:p-8 space-y-8">
            <div className="space-y-4 mb-8">
                {/* Navigation Tabs */}
                <div className="flex items-center gap-1 border-b border-white/10 pb-1">
                    {navItems.map((item) => {
                        const isActive = item.exact
                            ? pathname === item.href
                            : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all relative
                                    ${isActive
                                        ? 'text-white bg-white/5 border-b-2 border-[#2997FF]'
                                        : 'text-white/50 hover:text-white hover:bg-white/[0.02]'
                                    }
                                `}
                            >
                                <item.icon size={16} className={isActive ? 'text-[#2997FF]' : ''} />
                                {item.name}
                                {isActive && (
                                    <div className="absolute -bottom-[3px] left-0 right-0 h-[2px] bg-[#2997FF]" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {children}
        </div>
    );
}
