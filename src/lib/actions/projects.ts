'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { logAction } from './audit';

// ===== Client Actions =====

export async function getClients() {
    const { data, error } = await supabaseAdmin
        .from('Client')
        .select(`
            *,
            contracts:Contract (
                id,
                name,
                projects:Project (
                    id,
                    status
                )
            )
        `)
        .order('createdAt', { ascending: false });

    if (error) {
        console.error('Error fetching clients:', error);
        throw new Error('Müşteriler yüklenirken hata oluştu');
    }

    return data || [];
}

export async function getClientById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('Client')
        .select(`
            *,
            contracts:Contract (
                id,
                name,
                maxRevisions,
                paymentTerms,
                rawAssetsIncluded,
                retainerHours,
                createdAt,
                projects:Project (
                    id,
                    name,
                    status,
                    createdAt
                )
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching client:', error);
        return null;
    }

    return data;
}

export async function createClient(data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    linkedin?: string;
    website?: string;
    notes?: string;
}) {
    const { data: client, error } = await supabaseAdmin
        .from('Client')
        .insert([{
            name: data.name,
            email: data.email,
            phone: data.phone || null,
            company: data.company || null,
            instagram: data.instagram || null,
            facebook: data.facebook || null,
            tiktok: data.tiktok || null,
            youtube: data.youtube || null,
            linkedin: data.linkedin || null,
            website: data.website || null,
            notes: data.notes || null,
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating client:', error);
        throw new Error('Müşteri oluşturulurken hata oluştu');
    }

    // Audit log
    // Audit log
    await logAction('CREATE', 'CLIENT', client.id, { name: data.name }, client.name);

    revalidatePath('/dashboard/clients');
    return client;
}

export async function updateClient(id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    linkedin?: string;
    website?: string;
    notes?: string;
}) {
    const { data: client, error } = await supabaseAdmin
        .from('Client')
        .update({
            name: data.name,
            email: data.email,
            phone: data.phone || null,
            company: data.company || null,
            instagram: data.instagram || null,
            facebook: data.facebook || null,
            tiktok: data.tiktok || null,
            youtube: data.youtube || null,
            linkedin: data.linkedin || null,
            website: data.website || null,
            notes: data.notes || null,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating client:', error);
        throw new Error('Müşteri güncellenirken hata oluştu');
    }

    await logAction('UPDATE', 'CLIENT', id, { updated: Object.keys(data) }, client.name);

    revalidatePath('/dashboard/clients');
    revalidatePath(`/dashboard/clients/${id}`);
    return client;
}

export async function deleteClient(id: string) {
    const { error } = await supabaseAdmin
        .from('Client')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting client:', error);
        throw new Error('Müşteri silinirken hata oluştu');
    }

    await logAction('DELETE', 'CLIENT', id, {}, 'Müşteri');

    revalidatePath('/dashboard/clients');
}

// ===== Contract Actions =====

export async function getContracts(clientId?: string) {
    let query = supabaseAdmin
        .from('Contract')
        .select(`
            *,
            client:Client (
                id,
                name,
                email
            ),
            projects:Project (
                id,
                name,
                status
            )
        `)
        .order('createdAt', { ascending: false });

    if (clientId) {
        query = query.eq('clientId', clientId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching contracts:', error);
        throw new Error('Sözleşmeler yüklenirken hata oluştu');
    }

    return data || [];
}

export async function getContractById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('Contract')
        .select(`
            *,
            client:Client (
                id,
                name,
                email,
                phone,
                company
            ),
            projects:Project (
                id,
                name,
                status,
                createdAt
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching contract:', error);
        return null;
    }

    return data;
}

