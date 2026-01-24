'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Badge } from '@/components/ui';
import { Icons } from '@/components/content/icons';

export function SystemSettingsPageClient() {
    return (
        <div style={{ padding: 'var(--space-4)' }}>
            <div style={{ marginBottom: 'var(--space-4)' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 'var(--space-1)' }}>Sistem Ayarları</h1>
                <p style={{ color: 'var(--color-muted)' }}>uygulama genel yapılandırması.</p>
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                <Card>
                    <CardHeader title="Genel Ayarlar" />
                    <CardContent>
                        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontWeight: 600 }}>Dil / Language</p>
                                    <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Varsayılan sistem dili</p>
                                </div>
                                <select style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)' }} disabled>
                                    <option>Türkçe (TR)</option>
                                    <option>English (EN)</option>
                                </select>
                            </div>
                            <div style={{ width: '100%', height: 1, backgroundColor: 'var(--color-border)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontWeight: 600 }}>Saat Dilimi</p>
                                    <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Sistem zaman dilimi</p>
                                </div>
                                <select style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)' }} disabled>
                                    <option>Istanbul (GMT+3)</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader title="Sistem Durumu" />
                    <CardContent>
                        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                            <div style={{ padding: '16px', backgroundColor: 'var(--color-surface)', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                                <p style={{ fontSize: '24px', fontWeight: 700, color: '#00F5B0' }}>Aktif</p>
                                <p style={{ color: 'var(--color-muted)' }}>Sistem Durumu</p>
                            </div>
                            <div style={{ padding: '16px', backgroundColor: 'var(--color-surface)', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                                <p style={{ fontSize: '24px', fontWeight: 700 }}>v0.1.0</p>
                                <p style={{ color: 'var(--color-muted)' }}>Versiyon</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
