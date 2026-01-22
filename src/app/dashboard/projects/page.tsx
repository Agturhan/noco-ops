'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Badge, Button, ProjectStatusBadge, Modal, Input, Select, Textarea } from '@/components/ui';
import { getProjects, createProject, getClients, getContractUsage } from '@/lib/actions/projects';

// Tipler
interface Project {
    id: string;
    name: string;
    description: string | null;
    status: 'PENDING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
    createdAt: Date;
    contract: {
        id: string;
        name: string;
        monthlyVideoQuota?: number;
        monthlyPostQuota?: number;
        client: {
            id: string;
            name: string;
        };
    };
    deliverables: { id: string; status: string }[];
    invoices: { id: string; status: string }[];
    assignee: { id: string; name: string } | null;
}

interface Contract {
    id: string;
    name: string;
    clientId: string;
    monthlyVideoQuota?: number;
    monthlyPostQuota?: number;
}

interface Client {
    id: string;
    name: string;
    contracts: Contract[];
}

const statusFilters = [
    { value: '', label: 'Tümü' },
    { value: 'ACTIVE', label: 'Aktif' },
    { value: 'PENDING', label: 'Beklemede' },
    { value: 'ON_HOLD', label: 'Askıda' },
    { value: 'COMPLETED', label: 'Tamamlanmış' },
];

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [usageStats, setUsageStats] = useState<Record<string, { video: number; post: number; total: number }>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formContractId, setFormContractId] = useState('');

    // Projeleri yükle
    const loadProjects = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getProjects(statusFilter || undefined);
            setProjects(data as Project[]);
        } catch (error) {
            console.error('Projeler yüklenirken hata:', error);
            setError('Projeler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
        } finally {
            setLoading(false);
        }
    };

    // Müşterileri yükle (sözleşme seçimi için)
    const loadClients = async () => {
        try {
            const data = await getClients();
            setClients(data as Client[]);
        } catch (error) {
            console.error('Müşteriler yüklenirken hata:', error);
        }
    };

    useEffect(() => {
        loadProjects();
        loadClients();
    }, []);

    useEffect(() => {
        loadProjects();
    }, [statusFilter]);

    // Yeni proje oluştur
    const handleCreateProject = async () => {
        if (!formName || !formContractId) return;

        try {
            setSubmitting(true);
            await createProject({
                name: formName,
                description: formDescription || undefined,
                contractId: formContractId,
            });

            // Formu temizle
            setFormName('');
            setFormDescription('');
            setFormContractId('');
            setShowModal(false);

            // Listeyi yenile
            await loadProjects();
        } catch (error) {
            console.error('Proje oluşturulurken hata:', error);
            alert('Proje oluşturulurken bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

    // Tamamlanan teslimat sayısı - Detay sayfasıyla tutarlı
    const getCompletedDeliverables = (project: Project) => {
        return project.deliverables.filter(d =>
            d.status === 'DELIVERED' || d.status === 'APPROVED' || d.status === 'COMPLETED'
        ).length;
    };

    // Sözleşme seçenekleri oluştur
    const getContractOptions = () => {
        const options: { value: string; label: string }[] = [{ value: '', label: 'Sözleşme seçin...' }];
        clients.forEach(client => {
            client.contracts.forEach(contract => {
                options.push({
                    value: contract.id,
                    label: `${client.name} - ${contract.name}`
                });
            });
        });
        return options;
    };

    // İstatistikler
    const activeCount = projects.filter(p => p.status === 'ACTIVE').length;
    const pendingCount = projects.filter(p => p.status === 'PENDING').length;
    const completedCount = projects.filter(p => p.status === 'COMPLETED').length;

    return (
        <>
            <Header
                title="Projeler"
                subtitle="Tüm aktif ve geçmiş projeleriniz"
                actions={
                    <Button variant="primary" onClick={() => setShowModal(true)}>
                        + Yeni Proje
                    </Button>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* İstatistikler */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <Card>
                        <div style={{ textAlign: 'center', padding: 'var(--space-1)' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>TOPLAM</p>
                            <p style={{ fontSize: '28px', fontWeight: 700 }}>{projects.length}</p>
                        </div>
                    </Card>
                    <Card style={{ background: '#E8F5E9' }}>
                        <div style={{ textAlign: 'center', padding: 'var(--space-1)' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>AKTİF</p>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: '#2E7D32' }}>{activeCount}</p>
                        </div>
                    </Card>
                    <Card style={{ background: '#FFF3E0' }}>
                        <div style={{ textAlign: 'center', padding: 'var(--space-1)' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>BEKLEMEDE</p>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: '#E65100' }}>{pendingCount}</p>
                        </div>
                    </Card>
                    <Card>
                        <div style={{ textAlign: 'center', padding: 'var(--space-1)' }}>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>TAMAMLANDI</p>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-primary)' }}>{completedCount}</p>
                        </div>
                    </Card>
                </div>

                {/* Filter Bar */}
                <Card style={{ marginBottom: 'var(--space-2)' }}>
                    <div style={{
                        display: 'flex',
                        gap: 'var(--space-1)',
                        flexWrap: 'wrap'
                    }}>
                        {statusFilters.map(filter => (
                            <Button
                                key={filter.value}
                                variant={statusFilter === filter.value ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setStatusFilter(filter.value)}
                            >
                                {filter.label}
                            </Button>
                        ))}
                    </div>
                </Card>

                {/* Loading State */}
                {loading ? (
                    <Card>
                        <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                            <p style={{ color: 'var(--color-muted)' }}>Yükleniyor...</p>
                        </div>
                    </Card>
                ) : error ? (
                    <Card style={{ borderLeft: '4px solid var(--color-error)' }}>
                        <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                            <p style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>⚠️</p>
                            <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)', color: 'var(--color-error)' }}>Hata Oluştu</p>
                            <p style={{ color: 'var(--color-muted)', marginBottom: 'var(--space-2)' }}>{error}</p>
                            <Button variant="primary" onClick={() => loadProjects()}>
                                🔄 Tekrar Dene
                            </Button>
                        </div>
                    </Card>
                ) : projects.length === 0 ? (
                    <Card>
                        <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                            <p style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>📁</p>
                            <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Henüz proje yok</p>
                            <p style={{ color: 'var(--color-muted)', marginBottom: 'var(--space-2)' }}>
                                {statusFilter ? 'Bu filtrede proje bulunamadı' : 'İlk projenizi oluşturarak başlayın'}
                            </p>
                            {!statusFilter && (
                                <Button variant="primary" onClick={() => setShowModal(true)}>
                                    + İlk Projeyi Oluştur
                                </Button>
                            )}
                        </div>
                    </Card>
                ) : (
                    /* Projects Grid */
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: 'var(--space-2)'
                    }}>
                        {projects.map((project) => (
                            <Card key={project.id}>
                                <CardHeader
                                    title={project.name}
                                    description={project.contract.client.name}
                                    action={<ProjectStatusBadge status={project.status} />}
                                />
                                <CardContent>
                                    {/* Progress Bar */}
                                    {/* Monthly Quota Progress */}
                                    {project.contract?.monthlyVideoQuota ? (
                                        <div style={{ marginBottom: 'var(--space-2)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-caption)', marginBottom: 4 }}>
                                                <span style={{ color: 'var(--color-muted)' }}>🎬 Video Kotası ({new Date().toLocaleString('tr-TR', { month: 'long' })})</span>
                                                <span style={{ fontWeight: 600 }}>{usageStats[project.id]?.video || 0} / {project.contract.monthlyVideoQuota}</span>
                                            </div>
                                            <div style={{ height: 6, backgroundColor: 'var(--color-surface)', borderRadius: 3, overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${Math.min(((usageStats[project.id]?.video || 0) / project.contract.monthlyVideoQuota) * 100, 100)}%`,
                                                    backgroundColor: (() => {
                                                        const current = usageStats[project.id]?.video || 0;
                                                        const max = project.contract.monthlyVideoQuota || 0;
                                                        if (current > max) return '#F44336'; // Red
                                                        if (current === max) return '#4CAF50'; // Green
                                                        if (current >= max * 0.8) return '#FF9800'; // Orange
                                                        return '#2196F3'; // Blue
                                                    })(),
                                                    borderRadius: 3
                                                }} />
                                            </div>
                                            {(usageStats[project.id]?.video || 0) > project.contract.monthlyVideoQuota! && (
                                                <Badge variant="error" style={{ marginTop: 4, height: 20, fontSize: 10 }}>KOTA AŞILDI</Badge>
                                            )}
                                        </div>
                                    ) : null}

                                    {project.contract?.monthlyPostQuota ? (
                                        <div style={{ marginBottom: 'var(--space-2)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-caption)', marginBottom: 4 }}>
                                                <span style={{ color: 'var(--color-muted)' }}>🖼️ Post Kotası ({new Date().toLocaleString('tr-TR', { month: 'long' })})</span>
                                                <span style={{ fontWeight: 600 }}>{usageStats[project.id]?.post || 0} / {project.contract.monthlyPostQuota}</span>
                                            </div>
                                            <div style={{ height: 6, backgroundColor: 'var(--color-surface)', borderRadius: 3, overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${Math.min(((usageStats[project.id]?.post || 0) / project.contract.monthlyPostQuota) * 100, 100)}%`,
                                                    backgroundColor: (() => {
                                                        const current = usageStats[project.id]?.post || 0;
                                                        const max = project.contract.monthlyPostQuota || 0;
                                                        if (current > max) return '#F44336'; // Red
                                                        if (current === max) return '#4CAF50'; // Green
                                                        if (current >= max * 0.8) return '#FF9800'; // Orange
                                                        return '#2196F3'; // Blue
                                                    })(),
                                                    borderRadius: 3
                                                }} />
                                            </div>
                                            {(usageStats[project.id]?.post || 0) > project.contract.monthlyPostQuota! && (
                                                <Badge variant="error" style={{ marginTop: 4, height: 20, fontSize: 10 }}>KOTA AŞILDI</Badge>
                                            )}
                                        </div>
                                    ) : null}

                                    {/* Deliverable Progress - Optional fallback */}
                                    {!project.contract?.monthlyVideoQuota && !project.contract?.monthlyPostQuota && project.deliverables.length > 0 && (
                                        <div style={{ marginBottom: 'var(--space-2)' }}>
                                            {/* Original Deliverables logic kept as fallback */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontSize: 'var(--text-caption)',
                                                color: 'var(--color-muted)',
                                                marginBottom: '4px'
                                            }}>
                                                <span>Teslimat İlerlemesi</span>
                                                <span>{getCompletedDeliverables(project)}/{project.deliverables.length}</span>
                                            </div>
                                            <div style={{
                                                height: '6px',
                                                backgroundColor: 'var(--color-border)',
                                                borderRadius: '3px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${(getCompletedDeliverables(project) / project.deliverables.length) * 100}%`,
                                                    backgroundColor: getCompletedDeliverables(project) === project.deliverables.length
                                                        ? 'var(--color-success)'
                                                        : 'var(--color-primary)',
                                                    borderRadius: '3px',
                                                    transition: 'width 0.3s ease'
                                                }} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Project Details */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: 'var(--text-body-sm)',
                                        color: 'var(--color-sub-ink)'
                                    }}>
                                        <div>
                                            <span style={{ color: 'var(--color-muted)' }}>Sözleşme:</span> {project.contract.name}
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--color-muted)' }}>Fatura:</span> {project.invoices.length}
                                        </div>
                                    </div>

                                    {project.description && (
                                        <p style={{
                                            fontSize: 'var(--text-body-sm)',
                                            color: 'var(--color-muted)',
                                            marginTop: 'var(--space-1)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {project.description}
                                        </p>
                                    )}

                                    {/* Actions */}
                                    <div style={{
                                        display: 'flex',
                                        gap: 'var(--space-1)',
                                        marginTop: 'var(--space-2)',
                                        paddingTop: 'var(--space-2)',
                                        borderTop: '1px solid var(--color-border)'
                                    }}>
                                        <Link href={`/dashboard/projects/${project.id}`} style={{ flex: 1 }}>
                                            <Button variant="secondary" size="sm" style={{ width: '100%' }}>
                                                Detaylar
                                            </Button>
                                        </Link>
                                        <Button variant="ghost" size="sm">
                                            ⋮
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div >
                )
                }
            </div >

            {/* Yeni Proje Modal */}
            < Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="➕ Yeni Proje"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            İptal
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleCreateProject}
                            disabled={!formName || !formContractId || submitting}
                        >
                            {submitting ? 'Oluşturuluyor...' : 'Proje Oluştur'}
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {clients.length === 0 ? (
                        <div style={{
                            padding: 'var(--space-2)',
                            backgroundColor: '#FFF3E0',
                            borderRadius: 'var(--radius-sm)',
                            textAlign: 'center'
                        }}>
                            <p style={{ color: '#E65100', marginBottom: 'var(--space-1)' }}>
                                ⚠️ Henüz müşteri veya sözleşme yok
                            </p>
                            <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>
                                Proje oluşturmak için önce bir müşteri ve sözleşme eklemeniz gerekiyor.
                            </p>
                        </div>
                    ) : (
                        <>
                            <Input
                                label="Proje Adı *"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="Örn: Zeytindalı Rebrand 2026"
                            />
                            <Select
                                label="Sözleşme *"
                                value={formContractId}
                                onChange={(e) => setFormContractId(e.target.value)}
                                options={getContractOptions()}
                            />
                            <Textarea
                                label="Açıklama"
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                rows={3}
                                placeholder="Proje hakkında kısa açıklama..."
                            />
                        </>
                    )}
                </div>
            </Modal >
        </>
    );
}