export async function createContract(data: {
    clientId: string;
    name: string;
    maxRevisions?: number;
    paymentTerms?: string;
    rawAssetsIncluded?: boolean;
    retainerHours?: number;
    monthlyVideoQuota?: number;
    monthlyPostQuota?: number;
    notes?: string;
}) {
    const { data: contract, error } = await supabaseAdmin
        .from('Contract')
        .insert([{
            clientId: data.clientId,
            name: data.name,
            maxRevisions: data.maxRevisions || 3,
            paymentTerms: data.paymentTerms || 'NET30',
            rawAssetsIncluded: data.rawAssetsIncluded || false,
            retainerHours: data.retainerHours || null,
            monthlyVideoQuota: data.monthlyVideoQuota || 0,
            monthlyPostQuota: data.monthlyPostQuota || 0,
            notes: data.notes || null,
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating contract:', error);
        throw new Error('Sözleşme oluşturulurken hata oluştu');
    }

    // Audit log
    // Audit log
    await logAction('CREATE', 'CONTRACT', contract.id, { name: data.name, clientId: data.clientId }, contract.name);

    revalidatePath('/dashboard/clients');
    revalidatePath(`/dashboard/clients/${data.clientId}`);
    return contract;
}

export async function updateContract(id: string, data: {
    name?: string;
    maxRevisions?: number;
    paymentTerms?: string;
    rawAssetsIncluded?: boolean;
    retainerHours?: number | null;
    notes?: string;
}) {
    const updateData: Record<string, any> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.maxRevisions !== undefined) updateData.maxRevisions = data.maxRevisions;
    if (data.paymentTerms !== undefined) updateData.paymentTerms = data.paymentTerms;
    if (data.rawAssetsIncluded !== undefined) updateData.rawAssetsIncluded = data.rawAssetsIncluded;
    if (data.retainerHours !== undefined) updateData.retainerHours = data.retainerHours;
    if (data.retainerHours !== undefined) updateData.retainerHours = data.retainerHours;
    // @ts-ignore
    if (data.monthlyVideoQuota !== undefined) updateData.monthlyVideoQuota = data.monthlyVideoQuota;
    // @ts-ignore
    if (data.monthlyPostQuota !== undefined) updateData.monthlyPostQuota = data.monthlyPostQuota;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const { data: contract, error } = await supabaseAdmin
        .from('Contract')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating contract:', error);
        throw new Error('Sözleşme güncellenirken hata oluştu');
    }

    // Audit log
    // Audit log
    await logAction('UPDATE', 'CONTRACT', id, updateData, contract.name);

    revalidatePath('/dashboard/clients');
    return contract;
}

// ===== Project Actions =====

export async function getProjects(status?: string) {
    let query = supabaseAdmin
        .from('Project')
        .select(`
            *,
            contract:Contract (
                id,
                name,
                monthlyVideoQuota,
                monthlyPostQuota,
                retainerAmount,
                client:Client (
                    id,
                    name
                )
            ),
            deliverables:Deliverable (
                id,
                status
            ),
            invoices:Invoice (
                id,
                status
            ),
            assignee:User (
                id,
                name
            )
        `)
        .order('createdAt', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching projects:', error);
        throw new Error('Projeler yüklenirken hata oluştu');
    }

    return data || [];
}

