'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// ===== STUDIO CHECK-IN SYSTEM =====

// Equipment status enum
type EquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'DAMAGED';
type CheckInStatus = 'CHECKED_IN' | 'CHECKED_OUT';

// ===== EQUIPMENT CRUD =====

interface Equipment {
    id: string;
    name: string;
    category: string;
    serialNumber?: string;
    status: EquipmentStatus;
    notes?: string;
    lastChecked?: string;
    createdAt?: string;
}

export async function getEquipment(category?: string) {
    let query = supabaseAdmin
        .from('Equipment')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

    if (category) {
        query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching equipment:', error);
        // Return mock data if table doesn't exist yet
        return getMockEquipment();
    }

    return data || getMockEquipment();
}

export async function createEquipment(data: {
    name: string;
    category: string;
    serialNumber?: string;
    notes?: string;
}) {
    const { data: equipment, error } = await supabaseAdmin
        .from('Equipment')
        .insert([{
            name: data.name,
            category: data.category,
            serialNumber: data.serialNumber || null,
            notes: data.notes || null,
            status: 'AVAILABLE',
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating equipment:', error);
        throw new Error('Ekipman oluşturulurken hata oluştu');
    }

    revalidatePath('/dashboard/studio');
    return equipment;
}

export async function updateEquipmentStatus(id: string, status: EquipmentStatus, notes?: string) {
    const updateData: Record<string, any> = {
        status,
        lastChecked: new Date().toISOString(),
    };
    if (notes) updateData.notes = notes;

    const { data: equipment, error } = await supabaseAdmin
        .from('Equipment')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating equipment:', error);
        throw new Error('Ekipman durumu güncellenirken hata oluştu');
    }

    revalidatePath('/dashboard/studio');
    return equipment;
}

// ===== STUDIO CHECK-IN CRUD =====

interface StudioCheckIn {
    id: string;
    bookingId?: string;
    clientName: string;
    projectName?: string;
    checkInTime: string;
    checkOutTime?: string;
    status: CheckInStatus;
    cycloramaConditionIn?: string;
    cycloramaConditionOut?: string;
    cycloramaPhotoIn?: string;
    cycloramaPhotoOut?: string;
    scheduledHours: number;
    actualHours?: number;
    overtimeMinutes: number;
    overtimeCharge: number;
    paintCharge: number;
    totalExtraCharges: number;
    equipmentNotes?: string;
    generalNotes?: string;
    checkedInBy?: string;
    checkedOutBy?: string;
}

export async function getStudioCheckIns(date?: string) {
    let query = supabaseAdmin
        .from('StudioCheckIn')
        .select('*')
        .order('checkInTime', { ascending: false });

    if (date) {
        // Filter by date (YYYY-MM-DD format)
        const startOfDay = `${date}T00:00:00`;
        const endOfDay = `${date}T23:59:59`;
        query = query.gte('checkInTime', startOfDay).lte('checkInTime', endOfDay);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching check-ins:', error);
        return [];
    }

    return data || [];
}

export async function createStudioCheckIn(data: {
    clientName: string;
    projectName?: string;
    scheduledHours: number;
    cycloramaConditionIn?: string;
    equipmentNotes?: string;
    generalNotes?: string;
    checkedInBy?: string;
}) {
    const { data: checkIn, error } = await supabaseAdmin
        .from('StudioCheckIn')
        .insert([{
            clientName: data.clientName,
            projectName: data.projectName || null,
            checkInTime: new Date().toISOString(),
            scheduledHours: data.scheduledHours,
            status: 'CHECKED_IN',
            cycloramaConditionIn: data.cycloramaConditionIn || null,
            equipmentNotes: data.equipmentNotes || null,
            generalNotes: data.generalNotes || null,
            checkedInBy: data.checkedInBy || null,
            overtimeMinutes: 0,
            overtimeCharge: 0,
            paintCharge: 0,
            totalExtraCharges: 0,
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating check-in:', error);
        throw new Error('Check-in oluşturulurken hata oluştu');
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'STUDIO_CHECK_IN',
        entityType: 'STUDIO',
        entityId: checkIn.id,
        details: { clientName: data.clientName, scheduledHours: data.scheduledHours },
    }]);

    revalidatePath('/dashboard/studio');
    return checkIn;
}

export async function completeStudioCheckOut(id: string, data: {
    cycloramaConditionOut?: string;
    cycloramaPhotoOut?: string;
    overtimeMinutes?: number;
    paintCharge?: number;
    equipmentNotes?: string;
    generalNotes?: string;
    checkedOutBy?: string;
}) {
    // Get existing check-in
    const { data: existing } = await supabaseAdmin
        .from('StudioCheckIn')
        .select('*')
        .eq('id', id)
        .single();

    if (!existing) {
        throw new Error('Check-in bulunamadı');
    }

    // Calculate overtime charge (2500 TL/saat overtime ücreti)
    const overtimeMinutes = data.overtimeMinutes || 0;
    const overtimeCharge = Math.ceil(overtimeMinutes / 60) * 2500;

    // Calculate paint charge (already passed as data)
    const paintCharge = data.paintCharge || 0;

    // Total extra charges
    const totalExtraCharges = overtimeCharge + paintCharge;

    // Calculate actual hours
    const checkInTime = new Date(existing.checkInTime);
    const checkOutTime = new Date();
    const actualHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    const { data: checkOut, error } = await supabaseAdmin
        .from('StudioCheckIn')
        .update({
            status: 'CHECKED_OUT',
            checkOutTime: checkOutTime.toISOString(),
            actualHours: Math.round(actualHours * 100) / 100,
            cycloramaConditionOut: data.cycloramaConditionOut || null,
            cycloramaPhotoOut: data.cycloramaPhotoOut || null,
            overtimeMinutes,
            overtimeCharge,
            paintCharge,
            totalExtraCharges,
            equipmentNotes: data.equipmentNotes || existing.equipmentNotes,
            generalNotes: data.generalNotes || existing.generalNotes,
            checkedOutBy: data.checkedOutBy || null,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error completing check-out:', error);
        throw new Error('Check-out tamamlanırken hata oluştu');
    }

    // Audit log
    await supabaseAdmin.from('AuditLog').insert([{
        action: 'STUDIO_CHECK_OUT',
        entityType: 'STUDIO',
        entityId: id,
        details: {
            actualHours: Math.round(actualHours * 100) / 100,
            overtimeMinutes,
            totalExtraCharges,
        },
    }]);

    revalidatePath('/dashboard/studio');
    return checkOut;
}

// ===== OVERTIME CALCULATOR =====

export async function calculateOvertime(scheduledHours: number, actualHours: number): Promise<{
    isOvertime: boolean;
    overtimeMinutes: number;
    overtimeCharge: number;
}> {
    const scheduledMinutes = scheduledHours * 60;
    const actualMinutes = actualHours * 60;
    const overtimeMinutes = Math.max(0, actualMinutes - scheduledMinutes);
    const overtimeCharge = Math.ceil(overtimeMinutes / 60) * 2500; // 2500 TL/saat

    return {
        isOvertime: overtimeMinutes > 0,
        overtimeMinutes: Math.round(overtimeMinutes),
        overtimeCharge,
    };
}

// ===== PAINT CHARGE CALCULATOR =====

export async function calculatePaintCharge(condition: 'clean' | 'light' | 'heavy' | 'repaint'): Promise<number> {
    const charges: Record<string, number> = {
        clean: 0,
        light: 500,      // Hafif kirlilik
        heavy: 1500,     // Ağır kirlilik
        repaint: 5000,   // Boyama gerekli
    };
    return charges[condition] || 0;
}

// ===== MOCK DATA (if tables don't exist) =====

function getMockEquipment(): Equipment[] {
    return [
        { id: 'eq1', name: 'Sony A7R V', category: 'CAMERA', status: 'AVAILABLE', serialNumber: 'SNY-001' },
        { id: 'eq2', name: 'Sony A7S III', category: 'CAMERA', status: 'AVAILABLE', serialNumber: 'SNY-002' },
        { id: 'eq3', name: 'Canon RF 24-70mm f/2.8', category: 'LENS', status: 'AVAILABLE', serialNumber: 'CNL-001' },
        { id: 'eq4', name: 'Canon RF 70-200mm f/2.8', category: 'LENS', status: 'AVAILABLE', serialNumber: 'CNL-002' },
        { id: 'eq5', name: 'Godox AD600 Pro', category: 'LIGHT', status: 'AVAILABLE', serialNumber: 'GDX-001' },
        { id: 'eq6', name: 'Godox AD600 Pro', category: 'LIGHT', status: 'AVAILABLE', serialNumber: 'GDX-002' },
        { id: 'eq7', name: 'Godox SL150 II', category: 'LIGHT', status: 'AVAILABLE', serialNumber: 'GDX-003' },
        { id: 'eq8', name: 'Aputure 300D II', category: 'LIGHT', status: 'IN_USE', serialNumber: 'APT-001' },
        { id: 'eq9', name: 'DJI RS 3 Pro', category: 'GIMBAL', status: 'AVAILABLE', serialNumber: 'DJI-001' },
        { id: 'eq10', name: 'Wireless Lav Mic Set', category: 'AUDIO', status: 'AVAILABLE', serialNumber: 'AUD-001' },
        { id: 'eq11', name: 'Tripod (Heavy Duty)', category: 'SUPPORT', status: 'AVAILABLE', serialNumber: 'TRP-001' },
        { id: 'eq12', name: 'Light Stand Set (4x)', category: 'SUPPORT', status: 'AVAILABLE', serialNumber: 'LST-001' },
    ];
}

// ===== GET TODAY'S STUDIO STATUS =====

export async function getTodayStudioStatus() {
    const today = new Date().toISOString().split('T')[0];
    const checkIns = await getStudioCheckIns(today);

    const activeCheckIn = checkIns.find(c => c.status === 'CHECKED_IN');
    const todayCheckIns = checkIns.length;

    return {
        isOccupied: !!activeCheckIn,
        currentBooking: activeCheckIn ? {
            clientName: activeCheckIn.clientName,
            projectName: activeCheckIn.projectName,
            checkInTime: activeCheckIn.checkInTime,
            scheduledHours: activeCheckIn.scheduledHours,
        } : null,
        todayCheckIns,
    };
}
