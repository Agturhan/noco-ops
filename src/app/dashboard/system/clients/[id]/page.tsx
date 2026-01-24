'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, Button, Badge, Input, Textarea, ColorPicker, Modal } from '@/components/ui';
import { Icons, TypeIcons, StatusIcons } from '@/components/content/icons';
import { Clock, ListChecks } from 'lucide-react';
import { getBrandById, updateBrand, getBrandStats, getBrandProjects, Brand } from '@/lib/actions/brands';
import { ContentStatus } from '@/lib/data';

function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '10px 16px',
                borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: active ? 'var(--color-primary)' : 'var(--color-muted)',
                fontWeight: active ? 600 : 500,
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
        >
            {children}
        </button >
    );
}

export default function BrandDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [brand, setBrand] = useState<Brand | null>(null);
    const [stats, setStats] = useState({ totalProjects: 0, activeProjects: 0, contracts: 0 });
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'PROJECTS' | 'SOCIAL' | 'NOTES'>('GENERAL');

    // Form States
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<Partial<Brand>>({});
    const [socialCreds, setSocialCreds] = useState('');
    const [selectedTask, setSelectedTask] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        const [brandData, statsData, projectsData] = await Promise.all([
            getBrandById(id),
            getBrandStats(id),
            getBrandProjects(id)
        ]);

        if (brandData) {
            setBrand(brandData);
            setFormData(brandData);
            setSocialCreds(brandData.socialCredentials || '');
        }
        setStats(statsData);
        setProjects(projectsData || []);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!brand) return;
        try {
            const updates = { ...formData, socialCredentials: socialCreds };
            await updateBrand(brand.id, updates);
            setBrand({ ...brand, ...updates });
            setEditMode(false);
            alert('Kaydedildi');
        } catch (e) {
            console.error('Save failed', e);
            alert('Hata oluştu');
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Yükleniyor...</div>;
    if (!brand) return <div style={{ padding: '20px' }}>Marka bulunamadı.</div>;

    return (
        <div style={{ padding: 'var(--space-4)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Button variant="ghost" onClick={() => router.back()}>&larr; Geri</Button>
                    <div style={{ width: 40, height: 40, borderRadius: '8px', backgroundColor: brand.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '18px' }}>
                        {brand.name.charAt(0)}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{brand.name}</h1>
                        <p style={{ color: 'var(--color-muted)', fontSize: '13px' }}>{brand.category || 'Müşteri'}</p>
                    </div>
                </div>
                <div>
                    {editMode ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button variant="secondary" onClick={() => setEditMode(false)}>İptal</Button>
                            <Button variant="primary" onClick={handleSave}>Kaydet</Button>
                        </div>
                    ) : (
                        <Button variant="secondary" onClick={() => setEditMode(true)}>{Icons.Edit} Düzenle</Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            {!editMode && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                    <Card>
                        <CardContent style={{ textAlign: 'center', padding: '24px' }}>
                            <p style={{ fontSize: '12px', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Toplam Proje</p>
                            <p style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-primary)' }}>{stats.totalProjects}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent style={{ textAlign: 'center', padding: '24px' }}>
                            <p style={{ fontSize: '12px', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Aktif Proje</p>
                            <p style={{ fontSize: '32px', fontWeight: 700, color: '#00F5B0' }}>{stats.activeProjects}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent style={{ textAlign: 'center', padding: '24px' }}>
                            <p style={{ fontSize: '12px', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Sözleşme</p>
                            <p style={{ fontSize: '32px', fontWeight: 700, color: '#F6D73C' }}>{stats.contracts}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabs */}
            <div style={{ borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-4)', display: 'flex', gap: '8px' }}>
                <TabButton active={activeTab === 'GENERAL'} onClick={() => setActiveTab('GENERAL')}>Genel</TabButton>
                <TabButton active={activeTab === 'PROJECTS'} onClick={() => setActiveTab('PROJECTS')}>Projeler ({projects.length})</TabButton>
                <TabButton active={activeTab === 'SOCIAL'} onClick={() => setActiveTab('SOCIAL')}>Sosyal Medya</TabButton>
                <TabButton active={activeTab === 'NOTES'} onClick={() => setActiveTab('NOTES')}>Notlar</TabButton>
            </div>

            {/* Tab Content */}
            <Card>
                <CardContent style={{ minHeight: '300px' }}>
                    {activeTab === 'GENERAL' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>{Icons.User} İletişim Bilgileri</h3>
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Müşteri Adı</label>
                                        {editMode ? <Input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /> : <p style={{ fontWeight: 500 }}>{brand.name}</p>}
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--color-muted)' }}>E-posta</label>
                                        {editMode ? <Input value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} /> : <p style={{ fontWeight: 500 }}>{brand.email || '-'}</p>}
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Telefon</label>
                                        {editMode ? <Input value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} /> : <p style={{ fontWeight: 500 }}>{brand.phone || '-'}</p>}
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Şirket</label>
                                        {editMode ? <Input value={formData.company || ''} onChange={e => setFormData({ ...formData, company: e.target.value })} /> : <p style={{ fontWeight: 500 }}>{brand.company || '-'}</p>}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>{Icons.Tag} Marka Detayları</h3>
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Marka Rengi</label>
                                        {editMode ? <ColorPicker value={formData.color || '#329FF5'} onChange={c => setFormData({ ...formData, color: c })} /> : <div style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: brand.color }}></div>}
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Web Sitesi</label>
                                        {editMode ? <Input value={formData.website || ''} onChange={e => setFormData({ ...formData, website: e.target.value })} /> : <a href={brand.website} target="_blank" style={{ color: 'var(--color-primary)' }}>{brand.website || '-'}</a>}
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Instagram</label>
                                        {editMode ? <Input value={formData.instagram || ''} onChange={e => setFormData({ ...formData, instagram: e.target.value })} /> : <p style={{ fontWeight: 500 }}>{brand.instagram || '-'}</p>}
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Kayıt Tarihi</label>
                                        <p style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>{Icons.Calendar} {new Date(brand.createdAt).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'PROJECTS' && (
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Son Projeler & İçerikler</h3>
                            {projects.length === 0 ? <p style={{ color: 'var(--color-muted)' }}>Henüz proje yok.</p> : (
                                <div style={{ display: 'grid', gap: '8px' }}>
                                    {projects.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => setSelectedTask(p)}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '12px',
                                                backgroundColor: 'var(--color-bg)',
                                                borderRadius: 'var(--radius-sm)',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s'
                                            }}
                                            className="hover:bg-[var(--color-surface-hover)]"
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {TypeIcons[p.contentType] || TypeIcons['VIDEO']}
                                                <div>
                                                    <p style={{ fontWeight: 600 }}>{p.title}</p>
                                                    <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{p.dueDate ? new Date(p.dueDate).toLocaleDateString('tr-TR') : 'Tarih yok'}</p>
                                                </div>
                                            </div>
                                            <Badge style={{ backgroundColor: '#eee', color: '#333' }}>{p.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'SOCIAL' && (
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Sosyal Medya Giriş Bilgileri</h3>
                            <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginBottom: '12px' }}>Lütfen şifreleri ve güvenlik kodlarını buraya not edin. (Sadece yetkililer görebilir)</p>
                            {editMode ? (
                                <Textarea
                                    value={socialCreds}
                                    onChange={e => setSocialCreds(e.target.value)}
                                    rows={10}
                                    placeholder="Kullanıcı Adı: ...&#10;Şifre: ...&#10;2FA: ..."
                                />
                            ) : (
                                <div style={{ padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                    {socialCreds || 'Giriş bilgisi eklenmemiş.'}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'NOTES' && (
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Genel Notlar</h3>
                            {editMode ? (
                                <Textarea
                                    value={formData.notes || ''}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    rows={10}
                                    placeholder="Marka hakkında genel notlar..."
                                />
                            ) : (
                                <div style={{ padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', whiteSpace: 'pre-wrap' }}>
                                    {brand.notes || 'Not eklenmemiş.'}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* TASK DETAIL MODAL */}
            <Modal
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                title={selectedTask?.title || 'İçerik Detayı'}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Header Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Badge variant="neutral">{selectedTask?.type || 'İÇERİK'}</Badge>
                            <Badge style={{ backgroundColor: '#eee', color: '#333' }}>{selectedTask?.status}</Badge>
                        </div>
                    </div>

                    {/* Description */}
                    <div style={{ padding: '16px', backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ListChecks size={14} />
                            Açıklama / Notlar
                        </h4>
                        <p style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: 'var(--color-text)' }}>
                            {selectedTask?.notes || selectedTask?.description || 'Bu içerik için girilmiş bir açıklama bulunmuyor.'}
                        </p>
                    </div>

                    {/* Footer / Meta */}
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--color-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={16} />
                            <span>Son Tarih: {selectedTask?.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belirtilmemiş'}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                        <Button onClick={() => setSelectedTask(null)} variant="primary">Kapat</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
