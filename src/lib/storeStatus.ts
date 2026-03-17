import type { StoreConfig, BusinessHours } from '@/types';
import { getDayOfWeekBR, getTimeMinutesBR } from '@/lib/dateTime';

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
 *
 * All time comparisons use America/Sao_Paulo timezone via dateTime helpers.
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
  // getDayOfWeekBR: 0 = Sunday … 6 = Saturday in America/Sao_Paulo
  const dayOfWeek = getDayOfWeekBR(now);
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
  // getTimeMinutesBR: minutes since midnight in America/Sao_Paulo
  const currentMinutes = getTimeMinutesBR(now);
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

/** Returns today's business hours entry (or null if not found), using America/Sao_Paulo. */
export function getTodayHours(hours: BusinessHours[], now: Date = new Date()): BusinessHours | null {
  return hours.find((h) => h.dayOfWeek === getDayOfWeekBR(now)) ?? null;
}
