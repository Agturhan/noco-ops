'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Badge, Button, Modal, Input } from '@/components/ui';
import Link from 'next/link';
import { getClients, createClient, updateClient, deleteClient } from '@/lib/actions/projects';

// Müşteri tipi
interface Client {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    instagram: string | null;
    facebook: string | null;
    tiktok: string | null;
    youtube: string | null;
    linkedin: string | null;
    website: string | null;
    notes: string | null;
    createdAt: Date;
    contracts: {
        id: string;
        name: string;
        projects: { id: string; status: string }[];
    }[];
}

export function ClientsPageClient() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [showDropdown, setShowDropdown] = useState<string | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formCompany, setFormCompany] = useState('');
    const [formInstagram, setFormInstagram] = useState('');
    const [formFacebook, setFormFacebook] = useState('');
    const [formTiktok, setFormTiktok] = useState('');
    const [formYoutube, setFormYoutube] = useState('');
    const [formLinkedin, setFormLinkedin] = useState('');
    const [formWebsite, setFormWebsite] = useState('');
    const [formNotes, setFormNotes] = useState('');

    // Müşterileri yükle
    const loadClients = async () => {
        try {
            setLoading(true);
            const data = await getClients();
            setClients(data as Client[]);
        } catch (error) {
            console.error('Müşteriler yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClients();
    }, []);

    // Formu sıfırla
    const resetForm = () => {
        setFormName('');
        setFormEmail('');
        setFormPhone('');
        setFormCompany('');
        setFormInstagram('');
        setFormFacebook('');
        setFormTiktok('');
        setFormYoutube('');
        setFormLinkedin('');
        setFormWebsite('');
        setFormNotes('');
    };

    // Düzenleme için formu doldur
    const openEditModal = (client: Client) => {
        setEditingClient(client);
        setFormName(client.name);
        setFormEmail(client.email);
        setFormPhone(client.phone || '');
        setFormCompany(client.company || '');
        setFormInstagram(client.instagram || '');
        setFormFacebook(client.facebook || '');
        setFormTiktok(client.tiktok || '');
        setFormYoutube(client.youtube || '');
        setFormLinkedin(client.linkedin || '');
        setFormWebsite(client.website || '');
        setFormNotes(client.notes || '');
        setShowEditModal(true);
        setShowDropdown(null);
    };

    // Yeni müşteri oluştur
    const handleCreateClient = async () => {
        if (!formName || !formEmail) return;

        try {
            setSubmitting(true);
            await createClient({
                name: formName,
                email: formEmail,
                phone: formPhone || undefined,
                company: formCompany || undefined,
                instagram: formInstagram || undefined,
                facebook: formFacebook || undefined,
                tiktok: formTiktok || undefined,
                youtube: formYoutube || undefined,
                linkedin: formLinkedin || undefined,
                website: formWebsite || undefined,
                notes: formNotes || undefined,
            });

            resetForm();
            setShowModal(false);
            await loadClients();
        } catch (error) {
            console.error('Müşteri oluşturulurken hata:', error);
            alert('Müşteri oluşturulurken bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

    // Müşteri güncelle
    const handleUpdateClient = async () => {
        if (!editingClient || !formName || !formEmail) return;

        try {
            setSubmitting(true);
            await updateClient(editingClient.id, {
                name: formName,
                email: formEmail,
                phone: formPhone || undefined,
                company: formCompany || undefined,
                instagram: formInstagram || undefined,
                facebook: formFacebook || undefined,
                tiktok: formTiktok || undefined,
                youtube: formYoutube || undefined,
                linkedin: formLinkedin || undefined,
                website: formWebsite || undefined,
                notes: formNotes || undefined,
            });

            resetForm();
            setShowEditModal(false);
            setEditingClient(null);
            await loadClients();
        } catch (error) {
            console.error('Müşteri güncellenirken hata:', error);
            alert('Müşteri güncellenirken bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

    // Müşteri sil
    const handleDeleteClient = async (client: Client) => {
        if (!confirm(`"${client.name}" müşterisini silmek istediğinize emin misiniz?`)) return;

        try {
            await deleteClient(client.id);
            setShowDropdown(null);
            await loadClients();
        } catch (error) {
            console.error('Müşteri silinirken hata:', error);
            alert('Müşteri silinirken bir hata oluştu');
        }
    };

    // Aktif proje sayısını hesapla
    const getActiveProjects = (client: Client) => {
        return client.contracts?.reduce((count, contract) => {
            return count + contract.projects.filter(p => p.status === 'ACTIVE').length;
        }, 0) || 0;
    };

    // Toplam proje sayısını hesapla
    const getTotalProjects = (client: Client) => {
        return client.contracts?.reduce((count, contract) => {
            return count + contract.projects.length;
        }, 0) || 0;
    };

    // Form içeriği (hem create hem edit için ortak)
    const renderFormContent = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '60vh', overflowY: 'auto', paddingRight: 'var(--space-1)' }}>
            {/* Temel Bilgiler */}
            <p style={{ fontWeight: 600, color: 'var(--color-primary)', marginBottom: '4px' }}>📋 Temel Bilgiler</p>
            <Input
                label="Müşteri Adı *"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Örn: Tevfik Usta"
            />
            <Input
                label="E-posta *"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="info@example.com"
            />
            <Input
                label="Telefon"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+90 555 123 4567"
            />
            <Input
                label="Şirket Adı"
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
                placeholder="Şirket Ltd. Şti."
            />
            <Input
                label="Website"
                value={formWebsite}
                onChange={(e) => setFormWebsite(e.target.value)}
                placeholder="https://example.com"
            />

            {/* Sosyal Medya */}
            <p style={{ fontWeight: 600, color: 'var(--color-primary)', marginTop: 'var(--space-2)', marginBottom: '4px' }}>📱 Sosyal Medya Hesapları</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-1)' }}>
                <Input
                    label="Instagram"
                    value={formInstagram}
                    onChange={(e) => setFormInstagram(e.target.value)}
                    placeholder="@kullaniciadi"
                />
                <Input
                    label="Facebook"
                    value={formFacebook}
                    onChange={(e) => setFormFacebook(e.target.value)}
                    placeholder="facebook.com/sayfa"
                />
                <Input
                    label="TikTok"
                    value={formTiktok}
                    onChange={(e) => setFormTiktok(e.target.value)}
                    placeholder="@kullaniciadi"
                />
                <Input
                    label="YouTube"
                    value={formYoutube}
                    onChange={(e) => setFormYoutube(e.target.value)}
                    placeholder="@kanal"
                />
                <Input
                    label="LinkedIn"
                    value={formLinkedin}
                    onChange={(e) => setFormLinkedin(e.target.value)}
                    placeholder="linkedin.com/company/..."
                />
            </div>

            {/* Notlar / Giriş Bilgileri */}
            <p style={{ fontWeight: 600, color: 'var(--color-primary)', marginTop: 'var(--space-2)', marginBottom: '4px' }}>🔐 Giriş Bilgileri & Notlar</p>
            <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder={`Instagram şifre: xxxxxx
Facebook Business: xxxxxx
Google Ads hesabı: xxxxxx
Diğer notlar...`}
                rows={5}
                style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: '#1A1A1A',
                    color: '#FFFFFF',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    resize: 'vertical',
                    lineHeight: '1.5'
                }}
            />
            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                ⚠️ Bu bilgiler güvenli bir şekilde saklanacaktır.
            </p>
        </div>
    );

    return (
        <div style={{ padding: 'var(--space-4)', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 'var(--space-1)' }}>Müşteriler</h1>
                    <p style={{ color: 'var(--color-muted)' }}>Müşteri ve sözleşme yönetimi</p>
                </div>
                <Button variant="primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    + Yeni Müşteri
                </Button>
            </div>

            <div style={{ padding: 'var(--space-3)' }}>
                {/* İstatistikler */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <Card>
                        <div style={{ textAlign: 'center', padding: 'var(--space-1)' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>TOPLAM MÜŞTERİ</p>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-primary)' }}>{clients.length}</p>
                        </div>
                    </Card>
                    <Card>
                        <div style={{ textAlign: 'center', padding: 'var(--space-1)' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>AKTİF SÖZLEŞME</p>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: '#00F5B0' }}>
                                {clients.reduce((sum, c) => sum + (c.contracts?.length || 0), 0)}
                            </p>
                        </div>
                    </Card>
                    <Card>
                        <div style={{ textAlign: 'center', padding: 'var(--space-1)' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>TOPLAM PROJE</p>
                            <p style={{ fontSize: '28px', fontWeight: 700 }}>
                                {clients.reduce((sum, c) => sum + getTotalProjects(c), 0)}
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Loading State */}
                {loading ? (
                    <Card>
                        <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                            <p style={{ color: 'var(--color-muted)' }}>Yükleniyor...</p>
                        </div>
                    </Card>
                ) : clients.length === 0 ? (
                    <Card>
                        <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                            <p style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>👥</p>
                            <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Henüz müşteri yok</p>
                            <p style={{ color: 'var(--color-muted)', marginBottom: 'var(--space-2)' }}>
                                İlk müşterinizi ekleyerek başlayın
                            </p>
                            <Button variant="primary" onClick={() => setShowModal(true)}>
                                + İlk Müşteriyi Ekle
                            </Button>
                        </div>
                    </Card>
                ) : (
                    /* Clients Grid */
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: 'var(--space-2)'
                    }}>
                        {clients.map((client) => (
                            <Card key={client.id}>
                                <CardHeader
                                    title={client.name}
                                    description={client.company || client.email}
                                    action={
                                        getActiveProjects(client) > 0 ? (
                                            <Badge variant="success">Aktif</Badge>
                                        ) : (
                                            <Badge variant="info">Pasif</Badge>
                                        )
                                    }
                                />
                                <CardContent>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: 'var(--space-2)',
                                        marginBottom: 'var(--space-2)'
                                    }}>
                                        <div>
                                            <p style={{
                                                fontSize: 'var(--text-caption)',
                                                color: 'var(--color-muted)'
                                            }}>
                                                Aktif Projeler
                                            </p>
                                            <p style={{
                                                fontSize: 'var(--text-body)',
                                                fontWeight: 600
                                            }}>
                                                {getActiveProjects(client)}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{
                                                fontSize: 'var(--text-caption)',
                                                color: 'var(--color-muted)'
                                            }}>
                                                Sözleşmeler
                                            </p>
                                            <p style={{
                                                fontSize: 'var(--text-body)',
                                                fontWeight: 600
                                            }}>
                                                {client.contracts?.length || 0}
                                            </p>
                                        </div>
                                    </div>

                                    <p style={{
                                        fontSize: 'var(--text-body-sm)',
                                        color: 'var(--color-muted)',
                                        marginBottom: 'var(--space-1)'
                                    }}>
                                        📧 {client.email}
                                    </p>
                                    {client.phone && (
                                        <p style={{
                                            fontSize: 'var(--text-body-sm)',
                                            color: 'var(--color-muted)',
                                            marginBottom: 'var(--space-2)'
                                        }}>
                                            📞 {client.phone}
                                        </p>
                                    )}

                                    <div style={{
                                        display: 'flex',
                                        gap: 'var(--space-1)',
                                        paddingTop: 'var(--space-2)',
                                        borderTop: '1px solid var(--color-border)'
                                    }}>
                                        <Link href={`/dashboard/clients/${client.id}`} style={{ flex: 1 }}>
                                            <Button variant="secondary" size="sm" style={{ width: '100%' }}>
                                                Detay
                                            </Button>
                                        </Link>
                                        <div style={{ position: 'relative' }}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setShowDropdown(showDropdown === client.id ? null : client.id)}
                                            >
                                                ⋮
                                            </Button>
                                            {showDropdown === client.id && (
                                                <div style={{
                                                    position: 'absolute',
                                                    right: 0,
                                                    top: '100%',
                                                    backgroundColor: 'var(--color-surface)',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                                    zIndex: 100,
                                                    minWidth: '140px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <button
                                                        onClick={() => openEditModal(client)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '10px 16px',
                                                            border: 'none',
                                                            background: 'none',
                                                            textAlign: 'left',
                                                            cursor: 'pointer',
                                                            color: 'var(--color-ink)',
                                                            fontSize: '14px'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        ✏️ Düzenle
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClient(client)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '10px 16px',
                                                            border: 'none',
                                                            background: 'none',
                                                            textAlign: 'left',
                                                            cursor: 'pointer',
                                                            color: '#FF4242',
                                                            fontSize: '14px'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FFEBEE'}
                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        🗑️ Sil
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Dropdown dışına tıklayınca kapat */}
            {showDropdown && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                    onClick={() => setShowDropdown(null)}
                />
            )}

            {/* Yeni Müşteri Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="➕ Yeni Müşteri"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            İptal
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleCreateClient}
                            disabled={!formName || !formEmail || submitting}
                        >
                            {submitting ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </>
                }
            >
                {renderFormContent()}
            </Modal>

            {/* Düzenle Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => { setShowEditModal(false); setEditingClient(null); }}
                title="✏️ Müşteri Düzenle"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => { setShowEditModal(false); setEditingClient(null); }}>
                            İptal
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleUpdateClient}
                            disabled={!formName || !formEmail || submitting}
                        >
                            {submitting ? 'Kaydediliyor...' : 'Güncelle'}
                        </Button>
                    </>
                }
            >
                {renderFormContent()}
            </Modal>
        </div>
    );
}
