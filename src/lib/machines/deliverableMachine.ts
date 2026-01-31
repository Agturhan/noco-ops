import { createMachine, assign } from 'xstate';

/**
 * Deliverable State Machine
 * 
 * Bu state machine, Blueprint'te tanımlanan iş kurallarını zorlar:
 * 1. "Ödeme olmadan teslimat yok" - DELIVER transition'ı sadece invoice ödendiyse çalışır
 * 2. "Sınırlı revizyon hakkı" - REQUEST_REVISION sadece limit aşılmadıysa çalışır
 */

export interface DeliverableContext {
  deliverableId: string;
  invoicePaid: boolean;
  revisionCount: number;
  maxRevisions: number;
  rawAccessGranted: boolean;
}

export type DeliverableEvent =
  | { type: 'SUBMIT_FOR_REVIEW' }
  | { type: 'APPROVE' }
  | { type: 'REQUEST_REVISION'; feedback?: string }
  | { type: 'DELIVER' }
  | { type: 'APPROVE_ADDITIONAL_SCOPE' }
  | { type: 'GRANT_RAW_ACCESS' }
  | { type: 'PAYMENT_RECEIVED' }
  | { type: 'PAYMENT_REVOKED' };

export const deliverableMachine = createMachine(
  {
    id: 'deliverable',
    initial: 'inProgress',
    context: {
      deliverableId: '',
      invoicePaid: false,
      revisionCount: 0,
      maxRevisions: 2,
      rawAccessGranted: false,
    } as DeliverableContext,
    states: {
      // İç çalışma devam ediyor
      inProgress: {
        on: {
          SUBMIT_FOR_REVIEW: {
            target: 'inReview',
            actions: 'logTransition',
          },
        },
      },

      // Müşteri incelemesinde
      inReview: {
        on: {
          APPROVE: {
            target: 'approved',
            actions: 'logTransition',
          },
          REQUEST_REVISION: [
            {
              target: 'revisionLimitMet',
              guard: 'isRevisionLimitReached',
              actions: ['incrementRevision', 'logTransition'],
            },
            {
              target: 'inProgress',
              guard: 'canRequestRevision',
              actions: ['incrementRevision', 'logTransition'],
            },
          ],
        },
      },

      // Müşteri onayladı - teslimat bekliyor
      approved: {
        on: {
          DELIVER: {
            target: 'delivered',
            guard: 'isInvoicePaid', // 🔒 KURAL: Ödeme olmadan teslimat yok
            actions: 'logTransition',
          },
        },
        // Onaylı durumdayken ödeme durumu değişebilir
        always: [
          {
            target: 'approved',
            guard: 'isInvoicePaid',
          },
        ],
      },

      // Final durum - teslim edildi
      delivered: {
        type: 'final',
        entry: 'onDeliveryComplete',
      },

      // Revizyon limiti doldu - ek kapsam gerekli
      revisionLimitMet: {
        on: {
          APPROVE_ADDITIONAL_SCOPE: {
            target: 'inProgress',
            actions: ['resetRevisionLimit', 'logTransition'],
          },
          // Müşteri mevcut haliyle onaylayabilir
          APPROVE: {
            target: 'approved',
            actions: 'logTransition',
          },
        },
      },
    },
    on: {
      // Global events - herhangi bir state'te olabilir
      PAYMENT_RECEIVED: {
        actions: 'markAsPaid',
      },
      PAYMENT_REVOKED: {
        actions: 'markAsUnpaid',
      },
      GRANT_RAW_ACCESS: {
        actions: 'grantRawAccess',
        guard: 'canGrantRawAccess',
      },
    },
  },
  {
    guards: {
      // Revizyon isteği için limit kontrolü
      canRequestRevision: ({ context }) => {
        return context.revisionCount < context.maxRevisions;
      },

      // Revizyon limiti dolmuş mu?
      isRevisionLimitReached: ({ context }) => {
        return context.revisionCount >= context.maxRevisions;
      },

      // 🔒 KRİTİK KURAL: Ödeme yapılmış mı?
      isInvoicePaid: ({ context }) => {
        return context.invoicePaid === true;
      },

      // RAW erişim verilebilir mi?
      canGrantRawAccess: ({ context }) => {
        // Sadece delivered state'te ve ödeme yapılmışsa
        return context.invoicePaid === true;
      },
    },

    actions: {
      // Revizyon sayacını artır
      incrementRevision: assign({
        revisionCount: ({ context }) => context.revisionCount + 1,
      }),

      // Ek kapsam onaylandığında limiti sıfırla
      resetRevisionLimit: assign({
        revisionCount: () => 0,
      }),

      // Ödeme alındı
      markAsPaid: assign({
        invoicePaid: () => true,
      }),

      // Ödeme iptal edildi
      markAsUnpaid: assign({
        invoicePaid: () => false,
      }),

      // RAW erişim verildi
      grantRawAccess: assign({
        rawAccessGranted: () => true,
      }),

      // State geçişlerini logla (Audit için)
      logTransition: ({ context, event }) => {
        console.log('[Audit] Transition:', {
          deliverableId: context.deliverableId,
          event: event.type,
          revisionCount: context.revisionCount,
          invoicePaid: context.invoicePaid,
          timestamp: new Date().toISOString(),
        });
      },

      // Teslimat tamamlandığında
      onDeliveryComplete: ({ context }) => {
        console.log('[Delivery Complete]', {
          deliverableId: context.deliverableId,
          timestamp: new Date().toISOString(),
        });
      },
    },
  }
);

/**
 * Helper: Mevcut state'e göre izin verilen aksiyonları döndür
 */
export function getAllowedActions(
  currentState: string,
  context: DeliverableContext
): string[] {
  const actions: string[] = [];

  switch (currentState) {
    case 'inProgress':
      actions.push('SUBMIT_FOR_REVIEW');
      break;

    case 'inReview':
      actions.push('APPROVE');
      if (context.revisionCount < context.maxRevisions) {
        actions.push('REQUEST_REVISION');
      }
      break;

    case 'approved':
      if (context.invoicePaid) {
        actions.push('DELIVER');
      }
      break;

    case 'revisionLimitMet':
      actions.push('APPROVE_ADDITIONAL_SCOPE');
      actions.push('APPROVE');
      break;
  }

  return actions;
}

/**
 * Helper: Belirli bir aksiyonun neden engellendiğini açıkla
 */
export function getBlockedReason(
  action: string,
  context: DeliverableContext
): string | null {
  switch (action) {
    case 'DELIVER':
      if (!context.invoicePaid) {
        return 'Bu eylem, fatura ödenmeden gerçekleştirilemez.';
      }
      break;

    case 'REQUEST_REVISION':
      if (context.revisionCount >= context.maxRevisions) {
        return `Revizyon hakkınız doldu (${context.maxRevisions}/${context.maxRevisions}). Ek revizyonlar için yeni sözleşme gereklidir.`;
      }
      break;
  }

  return null;
}

export default deliverableMachine;
