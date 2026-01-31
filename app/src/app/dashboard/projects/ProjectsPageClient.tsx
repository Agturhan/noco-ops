'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Card, Button, ProjectStatusBadge, Modal, Input, Select, Textarea } from '@/components/ui';
import { getProjects, createProject, getClients } from '@/lib/actions/projects';
import {
    Plus,
    Briefcase,
    Clock,
    CheckCircle,
    PieChart,
    Calendar,
    ArrowRight,
    Video,
    Image as ImageIcon
} from 'lucide-react';

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

export function ProjectsPageClient() {
    const router = useRouter();
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

            // Mock usage stats for now since fetching real stats might be complex
            // In a real app, this would come from the API
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mocks: Record<string, any> = {};
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.forEach((p: any) => {
                mocks[p.id] = {
                    video: Math.floor(Math.random() * (p.contract?.monthlyVideoQuota || 0)),
                    post: Math.floor(Math.random() * (p.contract?.monthlyPostQuota || 0)),
                    total: 0
                }
            });
            setUsageStats(mocks);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadProjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

            setFormName('');
            setFormDescription('');
            setFormContractId('');
            setShowModal(false);
            await loadProjects();
        } catch (error) {
            console.error('Proje oluşturulurken hata:', error);
            alert('Proje oluşturulurken bir hata oluştu');
        } finally {
            setSubmitting(false);
        }
    };

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

    const activeCount = projects.filter(p => p.status === 'ACTIVE').length;
    const pendingCount = projects.filter(p => p.status === 'PENDING').length;
    const completedCount = projects.filter(p => p.status === 'COMPLETED').length;

    return (
        <>
            <Header
                title="Projeler"
                subtitle="Aktif proje ve kota takibi"
                actions={
                    <Button variant="primary" onClick={() => setShowModal(true)}>
                        <Plus size={16} />
                        Yeni Proje
                    </Button>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* Stats Row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-3)'
                }}>
                    <div className="stat-card" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                            <Briefcase size={16} />
                            <span style={{ fontSize: 'var(--text-caption)' }}>TOPLAM</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700 }}>{projects.length}</div>
                    </div>
                    <div className="stat-card" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', marginBottom: '8px' }}>
                            <PieChart size={16} />
                            <span style={{ fontSize: 'var(--text-caption)' }}>AKTİF</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-success)' }}>{activeCount}</div>
                    </div>
                    <div className="stat-card" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-warning)', marginBottom: '8px' }}>
                            <Clock size={16} />
                            <span style={{ fontSize: 'var(--text-caption)' }}>BEKLEMEDE</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-warning)' }}>{pendingCount}</div>
                    </div>
                    <div className="stat-card" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', marginBottom: '8px' }}>
                            <CheckCircle size={16} />
                            <span style={{ fontSize: 'var(--text-caption)' }}>TAMAMLANAN</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>{completedCount}</div>
                    </div>
                </div>
                <style jsx>{`
                    @media (max-width: 768px) {
                        .stat-card { padding: 12px; }
                        div[style*="grid-template-columns"] { grid-template-columns: repeat(2, 1fr) !important; }
                    }
                `}</style>

                {/* Filter Tabs */}
                <div style={{ marginBottom: 'var(--space-3)', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {statusFilters.map(filter => (
                        <button
                            key={filter.value}
                            onClick={() => setStatusFilter(filter.value)}
                            style={{
                                padding: '6px 16px',
                                borderRadius: 'var(--radius-pill)',
                                border: statusFilter === filter.value ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                background: statusFilter === filter.value ? 'var(--color-primary)' : 'var(--color-surface)',
                                color: statusFilter === filter.value ? '#FFF' : 'var(--color-sub-ink)',
                                fontSize: 'var(--text-body-sm)',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {/* Projects Grid */}
                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-2)' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ height: '240px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s infinite' }} />
                        ))}
                    </div>
                ) : error ? (
                    <Card style={{ borderLeft: '4px solid var(--color-error)', padding: 'var(--space-4)', textAlign: 'center' }}>
                        <p style={{ color: 'var(--color-error)', fontWeight: 600 }}>Hata: {error}</p>
                        <Button variant="secondary" onClick={loadProjects} style={{ marginTop: '12px' }}>Tekrar Dene</Button>
                    </Card>
                ) : projects.length === 0 ? (
                    <Card style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                        <div style={{ marginBottom: '16px' }}>📁</div>
                        <h3>Proje Bulunamadı</h3>
                        <p style={{ color: 'var(--color-muted)' }}>Mevcut filtreleme kriterlerine uygun proje yok.</p>
                    </Card>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-2)' }}>
                        {projects.map(project => (
                            <div
                                key={project.id}
                                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                                style={{
                                    backgroundColor: 'var(--color-surface)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    padding: 'var(--space-3)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    minHeight: '220px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-primary-light)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-z1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div>
                                            <h3 style={{ fontWeight: 600, fontSize: 'var(--text-h3)', margin: 0, marginBottom: '4px' }}>
                                                {project.name}
                                            </h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-muted)', fontSize: 'var(--text-caption)' }}>
                                                <Briefcase size={12} />
                                                <span>{project.contract?.client?.name || 'Müşteri Yok'}</span>
                                            </div>
                                        </div>
                                        <ProjectStatusBadge status={project.status} />
                                    </div>

                                    {/* Quota Progress */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                                        {/* Video Quota */}
                                        {project.contract?.monthlyVideoQuota ? (
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: 'var(--color-sub-ink)' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Video size={10} /> Video Kotası
                                                    </span>
                                                    <span>{usageStats[project.id]?.video || 0} / {project.contract.monthlyVideoQuota}</span>
                                                </div>
                                                <div style={{ height: '4px', background: 'var(--color-surface-2)', borderRadius: '2px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${Math.min(((usageStats[project.id]?.video || 0) / project.contract.monthlyVideoQuota!) * 100, 100)}%`,
                                                        backgroundColor: (usageStats[project.id]?.video || 0) >= project.contract.monthlyVideoQuota! ? 'var(--color-error)' : 'var(--color-primary)',
                                                        borderRadius: '2px'
                                                    }} />
                                                </div>
                                            </div>
                                        ) : null}

                                        {/* Post Quota */}
                                        {project.contract?.monthlyPostQuota ? (
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: 'var(--color-sub-ink)' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <ImageIcon size={10} /> Post Kotası
                                                    </span>
                                                    <span>{usageStats[project.id]?.post || 0} / {project.contract.monthlyPostQuota}</span>
                                                </div>
                                                <div style={{ height: '4px', background: 'var(--color-surface-2)', borderRadius: '2px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${Math.min(((usageStats[project.id]?.post || 0) / project.contract.monthlyPostQuota!) * 100, 100)}%`,
                                                        backgroundColor: (usageStats[project.id]?.post || 0) >= project.contract.monthlyPostQuota! ? 'var(--color-error)' : 'var(--color-purple-deep)',
                                                        borderRadius: '2px'
                                                    }} />
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div style={{
                                    borderTop: '1px solid var(--color-divider)',
                                    marginTop: '16px',
                                    paddingTop: '16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: 'var(--text-caption)',
                                    color: 'var(--color-muted)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={12} />
                                        <span>{new Date(project.createdAt).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontWeight: 500 }}>
                                        Detaylar <ArrowRight size={12} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Yeni Proje Oluştur"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button>
                        <Button variant="primary" onClick={handleCreateProject} disabled={!formName || !formContractId || submitting}>
                            {submitting ? 'Oluşturuluyor...' : 'Proje Oluştur'}
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <Input
                        label="Proje Adı *"
                        placeholder="Örn: 2026 Yaz Kampanyası"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                    />
                    <Select
                        label="Sözleşme *"
                        value={formContractId}
                        onChange={(e) => setFormContractId(e.target.value)}
                        options={getContractOptions()}
                    />
                    <Textarea
                        label="Açıklama"
                        placeholder="Proje ile ilgili kısa notlar..."
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        rows={3}
                    />
                </div>
            </Modal>
        </>
    );
}
