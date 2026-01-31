import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, Textarea } from '@/components/ui';
import { createFeedback } from '@/lib/actions/feedback';
import { usePathname } from 'next/navigation';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
    const pathname = usePathname();
    const [feedbackType, setFeedbackType] = useState('BUG');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackUrl, setFeedbackUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) {
                console.error('User data error');
            }
        }
        setFeedbackUrl(window.location.href);
    }, [pathname, isOpen]);

    const handleSubmit = async () => {
        if (!feedbackMessage || !user) return;

        try {
            setSubmitting(true);
            await createFeedback({
                userId: user.id || 'anonymous',
                userName: user.name || 'Anonymous',
                type: feedbackType as any,
                message: feedbackMessage,
                url: feedbackUrl,
            });
            onClose();
            setFeedbackMessage('');
            setFeedbackType('BUG');
            alert('Geri bildiriminiz alındı, teşekkürler!');
        } catch (error) {
            console.error('Feedback error:', error);
            alert('Bir hata oluştu.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Geri Bildirim & Hata Bildirimi"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>İptal</Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={submitting || !feedbackMessage}
                    >
                        {submitting ? 'Gönderiliyor...' : 'Gönder'}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-4">
                <Select
                    label="Bildirim Tipi"
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value)}
                    options={[
                        { value: 'BUG', label: 'Hata (Bug)' },
                        { value: 'FEATURE', label: 'Yeni Özellik İsteği' },
                        { value: 'UX', label: 'Tasarım/Kullanım Önerisi' },
                        { value: 'OTHER', label: 'Diğer' },
                    ]}
                />
                <Textarea
                    placeholder="Lütfen yaşadığınız durumu veya önerinizi detaylıca anlatın..."
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    rows={4}
                />
                <Input
                    label="İlgili Sayfa URL"
                    value={feedbackUrl}
                    onChange={(e) => setFeedbackUrl(e.target.value)}
                    disabled
                />
            </div>
        </Modal>
    );
};
