import type { OrderStatus } from '@/types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, { label: string; color: string }> = {
  received:   { label: 'Recebido',          color: 'bg-blue-100 text-blue-800' },
  analyzing:  { label: 'Em análise',        color: 'bg-yellow-100 text-yellow-800' },
  production: { label: 'Em produção',       color: 'bg-orange-100 text-orange-800' },
  delivery:   { label: 'Saiu para entrega', color: 'bg-purple-100 text-purple-800' },
  delivered:  { label: 'Entregue',          color: 'bg-green-100 text-green-800' },
  cancelled:  { label: 'Cancelado',         color: 'bg-red-100 text-red-800' },
};
