'use server';

import { supabaseAdmin } from '@/lib/supabase';

// ===== DASHBOARD STATS =====

export interface DashboardStats {
    // Proje istatistikleri
    activeProjects: number;
    pendingDeliverables: number;
    awaitingApproval: number;

    // Gelir istatistikleri
    recurringRevenue: number;  // Retainer geliri
    projectRevenue: number;    // Proje geliri
    totalRevenue: number;

    // Fatura durumları
    overdueInvoices: { id: string; client: string; amount: number; daysOverdue: number }[];
    upcomingPayments: { id: string; client: string; amount: number; dueIn: number }[];
    pendingAmount: number;
    overdueAmount: number;

    // Bugünkü rezervasyonlar
    todayBookings: { time: string; client: string; project: string }[];
    studioOccupancy: number;

    // Son projeler
    recentProjects: { id: string; name: string; client: string; status: string; progress: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
    try {
        // Paralel olarak tüm verileri çek
        const [
            projectsRes,
            deliverablesRes,
            invoicesRes,
            retainersRes,
        ] = await Promise.all([
            supabaseAdmin.from('Project').select('*, contract:Contract(client:Client(name))').eq('status', 'ACTIVE'),
            supabaseAdmin.from('Deliverable').select('*').in('status', ['IN_PROGRESS', 'IN_REVIEW']),
            supabaseAdmin.from('Invoice').select('*, project:Project(name, contract:Contract(client:Client(name)))'),
            supabaseAdmin.from('Retainer').select('*, client:Client(name)').eq('status', 'ACTIVE'),
        ]);

        const projects = projectsRes.data || [];
        const deliverables = deliverablesRes.data || [];
        const invoices = invoicesRes.data || [];
        const retainers = retainersRes.data || [];

        // Proje istatistikleri
        const activeProjects = projects.length;
        const pendingDeliverables = deliverables.filter(d => d.status === 'IN_PROGRESS').length;
        const awaitingApproval = deliverables.filter(d => d.status === 'IN_REVIEW').length;

        // Fatura hesaplamaları
        const today = new Date();
        const overdueInvoices = invoices
            .filter(inv => {
                if (inv.status === 'PAID') return false;
                if (!inv.dueDate) return false;
                return new Date(inv.dueDate) < today;
            })
            .map(inv => ({
                id: inv.id,
                client: inv.project?.contract?.client?.name || 'Bilinmeyen',
                amount: inv.amount || 0,
                daysOverdue: Math.floor((today.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)),
            }));

        const upcomingPayments = invoices
            .filter(inv => {
                if (inv.status === 'PAID') return false;
                if (!inv.dueDate) return false;
                const dueDate = new Date(inv.dueDate);
                return dueDate >= today && dueDate <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
            })
            .map(inv => ({
                id: inv.id,
                client: inv.project?.contract?.client?.name || 'Bilinmeyen',
                amount: inv.amount || 0,
                dueIn: Math.floor((new Date(inv.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
            }))
            .sort((a, b) => a.dueIn - b.dueIn);

        const pendingAmount = invoices
            .filter(inv => inv.status === 'PENDING')
            .reduce((sum, inv) => sum + (inv.amount || 0), 0);

        const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);

        // Gelir hesaplamaları (bu ay)
        const thisMonth = today.toISOString().slice(0, 7);
        const paidThisMonth = invoices.filter(inv =>
            inv.status === 'PAID' && inv.paidAt?.startsWith(thisMonth)
        );
        const projectRevenue = paidThisMonth.reduce((sum, inv) => sum + (inv.amount || 0), 0);

        // Retainer geliri (aylık toplam)
        const recurringRevenue = retainers.reduce((sum, ret) => sum + (ret.monthlyRate || 0), 0);
        const totalRevenue = recurringRevenue + projectRevenue;

        // Son projeler
        const recentProjects = projects.slice(0, 5).map(p => ({
            id: p.id,
            name: p.name,
            client: p.contract?.client?.name || 'Bilinmeyen',
            status: p.status,
            progress: Math.floor(Math.random() * 100), // TODO: Gerçek ilerleme hesabı
        }));

        return {
            activeProjects,
            pendingDeliverables,
            awaitingApproval,
            recurringRevenue,
            projectRevenue,
            totalRevenue,
            overdueInvoices,
            upcomingPayments,
            pendingAmount,
            overdueAmount,
            todayBookings: [], // TODO: CalendarEvent'ten çek
            studioOccupancy: 0,
            recentProjects,
        };
    } catch (error) {
        console.error('Dashboard stats error:', error);
        // Return defaults on error
        return {
            activeProjects: 0,
            pendingDeliverables: 0,
            awaitingApproval: 0,
            recurringRevenue: 0,
            projectRevenue: 0,
            totalRevenue: 0,
            overdueInvoices: [],
            upcomingPayments: [],
            pendingAmount: 0,
            overdueAmount: 0,
            todayBookings: [],
            studioOccupancy: 0,
            recentProjects: [],
        };
    }
}

// ===== QUICK ACTIONS =====

export async function getPendingActions() {
    try {
        const [overdueInvoices, pendingDeliverables] = await Promise.all([
            supabaseAdmin
                .from('Invoice')
                .select('*, project:Project(name, contract:Contract(client:Client(name)))')
                .eq('status', 'PENDING')
                .lt('dueDate', new Date().toISOString())
                .limit(5),
            supabaseAdmin
                .from('Deliverable')
                .select('*, project:Project(name)')
                .eq('status', 'IN_REVIEW')
                .limit(5),
        ]);

        const actions = [];

        // Gecikmiş faturalar
        for (const inv of overdueInvoices.data || []) {
            const daysOverdue = Math.floor(
                (new Date().getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            actions.push({
                id: `inv-${inv.id}`,
                type: 'payment',
                message: `${inv.project?.contract?.client?.name || 'Bilinmeyen'} faturası ödenmedi - ₺${inv.amount?.toLocaleString('tr-TR')} (${daysOverdue} gün gecikmiş)`,
                actionLabel: 'Faturayı Gör',
                severity: 'error',
                link: `/dashboard/invoices/${inv.id}`,
            });
        }

        // Onay bekleyen teslimatlar
        for (const del of pendingDeliverables.data || []) {
            actions.push({
                id: `del-${del.id}`,
                type: 'approval',
                message: `${del.project?.name || 'Bilinmeyen proje'} - ${del.name} müşteri onayı bekliyor`,
                actionLabel: 'İncele',
                severity: 'info',
                link: `/dashboard/deliverables/${del.id}`,
            });
        }

        return actions;
    } catch (error) {
        console.error('Pending actions error:', error);
        return [];
    }
}
