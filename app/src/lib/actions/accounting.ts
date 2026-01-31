'use server';
/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import prisma from '@/lib/prisma';

// ===== MUHASEBE VERİLERİ =====

// Aylık gelir/gider özeti
export async function getMonthlyFinancials(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    try {
        // Gelirler (ödenen faturalar)
        const incomes = await prisma.invoice.findMany({
            where: {
                status: 'PAID',
                paidAt: { gte: startDate, lte: endDate }
            },
            select: { amount: true, paidAt: true }
        });

        // Giderler
        const expenses = await prisma.expense.findMany({
            where: {
                date: { gte: startDate, lte: endDate }
            },
            select: { amount: true, category: true, date: true }
        });

        const totalIncome = incomes.reduce((sum: number, i: any) => sum + Number(i.amount), 0);
        const totalExpense = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);

        return {
            totalIncome,
            totalExpense,
            netProfit: totalIncome - totalExpense,
            incomeCount: incomes.length,
            expenseCount: expenses.length,
        };
    } catch (error) {
        console.error('Aylık finansal veriler alınamadı:', error);
        return { totalIncome: 0, totalExpense: 0, netProfit: 0, incomeCount: 0, expenseCount: 0 };
    }
}

// Yıllık gelir/gider trendi (12 ay)
export async function getYearlyTrend(year: number) {
    const months: any[] = [];

    for (let month = 1; month <= 12; month++) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        try {
            const incomes = await prisma.invoice.aggregate({
                where: {
                    status: 'PAID',
                    paidAt: { gte: startDate, lte: endDate }
                },
                _sum: { amount: true }
            });

            const expenses = await prisma.expense.aggregate({
                where: {
                    date: { gte: startDate, lte: endDate }
                },
                _sum: { amount: true }
            });

            months.push({
                month: new Date(year, month - 1).toLocaleString('tr-TR', { month: 'short' }),
                monthNumber: month,
                gelir: Number(incomes._sum.amount || 0),
                gider: Number(expenses._sum.amount || 0),
            });
        } catch (error) {
            months.push({
                month: new Date(year, month - 1).toLocaleString('tr-TR', { month: 'short' }),
                monthNumber: month,
                gelir: 0,
                gider: 0,
            });
        }
    }

    return months;
}

// Gider kategorileri dağılımı
export async function getExpensesByCategory(year: number, month?: number) {
    const startDate = month
        ? new Date(year, month - 1, 1)
        : new Date(year, 0, 1);
    const endDate = month
        ? new Date(year, month, 0)
        : new Date(year, 11, 31);

    try {
        const expenses = await prisma.expense.groupBy({
            by: ['category'],
            where: {
                date: { gte: startDate, lte: endDate }
            },
            _sum: { amount: true },
            _count: true,
        });

        const categoryLabels: Record<string, { name: string; color: string }> = {
            OFFICE: { name: 'Ofis ve Altyapı', color: '#329FF5' },
            LEGAL: { name: 'Yasal ve Mali', color: '#FF4242' },
            SOFTWARE: { name: 'Yazılım', color: '#00F5B0' },
            OPERATIONAL: { name: 'Operasyonel', color: '#F6D73C' },
            MARKETING: { name: 'Pazarlama', color: '#9C27B0' },
            OTHER: { name: 'Diğer', color: '#6B7B80' },
        };

        return expenses.map(e => ({
            category: e.category,
            name: categoryLabels[e.category]?.name || e.category,
            color: categoryLabels[e.category]?.color || '#6B7B80',
            value: Number(e._sum.amount || 0),
            count: e._count,
        }));
    } catch (error) {
        console.error('Gider kategori dağılımı alınamadı:', error);
        return [];
    }
}

// Müşteri bazlı gelir dağılımı
export async function getRevenueByClient(year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    try {
        const invoices = await prisma.invoice.findMany({
            where: {
                status: 'PAID',
                paidAt: { gte: startDate, lte: endDate }
            },
            include: {
                project: {
                    include: {
                        contract: {
                            include: {
                                client: true
                            }
                        }
                    }
                }
            }
        });

        // Müşteri bazlı topla
        const clientRevenue: Record<string, { name: string; total: number }> = {};

        invoices.forEach((inv: any) => {
            const clientName = inv.project?.contract?.client?.name || 'Bilinmeyen';
            if (!clientRevenue[clientName]) {
                clientRevenue[clientName] = { name: clientName, total: 0 };
            }
            clientRevenue[clientName].total += Number(inv.amount);
        });

        return Object.values(clientRevenue)
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
    } catch (error) {
        console.error('Müşteri gelir dağılımı alınamadı:', error);
        return [];
    }
}

