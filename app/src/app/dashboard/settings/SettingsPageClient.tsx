'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Badge, Input, Select, Modal } from '@/components/ui';
import {
    getSettings,
    updateSettings,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    type SettingsData,
    type CreateUserInput
} from '@/lib/actions/settings';

// ===== TİPLER =====
interface User {
    id: string;
    email: string;
    name: string;
    role: 'OWNER' | 'OPS' | 'STUDIO' | 'DIGITAL' | 'CLIENT';
    createdAt: Date;
}

type ActiveTab = 'general' | 'rules' | 'notifications' | 'branding' | 'users';

export function SettingsPageClient() {
    const [settings, setSettings] = useState<SettingsData | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>('general');

    // User Modal
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userForm, setUserForm] = useState<CreateUserInput>({
        email: '',
        name: '',
        role: 'DIGITAL',
    });

    // Verileri yükle
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [settingsData, usersData] = await Promise.all([
                getSettings(),
                getUsers(),
            ]);
            setSettings(settingsData);
            setUsers(usersData as User[]);
        } catch (error) {
            console.error('Veriler yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;

        try {
            setSaving(true);
            await updateSettings(settings);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            alert('Ayarlar kaydedilemedi');
        } finally {
            setSaving(false);
        }
    };

    const handleOpenUserModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setUserForm({ email: user.email, name: user.name, role: user.role });
        } else {
            setEditingUser(null);
            setUserForm({ email: '', name: '', role: 'DIGITAL' });
        }
        setShowUserModal(true);
    };

    const handleSaveUser = async () => {
        try {
            if (editingUser) {
                await updateUser(editingUser.id, userForm);
            } else {
                await createUser(userForm);
            }
            await loadData();
            setShowUserModal(false);
        } catch (error: any) {
            alert(error.message || 'İşlem başarısız');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;

        try {
            await deleteUser(userId);
            await loadData();
        } catch (error) {
            alert('Kullanıcı silinemedi');
        }
    };

    const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
        if (settings) {
            setSettings({ ...settings, [key]: value });
        }
    };

    if (loading) {
        return (
            <>
                <Header title="Ayarlar" subtitle="Yükleniyor..." />
                <div style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                    <p style={{ fontSize: '48px' }}>⏳</p>
                    <p>Ayarlar yükleniyor...</p>
                </div>
            </>
        );
    }

    if (!settings) {
        return (
            <>
                <Header title="Ayarlar" subtitle="Hata" />
                <div style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                    <p>Ayarlar yüklenemedi</p>
                    <Button onClick={loadData}>Tekrar Dene</Button>
                </div>
            </>
        );
    }

    const roleLabels: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'error' }> = {
        OWNER: { label: 'OWNER', variant: 'success' },
        OPS: { label: 'OPS', variant: 'warning' },
        STUDIO: { label: 'STUDIO', variant: 'info' },
        DIGITAL: { label: 'DIGITAL', variant: 'info' },
        CLIENT: { label: 'CLIENT', variant: 'error' },
    };

    return (
        <div style={{ paddingBottom: 'var(--space-4)' }}>
            <Header
                title="Ayarlar"
                subtitle="Sistem Yapılandırması"
                actions={
                    <Button variant="primary" onClick={handleSave} disabled={saving}>
                        {saving ? '⏳ Kaydediliyor...' : saved ? '✓ Kaydedildi' : '💾 Kaydet'}
                    </Button>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* Tab Navigation */}
                <Card style={{ marginBottom: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                        {[
                            { id: 'general' as ActiveTab, label: '⚙️ Genel' },
                            { id: 'rules' as ActiveTab, label: '📋 İş Kuralları' },
                            { id: 'notifications' as ActiveTab, label: '🔔 Bildirimler' },
                            { id: 'branding' as ActiveTab, label: '🎨 Marka' },
                            { id: 'users' as ActiveTab, label: '👥 Kullanıcılar' },
                        ].map(tab => (
                            <Button
                                key={tab.id}
                                variant={activeTab === tab.id ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </Button>
                        ))}
                    </div>
                </Card>

                {/* ===== GENEL AYARLAR ===== */}
                {activeTab === 'general' && (
                    <Card>
                        <CardHeader title="⚙️ Genel Ayarlar" />
                        <CardContent>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                                <Input
                                    label="Şirket Adı"
                                    value={settings.companyName}
                                    onChange={(e) => updateSetting('companyName', e.target.value)}
                                />
                                <Select
                                    label="Saat Dilimi"
                                    value={settings.timezone}
                                    onChange={(e) => updateSetting('timezone', e.target.value)}
                                    options={[
                                        { value: 'Europe/Istanbul', label: 'Türkiye (UTC+3)' },
                                        { value: 'Europe/London', label: 'Londra (UTC+0)' },
                                        { value: 'America/New_York', label: 'New York (UTC-5)' },
                                    ]}
                                />
                                <Select
                                    label="Dil"
                                    value={settings.language}
                                    onChange={(e) => updateSetting('language', e.target.value)}
                                    options={[
                                        { value: 'tr', label: 'Türkçe' },
                                        { value: 'en', label: 'English' },
                                    ]}
                                />
                                <Select
                                    label="Para Birimi"
                                    value={settings.currency}
                                    onChange={(e) => updateSetting('currency', e.target.value)}
                                    options={[
                                        { value: 'TRY', label: 'Türk Lirası (₺)' },
                                        { value: 'USD', label: 'Amerikan Doları ($)' },
                                        { value: 'EUR', label: 'Euro (€)' },
                                    ]}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ===== İŞ KURALLARI ===== */}
                {activeTab === 'rules' && (
                    <Card>
                        <CardHeader title="📋 İş Kuralları" description="Bu kurallar sistem genelinde zorunlu olarak uygulanır" />
                        <CardContent>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                {/* Revizyon Limiti */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                                    <div>
                                        <p style={{ fontWeight: 600 }}>🔄 Varsayılan Revizyon Limiti</p>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Her teslimat için izin verilen maksimum revizyon turu</p>
                                    </div>
                                    <Input
                                        type="number"
                                        value={settings.maxRevisions}
                                        onChange={(e) => updateSetting('maxRevisions', parseInt(e.target.value) || 1)}
                                        style={{ width: 80 }}
                                        min={1}
                                        max={10}
                                    />
                                </div>

                                {/* Toggle ayarları */}
                                {[
                                    { key: 'paymentRequired' as const, icon: '💰', title: 'Ödeme Zorunluluğu', desc: 'Fatura ödenmeden dosya teslimi yapılamaz', color: '#4CAF50' },
                                    { key: 'rawFilesProtected' as const, icon: '🔐', title: 'RAW Dosya Koruması', desc: 'Kaynak dosyalar (AI, PSD vb.) varsayılan olarak paylaşılmaz', color: '#FF9800' },
                                    { key: 'retainerExpiry' as const, icon: '⏰', title: 'Retainer Saat Süresi', desc: 'Kullanılmayan saatler ay sonunda sıfırlanır', color: '#329FF5' },
                                    { key: 'waiverRequired' as const, icon: '📝', title: 'Stüdyo Feragatname Zorunluluğu', desc: 'Çekim rezervasyonları için sorumluluk belgesi gerekli', color: '#9C27B0' },
                                ].map(item => (
                                    <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2)', backgroundColor: settings[item.key] ? `${item.color}20` : 'var(--color-surface)', borderRadius: 'var(--radius-sm)', borderLeft: settings[item.key] ? `4px solid ${item.color}` : 'none' }}>
                                        <div>
                                            <p style={{ fontWeight: 600 }}>{item.icon} {item.title}</p>
                                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>{item.desc}</p>
                                        </div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="checkbox"
                                                checked={settings[item.key]}
                                                onChange={(e) => updateSetting(item.key, e.target.checked)}
                                            />
                                            <Badge variant={settings[item.key] ? 'success' : 'warning'}>
                                                {settings[item.key] ? 'Aktif' : 'Devre Dışı'}
                                            </Badge>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ===== BİLDİRİMLER ===== */}
                {activeTab === 'notifications' && (
                    <Card>
                        <CardHeader title="🔔 Bildirim Ayarları" />
                        <CardContent>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {[
                                    { key: 'emailEnabled' as const, icon: '📧', title: 'E-posta Bildirimleri', desc: 'Önemli olaylar için e-posta gönder' },
                                    { key: 'paymentReminders' as const, icon: '💰', title: 'Ödeme Hatırlatıcıları', desc: 'Vadesi gelen faturalar için hatırlatma' },
                                ].map(item => (
                                    <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                                        <div>
                                            <p style={{ fontWeight: 600 }}>{item.icon} {item.title}</p>
                                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>{item.desc}</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={settings[item.key]}
                                            onChange={(e) => updateSetting(item.key, e.target.checked)}
                                        />
                                    </div>
                                ))}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                                    <div>
                                        <p style={{ fontWeight: 600 }}>⏰ Son Tarih Uyarıları</p>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Yaklaşan teslimat tarihleri için uyarı</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Input
                                            type="number"
                                            value={settings.daysBeforeDeadline}
                                            onChange={(e) => updateSetting('daysBeforeDeadline', parseInt(e.target.value) || 1)}
                                            style={{ width: 60 }}
                                            min={1}
                                            max={30}
                                        />
                                        <span>gün önce</span>
                                        <input
                                            type="checkbox"
                                            checked={settings.deadlineAlerts}
                                            onChange={(e) => updateSetting('deadlineAlerts', e.target.checked)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ===== MARKA ===== */}
                {activeTab === 'branding' && (
                    <Card>
                        <CardHeader title="🎨 Marka Ayarları" />
                        <CardContent>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Ana Renk</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input
                                            type="color"
                                            value={settings.primaryColor}
                                            onChange={(e) => updateSetting('primaryColor', e.target.value)}
                                            style={{ width: 50, height: 40, border: 'none', borderRadius: 'var(--radius-sm)' }}
                                        />
                                        <Input
                                            value={settings.primaryColor}
                                            onChange={(e) => updateSetting('primaryColor', e.target.value)}
                                            style={{ flex: 1 }}
                                        />
                                    </div>
                                </div>
                                <Input
                                    label="Logo URL"
                                    value={settings.logoUrl}
                                    onChange={(e) => updateSetting('logoUrl', e.target.value)}
                                />
                            </div>

                            {/* Preview */}
                            <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                                <p style={{ fontWeight: 600, marginBottom: '12px' }}>Önizleme</p>
                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                    <Button style={{ backgroundColor: settings.primaryColor, color: 'white' }}>Birincil</Button>
                                    <Button variant="secondary">İkincil</Button>
                                    <Badge style={{ backgroundColor: settings.primaryColor, color: 'white' }}>Badge</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ===== KULLANICILAR ===== */}
                {activeTab === 'users' && (
                    <Card>
                        <CardHeader title="👥 Kullanıcılar" action={<Button size="sm" onClick={() => handleOpenUserModal()}>+ Yeni Kullanıcı</Button>} />
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Kullanıcı</th>
                                        <th>E-posta</th>
                                        <th>Rol</th>
                                        <th>Kayıt Tarihi</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
                                                Kullanıcı bulunamadı
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map(user => (
                                            <tr key={user.id}>
                                                <td style={{ fontWeight: 600 }}>{user.name}</td>
                                                <td>{user.email}</td>
                                                <td>
                                                    <Badge variant={roleLabels[user.role]?.variant || 'info'}>
                                                        {roleLabels[user.role]?.label || user.role}
                                                    </Badge>
                                                </td>
                                                <td style={{ fontSize: 'var(--text-caption)' }}>
                                                    {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <Button size="sm" variant="ghost" onClick={() => handleOpenUserModal(user)}>✏️</Button>
                                                        <Button size="sm" variant="ghost" onClick={() => handleDeleteUser(user.id)} style={{ color: 'var(--color-error)' }}>🗑️</Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>

            {/* User Modal */}
            <Modal
                isOpen={showUserModal}
                onClose={() => setShowUserModal(false)}
                title={editingUser ? '✏️ Kullanıcı Düzenle' : '➕ Yeni Kullanıcı'}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowUserModal(false)}>İptal</Button>
                        <Button variant="primary" onClick={handleSaveUser}>Kaydet</Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <Input
                        label="Ad Soyad *"
                        value={userForm.name}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    />
                    <Input
                        label="E-posta *"
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    />
                    <Select
                        label="Rol *"
                        value={userForm.role}
                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                        options={[
                            { value: 'OWNER', label: '👑 Owner (Tam Yetki)' },
                            { value: 'OPS', label: '⚙️ Ops (Operasyon)' },
                            { value: 'STUDIO', label: '📸 Studio (Stüdyo)' },
                            { value: 'DIGITAL', label: '💻 Digital (Tasarım)' },
                            { value: 'CLIENT', label: '🏢 Client (Müşteri)' },
                        ]}
                    />
                    {!editingUser && (
                        <Input
                            label="Şifre"
                            type="password"
                            value={userForm.password || ''}
                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                            placeholder="Boş bırakılırsa davet e-postası gönderilir"
                        />
                    )}
                </div>
            </Modal>
        </div>
    );
}
