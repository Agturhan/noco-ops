'use server';

import { supabaseAdmin } from '@/lib/supabase';

// ===== REVENUE DISTRIBUTION & PARTNER SCORING =====
// Proje bazlı gelir dağılımı ve ortaklar arası puanlama sistemi

interface Partner {
    id: string;
    name: string;
    role: string;
    baseShare: number; // Varsayılan pay yüzdesi
}

interface ProjectRevenue {
    projectId: string;
    projectName: string;
    totalRevenue: number;
    distributions: {
        partnerId: string;
        partnerName: string;
        percentage: number;
        amount: number;
        points?: number;
    }[];
    vaultAmount: number; // Şirket kasasına ayrılan
}

// Noco ortakları
const PARTNERS: Partner[] = [
    { id: 'gurkan', name: 'Ahmet Gürkan', role: 'Creative Director', baseShare: 35 },
    { id: 'fatih', name: 'Fatih Ustaosmanoğlu', role: 'Video Director', baseShare: 30 },
    { id: 'aysegul', name: 'Ayşegül Güler', role: 'Operations Director', baseShare: 20 },
];

const VAULT_PERCENTAGE = 15; // Şirket kasasına %15

// ===== GET PARTNERS =====

export async function getPartners(): Promise<Partner[]> {
    return PARTNERS;
}

// ===== CALCULATE PROJECT DISTRIBUTION =====

export async function calculateProjectDistribution(projectId: string, customShares?: Record<string, number>): Promise<ProjectRevenue | null> {
    // Get project with invoices
    const { data: project } = await supabaseAdmin
        .from('Project')
        .select(`
            id,
            name,
            invoices:Invoice (
                amount,
                status
            )
        `)
        .eq('id', projectId)
        .single();

    if (!project) return null;

    // Calculate total paid revenue
    const paidInvoices = ((project as any).invoices || []).filter((i: any) => i.status === 'PAID');
    const totalRevenue = paidInvoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);

    // Calculate vault amount
    const vaultAmount = Math.round(totalRevenue * (VAULT_PERCENTAGE / 100));
    const distributableAmount = totalRevenue - vaultAmount;

    // Calculate distributions
    const distributions = PARTNERS.map(partner => {
        const percentage = customShares?.[partner.id] ?? partner.baseShare;
        const actualPercentage = (percentage / (100 - VAULT_PERCENTAGE)) * 100; // Adjust for vault
        const amount = Math.round(distributableAmount * (percentage / 100) * (100 / (100 - VAULT_PERCENTAGE)));

        return {
            partnerId: partner.id,
            partnerName: partner.name,
            percentage,
            amount,
        };
    });

    return {
        projectId: project.id,
        projectName: project.name,
        totalRevenue,
        distributions,
        vaultAmount,
    };
}

// ===== GET MONTHLY DISTRIBUTION SUMMARY =====

