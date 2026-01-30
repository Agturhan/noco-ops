'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// ===== TYPES =====
export interface FinanceAccount {
    id: string;
    name: string;
    type: 'BANK' | 'CASH' | 'CREDIT_CARD';
    currency: 'TRY' | 'USD' | 'EUR' | 'GBP';
    balance: number;
}

export interface FinanceTransaction {
    id: string;
    accountId: string;
    categoryId?: string;
    amount: number;
    date: string;
    description?: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    category?: { name: string; color: string; type: string };
    account?: { name: string };
}

export interface FinanceSummary {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
    pendingIncome: number;
    accounts: FinanceAccount[];
}

// ===== GET SUMMARY =====
export async function getFinancialSummary(): Promise<FinanceSummary> {
    try {
        // 1. Get Accounts
        const { data: accounts, error: accError } = await supabaseAdmin
            .from('FinanceAccount')
            .select('*')
            .order('name');

        if (accError) throw accError;

        // Calculate Total Balance (in TRY approximation - simplified for now)
        // In a real app, we'd use exchange rates. For now assuming all is TRY or display raw.
        const totalBalance = accounts?.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0) || 0;

        // 2. Get Income/Expense for this Month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];

        // Fetch Transactions for Month
        const { data: transactions, error: txError } = await supabaseAdmin
            .from('FinanceTransaction')
            .select('amount, category:FinanceCategory!inner(type)')
            .gte('date', startOfMonth)
            .lt('date', nextMonth)
            .eq('status', 'COMPLETED');

        if (txError) throw txError;

        let monthlyIncome = 0;
        let monthlyExpense = 0;

        transactions?.forEach((tx: any) => {
            const amount = Number(tx.amount);
            // Assuming transaction amount sign handles direction or category type does.
            // Usually: Income is positive, Expense is negative in amount? 
            // Or amount is absolute and Category Type decides? 
            // Implementation Plan said: "Positive for Income, Negative for Expense".
            if (amount > 0) monthlyIncome += amount;
            else monthlyExpense += Math.abs(amount);
        });

        // 3. Pending Income
        // Transactions with positive amount and PENDING status
        const { data: pendingTx } = await supabaseAdmin
            .from('FinanceTransaction')
            .select('amount')
            .gt('amount', 0)
            .eq('status', 'PENDING');

        const pendingIncome = pendingTx?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

        // 4. Add Client Retainers to Monthly Income
        // Fetch active clients with monthly fees
        const { data: clients, error: clientError } = await supabaseAdmin
            .from('Client')
            .select('monthlyFee')
            .eq('isActive', true)
            .neq('monthlyFee', 0); // Optimization: skip 0 fees

        const clientRetainerIncome = clients?.reduce((sum, client) => sum + (Number(client.monthlyFee) || 0), 0) || 0;

        // Add retainers to total calculated income
        monthlyIncome += clientRetainerIncome;

        return {
            totalBalance,
            monthlyIncome,
            monthlyExpense,
            pendingIncome,
            accounts: (accounts || []).map(a => ({ ...a, balance: Number(a.balance) }))
        };

    } catch (error) {
        console.error('getFinancialSummary error:', error);
        return {
            totalBalance: 0,
            monthlyIncome: 0,
            monthlyExpense: 0,
            pendingIncome: 0,
            accounts: []
        };
    }
}

// ===== GET TRANSACTIONS =====
export async function getTransactions(limit = 10) {
    const { data, error } = await supabaseAdmin
        .from('FinanceTransaction')
        .select(`
            *,
            category:FinanceCategory(name, color, type),
            account:FinanceAccount(name)
        `)
        .order('date', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('getTransactions error:', error);
        return [];
    }

    return data || [];
}

// ===== GET ACCOUNTS & CATEGORIES =====
export async function getFinanceAccounts() {
    const { data, error } = await supabaseAdmin
        .from('FinanceAccount')
        .select('*')
        .order('name');

    if (error) {
        console.error('getFinanceAccounts error:', error);
        return [];
    }
    return data || [];
}

export async function getFinanceCategories() {
    const { data, error } = await supabaseAdmin
        .from('FinanceCategory')
        .select('*')
        .order('type')
        .order('name');

    if (error) {
        console.error('getFinanceCategories error:', error);
        return [];
    }
    return data || [];
}

