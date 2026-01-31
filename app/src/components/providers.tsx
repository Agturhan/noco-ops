'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider } from 'next-themes';

// QueryClient instance
function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Veri 5 dakika boyunca "taze" kabul edilir
                staleTime: 5 * 60 * 1000,
                // Önbellekte 30 dakika tutulur
                gcTime: 30 * 60 * 1000,
                // Pencere odaklandığında yeniden fetch etme
                refetchOnWindowFocus: false,
                // Bağlantı yeniden kurulduğunda yeniden fetch etme
                refetchOnReconnect: true,
                // Hata durumunda 3 kez tekrar dene
                retry: 3,
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            },
            mutations: {
                // Mutation hatalarında 1 kez tekrar dene
                retry: 1,
            },
        },
    });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
    if (typeof window === 'undefined') {
        // Server: her zaman yeni client oluştur
        return makeQueryClient();
    } else {
        // Browser: singleton pattern
        if (!browserQueryClient) {
            browserQueryClient = makeQueryClient();
        }
        return browserQueryClient;
    }
}

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    const [queryClient] = useState(() => getQueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
                <ToastProvider position="top-right">
                    {children}
                </ToastProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

// Query keys factory - tutarlı key yönetimi için
export const queryKeys = {
    // Notifications
    notifications: {
        all: ['notifications'] as const,
        list: (userId: string) => ['notifications', 'list', userId] as const,
        unreadCount: (userId: string) => ['notifications', 'unreadCount', userId] as const,
    },

    // Projects
    projects: {
        all: ['projects'] as const,
        list: (filters?: any) => ['projects', 'list', filters] as const,
        detail: (id: string) => ['projects', 'detail', id] as const,
    },

    // Clients
    clients: {
        all: ['clients'] as const,
        list: () => ['clients', 'list'] as const,
        detail: (id: string) => ['clients', 'detail', id] as const,
    },

    // Invoices
    invoices: {
        all: ['invoices'] as const,
        list: (filters?: any) => ['invoices', 'list', filters] as const,
        detail: (id: string) => ['invoices', 'detail', id] as const,
    },

    // Tasks
    tasks: {
        all: ['tasks'] as const,
        list: (filters?: any) => ['tasks', 'list', filters] as const,
        detail: (id: string) => ['tasks', 'detail', id] as const,
    },

    // Settings
    settings: {
        all: ['settings'] as const,
        global: () => ['settings', 'global'] as const,
    },

    // Users
    users: {
        all: ['users'] as const,
        list: () => ['users', 'list'] as const,
        detail: (id: string) => ['users', 'detail', id] as const,
    },

    // Audit Logs
    auditLogs: {
        all: ['auditLogs'] as const,
        list: (filters?: any) => ['auditLogs', 'list', filters] as const,
        stats: () => ['auditLogs', 'stats'] as const,
    },

    // Dashboard
    dashboard: {
        all: ['dashboard'] as const,
        stats: () => ['dashboard', 'stats'] as const,
        pending: () => ['dashboard', 'pending'] as const,
    },

    // Calendar
    calendar: {
        all: ['calendar'] as const,
        events: (month: string) => ['calendar', 'events', month] as const,
    },

    // Deliverables
    deliverables: {
        all: ['deliverables'] as const,
        list: (projectId?: string) => ['deliverables', 'list', projectId] as const,
        detail: (id: string) => ['deliverables', 'detail', id] as const,
    },
} as const;
