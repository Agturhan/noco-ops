'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Badge, Input, Select } from '@/components/ui';
import {
    getAuditLogs,
    getAuditStats,
    getDistinctActions,
    type AuditLogFilters
} from '@/lib/actions/auditLog';

// ===== TİPLER =====
interface AuditLogEntry {
    id: string;
    createdAt: Date;
    action: string;
    entityType: string;
    entityId: string;
    details: any;
    isOverride: boolean;
    ipAddress?: string | null;
    user?: {
        id: string;
        name: string;
        email: string;
        role: string;
    } | null;
}

const actionLabels: Record<string, { label: string; icon: string }> = {
    CREATE: { label: 'Oluşturma', icon: '➕' },
    UPDATE: { label: 'Güncelleme', icon: '✏️' },
    DELETE: { label: 'Silme', icon: '🗑️' },
    UPLOAD_FILE: { label: 'Dosya Yükleme', icon: '📎' },
    STATUS_CHANGE: { label: 'Durum Değişikliği', icon: '🔄' },
    APPROVE: { label: 'Onaylama', icon: '✅' },
    REQUEST_REVISION: { label: 'Revizyon Talebi', icon: '🔄' },
    DELIVER: { label: 'Teslim', icon: '📦' },
    MARK_PAID: { label: 'Ödeme Kaydı', icon: '💰' },
    CREATE_USER: { label: 'Kullanıcı Oluşturma', icon: '👤' },
    UPDATE_USER: { label: 'Kullanıcı Güncelleme', icon: '👤' },
    DELETE_USER: { label: 'Kullanıcı Silme', icon: '👤' },
    UPDATE_SETTINGS: { label: 'Ayar Güncelleme', icon: '⚙️' },
    LOGIN: { label: 'Giriş', icon: '🔓' },
    LOGOUT: { label: 'Çıkış', icon: '🔒' },
};

