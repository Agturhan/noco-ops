'use server';

import { Resend } from 'resend';

// Resend client (API key .env'den alınır)
const resend = new Resend(process.env.RESEND_API_KEY);

// ===== EMAIL TYPES =====
export type EmailTemplate =
    | 'welcome'
    | 'payment_reminder'
    | 'payment_received'
    | 'deliverable_ready'
    | 'revision_requested'
    | 'deadline_approaching'
    | 'project_completed';

interface EmailOptions {
    to: string | string[];
    subject: string;
    template: EmailTemplate;
    data: Record<string, any>;
}

// ===== EMAIL TEMPLATES =====
const templates: Record<EmailTemplate, (data: any) => string> = {
    welcome: (data) => `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #329FF5 0%, #00F5B0 100%); padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0;">Hoş Geldiniz! 🎉</h1>
            </div>
            <div style="padding: 30px; background: #ffffff; border-radius: 12px; margin-top: 20px; border: 1px solid #e0e0e0;">
                <p>Merhaba <strong>${data.name}</strong>,</p>
                <p>NOCO Creative Operations System'e hoş geldiniz! Hesabınız başarıyla oluşturuldu.</p>
                <p>Giriş bilgileriniz:</p>
                <ul>
                    <li>E-posta: ${data.email}</li>
                    <li>Rol: ${data.role}</li>
                </ul>
                <a href="${data.loginUrl || 'https://nocoops.com/login'}" style="display: inline-block; background: #329FF5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Giriş Yap</a>
            </div>
            <div style="text-align: center; padding: 20px; color: #6B7B80; font-size: 12px;">
                <p>© 2026 NOCO Creative Digital Studios</p>
            </div>
        </div>
    `,

    payment_reminder: (data) => `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #F59E0B; padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0;">💰 Ödeme Hatırlatması</h1>
            </div>
            <div style="padding: 30px; background: #ffffff; border-radius: 12px; margin-top: 20px; border: 1px solid #e0e0e0;">
                <p>Sayın <strong>${data.clientName}</strong>,</p>
                <p><strong>${data.invoiceNumber}</strong> numaralı faturanızın vadesi yaklaşıyor.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="background: #f5f5f5;">
                        <td style="padding: 12px; border: 1px solid #e0e0e0;">Proje</td>
                        <td style="padding: 12px; border: 1px solid #e0e0e0; font-weight: 600;">${data.projectName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border: 1px solid #e0e0e0;">Tutar</td>
                        <td style="padding: 12px; border: 1px solid #e0e0e0; font-weight: 600; color: #FF4242;">₺${data.amount}</td>
                    </tr>
                    <tr style="background: #f5f5f5;">
                        <td style="padding: 12px; border: 1px solid #e0e0e0;">Son Ödeme Tarihi</td>
                        <td style="padding: 12px; border: 1px solid #e0e0e0; font-weight: 600;">${data.dueDate}</td>
                    </tr>
                </table>
                <p style="color: #E65100; background: #FFF3E0; padding: 12px; border-radius: 8px;">
                    ⚠️ Ödeme yapılmadan teslimatlar yapılamayacağını hatırlatırız.
                </p>
            </div>
        </div>
    `,

    payment_received: (data) => `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #10B981; padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0;">✅ Ödeme Alındı</h1>
            </div>
            <div style="padding: 30px; background: #ffffff; border-radius: 12px; margin-top: 20px; border: 1px solid #e0e0e0;">
                <p>Sayın <strong>${data.clientName}</strong>,</p>
                <p><strong>₺${data.amount}</strong> tutarındaki ödemeniz başarıyla alınmıştır.</p>
                <p>Fatura No: <strong>${data.invoiceNumber}</strong></p>
                <p>Proje: <strong>${data.projectName}</strong></p>
                <p style="color: #10B981;">Teslimatlarınız artık aktif edilmiştir. ✨</p>
            </div>
        </div>
    `,

    deliverable_ready: (data) => `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #329FF5; padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0;">📦 Teslimat Hazır</h1>
            </div>
            <div style="padding: 30px; background: #ffffff; border-radius: 12px; margin-top: 20px; border: 1px solid #e0e0e0;">
                <p>Sayın <strong>${data.clientName}</strong>,</p>
                <p><strong>${data.deliverableName}</strong> teslimatınız incelemenize hazırdır.</p>
                <p>Proje: <strong>${data.projectName}</strong></p>
                <a href="${data.portalUrl}" style="display: inline-block; background: #329FF5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Müşteri Portalına Git</a>
                <p style="margin-top: 20px; color: #6B7B80; font-size: 14px;">
                    Onaylayabilir veya revizyon talep edebilirsiniz. (Kalan revizyon hakkı: ${data.remainingRevisions})
                </p>
            </div>
        </div>
    `,

    revision_requested: (data) => `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #F59E0B; padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0;">🔄 Revizyon Talebi</h1>
            </div>
            <div style="padding: 30px; background: #ffffff; border-radius: 12px; margin-top: 20px; border: 1px solid #e0e0e0;">
                <p>Merhaba <strong>${data.assigneeName}</strong>,</p>
                <p><strong>${data.deliverableName}</strong> için müşteriden revizyon talebi geldi.</p>
                <p>Proje: <strong>${data.projectName}</strong></p>
                <p>Revizyon No: <strong>#${data.revisionNumber}</strong></p>
                <div style="background: #FFF3E0; padding: 16px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 16px 0;">
                    <p style="margin: 0; font-weight: 600;">Müşteri Notu:</p>
                    <p style="margin: 8px 0 0;">${data.feedback}</p>
                </div>
            </div>
        </div>
    `,

    deadline_approaching: (data) => `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #EF4444; padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0;">⏰ Son Tarih Yaklaşıyor</h1>
            </div>
            <div style="padding: 30px; background: #ffffff; border-radius: 12px; margin-top: 20px; border: 1px solid #e0e0e0;">
                <p>Merhaba <strong>${data.assigneeName}</strong>,</p>
                <p><strong>${data.deliverableName}</strong> teslimatının son tarihi <strong>${data.daysRemaining} gün</strong> içinde.</p>
                <p>Proje: <strong>${data.projectName}</strong></p>
                <p>Son Tarih: <strong style="color: #EF4444;">${data.deadline}</strong></p>
            </div>
        </div>
    `,

    project_completed: (data) => `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10B981 0%, #329FF5 100%); padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0;">🎉 Proje Tamamlandı</h1>
            </div>
            <div style="padding: 30px; background: #ffffff; border-radius: 12px; margin-top: 20px; border: 1px solid #e0e0e0;">
                <p>Sayın <strong>${data.clientName}</strong>,</p>
                <p><strong>${data.projectName}</strong> projesi başarıyla tamamlanmıştır!</p>
                <p>Teslim edilen: <strong>${data.deliverableCount} dosya</strong></p>
                <p>Bizimle çalıştığınız için teşekkür ederiz. 🙏</p>
            </div>
        </div>
    `,
};