export async function getMonthlyDistributionSummary(month?: string): Promise<{
    month: string;
    totalRevenue: number;
    vaultTotal: number;
    partnerDistributions: { partnerId: string; partnerName: string; totalAmount: number }[];
    projects: ProjectRevenue[];
}> {
    const targetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM

    // Get all paid invoices for the month
    const { data: invoices } = await supabaseAdmin
        .from('Invoice')
        .select(`
            amount,
            paidAt,
            project:Project (
                id,
                name
            )
        `)
        .eq('status', 'PAID')
        .gte('paidAt', `${targetMonth}-01`)
        .lte('paidAt', `${targetMonth}-31`);

    if (!invoices || invoices.length === 0) {
        return {
            month: targetMonth,
            totalRevenue: 0,
            vaultTotal: 0,
            partnerDistributions: PARTNERS.map(p => ({ partnerId: p.id, partnerName: p.name, totalAmount: 0 })),
            projects: [],
        };
    }

    const totalRevenue = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
    const vaultTotal = Math.round(totalRevenue * (VAULT_PERCENTAGE / 100));
    const distributableAmount = totalRevenue - vaultTotal;

    const partnerDistributions = PARTNERS.map(partner => ({
        partnerId: partner.id,
        partnerName: partner.name,
        totalAmount: Math.round(distributableAmount * (partner.baseShare / 100) * (100 / (100 - VAULT_PERCENTAGE))),
    }));

    // Group by project
    const projectMap = new Map<string, { id: string; name: string; revenue: number }>();
    invoices.forEach(inv => {
        const projectId = (inv as any).project?.id;
        const projectName = (inv as any).project?.name || 'Bilinmeyen';
        if (projectId) {
            const existing = projectMap.get(projectId);
            if (existing) {
                existing.revenue += inv.amount || 0;
            } else {
                projectMap.set(projectId, { id: projectId, name: projectName, revenue: inv.amount || 0 });
            }
        }
    });

    const projects: ProjectRevenue[] = Array.from(projectMap.values()).map(p => ({
        projectId: p.id,
        projectName: p.name,
        totalRevenue: p.revenue,
        distributions: PARTNERS.map(partner => ({
            partnerId: partner.id,
            partnerName: partner.name,
            percentage: partner.baseShare,
            amount: Math.round((p.revenue - p.revenue * VAULT_PERCENTAGE / 100) * partner.baseShare / 100),
        })),
        vaultAmount: Math.round(p.revenue * VAULT_PERCENTAGE / 100),
    }));

    return {
        month: targetMonth,
        totalRevenue,
        vaultTotal,
        partnerDistributions,
        projects,
    };
}

// ===== PARTNER SCORING SYSTEM =====

interface PartnerScore {
    partnerId: string;
    partnerName: string;
    projectsCompleted: number;
    tasksCompleted: number;
    clientSatisfaction: number; // 1-5
    onTimeDelivery: number; // Percentage
    totalPoints: number;
    rank: number;
}

export async function getPartnerScores(month?: string): Promise<PartnerScore[]> {
    // This would calculate scores based on completed projects, tasks, etc.
    // For now, return mock data based on partner performance
    const scores: PartnerScore[] = [
        {
            partnerId: 'gurkan',
            partnerName: 'Ahmet Gürkan',
            projectsCompleted: 8,
            tasksCompleted: 45,
            clientSatisfaction: 4.8,
            onTimeDelivery: 92,
            totalPoints: 186,
            rank: 1,
        },
        {
            partnerId: 'fatih',
            partnerName: 'Fatih Ustaosmanoğlu',
            projectsCompleted: 6,
            tasksCompleted: 38,
            clientSatisfaction: 4.6,
            onTimeDelivery: 88,
            totalPoints: 158,
            rank: 2,
        },
        {
            partnerId: 'aysegul',
            partnerName: 'Ayşegül Güler',
            projectsCompleted: 5,
            tasksCompleted: 52,
            clientSatisfaction: 4.9,
            onTimeDelivery: 95,
            totalPoints: 172,
            rank: 1, // Tied with Gürkan based on satisfaction
        },
    ];

    // Sort by total points
    return scores.sort((a, b) => b.totalPoints - a.totalPoints).map((s, i) => ({ ...s, rank: i + 1 }));
}

// ===== VAULT BALANCE =====

export async function getVaultBalance(): Promise<{
    currentBalance: number;
    monthlyContributions: { month: string; amount: number }[];
    totalContributed: number;
}> {
    // Calculate from all paid invoices
    const { data: invoices } = await supabaseAdmin
        .from('Invoice')
        .select('amount, paidAt')
        .eq('status', 'PAID');

    if (!invoices) {
        return { currentBalance: 0, monthlyContributions: [], totalContributed: 0 };
    }

    const monthlyMap = new Map<string, number>();
    let totalContributed = 0;

    invoices.forEach(inv => {
        const vaultAmount = Math.round((inv.amount || 0) * VAULT_PERCENTAGE / 100);
        totalContributed += vaultAmount;

        if (inv.paidAt) {
            const month = inv.paidAt.substring(0, 7);
            monthlyMap.set(month, (monthlyMap.get(month) || 0) + vaultAmount);
        }
    });

    const monthlyContributions = Array.from(monthlyMap.entries())
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => b.month.localeCompare(a.month))
        .slice(0, 12); // Last 12 months

    return {
        currentBalance: totalContributed,
        monthlyContributions,
        totalContributed,
    };
}
