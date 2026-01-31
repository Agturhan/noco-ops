import { Sidebar } from '@/components/layout';

export default function ClientPortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="layout">
            <Sidebar userRole="CLIENT" />
            <main className="main-content" style={{ backgroundColor: 'var(--color-surface)' }}>
                {children}
            </main>
        </div>
    );
}
