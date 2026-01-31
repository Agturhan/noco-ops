'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { GlassSurface } from '@/components/ui/GlassSurface';
import Prism from '@/components/backgrounds/Prism';
import '@/styles/tokens.css';
import '@/styles/components.css';

// Önceden tanımlı ekip üyeleri
const TEAM_MEMBERS = [
    { id: 'user-digital', name: 'Şeyma Bora', email: 'seyma@noco.studio', password: 'seyma2026', role: 'Kurgu & Takvim' },
    { id: 'user-studio', name: 'Fatih Ustaosmanoğlu', email: 'fatih@noco.studio', password: 'fatih2026', role: 'Çekim & Prodüksiyon' },
    { id: 'user-owner', name: 'Ayşegül Güler', email: 'aysegul@noco.studio', password: 'aysegul2026', role: 'Takvim & Koordinasyon' },
    { id: 'user-ops', name: 'Ahmet Gürkan Turhan', email: 'ahmet@noco.studio', password: 'ahmet2026', role: 'Çekim & Kurgu' },
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

        const user = TEAM_MEMBERS.find(
            u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );

        if (user) {
            localStorage.setItem('currentUser', JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }));
            router.push('/dashboard');
        } else {
            setError('E-posta veya şifre hatalı');
        }

        setIsLoading(false);
    };

    return (
        <div style={{
            position: 'relative',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backgroundColor: '#000', // Deep black background for Prism
        }}>
            {/* Background Animation */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <Prism
                    height={3.5}
                    baseWidth={5.5}
                    scale={3.6}
                    hueShift={0}
                    colorFrequency={1}
                    noise={0.1}
                    glow={0.8}
                    animationType="rotate"
                    timeScale={0.3}
                />
            </div>

            {/* Glass Container */}
            <GlassSurface intensity="medium" style={{
                width: '100%',
                maxWidth: '420px',
                padding: 'var(--space-4)',
                zIndex: 1, // Ensure it's above background
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
                    <img
                        src="/noco-logo-minimal.jpg"
                        alt="Noco Logo"
                        style={{
                            width: '80px',
                            height: 'auto',
                            objectFit: 'contain',
                            borderRadius: '12px',
                            margin: '0 auto var(--space-2)',
                            display: 'block'
                        }}
                    />
                    <h1 style={{
                        marginTop: '16px',
                        fontSize: '32px',
                        fontWeight: 700,
                        color: '#ffffff',
                        marginBottom: '4px',
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                    }}>
                        NOCO Ops
                    </h1>
                    <p style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '14px',
                        letterSpacing: '0.5px'
                    }}>
                        Creative Operations System
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '13px', color: '#ccc', fontWeight: 500 }}>E-posta</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="isim@noco.studio"
                                required
                                style={{
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '13px', color: '#ccc', fontWeight: 500 }}>Şifre</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white'
                                }}
                            />
                        </div>

                        {error && (
                            <div style={{
                                padding: '12px',
                                backgroundColor: 'rgba(255, 66, 66, 0.2)',
                                borderRadius: '8px',
                                border: '1px solid #FF4242',
                                color: '#ff8080',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            isLoading={isLoading}
                            style={{
                                width: '100%',
                                marginTop: 'var(--space-2)',
                                background: 'linear-gradient(90deg, #329FF5 0%, #00F5B0 100%)',
                                border: 'none',
                                color: '#000',
                                fontWeight: 600
                            }}
                        >
                            Giriş Yap
                        </Button>
                    </div>
                </form>

                {/* Ekip Üyeleri Bilgi */}
                <div style={{
                    marginTop: '24px',
                    paddingTop: '24px',
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <p style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '12px',
                        marginBottom: '12px',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        Hızlı Erişim (Demo)
                    </p>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        fontSize: '12px'
                    }}>
                        {TEAM_MEMBERS.map(member => (
                            <div
                                key={member.id}
                                style={{
                                    padding: '10px',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}
                                onClick={() => {
                                    setEmail(member.email);
                                    setPassword(member.password);
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <p style={{ fontWeight: 600, color: '#fff', marginBottom: '2px' }}>
                                    {member.name.split(' ')[0]}
                                </p>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>
                                    {member.role}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </GlassSurface>
        </div>
    );
}
