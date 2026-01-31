import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui';
import { Sun, Moon, MessageSquare, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';

interface UserProfileProps {
    userRole: string;
    onOpenFeedback: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userRole, onOpenFeedback }) => {
    const [mounted, setMounted] = useState(false);
    const { setTheme, resolvedTheme } = useTheme();

    useEffect(() => {
        // eslint-disable-next-line
        setMounted(true);
    }, []);

    // Prevent hydration mismatch
    if (!mounted) return null;

    const isDark = resolvedTheme === 'dark';

    return (
        <div className="p-2 border-t border-[var(--color-border)] mt-auto bg-[var(--color-card)]">
            <Button
                variant="ghost"
                className="w-full mb-2 justify-start text-[var(--color-muted)] hover:text-[var(--color-ink)] gap-2.5"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
            >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
                {isDark ? 'Açık Tema' : 'Koyu Tema'}
            </Button>

            <Button
                variant="ghost"
                className="w-full mb-3 justify-start text-[var(--color-muted)] hover:text-[var(--color-ink)] gap-2.5"
                onClick={onOpenFeedback}
            >
                <MessageSquare size={18} />
                Geri Bildirim
            </Button>

            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--color-zebra)] transition-colors">
                <Image
                    src="/noco-logo-icon.jpg"
                    alt="NOCO"
                    width={32}
                    height={32}
                    className="rounded-full"
                />
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate text-[var(--color-ink)]">
                        NOCO Digital
                    </div>
                    <div className="text-xs text-[var(--color-muted)] truncate">
                        {userRole}
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="p-1.5 text-[var(--color-muted)] hover:text-red-500 transition-colors"
                    title="Çıkış Yap"
                >
                    <LogOut size={16} />
                </button>
            </div>
        </div>
    );
};

