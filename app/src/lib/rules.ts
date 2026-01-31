import { Role } from '@prisma/client';


/**
 * Kural Değerlendirme Fonksiyonları
 * 
 * Bu modül, Blueprint'te tanımlanan iş kurallarını merkezi olarak değerlendirir.
 * State machine'ler bu fonksiyonları kullanarak guard koşullarını kontrol eder.
 */

// ===== Ödeme Kuralları =====

export interface PaymentRuleContext {
    invoiceStatus: 'PENDING' | 'PAID' | 'OVERDUE' | 'REFUNDED';
    paymentTerms: 'UPFRONT' | 'NET_15' | 'NET_30' | 'MILESTONE';
}

/**
 * Teslimat yapılabilir mi?
 * KURAL: Ödeme olmadan teslimat yok
 */
export function canDeliver(ctx: PaymentRuleContext): boolean {
    return ctx.invoiceStatus === 'PAID';
}

/**
 * Teslimat engellenme nedeni
 */
export function getDeliveryBlockReason(ctx: PaymentRuleContext): string | null {
    if (ctx.invoiceStatus === 'PENDING') {
        return 'Fatura henüz ödenmedi. Ödeme yapıldıktan sonra teslimat yapılabilir.';
    }
    if (ctx.invoiceStatus === 'OVERDUE') {
        return 'Fatura ödemesi gecikmiş durumda. Lütfen ödemenizi yapın.';
    }
    return null;
}

// ===== Revizyon Kuralları =====

export interface RevisionRuleContext {
    currentRevisions: number;
    maxRevisions: number;
}

/**
 * Revizyon talep edilebilir mi?
 * KURAL: Sözleşmede belirtilen revizyon hakkı sınırlıdır
 */
export function canRequestRevision(ctx: RevisionRuleContext): boolean {
    return ctx.currentRevisions < ctx.maxRevisions;
}

/**
 * Kalan revizyon hakkı
 */
export function getRemainingRevisions(ctx: RevisionRuleContext): number {
    return Math.max(0, ctx.maxRevisions - ctx.currentRevisions);
}

/**
 * Revizyon engellenme nedeni
 */
export function getRevisionBlockReason(ctx: RevisionRuleContext): string | null {
    if (ctx.currentRevisions >= ctx.maxRevisions) {
        return `Revizyon hakkınız doldu (${ctx.maxRevisions}/${ctx.maxRevisions}). Ek revizyonlar için sözleşme güncellenmesi gereklidir.`;
    }
    return null;
}

// ===== Asset Erişim Kuralları =====

export interface AssetAccessContext {
    assetType: 'FINAL' | 'RAW';
    rawAssetsIncluded: boolean;
    invoicePaid: boolean;
    deliverableDelivered: boolean;
}

/**
 * Asset indirilebilir mi?
 * KURAL: RAW dosyalar varsayılan olarak dahil değildir
 */
export function canDownloadAsset(ctx: AssetAccessContext): boolean {
    // Ödeme yapılmamışsa hiçbir şey indirilemez
    if (!ctx.invoicePaid) return false;

    // Teslimat yapılmamışsa final asset bile indirilemez
    if (!ctx.deliverableDelivered) return false;

    // Final asset'ler her zaman indirilebilir (ödeme varsa)
    if (ctx.assetType === 'FINAL') return true;

    // RAW dosyalar sadece sözleşmede dahilse indirilebilir
    return ctx.rawAssetsIncluded;
}

/**
 * Asset erişim engellenme nedeni
 */
export function getAssetBlockReason(ctx: AssetAccessContext): string | null {
    if (!ctx.invoicePaid) {
        return 'Dosyalar, fatura ödendikten sonra indirilebilir.';
    }
    if (!ctx.deliverableDelivered) {
        return 'Dosyalar henüz teslim edilmedi.';
    }
    if (ctx.assetType === 'RAW' && !ctx.rawAssetsIncluded) {
        return 'RAW/kaynak dosyalar bu sözleşmeye dahil değildir.';
    }
    return null;
}

