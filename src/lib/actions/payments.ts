'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/email';

// ===== PAYMENT TRACKING & REMINDERS =====
// Fatura vadesi takibi, gecikme faizi hesabı ve hatırlatma sistemi

interface PaymentDue {
    id: string;
    invoiceNumber: string;
    clientName: string;
    amount: number;
    dueDate: string;
    daysUntilDue: number;
    isOverdue: boolean;
    daysOverdue: number;
    lateFee: number;
    totalWithFee: number;
    status: 'PENDING' | 'DUE_SOON' | 'OVERDUE' | 'CRITICAL';
}

// ===== GET PAYMENT DUE STATUS =====

interface InvoiceWithRelations {
    id: string;
    number: string | null;
    amount: number;
    dueDate: string;
    status: string;
    project: {
        name: string;
        contract: {
            client: {
                name: string;
                email: string;
            } | null;
        } | null;
    } | null;
}

export async function getPaymentDueStatus(): Promise<{
    overdue: PaymentDue[];
    dueSoon: PaymentDue[];
    upcoming: PaymentDue[];
    totalOverdue: number;
    totalDueSoon: number;
}> {
    const { data: invoices } = await supabaseAdmin
        .from('Invoice')
        .select(`
            *,
            project:Project (
                name,
                contract:Contract (
                    client:Client (
                        name,
                        email
                    )
                )
            )
        `)
        .eq('status', 'PENDING')
        .order('dueDate', { ascending: true });

    if (!invoices) {
        return { overdue: [], dueSoon: [], upcoming: [], totalOverdue: 0, totalDueSoon: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const processed = (invoices as unknown as InvoiceWithRelations[]).map((inv) => {
        const dueDate = new Date(inv.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const isOverdue = diffDays < 0;
        const daysOverdue = isOverdue ? Math.abs(diffDays) : 0;

        // Gecikme faizi: Aylık %2 (günlük ~%0.067)
        const dailyRate = 0.02 / 30;
        const lateFee = isOverdue ? Math.round(inv.amount * dailyRate * daysOverdue) : 0;

        let status: PaymentDue['status'] = 'PENDING';
        if (daysOverdue > 30) status = 'CRITICAL';
        else if (isOverdue) status = 'OVERDUE';
        else if (diffDays <= 7) status = 'DUE_SOON';

        return {
            id: inv.id,
            invoiceNumber: inv.number || `INV-${inv.id.substring(0, 6)}`,
            clientName: inv.project?.contract?.client?.name || 'Bilinmeyen',
            amount: inv.amount || 0,
            dueDate: inv.dueDate,
            daysUntilDue: diffDays,
            isOverdue,
            daysOverdue,
            lateFee,
            totalWithFee: (inv.amount || 0) + lateFee,
            status,
        };
    });

    const overdue = processed.filter(p => p.isOverdue).sort((a, b) => b.daysOverdue - a.daysOverdue);
    const dueSoon = processed.filter(p => !p.isOverdue && p.daysUntilDue <= 7);
    const upcoming = processed.filter(p => !p.isOverdue && p.daysUntilDue > 7);

    return {
        overdue,
        dueSoon,
        upcoming,
        totalOverdue: overdue.reduce((sum, p) => sum + p.totalWithFee, 0),
        totalDueSoon: dueSoon.reduce((sum, p) => sum + p.amount, 0),
    };
}

// ===== CALCULATE LATE FEE =====

export async function calculateLateFee(invoiceId: string): Promise<{
    originalAmount: number;
    daysOverdue: number;
    lateFee: number;
    totalWithFee: number;
    dailyRate: number;
}> {
    const { data: invoice } = await supabaseAdmin
        .from('Invoice')
        .select('amount, dueDate')
        .eq('id', invoiceId)
        .single();

    if (!invoice) {
        return { originalAmount: 0, daysOverdue: 0, lateFee: 0, totalWithFee: 0, dailyRate: 0 };
    }

    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const diffTime = today.getTime() - dueDate.getTime();
    const daysOverdue = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const dailyRate = 0.02 / 30; // Aylık %2
    const lateFee = Math.round(invoice.amount * dailyRate * daysOverdue);

    return {
        originalAmount: invoice.amount,
        daysOverdue,
        lateFee,
        totalWithFee: invoice.amount + lateFee,
        dailyRate,
    };
}

// ===== CREATE PAYMENT REMINDER =====

export async function createPaymentReminder(invoiceId: string, reminderType: 'FRIENDLY' | 'URGENT' | 'FINAL'): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}> {
    // Get invoice details
    const { data: invoice } = await supabaseAdmin
        .from('Invoice')
        .select(`
            *,
            project:Project (
                name,
                contract:Contract (
                    client:Client (
                        name,
                        email
                    )
                )
            )
        `)
        .eq('id', invoiceId)
        .single();

    if (!invoice) {
        return { success: false, error: 'Fatura bulunamadı' };
    }

    const inv = invoice as unknown as InvoiceWithRelations;
    const clientName = inv.project?.contract?.client?.name || 'Değerli Müşterimiz';
    const clientEmail = inv.project?.contract?.client?.email;
    const { lateFee, totalWithFee, daysOverdue } = await calculateLateFee(invoiceId);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);

    let subject = '';
    let message = '';

    switch (reminderType) {
        case 'FRIENDLY':
            subject = `Ödeme Hatırlatması - ${invoice.number}`;
            message = `Sayın ${clientName},\n\n${invoice.number} numaralı faturanızın ödeme vadesi yaklaşmaktadır.\n\nTutar: ${formatCurrency(invoice.amount)}\nVade: ${new Date(invoice.dueDate).toLocaleDateString('tr-TR')}\n\nÖdemenizi zamanında yapmanızı rica ederiz.\n\nSaygılarımızla,\nNoco Creative`;
            break;
        case 'URGENT':
            subject = `⚠️ Gecikmiş Ödeme - ${invoice.number}`;
            message = `Sayın ${clientName},\n\n${invoice.number} numaralı faturanız ${daysOverdue} gün gecikmiştir.\n\nAsıl Tutar: ${formatCurrency(invoice.amount)}\nGecikme Faizi: ${formatCurrency(lateFee)}\nToplam: ${formatCurrency(totalWithFee)}\n\nÖdemenizi en kısa sürede yapmanızı önemle rica ederiz.\n\nSaygılarımızla,\nNoco Creative`;
            break;
        case 'FINAL':
            subject = `🚨 SON UYARI: Gecikmiş Ödeme - ${invoice.number}`;
            message = `Sayın ${clientName},\n\n${invoice.number} numaralı faturanız ${daysOverdue} gündür ödenmemiştir. Bu faturanın 7 gün içinde ödenmemesi halinde yasal süreç başlatılacaktır.\n\nAsıl Tutar: ${formatCurrency(invoice.amount)}\nGecikme Faizi: ${formatCurrency(lateFee)}\nToplam: ${formatCurrency(totalWithFee)}\n\nAcil iletişim: muhasebe@noco.com.tr\n\nSaygılarımızla,\nNoco Creative`;
            break;
    }

    // Send Email
    if (clientEmail) {
        await sendEmail({
            to: clientEmail,
            subject,
            template: 'payment_reminder',
            data: {
                clientName,
                invoiceNumber: inv.number || 'Belirtilmemiş',
                projectName: inv.project?.name || 'Proje',
                amount: formatCurrency(invoice.amount),
                dueDate: new Date(invoice.dueDate).toLocaleDateString('tr-TR'),
                message
            }
        });
    }

    // Log the reminder
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'PAYMENT_REMINDER',
        entityType: 'INVOICE',
        entityId: invoiceId,
        details: {
            reminderType,
            clientEmail,
            subject,
            daysOverdue,
            totalWithFee,
        },
    }]);

    revalidatePath('/dashboard/invoices');

    return {
        success: true,
        message: `${reminderType} hatırlatması oluşturuldu. E-posta: ${clientEmail || 'Belirtilmemiş'}`,
    };
}