export async function getProjectById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('Project')
        .select(`
            *,
            contract:Contract (
                id,
                name,
                maxRevisions,
                rawAssetsIncluded,
                client:Client (
                    id,
                    name,
                    email
                )
            ),
            deliverables:Deliverable (
                *,
                assets:Asset (*),
                revisionCycles:RevisionCycle (*)
            ),
            invoices:Invoice (*),
            assignee:User (
                id,
                name
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching project:', error);
        return null;
    }

    return data;
}

export async function createProject(data: {
    name: string;
    description?: string;
    contractId: string;
    assigneeId?: string;
}) {
    const { data: project, error } = await supabaseAdmin
        .from('Project')
        .insert([{
            name: data.name,
            description: data.description || null,
            contractId: data.contractId,
            assigneeId: data.assigneeId || null,
            status: 'PENDING',
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating project:', error);
        throw new Error('Proje oluşturulurken hata oluştu');
    }

    // Audit log
    // Audit log
    await logAction('CREATE', 'PROJECT', project.id, { name: data.name }, project.name);

    revalidatePath('/dashboard/projects');
    return project;
}

export async function updateProject(id: string, data: {
    name?: string;
    description?: string;
    status?: 'PENDING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
    assigneeId?: string | null;
    dueDate?: string | null;
}) {
    const updateData: Record<string, any> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;

    const { data: project, error } = await supabaseAdmin
        .from('Project')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating project:', error);
        throw new Error('Proje güncellenirken hata oluştu');
    }

    // Audit log
    // Audit log
    await logAction('UPDATE', 'PROJECT', id, updateData, project.name);

    revalidatePath('/dashboard/projects');
    revalidatePath(`/dashboard/projects/${id}`);
    return project;
}

export async function deleteProject(id: string) {
    const { error } = await supabaseAdmin
        .from('Project')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting project:', error);
        throw new Error('Proje silinirken hata oluştu');
    }

    // Audit log
    // Audit log
    await logAction('DELETE', 'PROJECT', id, {}, 'Proje');

    revalidatePath('/dashboard/projects');
}

// ===== Invoice Actions =====

export async function getInvoices(projectId?: string) {
    let query = supabaseAdmin
        .from('Invoice')
        .select(`
            *,
            project:Project (
                id,
                name,
                contract:Contract (
                    id,
                    name,
                    monthlyVideoQuota,
                    monthlyPostQuota,
                    client:Client (
                        id,
                        name
                    )
                )
            )
        `)
        .order('createdAt', { ascending: false });

    if (projectId) {
        query = query.eq('projectId', projectId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching invoices:', error);
        throw new Error('Faturalar yüklenirken hata oluştu');
    }

    return data || [];
}

export async function createInvoice(data: {
    projectId: string;
    amount: number;
    dueDate?: Date;
    notes?: string;
}) {
    const { data: invoice, error } = await supabaseAdmin
        .from('Invoice')
        .insert([{
            projectId: data.projectId,
            amount: data.amount,
            dueDate: data.dueDate?.toISOString() || null,
            notes: data.notes || null,
            status: 'PENDING',
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating invoice:', error);
        throw new Error('Fatura oluşturulurken hata oluştu');
    }

    await supabaseAdmin.from('AuditLog').insert([{
        action: 'CREATE',
        entityType: 'INVOICE',
        entityId: invoice.id,
        details: { amount: data.amount },
    }]);

    revalidatePath('/dashboard/invoices');
    return invoice;
}

export async function markInvoicePaid(invoiceId: string, userId?: string) {
    const { data: updated, error } = await supabaseAdmin
        .from('Invoice')
        .update({
            status: 'PAID',
            paidAt: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .select()
        .single();

    if (error) {
        console.error('Error marking invoice paid:', error);
        throw new Error('Fatura güncellenirken hata oluştu');
    }

    await supabaseAdmin.from('AuditLog').insert([{
        userId,
        action: 'PAYMENT_RECEIVED',
        entityType: 'INVOICE',
        entityId: invoiceId,
        details: { paidAt: new Date().toISOString() },
    }]);

    revalidatePath('/dashboard/invoices');
    revalidatePath('/dashboard/deliverables');
    return updated;
}
// ===== Usage Stats =====

export async function getContractUsage(clientId: string) {
    // Current month range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Fetch COMPLETED tasks for this client in this month
    const { data: tasks, error } = await supabaseAdmin
        .from('Task')
        .select('id, contentType, status, dueDate')
        .eq('clientId', clientId)
        .in('status', ['DONE', 'PAYLASILD', 'TESLIM'])
        .gte('dueDate', startOfMonth)
        .lte('dueDate', endOfMonth);

    if (error) {
        console.error('Error fetching usage:', error);
        return { video: 0, post: 0, total: 0 };
    }

    const video = tasks?.filter(t => t.contentType === 'VIDEO' || t.contentType === 'REELS').length || 0;
    const post = tasks?.filter(t => t.contentType === 'POST' || t.contentType === 'CAROUSEL').length || 0;

    return {
        video,
        post,
        total: (tasks?.length || 0)
    };

}