const getStatusFromLog = (log: AuditLogEntry): 'SUCCESS' | 'BLOCKED' | 'OVERRIDE' => {
    if (log.isOverride) return 'OVERRIDE';
    if (log.details?.blocked) return 'BLOCKED';
    return 'SUCCESS';
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    SUCCESS: { label: 'Başarılı', color: '#00F5B0', bgColor: '#E8F5E9' },
    BLOCKED: { label: 'Engellendi', color: '#FF4242', bgColor: '#FFEBEE' },
    OVERRIDE: { label: 'Override', color: '#FF9800', bgColor: '#FFF3E0' },
};

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalLogs: 0, overrideLogs: 0, todayLogs: 0 });
    const [actions, setActions] = useState<string[]>([]);

    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterAction, setFilterAction] = useState<string>('ALL');
    const [filterUser, setFilterUser] = useState<string>('');
    const [filterDate, setFilterDate] = useState<string>('');

    // Verileri yükle
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [logsData, statsData, actionsData] = await Promise.all([
                getAuditLogs({ limit: 100 }),
                getAuditStats(),
                getDistinctActions(),
            ]);
            setLogs(logsData as AuditLogEntry[]);
            setStats(statsData);
            setActions(actionsData);
        } catch (error) {
            console.error('Veriler yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filtreleme
    const filteredLogs = logs.filter(log => {
        const status = getStatusFromLog(log);
        if (filterStatus !== 'ALL' && status !== filterStatus) return false;
        if (filterAction !== 'ALL' && log.action !== filterAction) return false;
        if (filterUser && !log.user?.name?.toLowerCase().includes(filterUser.toLowerCase())) return false;
        if (filterDate) {
            const logDate = new Date(log.createdAt).toISOString().split('T')[0];
            if (logDate !== filterDate) return false;
        }
        return true;
    });

    const formatDateTime = (date: Date) => {
        return new Date(date).toLocaleString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const exportCSV = () => {
        const headers = ['Zaman', 'Kullanıcı', 'Rol', 'Aksiyon', 'Entity', 'Entity ID', 'Override', 'IP'];
        const rows = filteredLogs.map(log => [
            formatDateTime(log.createdAt),
            log.user?.name || 'Sistem',
            log.user?.role || '-',
            actionLabels[log.action]?.label || log.action,
            log.entityType,
            log.entityId,
            log.isOverride ? 'Evet' : 'Hayır',
            log.ipAddress || '-'
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <>
                <Header title="Audit Log" subtitle="Yükleniyor..." />
                <div style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                    <p style={{ fontSize: '48px' }}>⏳</p>
                    <p>Denetim kayıtları yükleniyor...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Header
                title="Audit Log"
                subtitle="Sistem Aktivite Kayıtları"
                actions={
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <Button variant="secondary" onClick={loadData}>🔄 Yenile</Button>
                        <Button variant="primary" onClick={exportCSV}>📥 CSV İndir</Button>
                    </div>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* İstatistikler */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '28px', fontWeight: 700 }}>{stats.totalLogs}</p>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Toplam Kayıt</p>
                        </div>
                    </Card>
                    <Card style={{ background: '#E8F5E9' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: '#2E7D32' }}>{stats.todayLogs}</p>
                            <p style={{ fontSize: 'var(--text-caption)', color: '#388E3C' }}>📅 Bugün</p>
                        </div>
                    </Card>
                    <Card style={{ background: '#FFF3E0' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: '#E65100' }}>{stats.overrideLogs}</p>
                            <p style={{ fontSize: 'var(--text-caption)', color: '#F57C00' }}>⚠️ Override</p>
                        </div>
                    </Card>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '28px', fontWeight: 700 }}>{filteredLogs.length}</p>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Filtrelenmiş</p>
                        </div>
                    </Card>
                </div>

                {/* Filtreler */}
                <Card style={{ marginBottom: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <Select
                            label="Durum"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            options={[
                                { value: 'ALL', label: 'Tüm Durumlar' },
                                { value: 'SUCCESS', label: '✅ Başarılı' },
                                { value: 'BLOCKED', label: '🚫 Engellendi' },
                                { value: 'OVERRIDE', label: '⚠️ Override' },
                            ]}
                        />
                        <Select
                            label="Aksiyon"
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            options={[
                                { value: 'ALL', label: 'Tüm Aksiyonlar' },
                                ...actions.map(a => ({
                                    value: a,
                                    label: `${actionLabels[a]?.icon || '📌'} ${actionLabels[a]?.label || a}`
                                }))
                            ]}
                        />
                        <Input
                            label="Kullanıcı"
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                            placeholder="Kullanıcı ara..."
                        />
                        <Input
                            label="Tarih"
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                        />
                        <Button variant="secondary" onClick={() => { setFilterStatus('ALL'); setFilterAction('ALL'); setFilterUser(''); setFilterDate(''); }}>
                            Temizle
                        </Button>
                    </div>
                </Card>

                {/* Log Listesi */}
                <Card>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Zaman</th>
                                    <th>Kullanıcı</th>
                                    <th>Aksiyon</th>
                                    <th>Entity</th>
                                    <th>Detay</th>
                                    <th>Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-muted)', padding: 'var(--space-4)' }}>
                                            Kayıt bulunamadı
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map(log => {
                                        const status = getStatusFromLog(log);
                                        return (
                                            <tr key={log.id} style={{ backgroundColor: status === 'BLOCKED' ? '#FFF5F5' : status === 'OVERRIDE' ? '#FFFBF5' : 'transparent' }}>
                                                <td style={{ fontFamily: 'monospace', fontSize: 'var(--text-caption)', whiteSpace: 'nowrap' }}>
                                                    {formatDateTime(log.createdAt)}
                                                </td>
                                                <td>
                                                    <div>
                                                        <p style={{ fontWeight: 500 }}>{log.user?.name || 'Sistem'}</p>
                                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>{log.user?.role || '-'}</p>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        {actionLabels[log.action]?.icon || '📌'} {actionLabels[log.action]?.label || log.action}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div>
                                                        <p style={{ fontWeight: 500 }}>{log.entityType}</p>
                                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', fontFamily: 'monospace' }}>
                                                            {log.entityId.substring(0, 12)}...
                                                        </p>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ maxWidth: 300 }}>
                                                        {log.details && typeof log.details === 'object' && (
                                                            <>
                                                                {log.details.reason && (
                                                                    <p style={{ fontSize: 'var(--text-caption)', color: status === 'BLOCKED' ? '#C62828' : '#E65100' }}>
                                                                        ⚠️ {log.details.reason}
                                                                    </p>
                                                                )}
                                                                {log.details.updatedFields && (
                                                                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                                                                        Güncellenen: {log.details.updatedFields.join(', ')}
                                                                    </p>
                                                                )}
                                                                {log.details.status && (
                                                                    <Badge variant="info" style={{ fontSize: '10px' }}>{log.details.status}</Badge>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge style={{ backgroundColor: statusConfig[status]?.bgColor, color: statusConfig[status]?.color }}>
                                                        {statusConfig[status]?.label}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </>
    );
}
