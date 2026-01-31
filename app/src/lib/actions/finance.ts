
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { FinanceAccount as _PrismaFinanceAccount, FinanceTransaction as _PrismaFinanceTransaction, FinanceCategory as _PrismaFinanceCategory } from '@prisma/client';

// ===== TYPES =====
// Re-exporting or mapping Prisma types if needed, or keeping interface for frontend compatibility
export interface FinanceAccount {
    id: string;
    name: string;
    type: string;
    currency: string;
    balance: number;
}

export interface FinanceTransaction {
    id: string;
    accountId: string;
    categoryId?: string;
    amount: number;
    date: string;
    description?: string;
    status: string;
    category?: { name: string; color: string | null; type: string };
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
        const accounts = await prisma.financeAccount.findMany({
            orderBy: { name: 'asc' }
        });

        // Calculate Total Balance
        const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

        // 2. Get Income/Expense for this Month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        // Fetch Transactions for Month
        const transactions = await prisma.financeTransaction.findMany({
            where: {
                date: {
                    gte: startOfMonth,
                    lt: nextMonth
                },
                status: 'COMPLETED'
            },
            include: {
                category: {
                    select: { type: true }
                }
            }
        });

        let monthlyIncome = 0;
        let monthlyExpense = 0;

        transactions.forEach(tx => {
            const amount = Number(tx.amount);
            if (amount > 0) monthlyIncome += amount;
            else monthlyExpense += Math.abs(amount);
        });

        // 3. Pending Income
        const pendingTx = await prisma.financeTransaction.findMany({
            where: {
                amount: { gt: 0 },
                status: 'PENDING'
            },
            select: { amount: true }
        });

        const pendingIncome = pendingTx.reduce((sum, tx) => sum + Number(tx.amount), 0);

        // 4. Add Client Retainers to Monthly Income
        // 4. Add Client Retainers to Monthly Income
        const clients = await prisma.client.findMany({
            where: {
                isActive: true,
                monthlyFee: { not: 0 }
            },
            select: { monthlyFee: true }
        });

        const clientRetainerIncome = clients.reduce((sum, client) => sum + (Number(client.monthlyFee) || 0), 0);

        monthlyIncome += clientRetainerIncome;

        return {
            totalBalance,
            monthlyIncome,
            monthlyExpense,
            pendingIncome,
            accounts: accounts.map(a => ({ ...a, balance: Number(a.balance) }))
        };

    } catch (error) {
        console.error('❌ getFinancialSummary CRITICAL ERROR:', error);
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
    try {
        const data = await prisma.financeTransaction.findMany({
            orderBy: { date: 'desc' },
            take: limit,
            include: {
                category: {
                    select: { name: true, color: true, type: true }
                },
                account: {
                    select: { name: true }
                }
            }
        });

        // Map Decimal/Date to plain objects
        return data.map(tx => ({
            ...tx,
            amount: Number(tx.amount),
            date: tx.date.toISOString(), // Keep generic string format for frontend
            categoryId: tx.categoryId || undefined,
            description: tx.description || undefined,
            category: tx.category ? { ...tx.category, color: tx.category.color || '' } : undefined, // Handle null color
            account: tx.account
        }));
    } catch (error) {
        console.error('getTransactions error:', error);
        return [];
    }
}

// ===== GET ACCOUNTS & CATEGORIES =====
export async function getFinanceAccounts() {
    try {
        const data = await prisma.financeAccount.findMany({
            orderBy: { name: 'asc' }
        });
        return data.map(d => ({ ...d, balance: Number(d.balance) }));
    } catch (error) {
        console.error('getFinanceAccounts error:', error);
        return [];
    }
}

export async function getFinanceCategories() {
    try {
        const data = await prisma.financeCategory.findMany({
            orderBy: [
                { type: 'asc' },
                { name: 'asc' }
            ]
        });
        return data;
    } catch (error) {
        console.error('getFinanceCategories error:', error);
        return [];
    }
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

        // 2. Adjust amount sign
        const finalAmount = Math.abs(formData.amount);
        const paramAmount = formData.type === 'EXPENSE' ? -finalAmount : finalAmount;

        // 3. Transaction & Account Update (Transaction)
        const result = await prisma.$transaction(async (tx) => {
            // Create Transaction
            const newTx = await tx.financeTransaction.create({
                data: {
                    accountId: formData.accountId,
                    categoryId: formData.categoryId || null,
                    amount: paramAmount,
                    date: new Date(formData.date),
                    description: formData.description,
                    status: 'COMPLETED'
                }
            });

            // Update Account Balance
            const account = await tx.financeAccount.findUnique({
                where: { id: formData.accountId }
            });

            if (account) {
                const currentBalance = Number(account.balance);
                await tx.financeAccount.update({
                    where: { id: formData.accountId },
                    data: {
                        balance: currentBalance + paramAmount
                    }
                });
            }

            return newTx;
        });

        revalidatePath('/dashboard/finance');
        return { success: true, data: result };

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
        sixMonthsAgo.setDate(1);

        const transactions = await prisma.financeTransaction.findMany({
            where: {
                date: { gte: sixMonthsAgo },
                status: 'COMPLETED'
            },
            include: {
                category: {
                    select: { name: true, type: true, color: true }
                }
            },
            orderBy: { date: 'asc' }
        });

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

        transactions.forEach(tx => {
            const date = new Date(tx.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const amount = Number(tx.amount);

            // Monthly Flow
            if (monthlyData.has(monthKey)) {
                const entry = monthlyData.get(monthKey)!;
                if (amount > 0) entry.income += amount;
                else entry.expense += Math.abs(amount);
            }

            // Breakdown
            if (monthKey === currentMonthKey && amount < 0 && tx.category) {
                const catName = tx.category.name;
                const current = expenseBreakdown.get(catName) || { name: catName, value: 0, color: tx.category.color || '#ccc' };
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
