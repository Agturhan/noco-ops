'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Textarea, Modal } from '@/components/ui';
import { getActiveTeamMembers, User, updateUserDetails, createUser, deleteUser } from '@/lib/actions/users';
import { UserRole } from '@/lib/types/auth';
import { MagicBento } from '@/components/react-bits/MagicBento';
import { GlassSurface } from '@/components/ui/GlassSurface';
import ShinyText from '@/components/react-bits/ShinyText';
import { Plus, Trash2, Edit2, Shield, Phone, Mail, User as UserIcon } from 'lucide-react';

const RoleColors: Record<UserRole, string> = {
    OWNER: '#FFD60A', // Gold
    OPS: '#329FF5',   // Blue
    STUDIO: '#AF52DE',// Purple
    DIGITAL: '#30D158', // Green
    CLIENT: '#8E8E93', // Gray
};

export function SystemUsersPageClient() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Forms
    const [newUserForm, setNewUserForm] = useState({ name: '', email: '', role: 'STUDIO' as UserRole, password: '', phone: '' });
    const [editForm, setEditForm] = useState({ phone: '', notes: '', role: 'STUDIO' as UserRole });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getActiveTeamMembers();
            setUsers(data);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        if (!newUserForm.name || !newUserForm.email || !newUserForm.password) return alert('Lütfen zorunlu alanları doldurun');

        setIsSubmitting(true);
        try {
            const res = await createUser(newUserForm);
            if (res.success) {
                setShowAddModal(false);
                setNewUserForm({ name: '', email: '', role: 'STUDIO', password: '', phone: '' });
                loadData();
            } else {
                alert('Hata: ' + res.error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateUser = async () => {
        if (!selectedUser) return;
        setIsSubmitting(true);
        try {
            await updateUserDetails(selectedUser.id, editForm);
            setShowEditModal(false);
            loadData();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
        try {
            await deleteUser(id);
            loadData();
        } catch (e) {
            console.error(e);
            alert('Silinemedi');
        }
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setEditForm({ phone: user.phone || '', notes: user.notes || '', role: user.role });
        setShowEditModal(true);
    };

    return (
        <div className="p-4 md:p-8 min-h-screen pt-6 text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 md:mb-12 gap-4">
                <div className="relative">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] -z-10 pointer-events-none" />
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2">
                        <ShinyText text="Ekip & Yetkiler" speed={4} />
                    </h1>
                    <div className="text-white/40 text-sm md:text-base font-medium tracking-wide max-w-xl">
                        Şirket içi roller, iletişim bilgileri ve sistem erişimlerini buradan yönetin.
                    </div>
                </div>

                <Button
                    className="bg-white text-black hover:bg-white/90 font-bold px-6 py-3 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    onClick={() => setShowAddModal(true)}
                >
                    <Plus size={18} /> Yeni Üye Ekle
                </Button>
            </div>

            <MagicBento gap={16}>
                {loading ? (
                    <div className="col-span-12 text-center py-20 text-white/30">Ekip listesi yükleniyor...</div>
                ) : (
                    users.map((user) => (
                        <div key={user.id} className="col-span-1 md:col-span-6 lg:col-span-4">
                            <GlassSurface
                                className="h-full p-6 flex flex-col relative group overflow-hidden"
                                intensity="light"
                                glowOnHover
                                glowColor="blue"
                            >
                                {/* Role Stripe */}
                                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: RoleColors[user.role] || '#fff' }} />

                                <div className="flex items-start justify-between mb-4 pl-3">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-inner border border-white/10"
                                            style={{
                                                background: `linear-gradient(135deg, ${RoleColors[user.role]}40, ${RoleColors[user.role]}10)`,
                                                color: RoleColors[user.role]
                                            }}
                                        >
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white leading-tight">{user.name}</h3>
                                            <div className="text-xs text-white/40 font-mono mt-0.5">{user.email}</div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {user.role !== 'OWNER' && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-2 hover:bg-red-500/20 rounded-lg text-white/60 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="pl-3 mt-2 space-y-3 flex-grow">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-white/10"
                                            style={{
                                                backgroundColor: `${RoleColors[user.role]}20`,
                                                color: RoleColors[user.role],
                                            }}
                                        >
                                            {user.role}
                                        </span>
                                        {user.phone && (
                                            <span className="flex items-center gap-1 text-[11px] text-white/40 bg-white/5 px-2 py-0.5 rounded">
                                                <Phone size={10} /> {user.phone}
                                            </span>
                                        )}
                                    </div>

                                    {user.notes && (
                                        <div className="text-xs text-white/50 bg-white/[0.02] p-2 rounded-lg border border-white/5 italic">
                                            "{user.notes}"
                                        </div>
                                    )}
                                </div>

                                {/* Access Info Overlay or Footer could go here */}
                            </GlassSurface>
                        </div>
                    ))
                )}
            </MagicBento>

            {/* ADD USER MODAL */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Yeni Ekip Üyesi"
                size="md"
            >
                <div className="space-y-4">
                    <Input
                        label="Ad Soyad"
                        placeholder="Örn: Ahmet Yılmaz"
                        value={newUserForm.name}
                        onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    />
                    <Input
                        label="E-posta"
                        type="email"
                        placeholder="ahmet@noco.com"
                        value={newUserForm.email}
                        onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    />
                    <Input
                        label="Şifre"
                        type="password"
                        placeholder="Geçici şifre belirleyin"
                        value={newUserForm.password}
                        onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    />
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">Rol</label>
                        <select
                            className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm focus:border-white/30 outline-none"
                            value={newUserForm.role}
                            onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                        >
                            <option value="OPS">Operations (OPS)</option>
                            <option value="STUDIO">Studio Team</option>
                            <option value="DIGITAL">Digital Team</option>
                            <option value="OWNER">Owner (Full Access)</option>
                        </select>
                    </div>
                    <Input
                        label="Telefon (Opsiyonel)"
                        placeholder="+90..."
                        value={newUserForm.phone}
                        onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    />

                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>İptal</Button>
                        <Button variant="primary" onClick={handleCreateUser} disabled={isSubmitting}>
                            {isSubmitting ? 'Oluşturuluyor...' : 'Oluştur'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* EDIT USER MODAL */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Kullanıcı Düzenle"
                size="md"
            >
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">Rol</label>
                        <select
                            className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm focus:border-white/30 outline-none"
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                        >
                            <option value="OPS">Operations (OPS)</option>
                            <option value="STUDIO">Studio Team</option>
                            <option value="DIGITAL">Digital Team</option>
                            <option value="OWNER">Owner</option>
                        </select>
                    </div>
                    <Input
                        label="Telefon"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                    <Textarea
                        label="Notlar"
                        value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    />

                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>İptal</Button>
                        <Button variant="primary" onClick={handleUpdateUser} disabled={isSubmitting}>
                            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
