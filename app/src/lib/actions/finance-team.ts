'use server';
/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function updateUserCost(userId: string, hourlyCost: number, currency: 'TRY' | 'USD' | 'EUR' | 'GBP' = 'TRY') {
    try {
        // Upsert the cost. Since userId is unique in the table (effectively, though schema allows multiple for history, for now we simplified to one active cost or need to handle history)
        // Looking at schema: UserHourlyCost doesn't have unique constraint on userId, so it's designed for history.
        // However, for simplicity V1, we will update the latest or insert new.
        // Let's check schema again:
        /*
        CREATE TABLE "UserHourlyCost" (
            "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
            "userId" TEXT NOT NULL,
            "hourlyCost" DECIMAL(10, 2) NOT NULL,
            "currency" "CurrencyCode" DEFAULT 'TRY',
            "effectiveFrom" DATE DEFAULT CURRENT_DATE,
            ...
        */

        // For V1, we'll try to update the record for today or create new. 
        // Actually, to keep it simple and effective, let's just insert a new record if the cost changes, 
        // or update the latest one if it was created today.

        // But for the UI "current cost", we usually valid "effectiveFrom" <= now.
        // Let's just UPSERT based on ID if we had one, but we don't pass ID from UI easily unless we fetch it.

        // Strategy: 
        // 1. Check if there is a cost record for this user with effectiveDate = today.
        // 2. If yes, update it.
        // 3. If no, insert new one.
        // OR better: Just insert a new record with now() as effective date whenever it changes. 
        // But that floods DB if user types.
        // UI should send update on Blur/Save.

        // Let's go with: Find latest cost record. If it exists and effectiveFrom is today, update it. Else insert.

        const { data: latestCost } = await supabaseAdmin
            .from('UserHourlyCost')
            .select('*')
            .eq('userId', userId)
            .order('effectiveFrom', { ascending: false })
            .limit(1)
            .single();

        const today = new Date().toISOString().split('T')[0];

        if (latestCost && latestCost.effectiveFrom === today) {
            const { error } = await supabaseAdmin
                .from('UserHourlyCost')
                .update({
                    hourlyCost,
                    currency,
                    effectiveFrom: today
                })
                .eq('id', latestCost.id);
            if (error) throw error;
        } else {
            const { error } = await supabaseAdmin
                .from('UserHourlyCost')
                .insert({
                    userId,
                    hourlyCost,
                    currency,
                    effectiveFrom: today
                });
            if (error) throw error;
        }

        revalidatePath('/dashboard/finance/team');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating user cost:', error);
        return { success: false, error: error.message };
    }
}

export async function getTeamWithCosts() {
    // Fetch users
    const { data: users, error: userError } = await supabaseAdmin
        .from('User')
        .select('id, name, email, role')
        .order('name');

    if (userError) {
        console.error('Error fetching users:', userError);
        return [];
    }

    // Fetch latest costs for all users
    // We can't easily do a "latest per group" in simple Supabase query without RPC or complex join.
    // So we'll fetch all costs and filter in JS (assuming not varying too much).

    const { data: costs, error: costError } = await supabaseAdmin
        .from('UserHourlyCost')
        .select('*')
        .order('effectiveFrom', { ascending: false });

    if (costError) {
        console.error('Error fetching costs:', costError);
        // Return users with 0 cost
        return users.map(u => ({ ...u, hourlyCost: 0, currency: 'TRY' as 'TRY' | 'USD' | 'EUR' | 'GBP', lastUpdated: null }));
    }

    // Map stats
    const teamWithCosts = users.map(user => {
        // Find latest cost for this user
        // Costs are ordered by date desc, so find first match
        const costRecord = costs.find((c: any) => c.userId === user.id);

        return {
            ...user,
            hourlyCost: costRecord ? Number(costRecord.hourlyCost) : 0,
            currency: (costRecord ? costRecord.currency : 'TRY') as 'TRY' | 'USD' | 'EUR' | 'GBP',
            lastUpdated: costRecord ? costRecord.effectiveFrom : null
        };
    });

    return teamWithCosts;
}