// ===== ADD TRANSACTION =====
export async function addTransaction(formData: {
    accountId: string;
    categoryId: string;
    amount: number;
    description: string;
    date: string;
    type: 'INCOME' | 'EXPENSE';
}) {
    try {
        // 1. Validate inputs
        if (!formData.accountId || !formData.amount || !formData.date) {
            throw new Error('Eksik bilgi: Hesap, Tutar ve Tarih zorunludur.');
        }

        // 2. Adjust amount sign based on Type
        // INCOME: +Amount, EXPENSE: -Amount
        let finalAmount = Math.abs(formData.amount);
        let paramAmount;
        if (formData.type === 'EXPENSE') paramAmount = -finalAmount;
        else paramAmount = finalAmount;

        // 3. Insert Transaction
        const { data: tx, error: txError } = await supabaseAdmin
            .from('FinanceTransaction')
            .insert([{
                accountId: formData.accountId,
                categoryId: formData.categoryId || null,
                amount: paramAmount,
                date: formData.date,
                description: formData.description,
                status: 'COMPLETED' // Auto-complete for now
            }])
            .select()
            .single();

        if (txError) throw txError;

        // 4. Update Account Balance (Atomic-like)
        // Note: In potential high-concurrency, use RPC. For this scale, fetch-add-update is okay or simple update.
        // Better: Use a Postgres Function/Trigger for balance updates to be safe.
        // For now, I will manually update the balance here for simplicity, assuming low concurrency.

        // Fetch current balance
        const { data: account } = await supabaseAdmin
            .from('FinanceAccount')
            .select('balance')
            .eq('id', formData.accountId)
            .single();

        if (account) {
            const newBalance = (Number(account.balance) || 0) + paramAmount;
            await supabaseAdmin
                .from('FinanceAccount')
                .update({ balance: newBalance, updatedAt: new Date().toISOString() })
                .eq('id', formData.accountId);
        }

        revalidatePath('/dashboard/finance');
        return { success: true, data: tx };

    } catch (error) {
        console.error('addTransaction error:', error);
        return { success: false, error: 'İşlem eklenirken hata oluştu.' };
    }
}

// ===== CHARTS DATA =====
export async function getFinanceChartData() {
    try {
        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 5);
        sixMonthsAgo.setDate(1); // Start of that month

        const { data: transactions } = await supabaseAdmin
            .from('FinanceTransaction')
            .select(`
                amount,
                date,
                category:FinanceCategory(name, type, color)
            `)
            .gte('date', sixMonthsAgo.toISOString().split('T')[0])
            .eq('status', 'COMPLETED')
            .order('date');

        // 1. Process Cash Flow (Monthly)
        const monthlyData = new Map<string, { name: string, income: number, expense: number }>();

        // Initialize last 6 months
        for (let i = 0; i < 6; i++) {
            const d = new Date(sixMonthsAgo);
            d.setMonth(d.getMonth() + i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('tr-TR', { month: 'short' });
            monthlyData.set(key, { name: label, income: 0, expense: 0 });
        }

        // 2. Process Breakdown (This Month)
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const expenseBreakdown = new Map<string, { name: string, value: number, color: string }>();

        transactions?.forEach((tx: any) => {
            const date = new Date(tx.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const amount = Number(tx.amount);

            // Monthly Flow
            if (monthlyData.has(monthKey)) {
                const entry = monthlyData.get(monthKey)!;
                if (amount > 0) entry.income += amount;
                else entry.expense += Math.abs(amount);
            }

            // Breakdown (This Month & Expense)
            if (monthKey === currentMonthKey && amount < 0 && tx.category) {
                const catName = tx.category.name;
                const current = expenseBreakdown.get(catName) || { name: catName, value: 0, color: tx.category.color };
                current.value += Math.abs(amount);
                expenseBreakdown.set(catName, current);
            }
        });

        return {
            cashFlow: Array.from(monthlyData.values()),
            expenseBreakdown: Array.from(expenseBreakdown.values()).sort((a, b) => b.value - a.value)
        };

    } catch (error) {
        console.error('getFinanceChartData error:', error);
        return { cashFlow: [], expenseBreakdown: [] };
    }
}
