'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui';
import { AuditLogEntry, getAuditLogs } from '@/lib/actions/audit';
import { Icons } from '@/components/content/icons';

export function AuditLogPageClient() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    // Silent refresh indicator if needed, but we want it fully silent

    const loadLogs = useCallback(async (isInitial = false) => {
        if (isInitial) setLoading(true);
        try {
            const data = await getAuditLogs(50);
            setLogs(data);
        } catch (error) {
            console.error('Failed to load logs', error);
        } finally {
            if (isInitial) setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initial load
        loadLogs(true);

        // Silent refresh every 5 seconds
        const interval = setInterval(() => loadLogs(false), 5000);
        return () => clearInterval(interval);
    }, [loadLogs]);

    const formatLogMessage = (log: AuditLogEntry) => {
        const user = log.user?.name || 'Sistem / Bilinmeyen';

        const entityName = log.entityName || log.entityId;

        // Helper for bold text
        const B = ({ children }: { children: React.ReactNode }) => <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{children}</span>;

        /* 
           Log Formats:
           - CREATE Brand -> "Ahmet, X markasını oluşturdu."
           - UPDATE User -> "Ahmet, Y kullanıcısını güncelledi."
           - VIEW Brand Detail -> "Ahmet, X markasını inceledi."
           - CREATE Task -> "Ahmet, X için Y görevini oluşturdu."
        */

        if (log.action === 'CREATE') {
            if (log.entityType === 'Brand') return <span><B>{user}</B>, <B>{entityName}</B> adlı yeni bir marka oluşturdu.</span>;
            return <span><B>{user}</B>, yeni bir <B>{log.entityType}</B> oluşturdu: <B>{entityName}</B>.</span>;
        }

        if (log.action === 'UPDATE') {
            if (log.entityType === 'User') return <span><B>{user}</B>, <B>{entityName}</B> adlı ekip üyesinin bilgilerini güncelledi.</span>;
            if (log.entityType === 'Brand') return <span><B>{user}</B>, <B>{entityName}</B> markasının bilgilerini düzenledi.</span>;
            return <span><B>{user}</B>, <B>{entityName}</B> üzerinde değişiklik yaptı.</span>;
        }

        if (log.action === 'VIEW') {
            if (log.entityType === 'Brand Detail') return <span><B>{user}</B>, <B>{entityName.replace('/dashboard/system/clients/', 'Marka #')}</B> detaylarını inceledi.</span>;
            return <span><B>{user}</B>, <B>{log.entityType}</B> sayfasını görüntüledi.</span>;
        }

        if (log.action === 'DELETE') {
            return <span><B>{user}</B>, <B>{entityName}</B> kaydını sildi.</span>;
        }

        return <span><B>{user}</B>, bir işlem yaptı: {log.action} ({log.entityType})</span>;
    };

    return (
        <div style={{ padding: 'var(--space-4)', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: 'var(--space-6)' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 'var(--space-1)' }}>Denetim Kaydı</h1>
                <p style={{ color: 'var(--color-muted)' }}>Sistem üzerindeki son aktiviteler ve kullanıcı hareketleri.</p>
            </div>

            <Card>
                <CardHeader title="Aktivite Akışı" />
                <CardContent>
                    {loading && logs.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-muted)' }}>
                            <p>Yükleniyor...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {logs.length === 0 ? (
                                <p style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted)' }}>Henüz kayıt bulunamadı.</p>
                            ) : (
                                logs.map((log, index) => {
                                    const isLast = index === logs.length - 1;
                                    const dateStr = new Date(log.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

                                    return (
                                        <div key={log.id} style={{
                                            display: 'flex',
                                            position: 'relative',
                                            paddingBottom: isLast ? 0 : '32px'
                                        }}>
                                            {/* Line */}
                                            {!isLast && (
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '24px',
                                                    top: '36px',
                                                    bottom: 0,
                                                    width: '2px',
                                                    backgroundColor: 'var(--color-border)'
                                                }} />
                                            )}

                                            {/* Avatar/Icon */}
                                            <div style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--color-surface)',
                                                border: '1px solid var(--color-border)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: '16px',
                                                zIndex: 1,
                                                color: 'var(--color-muted)'
                                            }}>
                                                {log.action === 'CREATE' ? Icons.Plus :
                                                    log.action === 'UPDATE' ? Icons.Edit :
                                                        log.action === 'DELETE' ? Icons.Delete :
                                                            Icons.Eye}
                                            </div>

                                            {/* Content */}
                                            <div style={{ flex: 1, paddingTop: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <div style={{ fontSize: '15px', color: 'var(--color-text-light)' }}>
                                                        {formatLogMessage(log)}
                                                    </div>
                                                    <span style={{ fontSize: '12px', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                                                        {dateStr}
                                                    </span>
                                                </div>

                                                {/* Optional: Show minimal details if meaningful, ignoring raw JSON */}
                                                {/* We purposefully hide raw JSON now as requested */}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
