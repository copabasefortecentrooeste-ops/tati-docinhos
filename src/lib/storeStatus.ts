import type { StoreConfig, BusinessHours } from '@/types';

export type StoreStatusType = 'open' | 'closed' | 'paused' | 'outside_hours';

export interface StoreStatus {
  type: StoreStatusType;
  /** Short label shown to the user */
  label: string;
  /** Longer message / explanation */
  message: string;
  /** Whether the customer can place orders right now */
  canOrder: boolean;
  /** True when the store is outside its scheduled hours (but not manually closed) */
  isOutsideHours: boolean;
}

/**
 * Calculates the current store operational status.
 *
 * Priority:
 *  1. manual_status === 'closed'  → always closed (blocks orders)
 *  2. manual_status === 'paused'  → paused (blocks orders)
 *  3. business_hours check        → outside_hours (blocks if blockOrdersOutsideHours)
 *  4. everything else             → open
 */
export function getStoreStatus(
  config: StoreConfig,
  hours: BusinessHours[],
  now: Date = new Date(),
): StoreStatus {
  const closed = config.closedMessage || 'Estamos fechados no momento.';

  // ── 1. Manual closed ────────────────────────────────────────
  if (config.manualStatus === 'closed') {
    return {
      type: 'closed',
      label: 'Fechado',
      message: closed,
      canOrder: false,
      isOutsideHours: false,
    };
  }

  // ── 2. Manual paused ────────────────────────────────────────
  if (config.manualStatus === 'paused') {
    return {
      type: 'paused',
      label: 'Pausado',
      message: config.operationalMessage || 'Pedidos pausados temporariamente.',
      canOrder: false,
      isOutsideHours: false,
    };
  }

  // ── 3. Business hours check ──────────────────────────────────
  const dayOfWeek = now.getDay(); // 0 = Sunday … 6 = Saturday
  const todayHours = hours.find((h) => h.dayOfWeek === dayOfWeek);
  const isBlocked = config.blockOrdersOutsideHours ?? false;

  if (!todayHours || !todayHours.active) {
    return {
      type: 'outside_hours',
      label: 'Fora do horário',
      message: closed,
      canOrder: !isBlocked,
      isOutsideHours: true,
    };
  }

  const [openH, openM] = todayHours.openTime.split(':').map(Number);
  const [closeH, closeM] = todayHours.closeTime.split(':').map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (currentMinutes < openMinutes || currentMinutes >= closeMinutes) {
    return {
      type: 'outside_hours',
      label: 'Fora do horário',
      message:
        closed ||
        `Funcionamos hoje das ${todayHours.openTime} às ${todayHours.closeTime}.`,
      canOrder: !isBlocked,
      isOutsideHours: true,
    };
  }

  // ── 4. Open ─────────────────────────────────────────────────
  return {
    type: 'open',
    label: 'Aberto',
    message: config.operationalMessage || '',
    canOrder: true,
    isOutsideHours: false,
  };
}

/** Returns today's business hours entry (or null if not found) */
export function getTodayHours(hours: BusinessHours[], now: Date = new Date()): BusinessHours | null {
  return hours.find((h) => h.dayOfWeek === now.getDay()) ?? null;
}
