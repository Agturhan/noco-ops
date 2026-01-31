'use server';

import { supabaseAdmin } from '@/lib/supabase';

export interface ProfitabilityStat {
    clientId: string;
    clientName: string;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
    totalHours: number;
    hourlyRevenue: number;
    breakdown: {
        userId: string;
        userName: string;
        role: string;
        hours: number;
        cost: number;
    }[];
}

export async function getProfitabilityStats(month: number, year: number) {
    // 1. Define date range for the selected month
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

    // 2. Fetch Clients with financial info
    const { data: clients, error: clientError } = await supabaseAdmin
        .from('Client')
        .select('id, name, monthlyFee')
        .eq('isActive', true);

    if (clientError) {
        console.error('Error fetching clients:', clientError);
        return [];
    }

    // 3. Fetch Time Logs for the period
    const { data: logs, error: logError } = await supabaseAdmin
        .from('TaskTimeLog')
        .select(`
            durationMinutes,
            startedAt,
            userId,
            user:userId (
                name,
                role
            ),
            Task:taskId (
                clientId
            )
        `)
        .gte('startedAt', startDate)
        .lte('startedAt', endDate);

    if (logError) {
        console.error('Error fetching time logs:', logError);
        return [];
    }

    // 4. Fetch User Hourly Costs
    // We need history to be accurate, but for V1 we might use latest or filter in JS.
    const { data: userCosts, error: costError } = await supabaseAdmin
        .from('UserHourlyCost')
        .select('*')
        .order('effectiveFrom', { ascending: false });

    if (costError) {
        console.error('Error fetching user costs:', costError);
        return [];
    }

    // 5. Calculate Costs per Client
    const clientStatsMap = new Map<string, {
        cost: number;
        hours: number;
        breakdown: Map<string, { userId: string; userName: string; role: string; hours: number; cost: number; }>
    }>();

    logs.forEach((log: any) => {
        const clientId = log.Task?.clientId;
        if (!clientId) return; // Skip logs not assigned to a client-task

        const durationHours = (log.durationMinutes || 0) / 60;

        // Find applicable cost: First cost record where effectiveFrom <= log.startedAt
        // Costs are sorted desc by date.
        const logDate = new Date(log.startedAt);
        const applicableCost = userCosts.find((c: any) => {
            const effectiveDate = new Date(c.effectiveFrom);
            return effectiveDate <= logDate && c.userId === log.userId;
        });

        // Use cost or 0 if not found
        const hourlyRate = applicableCost ? Number(applicableCost.hourlyCost) : 0;
        const cost = durationHours * hourlyRate;

        // Get Client Accumulator
        if (!clientStatsMap.has(clientId)) {
            clientStatsMap.set(clientId, { cost: 0, hours: 0, breakdown: new Map() });
        }
        const currentClient = clientStatsMap.get(clientId)!;

        // Update Client Totals
        currentClient.cost += cost;
        currentClient.hours += durationHours;

        // Update User Breakdown
        const userId = log.userId;
        if (userId) {
            if (!currentClient.breakdown.has(userId)) {
                // We need extra user info here. Ideally Supabase join would fetch it.
                // Assuming log.user is populated or we fetch from a user map.
                // For this implementation, let's try to get it from log.user if available, 
                // or fallback to a lookup if we fetched users separately. 
                // Since I can't easily change the query above in this single replacement chunk reliably without context on imports,
                // I will assume `log.user` (relation) is available if I update the query. 
                // Wait, I should update the query in a separate step or assume I'll do it.
                // Actually, let's use the `user:userId` alias if possible.
                // For now, I'll fallback to "Unknown User" and fixing the query in next step.
                currentClient.breakdown.set(userId, {
                    userId,
                    userName: log.user?.name || 'Bilinmeyen Personel',
                    role: log.user?.role || '-',
                    hours: 0,
                    cost: 0
                });
            }
            const userStat = currentClient.breakdown.get(userId)!;
            userStat.hours += durationHours;
            userStat.cost += cost;
        }
    });

    // 6. Assemble Final Stats
    const stats: ProfitabilityStat[] = clients.map((client: any) => {
        const usage = clientStatsMap.get(client.id) || { cost: 0, hours: 0, breakdown: new Map() };
        const revenue = Number(client.monthlyFee) || 0;
        const cost = usage.cost;
        const profit = revenue - cost;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        // Convert Breakdown Map to Array
        const breakdownArray = Array.from(usage.breakdown.values()).sort((a, b) => b.cost - a.cost);

        return {
            clientId: client.id,
            clientName: client.name,
            revenue,
            cost,
            profit,
            margin,
            totalHours: usage.hours,
            hourlyRevenue: usage.hours > 0 ? revenue / usage.hours : 0,
            breakdown: breakdownArray
        };
    });

    // Sort by profit (descending)
    return stats.sort((a, b) => b.profit - a.profit);
}