// ===== GET INVOICE PAYMENT COUNTDOWN =====

export async function getInvoiceCountdown(invoiceId: string): Promise<{
    daysLeft: number;
    hoursLeft: number;
    isOverdue: boolean;
    urgencyLevel: 'OK' | 'WARNING' | 'DANGER' | 'CRITICAL';
    message: string;
}> {
    const { data: invoice } = await supabaseAdmin
        .from('Invoice')
        .select('dueDate, status')
        .eq('id', invoiceId)
        .single();

    if (!invoice || invoice.status === 'PAID') {
        return { daysLeft: 0, hoursLeft: 0, isOverdue: false, urgencyLevel: 'OK', message: 'Ödendi' };
    }

    const now = new Date();
    const dueDate = new Date(invoice.dueDate);
    const diffMs = dueDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    const isOverdue = diffMs < 0;

    let urgencyLevel: 'OK' | 'WARNING' | 'DANGER' | 'CRITICAL' = 'OK';
    let message = '';

    if (isOverdue) {
        const daysOverdue = Math.abs(diffDays);
        if (daysOverdue > 30) {
            urgencyLevel = 'CRITICAL';
            message = `${daysOverdue} gün gecikmiş - SON UYARI`;
        } else {
            urgencyLevel = 'DANGER';
            message = `${daysOverdue} gün gecikmiş`;
        }
    } else if (diffDays <= 3) {
        urgencyLevel = 'DANGER';
        message = diffDays === 0 ? `Bugün son gün!` : `${diffDays} gün kaldı`;
    } else if (diffDays <= 7) {
        urgencyLevel = 'WARNING';
        message = `${diffDays} gün kaldı`;
    } else {
        urgencyLevel = 'OK';
        message = `${diffDays} gün kaldı`;
    }

    return {
        daysLeft: Math.max(0, diffDays),
        hoursLeft: Math.max(0, diffHours),
        isOverdue,
        urgencyLevel,
        message,
    };
}
