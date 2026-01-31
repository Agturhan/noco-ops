'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Badge, Modal, Input, Select } from '@/components/ui';
import { getClientById, updateClient, createContract } from '@/lib/actions/projects';

// Tipler
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
    createdAt: string;
    contracts: {
        id: string;
        name: string;
        maxRevisions: number;
        paymentTerms: string;
        retainerHours: number | null;
        monthlyVideoQuota: number;
        monthlyPostQuota: number;
        createdAt: string;
        projects: {
            id: string;
            name: string;
            status: string;
            createdAt: string;
        }[];
    }[];
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    ACTIVE: { label: 'Aktif', color: '#00F5B0', bgColor: '#E8F5E9' },
    PENDING: { label: 'Beklemede', color: '#F6D73C', bgColor: '#FFF9E6' },
    ON_HOLD: { label: 'Askıda', color: '#FF9800', bgColor: '#FFF3E0' },
    COMPLETED: { label: 'Tamamlandı', color: '#4CAF50', bgColor: '#E8F5E9' },
    ARCHIVED: { label: 'Arşivlendi', color: '#6B7B80', bgColor: '#F5F5F5' },
};

export default function ClientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'contracts' | 'social' | 'notes'>('overview');

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
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

    // Contract modal state
    const [showContractModal, setShowContractModal] = useState(false);
    const [contractSubmitting, setContractSubmitting] = useState(false);
    const [contractName, setContractName] = useState('');
    const [contractMaxRevisions, setContractMaxRevisions] = useState('3');
    const [contractPaymentTerms, setContractPaymentTerms] = useState('NET30');
    const [contractRawAssets, setContractRawAssets] = useState(false);
    const [contractRetainerHours, setContractRetainerHours] = useState('');
    const [contractVideoQuota, setContractVideoQuota] = useState('');
    const [contractPostQuota, setContractPostQuota] = useState('');
    const [contractNotes, setContractNotes] = useState('');

    const openEditModal = () => {
        if (!client) return;
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
    };

    const handleUpdateClient = async () => {
        if (!client || !formName || !formEmail) return;

        try {
            setSubmitting(true);
            await updateClient(client.id, {
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

            setShowEditModal(false);
            // Reload client data
            const data = await getClientById(client.id);
            setClient(data as Client);
        } catch (error) {
            console.error('Müşteri güncellenirken hata:', error);
            alert('Müşteri güncellenirken bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateContract = async () => {
        if (!client || !contractName) return;

        try {
            setContractSubmitting(true);
            await createContract({
                clientId: client.id,
                name: contractName,
                maxRevisions: parseInt(contractMaxRevisions) || 3,
                paymentTerms: contractPaymentTerms,
                rawAssetsIncluded: contractRawAssets,
                retainerHours: contractRetainerHours ? parseInt(contractRetainerHours) : undefined,
                monthlyVideoQuota: contractVideoQuota ? parseInt(contractVideoQuota) : undefined,
                monthlyPostQuota: contractPostQuota ? parseInt(contractPostQuota) : undefined,
                notes: contractNotes || undefined,
            });

            setShowContractModal(false);
            // Reset form
            setContractName('');
            setContractMaxRevisions('3');
            setContractPaymentTerms('NET30');
            setContractRawAssets(false);
            setContractRetainerHours('');
            setContractVideoQuota('');
            setContractPostQuota('');
            setContractNotes('');
            // Reload client data
            const data = await getClientById(client.id);
            setClient(data as Client);
        } catch (error) {
            console.error('Sözleşme oluşturulurken hata:', error);
            alert('Sözleşme oluşturulurken bir hata oluştu');
        } finally {
            setContractSubmitting(false);
        }
    };

    useEffect(() => {
        const loadClient = async () => {
            try {
                setLoading(true);
                const data = await getClientById(params.id as string);
                setClient(data as Client);
            } catch (error) {
                console.error('Müşteri yüklenirken hata:', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            loadClient();
        }
    }, [params.id]);

    if (loading) {
        return (
            <>
                <Header title="Yükleniyor..." subtitle="" />
                <div style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                    <Card>
                        <div style={{ padding: 'var(--space-4)' }}>
                            <p style={{ color: 'var(--color-muted)' }}>Müşteri bilgileri yükleniyor...</p>
                        </div>
                    </Card>
                </div>
            </>
        );
    }

    if (!client) {
        return (
            <>
                <Header title="Müşteri Bulunamadı" subtitle="" />
                <div style={{ padding: 'var(--space-3)' }}>
                    <Card>
                        <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                            <p style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>❌</p>
                            <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Müşteri bulunamadı</p>
                            <p style={{ color: 'var(--color-muted)', marginBottom: 'var(--space-2)' }}>
                                Bu müşteri silinmiş veya mevcut değil.
                            </p>
                            <Button variant="primary" onClick={() => router.back()}>← Geri Dön</Button>
                        </div>
                    </Card>
                </div>
            </>
        );
    }

    const totalProjects = client.contracts.reduce((sum, c) => sum + c.projects.length, 0);
    const activeProjects = client.contracts.reduce((sum, c) =>
        sum + c.projects.filter(p => p.status === 'ACTIVE').length, 0);

    return (
        <>
            <Header
                title={client.name}
                subtitle={client.company || client.email}
                actions={
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <Button variant="secondary" onClick={() => router.back()}>← Geri</Button>
                        <Button variant="primary" onClick={openEditModal}>✏️ Düzenle</Button>
                    </div>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* Üst İstatistikler */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <Card style={{ background: activeProjects > 0 ? '#E8F5E9' : '#F5F5F5' }}>
                        <div style={{ textAlign: 'center', padding: 'var(--space-1)' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>DURUM</p>
                            <p style={{ fontSize: '18px', fontWeight: 700, color: activeProjects > 0 ? '#00F5B0' : '#6B7B80' }}>
                                {activeProjects > 0 ? 'Aktif' : 'Pasif'}
                            </p>
                        </div>
                    </Card>

                    <Card>
                        <div style={{ textAlign: 'center', padding: 'var(--space-1)' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>TOPLAM PROJE</p>
                            <p style={{ fontSize: '24px', fontWeight: 700 }}>{totalProjects}</p>
                        </div>
                    </Card>

                    <Card>
                        <div style={{ textAlign: 'center', padding: 'var(--space-1)' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>AKTİF PROJE</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>{activeProjects}</p>
                        </div>
                    </Card>

                    <Card>
                        <div style={{ textAlign: 'center', padding: 'var(--space-1)' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>SÖZLEŞME</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, color: '#00F5B0' }}>{client.contracts.length}</p>
                        </div>
                    </Card>
                </div>

                {/* Tab Navigation */}
                <Card style={{ marginBottom: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        {[
                            { id: 'overview', label: '📋 Genel' },
                            { id: 'projects', label: `📁 Projeler (${totalProjects})` },
                            { id: 'contracts', label: `📄 Sözleşmeler (${client.contracts.length})` },
                            { id: 'social', label: '📱 Sosyal Medya' },
                            { id: 'notes', label: '🔐 Notlar' },
                        ].map(tab => (
                            <Button
                                key={tab.id}
                                variant={activeTab === tab.id ? 'primary' : 'ghost'}
                                size="sm"
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                onClick={() => setActiveTab(tab.id as any)}
                            >
                                {tab.label}
                            </Button>
                        ))}
                    </div>
                </Card>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                        <Card>
                            <CardHeader title="👤 İletişim Bilgileri" />
                            <CardContent>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                    <div>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Müşteri Adı</p>
                                        <p style={{ fontWeight: 600 }}>{client.name}</p>
                                    </div>
                                    {client.company && (
                                        <div>
                                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Şirket</p>
                                            <p>🏢 {client.company}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>E-posta</p>
                                        <p>📧 {client.email}</p>
                                    </div>
                                    {client.phone && (
                                        <div>
                                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Telefon</p>
                                            <p>📞 {client.phone}</p>
                                        </div>
                                    )}
                                    {client.website && (
                                        <div>
                                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Web Sitesi</p>
                                            <p>🌐 {client.website}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Kayıt Tarihi</p>
                                        <p>📅 {new Date(client.createdAt).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader title="📁 Son Projeler" />
                            <CardContent>
                                {client.contracts.flatMap(c => c.projects).length === 0 ? (
                                    <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: 'var(--space-2)' }}>
                                        Henüz proje yok
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                                        {client.contracts.flatMap(c => c.projects).slice(0, 5).map(project => (
                                            <div key={project.id} style={{
                                                padding: 'var(--space-1)',
                                                backgroundColor: 'var(--color-surface)',
                                                borderRadius: 'var(--radius-sm)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <span style={{ fontWeight: 500 }}>{project.name}</span>
                                                <Badge style={{
                                                    backgroundColor: statusConfig[project.status]?.bgColor,
                                                    color: statusConfig[project.status]?.color
                                                }}>
                                                    {statusConfig[project.status]?.label}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'projects' && (
                    <Card>
                        <CardHeader title="📁 Tüm Projeler" />
                        <CardContent>
                            {client.contracts.flatMap(c => c.projects).length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                                    <p style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>📁</p>
                                    <p style={{ color: 'var(--color-muted)' }}>Bu müşteri için henüz proje oluşturulmamış.</p>
                                    <Button variant="primary" style={{ marginTop: 'var(--space-2)' }}>
                                        + Yeni Proje Oluştur
                                    </Button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                                    {client.contracts.flatMap(c => c.projects).map(project => (
                                        <div key={project.id} style={{
                                            padding: 'var(--space-2)',
                                            backgroundColor: 'var(--color-surface)',
                                            borderRadius: 'var(--radius-sm)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <p style={{ fontWeight: 600 }}>{project.name}</p>
                                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                                                    Oluşturulma: {new Date(project.createdAt).toLocaleDateString('tr-TR')}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                                                <Badge style={{
                                                    backgroundColor: statusConfig[project.status]?.bgColor,
                                                    color: statusConfig[project.status]?.color
                                                }}>
                                                    {statusConfig[project.status]?.label}
                                                </Badge>
                                                <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
                                                    Görüntüle
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'contracts' && (
                    <Card>
                        <CardHeader title="📄 Sözleşmeler" action={<Button size="sm" onClick={() => setShowContractModal(true)}>+ Yeni Sözleşme</Button>} />
                        <CardContent>
                            {client.contracts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                                    <p style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>📄</p>
                                    <p style={{ color: 'var(--color-muted)' }}>Bu müşteri için henüz sözleşme oluşturulmamış.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                    {client.contracts.map(contract => (
                                        <div key={contract.id} style={{
                                            padding: 'var(--space-2)',
                                            backgroundColor: 'var(--color-surface)',
                                            borderRadius: 'var(--radius-sm)',
                                            borderLeft: '4px solid var(--color-primary)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <p style={{ fontWeight: 600, marginBottom: '4px' }}>{contract.name}</p>
                                                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                                                        Oluşturulma: {new Date(contract.createdAt).toLocaleDateString('tr-TR')}
                                                    </p>
                                                </div>
                                                <Badge variant="info">{contract.projects.length} Proje</Badge>
                                            </div>
                                            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-1)', fontSize: 'var(--text-body-sm)' }}>
                                                <span>📝 Maks Revizyon: {contract.maxRevisions}</span>
                                                <span>💰 Ödeme: {contract.paymentTerms}</span>
                                                <span>💰 Ödeme: {contract.paymentTerms}</span>
                                                {contract.retainerHours && <span>⏱️ Retainer: {contract.retainerHours} saat</span>}
                                                {(contract.monthlyVideoQuota || contract.monthlyPostQuota) ? (
                                                    <span style={{ color: 'var(--color-primary)' }}>
                                                        🎯 Kota: {contract.monthlyVideoQuota || 0} Video / {contract.monthlyPostQuota || 0} Post
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'social' && (
                    <Card>
                        <CardHeader title="📱 Sosyal Medya Hesapları" />
                        <CardContent>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                                {client.instagram && (
                                    <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #E4405F' }}>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Instagram</p>
                                        <p style={{ fontWeight: 600 }}>📸 {client.instagram}</p>
                                    </div>
                                )}
                                {client.facebook && (
                                    <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #1877F2' }}>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Facebook</p>
                                        <p style={{ fontWeight: 600 }}>👍 {client.facebook}</p>
                                    </div>
                                )}
                                {client.tiktok && (
                                    <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #000000' }}>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>TikTok</p>
                                        <p style={{ fontWeight: 600 }}>🎵 {client.tiktok}</p>
                                    </div>
                                )}
                                {client.youtube && (
                                    <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #FF0000' }}>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>YouTube</p>
                                        <p style={{ fontWeight: 600 }}>🎬 {client.youtube}</p>
                                    </div>
                                )}
                                {client.linkedin && (
                                    <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #0A66C2' }}>
                                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>LinkedIn</p>
                                        <p style={{ fontWeight: 600 }}>💼 {client.linkedin}</p>
                                    </div>
                                )}
                            </div>
                            {!client.instagram && !client.facebook && !client.tiktok && !client.youtube && !client.linkedin && (
                                <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                                    <p style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>📱</p>
                                    <p style={{ color: 'var(--color-muted)' }}>Bu müşteri için sosyal medya hesabı eklenmemiş.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'notes' && (
                    <Card>
                        <CardHeader title="🔐 Giriş Bilgileri & Notlar" />
                        <CardContent>
                            {client.notes ? (
                                <div style={{
                                    padding: 'var(--space-2)',
                                    backgroundColor: 'var(--color-surface)',
                                    borderRadius: 'var(--radius-sm)',
                                    borderLeft: '4px solid #FF9800',
                                    whiteSpace: 'pre-wrap',
                                    fontFamily: 'monospace',
                                    fontSize: 'var(--text-body-sm)'
                                }}>
                                    {client.notes}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                                    <p style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>🔐</p>
                                    <p style={{ color: 'var(--color-muted)' }}>Bu müşteri için not eklenmemiş.</p>
                                </div>
                            )}
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginTop: 'var(--space-2)' }}>
                                ⚠️ Bu bilgiler hassas veriler içerebilir. Yalnızca yetkili kişiler görebilir.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="✏️ Müşteri Düzenle"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '60vh', overflowY: 'auto', paddingRight: 'var(--space-1)' }}>
                    <p style={{ fontWeight: 600, color: 'var(--color-primary)', marginBottom: '4px' }}>📋 Temel Bilgiler</p>
                    <Input label="Müşteri Adı *" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Müşteri adı" />
                    <Input label="E-posta *" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="E-posta" />
                    <Input label="Telefon" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+90 555 123 4567" />
                    <Input label="Şirket Adı" value={formCompany} onChange={(e) => setFormCompany(e.target.value)} placeholder="Şirket Ltd. Şti." />
                    <Input label="Website" value={formWebsite} onChange={(e) => setFormWebsite(e.target.value)} placeholder="https://example.com" />

                    <p style={{ fontWeight: 600, color: 'var(--color-primary)', marginTop: 'var(--space-2)', marginBottom: '4px' }}>📱 Sosyal Medya</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-1)' }}>
                        <Input label="Instagram" value={formInstagram} onChange={(e) => setFormInstagram(e.target.value)} placeholder="@kullaniciadi" />
                        <Input label="Facebook" value={formFacebook} onChange={(e) => setFormFacebook(e.target.value)} placeholder="facebook.com/sayfa" />
                        <Input label="TikTok" value={formTiktok} onChange={(e) => setFormTiktok(e.target.value)} placeholder="@kullaniciadi" />
                        <Input label="YouTube" value={formYoutube} onChange={(e) => setFormYoutube(e.target.value)} placeholder="@kanal" />
                        <Input label="LinkedIn" value={formLinkedin} onChange={(e) => setFormLinkedin(e.target.value)} placeholder="linkedin.com/..." />
                    </div>

                    <p style={{ fontWeight: 600, color: 'var(--color-primary)', marginTop: 'var(--space-2)', marginBottom: '4px' }}>🔐 Giriş Bilgileri & Notlar</p>
                    <textarea
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder={`Instagram şifre: xxxxxx
Facebook Business: xxxxxx
Google Ads hesabı: xxxxxx`}
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
                </div>
            </Modal>

            {/* Contract Modal */}
            <Modal
                isOpen={showContractModal}
                onClose={() => setShowContractModal(false)}
                title="📄 Yeni Sözleşme Oluştur"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowContractModal(false)}>İptal</Button>
                        <Button
                            variant="primary"
                            onClick={handleCreateContract}
                            disabled={contractSubmitting || !contractName}
                        >
                            {contractSubmitting ? 'Oluşturuluyor...' : 'Sözleşme Oluştur'}
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <Input
                        label="Sözleşme Adı *"
                        value={contractName}
                        onChange={(e) => setContractName(e.target.value)}
                        placeholder="Örn: 2026 Yıllık Retainer"
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                        <Input
                            label="Maks. Revizyon"
                            type="number"
                            value={contractMaxRevisions}
                            onChange={(e) => setContractMaxRevisions(e.target.value)}
                            min={1}
                            max={10}
                        />
                        <Select
                            label="Ödeme Vadesi"
                            value={contractPaymentTerms}
                            onChange={(e) => setContractPaymentTerms(e.target.value)}
                            options={[
                                { value: 'IMMEDIATE', label: 'Peşin' },
                                { value: 'NET15', label: '15 Gün' },
                                { value: 'NET30', label: '30 Gün' },
                                { value: 'NET45', label: '45 Gün' },
                                { value: 'NET60', label: '60 Gün' },
                            ]}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                        <Input
                            label="Retainer Saati (Opsiyonel)"
                            type="number"
                            value={contractRetainerHours}
                            onChange={(e) => setContractRetainerHours(e.target.value)}
                            placeholder="Aylık saat"
                        />
                        <Input
                            label="Aylık Video Kotası"
                            type="number"
                            value={contractVideoQuota}
                            onChange={(e) => setContractVideoQuota(e.target.value)}
                            placeholder="Örn: 10"
                        />
                        <Input
                            label="Aylık Post Kotası"
                            type="number"
                            value={contractPostQuota}
                            onChange={(e) => setContractPostQuota(e.target.value)}
                            placeholder="Örn: 20"
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', paddingTop: '24px' }}>
                            <input
                                type="checkbox"
                                id="rawAssets"
                                checked={contractRawAssets}
                                onChange={(e) => setContractRawAssets(e.target.checked)}
                            />
                            <label htmlFor="rawAssets">RAW Dosyaları Dahil</label>
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Notlar</label>
                        <textarea
                            value={contractNotes}
                            onChange={(e) => setContractNotes(e.target.value)}
                            placeholder="Sözleşme notları..."
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-surface)',
                                color: 'var(--color-ink)',
                                fontFamily: 'inherit',
                                fontSize: '14px',
                                resize: 'vertical'
                            }}
                        />
                    </div>
                </div>
            </Modal>
        </>
    );
}
