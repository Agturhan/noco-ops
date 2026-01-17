'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// ===== REVISION TRACKING SYSTEM =====
// Her proje için sözleşmede belirlenen maksimum revizyon hakkı takibi

type RevisionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

interface RevisionRequest {
    id: string;
    deliverableId: string;
    requestedBy?: string;
    description: string;
    items: string[];
    status: RevisionStatus;
    createdAt: string;
    completedAt?: string;
}

// ===== GET REVISION REQUESTS =====

export async function getRevisionRequests(deliverableId?: string) {
    let query = supabaseAdmin
        .from('RevisionCycle')
        .select(`
            *,
            deliverable:Deliverable (
                id,
                name,
                project:Project (
                    id,
                    name,
                    contract:Contract (
                        maxRevisions
                    )
                )
            )
        `)
        .order('createdAt', { ascending: false });

    if (deliverableId) {
        query = query.eq('deliverableId', deliverableId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching revision requests:', error);
        return [];
    }

    return data || [];
}

// ===== GET REVISION COUNT FOR DELIVERABLE =====

export async function getRevisionCount(deliverableId: string): Promise<{
    used: number;
    max: number;
    remaining: number;
    isLimitReached: boolean;
}> {
    // Get deliverable with project and contract info
    const { data: deliverable } = await supabaseAdmin
        .from('Deliverable')
        .select(`
            id,
            project:Project (
                contract:Contract (
                    maxRevisions
                )
            )
        `)
        .eq('id', deliverableId)
        .single();

    const maxRevisions = (deliverable as any)?.project?.contract?.maxRevisions || 2;

    // Count completed revisions
    const { count } = await supabaseAdmin
        .from('RevisionCycle')
        .select('*', { count: 'exact', head: true })
        .eq('deliverableId', deliverableId)
        .eq('status', 'CLOSED');

    const used = count || 0;
    const remaining = Math.max(0, maxRevisions - used);

    return {
        used,
        max: maxRevisions,
        remaining,
        isLimitReached: remaining === 0,
    };
}

// ===== CREATE REVISION REQUEST =====

export async function createRevisionRequest(data: {
    deliverableId: string;
    description: string;
    items?: string[];
    requestedBy?: string;
}): Promise<{ success: boolean; error?: string; data?: any }> {
    // Check if revision limit is reached
    const { isLimitReached, max, used } = await getRevisionCount(data.deliverableId);

    if (isLimitReached) {
        return {
            success: false,
            error: `Revizyon limiti doldu (${used}/${max}). Ek revizyon için onay gerekli.`,
        };
    }

    const { data: revision, error } = await supabaseAdmin
        .from('RevisionCycle')
        .insert([{
            deliverableId: data.deliverableId,
            status: 'OPEN',
            feedback: data.description,
            requestedBy: data.requestedBy || null,
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating revision request:', error);
        return { success: false, error: 'Revizyon talebi oluşturulurken hata oluştu' };
    }

    // Update deliverable status to IN_PROGRESS
    await supabaseAdmin
        .from('Deliverable')
        .update({ status: 'IN_PROGRESS' })
        .eq('id', data.deliverableId);

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'CREATE_REVISION',
        entityType: 'REVISION',
        entityId: revision.id,
        details: { deliverableId: data.deliverableId, description: data.description },
    }]);

    revalidatePath('/dashboard/deliverables');
    revalidatePath(`/dashboard/deliverables/${data.deliverableId}`);
    return { success: true, data: revision };
}

// ===== COMPLETE REVISION =====

export async function completeRevision(revisionId: string): Promise<{ success: boolean; error?: string }> {
    const { data: revision, error } = await supabaseAdmin
        .from('RevisionCycle')
        .update({
            status: 'CLOSED',
            closedAt: new Date().toISOString(),
        })
        .eq('id', revisionId)
        .select('deliverableId')
        .single();

    if (error) {
        console.error('Error completing revision:', error);
        return { success: false, error: 'Revizyon tamamlanırken hata oluştu' };
    }

    // Update deliverable status to IN_REVIEW
    await supabaseAdmin
        .from('Deliverable')
        .update({ status: 'IN_REVIEW' })
        .eq('id', revision.deliverableId);

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'COMPLETE_REVISION',
        entityType: 'REVISION',
        entityId: revisionId,
        details: {},
    }]);

    revalidatePath('/dashboard/deliverables');
    return { success: true };
}

// ===== APPROVE EXTRA REVISION (when limit reached) =====

export async function approveExtraRevision(data: {
    deliverableId: string;
    description: string;
    approvedBy: string;
    extraCharge?: number;
}): Promise<{ success: boolean; error?: string; data?: any }> {
    const { data: revision, error } = await supabaseAdmin
        .from('RevisionCycle')
        .insert([{
            deliverableId: data.deliverableId,
            status: 'OPEN',
            feedback: `[EK REVİZYON] ${data.description}`,
            requestedBy: data.approvedBy,
            isExtra: true,
            extraCharge: data.extraCharge || 0,
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating extra revision:', error);
        return { success: false, error: 'Ek revizyon oluşturulurken hata oluştu' };
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'APPROVE_EXTRA_REVISION',
        entityType: 'REVISION',
        entityId: revision.id,
        details: {
            deliverableId: data.deliverableId,
            approvedBy: data.approvedBy,
            extraCharge: data.extraCharge,
        },
    }]);

    revalidatePath('/dashboard/deliverables');
    return { success: true, data: revision };
}

// ===== GET PROJECT REVISION SUMMARY =====

export async function getProjectRevisionSummary(projectId: string) {
    // Get all deliverables for project with revision counts
    const { data: deliverables } = await supabaseAdmin
        .from('Deliverable')
        .select(`
            id,
            name,
            status,
            revisionCycles:RevisionCycle (
                id,
                status
            )
        `)
        .eq('projectId', projectId);

    if (!deliverables) return { deliverables: [], totalRevisions: 0, activeRevisions: 0 };

    // Get project's max revisions from contract
    const { data: project } = await supabaseAdmin
        .from('Project')
        .select('contract:Contract(maxRevisions)')
        .eq('id', projectId)
        .single();

    const maxRevisions = (project as any)?.contract?.maxRevisions || 2;

    const summary = deliverables.map((d: any) => {
        const cycles = d.revisionCycles || [];
        const completedRevisions = cycles.filter((c: any) => c.status === 'CLOSED').length;
        const activeRevision = cycles.find((c: any) => c.status === 'OPEN' || c.status === 'IN_PROGRESS');

        return {
            id: d.id,
            name: d.name,
            status: d.status,
            usedRevisions: completedRevisions,
            maxRevisions,
            remainingRevisions: Math.max(0, maxRevisions - completedRevisions),
            hasActiveRevision: !!activeRevision,
            isLimitReached: completedRevisions >= maxRevisions,
        };
    });

    return {
        deliverables: summary,
        totalRevisions: summary.reduce((sum, d) => sum + d.usedRevisions, 0),
        activeRevisions: summary.filter(d => d.hasActiveRevision).length,
        maxRevisions,
    };
}
