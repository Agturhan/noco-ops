import { createMachine, assign } from 'xstate';

/**
 * Project State Machine
 * 
 * Proje yaşam döngüsünü yönetir ve iş kurallarını zorlar:
 * 1. Sözleşme/ödeme olmadan proje aktif olamaz
 * 2. Tüm teslimatlar delivered olmadan proje tamamlanamaz
 */

export interface ProjectContext {
    projectId: string;
    contractSigned: boolean;
    initialPaymentReceived: boolean;
    allDeliverablesDone: boolean;
    finalPaymentReceived: boolean;
}

export type ProjectEvent =
    | { type: 'SIGN_CONTRACT' }
    | { type: 'RECEIVE_INITIAL_PAYMENT' }
    | { type: 'START_PROJECT' }
    | { type: 'PUT_ON_HOLD'; reason?: string }
    | { type: 'RESUME_PROJECT' }
    | { type: 'ALL_DELIVERABLES_COMPLETE' }
    | { type: 'RECEIVE_FINAL_PAYMENT' }
    | { type: 'COMPLETE_PROJECT' }
    | { type: 'ARCHIVE_PROJECT' };

export const projectMachine = createMachine(
    {
        id: 'project',
        initial: 'pending',
        context: {
            projectId: '',
            contractSigned: false,
            initialPaymentReceived: false,
            allDeliverablesDone: false,
            finalPaymentReceived: false,
        } as ProjectContext,
        states: {
            // Beklemede - Sözleşme ve ödeme bekleniyor
            pending: {
                on: {
                    SIGN_CONTRACT: {
                        actions: 'markContractSigned',
                    },
                    RECEIVE_INITIAL_PAYMENT: {
                        actions: 'markInitialPaymentReceived',
                    },
                    START_PROJECT: {
                        target: 'active',
                        guard: 'canStartProject', // 🔒 KURAL: Sözleşme + ödeme gerekli
                        actions: 'logTransition',
                    },
                },
            },

            // Aktif - Çalışma devam ediyor
            active: {
                on: {
                    PUT_ON_HOLD: {
                        target: 'onHold',
                        actions: 'logTransition',
                    },
                    ALL_DELIVERABLES_COMPLETE: {
                        actions: 'markAllDeliverablesDone',
                    },
                    RECEIVE_FINAL_PAYMENT: {
                        actions: 'markFinalPaymentReceived',
                    },
                    COMPLETE_PROJECT: {
                        target: 'completed',
                        guard: 'canCompleteProject', // 🔒 KURAL: Tüm teslimatlar + ödeme gerekli
                        actions: 'logTransition',
                    },
                },
            },

            // Askıda - Sorun var (ödeme, müşteri, vb.)
            onHold: {
                on: {
                    RESUME_PROJECT: {
                        target: 'active',
                        actions: 'logTransition',
                    },
                },
            },

            // Tamamlandı
            completed: {
                on: {
                    ARCHIVE_PROJECT: {
                        target: 'archived',
                        actions: 'logTransition',
                    },
                },
            },

            // Arşivlendi - Final durum
            archived: {
                type: 'final',
            },
        },
    },
    {
        guards: {
            // Proje başlatmak için sözleşme VE ilk ödeme gerekli
            canStartProject: ({ context }) => {
                return context.contractSigned && context.initialPaymentReceived;
            },

            // Proje tamamlamak için tüm teslimatlar VE final ödeme gerekli
            canCompleteProject: ({ context }) => {
                return context.allDeliverablesDone && context.finalPaymentReceived;
            },
        },

        actions: {
            markContractSigned: assign({
                contractSigned: () => true,
            }),

            markInitialPaymentReceived: assign({
                initialPaymentReceived: () => true,
            }),

            markAllDeliverablesDone: assign({
                allDeliverablesDone: () => true,
            }),

            markFinalPaymentReceived: assign({
                finalPaymentReceived: () => true,
            }),

            logTransition: ({ context, event }) => {
                console.log('[Audit] Project Transition:', {
                    projectId: context.projectId,
                    event: event.type,
                    timestamp: new Date().toISOString(),
                });
            },
        },
    }
);

/**
 * Helper: Proje durumuna göre izin verilen aksiyonları döndür
 */
export function getProjectAllowedActions(
    currentState: string,
    context: ProjectContext
): string[] {
    const actions: string[] = [];

    switch (currentState) {
        case 'pending':
            if (!context.contractSigned) {
                actions.push('SIGN_CONTRACT');
            }
            if (!context.initialPaymentReceived) {
                actions.push('RECEIVE_INITIAL_PAYMENT');
            }
            if (context.contractSigned && context.initialPaymentReceived) {
                actions.push('START_PROJECT');
            }
            break;

        case 'active':
            actions.push('PUT_ON_HOLD');
            if (context.allDeliverablesDone && context.finalPaymentReceived) {
                actions.push('COMPLETE_PROJECT');
            }
            break;

        case 'onHold':
            actions.push('RESUME_PROJECT');
            break;

        case 'completed':
            actions.push('ARCHIVE_PROJECT');
            break;
    }

    return actions;
}

/**
 * Helper: Engelleme nedenini açıkla
 */
export function getProjectBlockedReason(
    action: string,
    context: ProjectContext
): string | null {
    switch (action) {
        case 'START_PROJECT':
            if (!context.contractSigned) {
                return 'Proje başlatmak için önce sözleşme imzalanmalıdır.';
            }
            if (!context.initialPaymentReceived) {
                return 'Proje başlatmak için ön ödeme alınmalıdır.';
            }
            break;

        case 'COMPLETE_PROJECT':
            if (!context.allDeliverablesDone) {
                return 'Tüm teslimatlar tamamlanmadan proje kapatılamaz.';
            }
            if (!context.finalPaymentReceived) {
                return 'Final ödeme alınmadan proje kapatılamaz.';
            }
            break;
    }

    return null;
}

export default projectMachine;
