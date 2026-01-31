'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

// Supabase client (browser-side)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ===== GENERIC REALTIME HOOK =====
interface UseRealtimeOptions<T> {
    table: string;
    filter?: string;
    onInsert?: (payload: T) => void;
    onUpdate?: (payload: T) => void;
    onDelete?: (payload: { old: T }) => void;
}

export function useRealtime<T>({
    table,
    filter,
    onInsert,
    onUpdate,
    onDelete,
}: UseRealtimeOptions<T>) {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let channel: RealtimeChannel;

        const setupChannel = () => {
            channel = supabase
                .channel(`${table}-changes`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table,
                        filter,
                    },
                    (payload) => {
                        switch (payload.eventType) {
                            case 'INSERT':
                                onInsert?.(payload.new as T);
                                break;
                            case 'UPDATE':
                                onUpdate?.(payload.new as T);
                                break;
                            case 'DELETE':
                                onDelete?.({ old: payload.old as T });
                                break;
                        }
                    }
                )
                .subscribe((status) => {
                    setIsConnected(status === 'SUBSCRIBED');
                });
        };

        setupChannel();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [table, filter, onInsert, onUpdate, onDelete]);

    return { isConnected };
}

// ===== NOTIFICATIONS REALTIME =====
interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
}

export function useRealtimeNotifications(userId: string, onNewNotification?: (n: Notification) => void) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const handleInsert = useCallback((payload: Notification) => {
        if (payload.userId === userId) {
            setNotifications(prev => [payload, ...prev]);
            onNewNotification?.(payload);
        }
    }, [userId, onNewNotification]);

    const handleUpdate = useCallback((payload: Notification) => {
        setNotifications(prev =>
            prev.map(n => n.id === payload.id ? payload : n)
        );
    }, []);

    const { isConnected } = useRealtime<Notification>({
        table: 'Notification',
        filter: `userId=eq.${userId}`,
        onInsert: handleInsert,
        onUpdate: handleUpdate,
    });

    return { notifications, setNotifications, isConnected };
}

// ===== PROJECTS REALTIME =====
interface Project {
    id: string;
    name: string;
    status: string;
}

export function useRealtimeProjects(onUpdate?: (p: Project) => void) {
    const [projects, setProjects] = useState<Project[]>([]);

    const handleUpdate = useCallback((payload: Project) => {
        setProjects(prev =>
            prev.map(p => p.id === payload.id ? payload : p)
        );
        onUpdate?.(payload);
    }, [onUpdate]);

    const handleInsert = useCallback((payload: Project) => {
        setProjects(prev => [...prev, payload]);
    }, []);

    const { isConnected } = useRealtime<Project>({
        table: 'Project',
        onInsert: handleInsert,
        onUpdate: handleUpdate,
    });

    return { projects, setProjects, isConnected };
}

// ===== DELIVERABLES REALTIME =====
interface Deliverable {
    id: string;
    name: string;
    status: string;
    projectId: string;
}

export function useRealtimeDeliverables(projectId: string, onStatusChange?: (d: Deliverable) => void) {
    const [deliverables, setDeliverables] = useState<Deliverable[]>([]);

    const handleUpdate = useCallback((payload: Deliverable) => {
        setDeliverables(prev =>
            prev.map(d => d.id === payload.id ? payload : d)
        );
        onStatusChange?.(payload);
    }, [onStatusChange]);

    const { isConnected } = useRealtime<Deliverable>({
        table: 'Deliverable',
        filter: `projectId=eq.${projectId}`,
        onUpdate: handleUpdate,
    });

    return { deliverables, setDeliverables, isConnected };
}

// ===== INVOICES REALTIME =====
interface Invoice {
    id: string;
    status: string;
    paidAt: string | null;
}

export function useRealtimeInvoices(onPaymentReceived?: (i: Invoice) => void) {
    const handleUpdate = useCallback((payload: Invoice) => {
        if (payload.status === 'PAID' && payload.paidAt) {
            onPaymentReceived?.(payload);
        }
    }, [onPaymentReceived]);

    const { isConnected } = useRealtime<Invoice>({
        table: 'Invoice',
        onUpdate: handleUpdate,
    });

    return { isConnected };
}

// ===== PRESENCE (Online Users) =====
export function usePresence(roomName: string, userId: string, userName: string) {
    const [onlineUsers, setOnlineUsers] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        const channel = supabase.channel(roomName);

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const users = Object.values(state).flat().map((u: any) => ({
                    id: u.user_id,
                    name: u.user_name,
                }));
                setOnlineUsers(users);
            })
            .on('presence', { event: 'join' }, ({ newPresences }) => {
                console.log('User joined:', newPresences);
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }) => {
                console.log('User left:', leftPresences);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: userId,
                        user_name: userName,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomName, userId, userName]);

    return { onlineUsers };
}

// ===== CONNECTION STATUS INDICATOR =====
export function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
    return (
        <div style= {{
        display: 'inline-flex',
            alignItems: 'center',
                gap: 6,
                    fontSize: 'var(--text-caption)',
                        color: isConnected ? 'var(--color-success)' : 'var(--color-muted)',
        }
}>
    <span style={
        {
            width: 8,
                height: 8,
                    borderRadius: '50%',
                        backgroundColor: isConnected ? '#10B981' : '#6B7B80',
                            animation: isConnected ? 'pulse 2s infinite' : 'none',
            }
} />
{ isConnected ? 'Canlı' : 'Bağlantı kesildi' }
</div>
    );
}

export default {
    useRealtime,
    useRealtimeNotifications,
    useRealtimeProjects,
    useRealtimeDeliverables,
    useRealtimeInvoices,
    usePresence,
    ConnectionStatus,
};
