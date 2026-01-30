import React from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { GlassCard } from '@/components/ui/GlassCard';
import { ClientFinancialsList } from './ClientFinancialsList';

export const dynamic = 'force-dynamic';

export default async function FinanceClientsPage() {
    const { data: clients, error } = await supabaseAdmin
        .from('Client')
        .select('*')
        .order('name');

    if (error) {
        return <div className="p-8 text-red-500">Hata: {error.message}</div>;
    }

    return (
        <div className="p-8 max-w-[1200px] mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--ink)] mb-2">Müşteri Finansalları</h1>
                    <p className="text-[var(--muted)] text-lg">
                        Markaların sözleşme türleri ve aylık anlaşma bedellerini (Retainer) buradan yönetin.
                    </p>
                </div>
            </div>

            <GlassCard className="p-0 overflow-hidden">
                <ClientFinancialsList clients={clients || []} />
            </GlassCard>
        </div>
    );
}
