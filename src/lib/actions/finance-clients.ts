'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function updateClientFinancials(clientId: string, data: { monthlyFee: number; contractType: string; instagramHandle?: string }) {
    const supabase = supabaseAdmin;

    const { error } = await supabase
        .from('Client')
        .update({
            monthlyFee: data.monthlyFee,
            contractType: data.contractType,
            instagramHandle: data.instagramHandle,
            updatedAt: new Date().toISOString()
        })
        .eq('id', clientId);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/finance/clients');
    revalidatePath('/dashboard/finance/profitability');
    return { success: true };
}
