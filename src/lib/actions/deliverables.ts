'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// ===== Deliverable Types =====
export type DeliverableStatus = 'IN_PROGRESS' | 'IN_REVIEW' | 'APPROVED' | 'DELIVERED' | 'REVISION_LIMIT_MET';

// ===== Get Deliverables =====
export async function getDeliverables(projectId?: string) {
    let query = supabaseAdmin
        .from('Deliverable')
        .select(`
            *,
            project:Project (
                id,
                name,
                contract:Contract (
                    id,
                    maxRevisions,
                    client:Client (
                        id,
                        name
                    )
                )
            ),
            assets:Asset (*),
            revisionCycles:RevisionCycle (*)
        `)
        .order('createdAt', { ascending: false });

    if (projectId) {
        query = query.eq('projectId', projectId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching deliverables:', error);
        throw new Error('Teslimatlar yüklenirken hata oluştu');
    }

    return data || [];
}

// ===== Get Deliverable By ID =====
export async function getDeliverableById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('Deliverable')
        .select(`
            *,
            project:Project (
                id,
                name,
                contract:Contract (
                    id,
                    maxRevisions,
                    rawAssetsIncluded,
                    client:Client (
                        id,
                        name,
                        email
                    )
                )
            ),
            assets:Asset (*),
            revisionCycles:RevisionCycle (*)
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching deliverable:', error);
        return null;
    }

    return data;
}

// ===== Create Deliverable =====
export async function createDeliverable(data: {
    name: string;
    description?: string;
    projectId: string;
}) {
    const { data: deliverable, error } = await supabaseAdmin
        .from('Deliverable')
        .insert([{
            name: data.name,
            description: data.description || null,
            projectId: data.projectId,
            status: 'IN_PROGRESS',
            revisionCount: 0,
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating deliverable:', error);
        throw new Error('Teslimat oluşturulurken hata oluştu');
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'CREATE',
        entityType: 'DELIVERABLE',
        entityId: deliverable.id,
        details: { name: data.name, projectId: data.projectId },
    }]);

    revalidatePath('/dashboard/deliverables');
    revalidatePath(`/dashboard/projects/${data.projectId}`);
    return deliverable;
}

// ===== Update Deliverable =====
export async function updateDeliverable(id: string, data: {
    name?: string;
    description?: string;
    status?: DeliverableStatus;
}) {
    const updateData: Record<string, any> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;

    const { data: deliverable, error } = await supabaseAdmin
        .from('Deliverable')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating deliverable:', error);
        throw new Error('Teslimat güncellenirken hata oluştu');
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'UPDATE',
        entityType: 'DELIVERABLE',
        entityId: id,
        details: updateData,
    }]);

    revalidatePath('/dashboard/deliverables');
    return deliverable;
}

// ===== Delete Deliverable =====
export async function deleteDeliverable(id: string) {
    const { error } = await supabaseAdmin
        .from('Deliverable')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting deliverable:', error);
        throw new Error('Teslimat silinirken hata oluştu');
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'DELETE',
        entityType: 'DELIVERABLE',
        entityId: id,
        details: {},
    }]);

    revalidatePath('/dashboard/deliverables');
}

// ===== Update Deliverable Status =====
export async function updateDeliverableStatus(id: string, status: DeliverableStatus) {
    return updateDeliverable(id, { status });
}

// ===== Request Revision =====
export async function requestRevision(deliverableId: string, feedback: string) {
    // Get current deliverable
    const deliverable = await getDeliverableById(deliverableId);
    if (!deliverable) {
        throw new Error('Teslimat bulunamadı');
    }

    const maxRevisions = deliverable.project?.contract?.maxRevisions || 2;
    const currentRevisions = deliverable.revisionCount || 0;

    if (currentRevisions >= maxRevisions) {
        throw new Error('Maksimum revizyon sayısına ulaşıldı');
    }

    // Create revision cycle
    await supabaseAdmin.from('RevisionCycle').insert([{
        deliverableId,
        status: 'OPEN',
        feedback,
    }]);

    // Update deliverable
    const newStatus = currentRevisions + 1 >= maxRevisions ? 'REVISION_LIMIT_MET' : 'IN_PROGRESS';

    const { data, error } = await supabaseAdmin
        .from('Deliverable')
        .update({
            revisionCount: currentRevisions + 1,
            status: newStatus,
        })
        .eq('id', deliverableId)
        .select()
        .single();

    if (error) {
        console.error('Error requesting revision:', error);
        throw new Error('Revizyon talep edilirken hata oluştu');
    }

    revalidatePath('/dashboard/deliverables');
    return data;
}

// ===== Approve Deliverable =====
export async function approveDeliverable(id: string) {
    return updateDeliverable(id, { status: 'APPROVED' });
}

// ===== Deliver Deliverable =====
export async function deliverDeliverable(id: string) {
    return updateDeliverable(id, { status: 'DELIVERED' });
}
