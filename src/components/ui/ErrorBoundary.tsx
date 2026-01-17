'use client';

import React from 'react';
import { Button, Card } from '@/components/ui';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });

        // TODO: Error reporting service'e gönder (Sentry, LogRocket vb.)
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '400px',
                    padding: 'var(--space-3)',
                }}>
                    <Card style={{
                        maxWidth: 500,
                        textAlign: 'center',
                        padding: 'var(--space-4)',
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: 'var(--space-2)' }}>⚠️</div>
                        <h2 style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 'var(--text-h3)',
                            marginBottom: 'var(--space-2)',
                            color: 'var(--color-error)',
                        }}>
                            Bir Hata Oluştu
                        </h2>
                        <p style={{
                            color: 'var(--color-muted)',
                            marginBottom: 'var(--space-3)',
                            lineHeight: 1.6,
                        }}>
                            Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin veya desteğe başvurun.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div style={{
                                textAlign: 'left',
                                padding: 'var(--space-2)',
                                backgroundColor: 'var(--color-surface)',
                                borderRadius: 'var(--radius-sm)',
                                marginBottom: 'var(--space-2)',
                                overflow: 'auto',
                                maxHeight: 200,
                            }}>
                                <p style={{
                                    fontFamily: 'monospace',
                                    fontSize: '12px',
                                    color: 'var(--color-error)',
                                    margin: 0,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all',
                                }}>
                                    {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <p style={{
                                        fontFamily: 'monospace',
                                        fontSize: '11px',
                                        color: 'var(--color-muted)',
                                        marginTop: 8,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-all',
                                    }}>
                                        {this.state.errorInfo.componentStack}
                                    </p>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'center' }}>
                            <Button variant="secondary" onClick={() => window.location.reload()}>
                                🔄 Sayfayı Yenile
                            </Button>
                            <Button variant="primary" onClick={this.handleRetry}>
                                ↩️ Tekrar Dene
                            </Button>
                        </div>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

// ===== NEXT.JS ERROR PAGE =====
// Bu bileşen app/dashboard/error.tsx için kullanılabilir

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export function ErrorPage({ error, reset }: ErrorPageProps) {
    React.useEffect(() => {
        console.error('Page Error:', error);
    }, [error]);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 'var(--space-3)',
            backgroundColor: 'var(--color-surface)',
        }}>
            <Card style={{
                maxWidth: 500,
                textAlign: 'center',
                padding: 'var(--space-4)',
            }}>
                <div style={{ fontSize: '64px', marginBottom: 'var(--space-2)' }}>💔</div>
                <h2 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--text-h2)',
                    marginBottom: 'var(--space-2)',
                }}>
                    Bir şeyler yanlış gitti
                </h2>
                <p style={{
                    color: 'var(--color-muted)',
                    marginBottom: 'var(--space-3)',
                    lineHeight: 1.6,
                }}>
                    Bu sayfayı yüklerken bir hata oluştu. Lütfen tekrar deneyin.
                </p>

                {error.digest && (
                    <p style={{
                        fontSize: 'var(--text-caption)',
                        color: 'var(--color-muted)',
                        fontFamily: 'monospace',
                        marginBottom: 'var(--space-2)',
                    }}>
                        Hata Kodu: {error.digest}
                    </p>
                )}

                <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'center' }}>
                    <Button variant="secondary" onClick={() => window.history.back()}>
                        ← Geri Dön
                    </Button>
                    <Button variant="primary" onClick={reset}>
                        🔄 Tekrar Dene
                    </Button>
                </div>
            </Card>
        </div>
    );
}

export default ErrorBoundary;
