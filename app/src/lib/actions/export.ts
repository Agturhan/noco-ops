'use server';
/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

// CSV Export utility
export async function exportToCSV(
    data: Record<string, any>[],
    filename: string,
    headers?: { key: string; label: string }[]
) {
    if (!data.length) {
        throw new Error('Veri bulunamadı');
    }

    // Header'ları belirle
    const keys = headers?.map(h => h.key) || Object.keys(data[0]);
    const labels = headers?.map(h => h.label) || keys;

    // CSV content oluştur
    const csvRows: string[] = [];

    // Header row
    csvRows.push(labels.join(','));

    // Data rows
    for (const row of data) {
        const values = keys.map(key => {
            const value = row[key]?.toString() || '';
            // Escape quotes and wrap in quotes if contains comma
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');

    return {
        content: csvContent,
        filename: `${filename}-${new Date().toISOString().split('T')[0]}.csv`,
        mimeType: 'text/csv;charset=utf-8;',
    };
}

// JSON Export utility
export async function exportToJSON(data: any, filename: string) {
    const jsonContent = JSON.stringify(data, null, 2);

    return {
        content: jsonContent,
        filename: `${filename}-${new Date().toISOString().split('T')[0]}.json`,
        mimeType: 'application/json',
    };
}

// Excel-compatible CSV (with BOM for Turkish characters)
export async function exportToExcel(
    data: Record<string, any>[],
    filename: string,
    headers?: { key: string; label: string }[]
) {
    const { content, filename: fname, mimeType } = await exportToCSV(data, filename, headers);

    // Add BOM for Excel to recognize UTF-8
    const bom = '\uFEFF';

    return {
        content: bom + content,
        filename: fname.replace('.csv', '.csv'), // Excel will open .csv with BOM correctly
        mimeType,
    };
}

// Download helper (client-side use)
export function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===== DATA FETCHING FOR EXPORT =====

import prisma from '@/lib/prisma';

// Export Projects
export async function getProjectsForExport() {
    const projects = await prisma.project.findMany({
        include: {
            contract: {
                include: {
                    client: true,
                },
            },
            deliverables: true,
            invoices: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    return projects.map((p: any) => ({
        id: p.id,
        name: p.name,
        client: p.contract.client.name,
        status: p.status,
        startDate: p.startDate?.toISOString().split('T')[0] || '',
        endDate: p.endDate?.toISOString().split('T')[0] || '',
        deliverableCount: p.deliverables.length,
        invoiceCount: p.invoices.length,
        createdAt: p.createdAt.toISOString().split('T')[0],
    }));
}

// Export Invoices
export async function getInvoicesForExport() {
    const invoices = await prisma.invoice.findMany({
        include: {
            project: {
                include: {
                    contract: {
                        include: {
                            client: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return invoices.map((i: any) => ({
        invoiceNumber: i.invoiceNumber || i.id,
        client: i.project.contract.client.name,
        project: i.project.name,
        amount: Number(i.amount),
        status: i.status,
        dueDate: i.dueDate?.toISOString().split('T')[0] || '',
        paidAt: i.paidAt?.toISOString().split('T')[0] || '',
        createdAt: i.createdAt.toISOString().split('T')[0],
    }));
}

// Export Tasks
export async function getTasksForExport() {
    const tasks = await prisma.task.findMany({
        orderBy: { createdAt: 'desc' },
    });

    return tasks.map((t: any) => ({
        title: t.title,
        description: t.description || '',
        status: t.status,
        priority: t.priority,
        assigneeId: t.assigneeId || '',
        projectId: t.projectId || '',
        dueDate: t.dueDate?.toISOString().split('T')[0] || '',
        createdAt: t.createdAt.toISOString().split('T')[0],
    }));
}

// Export Audit Logs
export async function getAuditLogsForExport(limit: number = 1000) {
    const logs = await prisma.auditLog.findMany({
        include: {
            user: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });

    return logs.map(l => ({
        timestamp: l.createdAt.toISOString(),
        user: l.user?.name || 'Sistem',
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        isOverride: l.isOverride ? 'Evet' : 'Hayır',
    }));
}
