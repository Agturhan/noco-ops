'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui';
import '@/styles/tokens.css';
import '@/styles/components.css';

// Önceden tanımlı ekip üyeleri
const TEAM_MEMBERS = [
    { id: '1', name: 'Şeyma Bora', email: 'seyma@noco.studio', password: 'seyma2026', role: 'Kurgu & Takvim' },
    { id: '2', name: 'Fatih Ustaosmanoğlu', email: 'fatih@noco.studio', password: 'fatih2026', role: 'Çekim & Prodüksiyon' },
    { id: '3', name: 'Ayşegül Güler', email: 'aysegul@noco.studio', password: 'aysegul2026', role: 'Takvim & Koordinasyon' },
    { id: '4', name: 'Ahmet Gürkan Turhan', email: 'ahmet@noco.studio', password: 'ahmet2026', role: 'Çekim & Kurgu' },
];

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Kullanıcı kontrolü
        const user = TEAM_MEMBERS.find(
            u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );

        if (user) {
            // Kullanıcı bilgilerini localStorage'a kaydet
            localStorage.setItem('currentUser', JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }));

            // Dashboard'a yönlendir
            router.push('/dashboard');
        } else {
            setError('E-posta veya şifre hatalı');
        }

        setIsLoading(false);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1A1A1A 0%, #0D0D0D 100%)',
            padding: 'var(--space-3)'
        }}>
            <Card style={{
                width: '100%',
                maxWidth: '420px',
                padding: 'var(--space-4)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)'
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #329FF5 0%, #00F5B0 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--space-2)',
                        fontSize: '28px',
                        fontWeight: 700,
                        color: '#0D0D0D'
                    }}>
                        N
                    </div>
                    <h1 style={{
                        fontSize: 'var(--text-h2)',
                        fontFamily: 'var(--font-heading)',
                        color: 'var(--color-ink)',
                        marginBottom: '4px'
                    }}>
                        NOCO Ops
                    </h1>
                    <p style={{
                        color: 'var(--color-muted)',
                        fontSize: 'var(--text-body-sm)'
                    }}>
                        Creative Operations System
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        <Input
                            label="E-posta"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="isim@noco.studio"
                            required
                        />

                        <Input
                            label="Şifre"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />

                        {error && (
                            <div style={{
                                padding: 'var(--space-2)',
                                backgroundColor: 'rgba(255, 66, 66, 0.1)',
                                borderRadius: 'var(--radius-sm)',
                                borderLeft: '3px solid #FF4242',
                                color: '#FF4242',
                                fontSize: 'var(--text-body-sm)'
                            }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            isLoading={isLoading}
                            style={{ width: '100%', marginTop: 'var(--space-1)' }}
                        >
                            Giriş Yap
                        </Button>
                    </div>
                </form>

                {/* Ekip Üyeleri Bilgi */}
                <div style={{
                    marginTop: 'var(--space-3)',
                    paddingTop: 'var(--space-3)',
                    borderTop: '1px solid var(--color-border)'
                }}>
                    <p style={{
                        color: 'var(--color-muted)',
                        fontSize: 'var(--text-caption)',
                        marginBottom: 'var(--space-1)',
                        textAlign: 'center'
                    }}>
                        👥 Ekip Üyeleri
                    </p>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        fontSize: 'var(--text-caption)'
                    }}>
                        {TEAM_MEMBERS.map(member => (
                            <div
                                key={member.id}
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: 'var(--color-bg)',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onClick={() => {
                                    setEmail(member.email);
                                    setPassword(member.password);
                                }}
                            >
                                <p style={{ fontWeight: 600, color: 'var(--color-ink)', marginBottom: '2px' }}>
                                    {member.name.split(' ')[0]}
                                </p>
                                <p style={{ color: 'var(--color-muted)', fontSize: '10px' }}>
                                    {member.role}
                                </p>
                            </div>
                        ))}
                    </div>
                    <p style={{
                        color: 'var(--color-muted)',
                        fontSize: '10px',
                        textAlign: 'center',
                        marginTop: 'var(--space-1)'
                    }}>
                        Tıkla → otomatik doldur
                    </p>
                </div>
            </Card>
        </div>
    );
}
