'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, Button, Badge } from '@/components/ui';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount
} from '@/lib/actions/notifications';

// ===== TİPLER =====
interface Notification {
    id: string;
    createdAt: Date;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'PAYMENT' | 'DEADLINE' | 'REVISION' | 'APPROVAL';
    read: boolean;
    actionUrl?: string | null;
    entityType?: string | null;
    entityId?: string | null;
    entityName?: string | null;
}

const typeConfig: Record<string, { label: string; icon: string; color: string; bgColor: string }> = {
    INFO: { label: 'Bilgi', icon: 'ℹ️', color: '#329FF5', bgColor: '#E3F2FD' },
    SUCCESS: { label: 'Başarılı', icon: '✅', color: '#00F5B0', bgColor: '#E8F5E9' },
    WARNING: { label: 'Uyarı', icon: '⚠️', color: '#FF9800', bgColor: '#FFF3E0' },
    ERROR: { label: 'Hata', icon: '🚫', color: '#FF4242', bgColor: '#FFEBEE' },
    PAYMENT: { label: 'Ödeme', icon: '💰', color: '#4CAF50', bgColor: '#E8F5E9' },
    DEADLINE: { label: 'Son Tarih', icon: '⏰', color: '#9C27B0', bgColor: '#F3E5F5' },
    REVISION: { label: 'Revizyon', icon: '🔄', color: '#FF9800', bgColor: '#FFF3E0' },
    APPROVAL: { label: 'Onay', icon: '👀', color: '#329FF5', bgColor: '#E3F2FD' },
};

// Demo user ID - Gerçek uygulamada session'dan alınacak
const DEMO_USER_ID = 'demo-user-1';

export function NotificationsPageClient() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>('ALL');
    const [showOnlyUnread, setShowOnlyUnread] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Bildirimleri yükle
    useEffect(() => {
        const loadNotifications = async () => {
            try {
                setLoading(true);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const filters: any = {};

                if (showOnlyUnread) {
                    filters.unreadOnly = true;
                }

                if (filterType !== 'ALL') {
                    filters.type = filterType;
                }

                const data = await getNotifications(DEMO_USER_ID, filters);
                setNotifications(data as Notification[]);

                // Okunmamış sayısını güncelle
                const count = await getUnreadCount(DEMO_USER_ID);
                setUnreadCount(count);
            } catch (error) {
                console.error('Bildirimler yüklenemedi:', error);
            } finally {
                setLoading(false);
            }
        };
        loadNotifications();
    }, [showOnlyUnread, filterType]);

    const handleMarkAsRead = async (id: string) => {
        try {
            await markAsRead(id);
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('İşlem başarısız:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead(DEMO_USER_ID);
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('İşlem başarısız:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteNotification(id);
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) {
            console.error('Silme başarısız:', error);
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            <Header
                title="Bildirimler"
                subtitle={`${unreadCount} okunmamış bildirim`}
                actions={
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <Button variant="secondary" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                            ✓ Tümünü Okundu İşaretle
                        </Button>
                    </div>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* Filtreler */}
                <Card style={{ marginBottom: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                            {['ALL', 'INFO', 'SUCCESS', 'WARNING', 'ERROR', 'PAYMENT', 'DEADLINE', 'REVISION', 'APPROVAL'].map(type => (
                                <Button
                                    key={type}
                                    variant={filterType === type ? 'primary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setFilterType(type)}
                                >
                                    {type === 'ALL' ? '📋 Tümü' : `${typeConfig[type]?.icon} ${typeConfig[type]?.label}`}
                                </Button>
                            ))}
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={showOnlyUnread}
                                onChange={(e) => setShowOnlyUnread(e.target.checked)}
                            />
                            Sadece okunmamış
                        </label>
                    </div>
                </Card>

                {/* Loading State */}
                {loading ? (
                    <Card>
                        <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--color-muted)' }}>
                            <p style={{ fontSize: '24px', marginBottom: 'var(--space-2)' }}>⏳</p>
                            <p>Yükleniyor...</p>
                        </div>
                    </Card>
                ) : (
                    /* Bildirim Listesi */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {notifications.length === 0 ? (
                            <Card>
                                <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--color-muted)' }}>
                                    <p style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>📭</p>
                                    <p>Bildirim bulunamadı</p>
                                    <p style={{ fontSize: 'var(--text-caption)', marginTop: '8px' }}>
                                        {showOnlyUnread ? 'Tüm bildirimleriniz okunmuş.' : 'Henüz bildirim yok.'}
                                    </p>
                                </div>
                            </Card>
                        ) : (
                            notifications.map(notif => (
                                <Card
                                    key={notif.id}
                                    style={{
                                        cursor: 'pointer',
                                        backgroundColor: notif.read ? 'var(--color-card)' : typeConfig[notif.type]?.bgColor,
                                        borderLeft: `4px solid ${typeConfig[notif.type]?.color}`,
                                        opacity: notif.read ? 0.8 : 1,
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                        <span style={{ fontSize: '28px' }}>{typeConfig[notif.type]?.icon}</span>
                                        <div style={{ flex: 1 }} onClick={() => handleMarkAsRead(notif.id)}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                                                <p style={{ fontWeight: 600, color: notif.read ? 'var(--color-muted)' : 'inherit' }}>
                                                    {notif.title}
                                                    {!notif.read && <span style={{ marginLeft: '8px', width: 8, height: 8, backgroundColor: typeConfig[notif.type]?.color, borderRadius: '50%', display: 'inline-block' }} />}
                                                </p>
                                                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                                                    {formatDate(notif.createdAt)}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)', marginBottom: notif.entityName ? '8px' : 0 }}>
                                                {notif.message}
                                            </p>
                                            {notif.entityName && (
                                                <Badge variant="info" style={{ fontSize: '11px' }}>
                                                    {notif.entityType}: {notif.entityName}
                                                </Badge>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {!notif.read && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                                                    title="Okundu işaretle"
                                                >
                                                    ✓
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }}
                                                title="Sil"
                                                style={{ color: 'var(--color-error)' }}
                                            >
                                                🗑️
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
