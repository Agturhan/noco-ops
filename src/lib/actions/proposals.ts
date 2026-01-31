'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// ===== PROPOSAL TYPES =====

type ProposalStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED';

interface ProposalLineItem {
    serviceId: string;
    serviceName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    total: number;
    incomeType: 'RECURRING' | 'PROJECT';
}

// ===== GET PROPOSALS =====

export async function getProposals(status?: ProposalStatus) {
    let query = supabaseAdmin
        .from('Proposal')
        .select(`
            *,
            client:Client (
                id,
                name,
                email
            )
        `)
        .order('createdAt', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching proposals:', error);
        throw new Error('Teklifler yüklenirken hata oluştu');
    }

    return data || [];
}

// ===== GET PROPOSAL BY ID =====

export async function getProposalById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('Proposal')
        .select(`
            *,
            client:Client (
                id,
                name,
                email,
                phone,
                address
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching proposal:', error);
        return null;
    }

    return data;
}

// ===== CREATE PROPOSAL =====

export async function createProposal(data: {
    clientId: string;
    lineItems: ProposalLineItem[];
    notes?: string;
    paymentTerms?: string;
    validUntil?: string;
}) {
    // Calculate totals
    const subtotal = data.lineItems.reduce((sum, item) => sum + item.total, 0);
    const kdv = subtotal * 0.18; // %18 KDV
    const total = subtotal + kdv;

    // Generate proposal number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const proposalNumber = `TKL-${year}-${month}${random}`;

    const { data: proposal, error } = await supabaseAdmin
        .from('Proposal')
        .insert([{
            number: proposalNumber,
            clientId: data.clientId,
            status: 'DRAFT',
            lineItems: data.lineItems,
            subtotal,
            kdv,
            total,
            notes: data.notes || null,
            paymentTerms: data.paymentTerms || '%50 peşin, %50 teslimde',
            validUntil: data.validUntil || null,
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating proposal:', error);
        throw new Error('Teklif oluşturulurken hata oluştu');
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'CREATE',
        entityType: 'PROPOSAL',
        entityId: proposal.id,
        details: { number: proposalNumber, total },
    }]);

    revalidatePath('/dashboard/proposals');
    return proposal;
}

// ===== UPDATE PROPOSAL =====

export async function updateProposal(id: string, data: {
    lineItems?: ProposalLineItem[];
    notes?: string;
    paymentTerms?: string;
    validUntil?: string;
}) {
    const updateData: Record<string, any> = {};

    if (data.lineItems) {
        const subtotal = data.lineItems.reduce((sum, item) => sum + item.total, 0);
        const kdv = subtotal * 0.18;
        updateData.lineItems = data.lineItems;
        updateData.subtotal = subtotal;
        updateData.kdv = kdv;
        updateData.total = subtotal + kdv;
    }

    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.paymentTerms !== undefined) updateData.paymentTerms = data.paymentTerms;
    if (data.validUntil !== undefined) updateData.validUntil = data.validUntil;

    const { data: proposal, error } = await supabaseAdmin
        .from('Proposal')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating proposal:', error);
        throw new Error('Teklif güncellenirken hata oluştu');
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'UPDATE',
        entityType: 'PROPOSAL',
        entityId: id,
        details: updateData,
    }]);

    revalidatePath('/dashboard/proposals');
    revalidatePath(`/dashboard/proposals/${id}`);
    return proposal;
}

// ===== UPDATE PROPOSAL STATUS =====

export async function updateProposalStatus(id: string, status: ProposalStatus) {
    const { data: proposal, error } = await supabaseAdmin
        .from('Proposal')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating proposal status:', error);
        throw new Error('Teklif durumu güncellenirken hata oluştu');
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'STATUS_CHANGE',
        entityType: 'PROPOSAL',
        entityId: id,
        details: { status },
    }]);

    revalidatePath('/dashboard/proposals');
    return proposal;
}

// ===== SEND PROPOSAL =====

export async function sendProposal(id: string) {
    return updateProposalStatus(id, 'SENT');
}

// ===== APPROVE PROPOSAL =====

export async function approveProposal(id: string) {
    return updateProposalStatus(id, 'APPROVED');
}

// ===== REJECT PROPOSAL =====

export async function rejectProposal(id: string) {
    return updateProposalStatus(id, 'REJECTED');
}

// ===== DELETE PROPOSAL =====

export async function deleteProposal(id: string) {
    // Only allow deleting DRAFT proposals
    const proposal = await getProposalById(id);
    if (proposal?.status !== 'DRAFT') {
        throw new Error('Sadece taslak teklifler silinebilir');
    }

    const { error } = await supabaseAdmin
        .from('Proposal')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting proposal:', error);
        throw new Error('Teklif silinirken hata oluştu');
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'DELETE',
        entityType: 'PROPOSAL',
        entityId: id,
        details: {},
    }]);

    revalidatePath('/dashboard/proposals');
}

// ===== CONVERT PROPOSAL TO PROJECT =====

export async function convertProposalToProject(proposalId: string, contractData: {
    name: string;
    startDate?: string;
    endDate?: string;
    maxRevisions?: number;
}) {
    // Get proposal details
    const proposal = await getProposalById(proposalId);
    if (!proposal) {
        throw new Error('Teklif bulunamadı');
    }

    if (proposal.status !== 'APPROVED') {
        throw new Error('Sadece onaylanan teklifler projeye dönüştürülebilir');
    }

    // Create contract
    const { data: contract, error: contractError } = await supabaseAdmin
        .from('Contract')
        .insert([{
            clientId: proposal.clientId,
            name: contractData.name,
            startDate: contractData.startDate || new Date().toISOString(),
            endDate: contractData.endDate || null,
            maxRevisions: contractData.maxRevisions || 3,
            status: 'ACTIVE',
            value: proposal.total,
        }])
        .select()
        .single();

    if (contractError) {
        console.error('Error creating contract from proposal:', contractError);
        throw new Error('Sözleşme oluşturulurken hata oluştu');
    }

    // Create project
    const { data: project, error: projectError } = await supabaseAdmin
        .from('Project')
        .insert([{
            name: contractData.name,
            contractId: contract.id,
            status: 'PENDING',
        }])
        .select()
        .single();

    if (projectError) {
        console.error('Error creating project from proposal:', projectError);
        throw new Error('Proje oluşturulurken hata oluştu');
    }

    // Link proposal to project (if column exists)
    // await supabaseAdmin
    //     .from('Proposal')
    //     .update({ projectId: project.id, convertedAt: new Date().toISOString() })
    //     .eq('id', proposalId);

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'CONVERT',
        entityType: 'PROPOSAL',
        entityId: proposalId,
        details: {
            contractId: contract.id,
            projectId: project.id
        },
    }]);

    revalidatePath('/dashboard/proposals');
    revalidatePath('/dashboard/projects');
    revalidatePath('/dashboard/contracts');

    return { contract, project };
}