// Ödeme durumu özeti
export async function getPaymentStatusSummary() {
    try {
        const paid = await prisma.invoice.aggregate({
            where: { status: 'PAID' },
            _sum: { amount: true },
            _count: true,
        });

        const pending = await prisma.invoice.aggregate({
            where: { status: 'PENDING' },
            _sum: { amount: true },
            _count: true,
        });

        const overdue = await prisma.invoice.aggregate({
            where: { status: 'OVERDUE' },
            _sum: { amount: true },
            _count: true,
        });

        return {
            paid: { amount: Number(paid._sum.amount || 0), count: paid._count },
            pending: { amount: Number(pending._sum.amount || 0), count: pending._count },
            overdue: { amount: Number(overdue._sum.amount || 0), count: overdue._count },
        };
    } catch (error) {
        console.error('Ödeme durumu alınamadı:', error);
        return {
            paid: { amount: 0, count: 0 },
            pending: { amount: 0, count: 0 },
            overdue: { amount: 0, count: 0 },
        };
    }
}

// Nakit akış tahmini (sonraki 30 gün)
export async function getCashflowForecast() {
    const today = new Date();
    const next30Days = new Date(today);
    next30Days.setDate(next30Days.getDate() + 30);

    try {
        // Beklenen gelirler
        const expectedIncome = await prisma.invoice.findMany({
            where: {
                status: 'PENDING',
                dueDate: { gte: today, lte: next30Days }
            },
            select: { amount: true, dueDate: true }
        });

        // Planlanan giderler (Tüm giderler - basitleştirildi)
        const plannedExpenses = await prisma.expense.findMany({
            select: { amount: true, category: true }
        });

        return {
            expectedIncome: expectedIncome.reduce((sum, i) => sum + Number(i.amount), 0),
            expectedExpense: plannedExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
            invoicesDue: expectedIncome.length,
        };
    } catch (error) {
        console.error('Nakit akış tahmini alınamadı:', error);
        return { expectedIncome: 0, expectedExpense: 0, invoicesDue: 0 };
    }
}

// ===== LİSTELEME (DETAYLI) =====

export async function getIncomes(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    try {
        const incomes = await prisma.income.findMany({
            where: {
                date: { gte: startDate, lte: endDate }
            },
            orderBy: { date: 'desc' }
        });
        return incomes;
    } catch (error) {
        console.error('Gelir listesi alınamadı:', error);
        return [];
    }
}

export async function getExpenses(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    try {
        const expenses = await prisma.expense.findMany({
            where: {
                date: { gte: startDate, lte: endDate }
            },
            orderBy: { date: 'desc' }
        });
        return expenses;
    } catch (error) {
        console.error('Gider listesi alınamadı:', error);
        return [];
    }
}

// ===== GELİR EKLEME =====

export async function createIncome(data: {
    title: string;
    amount: number;
    category?: string;
    source?: string;
    projectId?: string;
    invoiceId?: string;
    notes?: string;
    date?: string;
}) {
    try {
        const income = await prisma.income.create({
            data: {
                title: data.title,
                amount: data.amount,
                source: data.source,
                projectId: data.projectId,
                invoiceId: data.invoiceId,
                notes: data.notes,
                date: data.date ? new Date(data.date) : new Date(),
            }
        });

        return income;
    } catch (error) {
        console.error('Gelir eklenirken hata:', error);
        throw new Error('Gelir kaydedilemedi');
    }
}
// ===== GİDER EKLEME =====

export async function createExpense(data: {
    title: string;
    amount: number;
    category?: any;
    projectId?: string;
    notes?: string;
    Date?: string;
}) {
    try {
        const expense = await prisma.expense.create({
            data: {
                title: data.title,
                amount: data.amount,
                category: data.category || 'OTHER',
                projectId: data.projectId,
                notes: data.notes,
                date: data.Date ? new Date(data.Date) : new Date(),
            }
        });

        return expense;
    } catch (error) {
        console.error('Gider eklenirken hata:', error);
        throw new Error('Gider kaydedilemedi');
    }
}

export async function deleteIncome(id: string) {
    try {
        await prisma.income.delete({ where: { id } });
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
}

export async function deleteExpense(id: string) {
    try {
        await prisma.expense.delete({ where: { id } });
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
}

export async function seedExpenses(expenses: any[]) {
    try {
        const count = await prisma.expense.createMany({
            data: expenses.map(e => ({
                title: e.title,
                amount: e.amount,
                category: e.category,
                date: new Date(),
                notes: 'Varsayılan gider'
            }))
        });
        return { success: true, count: count.count };
    } catch (error) {
        console.error('Seed hatası:', error);
        return { success: false, error };
    }
}
