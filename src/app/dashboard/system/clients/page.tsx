'use client';
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal, Badge } from '@/components/ui'; // Reduced imports
import { Icons } from '@/components/content/icons';
import { getBrands, createBrand, Brand } from '@/lib/actions/brands';
import { useRouter } from 'next/navigation';

export default function ClientsPage() {
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
        <div style={{ padding: 'var(--space-4)', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 'var(--space-1)' }}>Müşteriler</h1>
                    <p style={{ color: 'var(--color-muted)' }}>{brands.length} aktif marka</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Input
                            placeholder="Marka ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '240px', paddingLeft: '32px' }}
                        />
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }}>
                            {Icons.Search || '🔍'}
                        </span>
                    </div>
                    <Button variant="primary" onClick={() => setShowCreateModal(true)}>+ Yeni Marka</Button>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <span style={{ color: 'var(--color-muted)' }}>Yükleniyor...</span>
                </div>
            ) : filteredBrands.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', opacity: 0.6 }}>
                    <p>Marka bulunamadı.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {filteredBrands.map(brand => (
                        <div
                            key={brand.id}
                            onClick={() => router.push(`/dashboard/system/clients/${brand.id}`)}
                            style={{
                                backgroundColor: 'var(--color-surface)',
                                borderRadius: '12px',
                                padding: '20px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                border: '1px solid transparent',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                            }}
                        >
                            {/* Accent Line */}
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: brand.color || '#329FF5' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: '10px',
                                        backgroundColor: brand.color ? `${brand.color}20` : '#F0F0F0', // 20% opacity
                                        color: brand.color || '#666',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: '16px'
                                    }}>
                                        {brand.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: 600, fontSize: '16px', margin: 0 }}>{brand.name}</h3>
                                        <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>{brand.category || 'Genel'}</p>
                                    </div>
                                </div>
                                {!brand.isActive && <Badge variant="neutral" size="sm">Pasif</Badge>}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                                <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                                    {new Date(brand.createdAt).toLocaleDateString('tr-TR')}
                                </span>
                                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-primary)' }}>Detaylar &rarr;</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Yeni Marka Oluştur"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>İptal</Button>
                        <Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Oluşturuluyor...' : 'Oluştur'}</Button>
                    </>
                }
            >
                <div>
                    <Input
                        label="Marka Adı"
                        placeholder="Örn: Yeni Müşteri"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        autoFocus
                    />
                </div>
            </Modal>
        </div>
    );
}
