'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Button, ColorPicker, Modal, Input, Textarea } from '@/components/ui';
import { getActiveTeamMembers, User, updateUserDetails } from '@/lib/actions/users';
import { getMemberColors, saveMemberColors } from '@/lib/actions/userSettings';
import { Icons } from '@/components/content/icons';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [teamMemberColors, setTeamMemberColors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    // Detail Modal State
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailForm, setDetailForm] = useState({ phone: '', notes: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [usersData, colorsData] = await Promise.all([
                    getActiveTeamMembers(),
                    getMemberColors()
                ]);
                setUsers(usersData);
                setTeamMemberColors(colorsData);
            } catch (e) {
                console.error('Failed to load users data', e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleColorChange = async (userName: string, color: string) => {
        const newColors = { ...teamMemberColors, [userName]: color };
        setTeamMemberColors(newColors);
        try {
            await saveMemberColors(newColors);
        } catch (e) {
            console.error('Failed to save color', e);
        }
    };

    const openDetailModal = (user: User) => {
        setSelectedUser(user);
        setDetailForm({ phone: user.phone || '', notes: user.notes || '' });
        setShowDetailModal(true);
    };

    const handleSaveDetails = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            const success = await updateUserDetails(selectedUser.id, detailForm);
            if (success) {
                // Update local state
                setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...detailForm } : u));
                setShowDetailModal(false);
            } else {
                alert('Kaydedilemedi');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ padding: 'var(--space-4)' }}>
            <div style={{ marginBottom: 'var(--space-4)' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 'var(--space-1)' }}>Kullanıcılar & Ekip</h1>
                <p style={{ color: 'var(--color-muted)' }}>Ekip üyelerini ve kişisel ayarlarını yönetin.</p>
            </div>

            <Card>
                <CardHeader title="Kişi Renk Ayarları" />
                <CardContent>
                    <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginBottom: 'var(--space-3)' }}>
                        Takvim ve görev listelerinde kişileri ayırt etmek için kullanılan renkler.
                    </p>

                    {loading ? (
                        <p>Yükleniyor...</p>
                    ) : (
                        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                            {users.map(user => (
                                <div key={user.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    backgroundColor: 'var(--color-surface)',
                                    borderRadius: 'var(--radius-sm)',
                                    borderLeft: `4px solid ${teamMemberColors[user.name] || '#6B7B80'}`
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%',
                                            backgroundColor: 'var(--color-primary)', color: 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600
                                        }}>
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 600 }}>{user.name}</p>
                                            <p style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{user.role}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <Button variant="ghost" size="sm" onClick={() => openDetailModal(user)}>{Icons.Edit} Detay</Button>
                                        <ColorPicker
                                            value={teamMemberColors[user.name] || '#6B7B80'}
                                            onChange={(color) => handleColorChange(user.name, color)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title={`${selectedUser?.name} Detayları`}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowDetailModal(false)}>İptal</Button>
                        <Button variant="primary" onClick={handleSaveDetails} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <Input
                        label="İletişim Numarası"
                        placeholder="+90 5XX XXX XX XX"
                        value={detailForm.phone}
                        onChange={(e) => setDetailForm({ ...detailForm, phone: e.target.value })}
                    />
                    <Textarea
                        label="Kişisel Notlar"
                        placeholder="Kişi hakkında notlar..."
                        value={detailForm.notes}
                        onChange={(e) => setDetailForm({ ...detailForm, notes: e.target.value })}
                        rows={4}
                    />
                </div>
            </Modal>
        </div>
    );
}
