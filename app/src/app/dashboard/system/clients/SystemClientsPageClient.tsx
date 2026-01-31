'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Card, Button, Input, Modal, Badge } from '@/components/ui';
import { getBrands, createBrand, deleteBrand, Brand } from '@/lib/actions/brands';
import {
    Plus,
    Search,
    Trash2,
    MoreHorizontal,
    Briefcase,
    Calendar,
    ArrowRight
} from 'lucide-react';

export function SystemClientsPageClient() {
    const router = useRouter();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Create Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newBrandName, setNewBrandName] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadBrands();
    }, []);

    const loadBrands = async () => {
        setLoading(true);
        const data = await getBrands();
        setBrands(data || []);
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!newBrandName.trim()) return;
        setCreating(true);
        const res = await createBrand({ name: newBrandName });
        if (res.success) {
            await loadBrands();
            setShowCreateModal(false);
            setNewBrandName('');
        } else {
            alert('Marka oluşturulamadı.');
        }
        setCreating(false);
    };

    const filteredBrands = brands.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Header
                title="Müşteriler"
                subtitle={`${brands.length} aktif marka yönetimi`}
                actions={
                    <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={16} />
                        Yeni Marka
                    </Button>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* Search Bar */}
                <div style={{ marginBottom: 'var(--space-4)', maxWidth: '400px' }}>
                    <div style={{ position: 'relative' }}>
                        <Input
                            placeholder="Markalarda ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                paddingLeft: '36px',
                                backgroundColor: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                height: '44px'
                            }}
                        />
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--color-muted)'
                            }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: 'var(--space-3)'
                    }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} style={{
                                height: '180px',
                                background: 'var(--color-surface)',
                                borderRadius: 'var(--radius-md)',
                                animation: 'pulse 1.5s infinite'
                            }} />
                        ))}
                    </div>
                ) : filteredBrands.length === 0 ? (
                    <Card style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'var(--color-surface-2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto var(--space-3)'
                        }}>
                            <Briefcase size={32} style={{ color: 'var(--color-muted)' }} />
                        </div>
                        <h3 style={{ fontSize: 'var(--text-h3)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                            Marka Bulunamadı
                        </h3>
                        <p style={{ color: 'var(--color-muted)', marginBottom: 'var(--space-4)' }}>
                            Aradığınız kriterlere uygun sonuç yok.
                        </p>
                        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                            + Yeni Marka Ekle
                        </Button>
                    </Card>
                ) : (
                    <div className="clients-grid">
                        {filteredBrands.map(brand => (
                            <div
                                key={brand.id}
                                className="client-card"
                                onClick={() => router.push(`/dashboard/system/clients/${brand.id}`)}
                                style={{
                                    backgroundColor: 'var(--color-surface)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: 'var(--space-3)',
                                    cursor: 'pointer',
                                    border: '1px solid var(--color-border)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    minHeight: '180px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.borderColor = 'var(--color-primary-light)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-z2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {/* Top Section */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        {/* Avatar */}
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '12px',
                                            backgroundColor: brand.color ? `${brand.color}20` : 'var(--color-surface-2)',
                                            color: brand.color || 'var(--color-sub-ink)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            fontSize: '20px',
                                            border: '1px solid var(--color-border)'
                                        }}>
                                            {brand.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 style={{
                                                fontWeight: 600,
                                                fontSize: 'var(--text-h3)',
                                                margin: 0,
                                                marginBottom: '4px'
                                            }}>
                                                {brand.name}
                                            </h3>
                                            <Badge variant={brand.isActive ? 'success' : 'neutral'} style={{ fontSize: '10px' }}>
                                                {brand.isActive ? 'Aktif' : 'Pasif'}
                                            </Badge>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // TODO: Menu action
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--color-muted)',
                                            cursor: 'pointer',
                                            padding: '4px'
                                        }}
                                    >
                                        <MoreHorizontal size={20} />
                                    </button>
                                </div>

                                {/* Bottom Section */}
                                <div style={{
                                    paddingTop: 'var(--space-3)',
                                    borderTop: '1px solid var(--color-divider)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-muted)', fontSize: 'var(--text-caption)' }}>
                                        <Calendar size={14} />
                                        <span>{new Date(brand.createdAt).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: 'var(--color-surface-2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--color-ink)'
                                    }}>
                                        <ArrowRight size={14} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Grid Styles */}
            <style jsx global>{`
                .clients-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: var(--space-3);
                }
                @media (max-width: 640px) {
                    .clients-grid {
                        grid-template-columns: 1fr;
                    }
                }
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 0.3; }
                    100% { opacity: 0.6; }
                }
            `}</style>

            {/* Create Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Yeni Marka Oluştur"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>İptal</Button>
                        <Button variant="primary" onClick={handleCreate} disabled={creating}>
                            {creating ? 'Oluşturuluyor...' : 'Oluştur'}
                        </Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <Input
                        label="Marka Adı"
                        placeholder="Örn: Yeni Müşteri A.Ş."
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        autoFocus
                    />
                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                        Marka oluşturulduktan sonra detay sayfasından logo ve sözleşme bilgilerini ekleyebilirsiniz.
                    </p>
                </div>
            </Modal>
        </>
    );
}