// ===== SEND EMAIL =====
export async function sendEmail(options: EmailOptions) {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY bulunamadı, e-posta gönderilmedi');
            return { success: false, error: 'API key eksik' };
        }

        const html = templates[options.template](options.data);

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'NOCO Ops <noreply@nocoops.com>',
            to: options.to,
            subject: options.subject,
            html,
        });

        if (error) {
            console.error('E-posta gönderilemedi:', error);
            return { success: false, error: error.message };
        }

        console.log('E-posta gönderildi:', data?.id);
        return { success: true, id: data?.id };
    } catch (error: any) {
        console.error('E-posta gönderme hatası:', error);
        return { success: false, error: error.message };
    }
}

// ===== HELPER FUNCTIONS =====

export async function sendPaymentReminder(
    clientEmail: string,
    clientName: string,
    invoiceNumber: string,
    projectName: string,
    amount: number,
    dueDate: string
) {
    return sendEmail({
        to: clientEmail,
        subject: `💰 Ödeme Hatırlatması - ${invoiceNumber}`,
        template: 'payment_reminder',
        data: { clientName, invoiceNumber, projectName, amount: amount.toLocaleString('tr-TR'), dueDate },
    });
}

export async function sendPaymentConfirmation(
    clientEmail: string,
    clientName: string,
    invoiceNumber: string,
    projectName: string,
    amount: number
) {
    return sendEmail({
        to: clientEmail,
        subject: `✅ Ödeme Alındı - ${invoiceNumber}`,
        template: 'payment_received',
        data: { clientName, invoiceNumber, projectName, amount: amount.toLocaleString('tr-TR') },
    });
}

export async function sendDeliverableNotification(
    clientEmail: string,
    clientName: string,
    deliverableName: string,
    projectName: string,
    remainingRevisions: number,
    portalUrl: string
) {
    return sendEmail({
        to: clientEmail,
        subject: `📦 ${deliverableName} - İncelemenize Hazır`,
        template: 'deliverable_ready',
        data: { clientName, deliverableName, projectName, remainingRevisions, portalUrl },
    });
}

export async function sendRevisionNotification(
    assigneeEmail: string,
    assigneeName: string,
    deliverableName: string,
    projectName: string,
    revisionNumber: number,
    feedback: string
) {
    return sendEmail({
        to: assigneeEmail,
        subject: `🔄 Revizyon Talebi - ${deliverableName}`,
        template: 'revision_requested',
        data: { assigneeName, deliverableName, projectName, revisionNumber, feedback },
    });
}

export async function sendDeadlineAlert(
    assigneeEmail: string,
    assigneeName: string,
    deliverableName: string,
    projectName: string,
    daysRemaining: number,
    deadline: string
) {
    return sendEmail({
        to: assigneeEmail,
        subject: `⏰ Son Tarih Yaklaşıyor - ${deliverableName}`,
        template: 'deadline_approaching',
        data: { assigneeName, deliverableName, projectName, daysRemaining, deadline },
    });
}

export async function sendWelcomeEmail(
    email: string,
    name: string,
    role: string,
    loginUrl?: string
) {
    return sendEmail({
        to: email,
        subject: '🎉 NOCO Ops\'a Hoş Geldiniz!',
        template: 'welcome',
        data: { name, email, role, loginUrl },
    });
}
