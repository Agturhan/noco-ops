'use server';
/* eslint-disable @typescript-eslint/no-explicit-any */
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
    taskBreakdown: {
        taskId: string;
        taskTitle: string;
        contentType: string;
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
                id,
                title,
                contentType,
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
        breakdown: Map<string, { userId: string; userName: string; role: string; hours: number; cost: number; }>;
        taskBreakdown: Map<string, { taskId: string; taskTitle: string; contentType: string; hours: number; cost: number; }>;
    }>();

    logs.forEach((log: any) => {
        const clientId = log.Task?.clientId;
        if (!clientId) return; // Skip logs not assigned to a client-task

        const durationHours = (log.durationMinutes || 0) / 60;

        // Find applicable cost
        const logDate = new Date(log.startedAt);
        const applicableCost = userCosts.find((c: any) => {
            const effectiveDate = new Date(c.effectiveFrom);
            return effectiveDate <= logDate && c.userId === log.userId;
        });

        const hourlyRate = applicableCost ? Number(applicableCost.hourlyCost) : 0;
        const cost = durationHours * hourlyRate;

        // Get Client Accumulator
        if (!clientStatsMap.has(clientId)) {
            clientStatsMap.set(clientId, { cost: 0, hours: 0, breakdown: new Map(), taskBreakdown: new Map() });
        }
        const currentClient = clientStatsMap.get(clientId)!;

        // Update Client Totals
        currentClient.cost += cost;
        currentClient.hours += durationHours;

        // Update User Breakdown
        const userId = log.userId;
        if (userId) {
            if (!currentClient.breakdown.has(userId)) {
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

        // Update Task Breakdown
        const taskId = log.Task?.id;
        if (taskId) {
            if (!currentClient.taskBreakdown.has(taskId)) {
                currentClient.taskBreakdown.set(taskId, {
                    taskId,
                    taskTitle: log.Task.title || 'İsimsiz Görev',
                    contentType: log.Task.contentType || 'Diğer',
                    hours: 0,
                    cost: 0
                });
            }
            const taskStat = currentClient.taskBreakdown.get(taskId)!;
            taskStat.hours += durationHours;
            taskStat.cost += cost;
        }
    });

    // 6. Assemble Final Stats
    const stats: ProfitabilityStat[] = clients.map((client: any) => {
        const usage = clientStatsMap.get(client.id) || { cost: 0, hours: 0, breakdown: new Map(), taskBreakdown: new Map() };
        const revenue = Number(client.monthlyFee) || 0;
        const cost = usage.cost;
        const profit = revenue - cost;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        // Convert Breakdown Maps to Arrays
        const breakdownArray = Array.from(usage.breakdown.values()).sort((a, b) => b.cost - a.cost);
        const taskBreakdownArray = Array.from(usage.taskBreakdown.values()).sort((a, b) => b.cost - a.cost);

        return {
            clientId: client.id,
            clientName: client.name,
            revenue,
            cost,
            profit,
            margin,
            totalHours: usage.hours,
            hourlyRevenue: usage.hours > 0 ? revenue / usage.hours : 0,
            breakdown: breakdownArray,
            taskBreakdown: taskBreakdownArray
        };
    });

    // Sort by profit (descending)
    return stats.sort((a, b) => b.profit - a.profit);
}