// ===== Rol + Durum Tabanlı Erişim Kuralları =====

export interface ActionPermissionContext {
    userRole: Role;
    entityState: string;
    entityType: 'PROJECT' | 'DELIVERABLE' | 'INVOICE';
}

/**
 * Kullanıcı bu aksiyonu gerçekleştirebilir mi?
 * Rol ve durum tabanlı yetkilendirme
 */
export function canPerformAction(
    action: string,
    ctx: ActionPermissionContext
): boolean {
    const { userRole, entityState } = ctx;

    // Aksiyon-Rol-Durum matrisi
    const permissions: Record<string, { roles: Role[]; states: string[] }> = {
        // Deliverable aksiyonları
        'SUBMIT_FOR_REVIEW': {
            roles: ['OWNER', 'OPS', 'DIGITAL'],
            states: ['IN_PROGRESS'],
        },
        'APPROVE': {
            roles: ['CLIENT'], // Sadece müşteri onaylayabilir
            states: ['IN_REVIEW'],
        },
        'REQUEST_REVISION': {
            roles: ['CLIENT'],
            states: ['IN_REVIEW'],
        },
        'DELIVER': {
            roles: ['OWNER', 'OPS'], // Sadece ops veya owner teslim edebilir
            states: ['APPROVED'],
        },

        // Project aksiyonları
        'START_PROJECT': {
            roles: ['OWNER', 'OPS'],
            states: ['PENDING'],
        },
        'COMPLETE_PROJECT': {
            roles: ['OWNER', 'OPS'],
            states: ['ACTIVE'],
        },

        // Invoice aksiyonları
        'MARK_PAID': {
            roles: ['OWNER', 'OPS'],
            states: ['PENDING', 'OVERDUE'],
        },
    };

    const permission = permissions[action];
    if (!permission) return false;

    const hasRole = permission.roles.includes(userRole);
    const hasValidState = permission.states.includes(entityState);

    return hasRole && hasValidState;
}

/**
 * Aksiyon engellenme nedeni
 */
export function getActionBlockReason(
    action: string,
    ctx: ActionPermissionContext
): string | null {
    const { userRole, entityState } = ctx;

    const permissions: Record<string, { roles: Role[]; states: string[] }> = {
        'APPROVE': {
            roles: ['CLIENT'],
            states: ['IN_REVIEW'],
        },
        'DELIVER': {
            roles: ['OWNER', 'OPS'],
            states: ['APPROVED'],
        },
    };

    const permission = permissions[action];
    if (!permission) return null;

    if (!permission.roles.includes(userRole)) {
        return 'Bu işlemi gerçekleştirmek için yetkiniz bulunmamaktadır.';
    }

    if (!permission.states.includes(entityState)) {
        return 'Bu işlem şu anki durumda gerçekleştirilemez.';
    }

    return null;
}

// ===== Override (Kural Geçersiz Kılma) =====

export interface OverrideContext {
    userRole: Role;
    ruleType: string;
    reason?: string;
}

/**
 * Kullanıcı kuralı override edebilir mi?
 * KURAL: Sadece OWNER override yapabilir ve her override loglanır
 */
export function canOverride(ctx: OverrideContext): boolean {
    return ctx.userRole === 'OWNER' && !!ctx.reason;
}

/**
 * Override için audit log entry oluştur
 */
export function createOverrideAuditEntry(ctx: OverrideContext & {
    userId: string;
    entityType: string;
    entityId: string;
}) {
    return {
        userId: ctx.userId,
        action: 'OVERRIDE',
        entityType: ctx.entityType,
        entityId: ctx.entityId,
        isOverride: true,
        details: {
            ruleType: ctx.ruleType,
            reason: ctx.reason,
            timestamp: new Date().toISOString(),
        },
    };
}
