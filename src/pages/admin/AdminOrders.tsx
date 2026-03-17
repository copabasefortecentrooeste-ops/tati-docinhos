import { motion } from 'framer-motion';
import { useOrderStore } from '@/store/orderStore';
import { formatPrice } from '@/lib/format';
import { ORDER_STATUS_LABELS } from '@/lib/orderStatus';
import { mapSupabaseError } from '@/lib/supabaseError';
import { formatDatetimeBR } from '@/lib/dateTime';
import type { OrderStatus } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

const statusFlow: OrderStatus[] = ['received', 'analyzing', 'production', 'delivery', 'delivered'];

export default function AdminOrders() {
  const { orders, updateStatus, initFromDB } = useOrderStore();
  const [filter, setFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    try {
      await updateStatus(id, newStatus);
    } catch (err) {
      const mapped = mapSupabaseError(err);
      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
    }
  };

  const advanceStatus = (orderId: string, current: OrderStatus) => {
    const idx = statusFlow.indexOf(current);
    if (idx < statusFlow.length - 1) {
      handleStatusChange(orderId, statusFlow[idx + 1]);
      toast({ title: `Status: "${ORDER_STATUS_LABELS[statusFlow[idx + 1]].label}"` });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await initFromDB();
    setRefreshing(false);
    toast({ title: 'Pedidos atualizados' });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Pedidos</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`shrink-0 rounded-button px-3 py-1.5 text-xs font-medium ${
            filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          Todos ({orders.length})
        </button>
        {Object.entries(ORDER_STATUS_LABELS).map(([key, { label, color }]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`shrink-0 rounded-button px-3 py-1.5 text-xs font-medium ${
              filter === key ? color : 'bg-muted text-muted-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {filtered.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-card border border-border bg-card p-4 shadow-soft"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tabular-nums text-sm font-bold text-foreground">{order.code}</span>
                  <span
                    className={`rounded-button px-2 py-0.5 text-[10px] font-medium ${ORDER_STATUS_LABELS[order.status]?.color}`}
                  >
                    {ORDER_STATUS_LABELS[order.status]?.label}
                  </span>
                  {order.outsideHours && (
                    <span className="rounded-button bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">
                      ⏰ Fora do horário
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {order.customer.name} • {order.customer.phone}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.isPickup
                    ? '🏪 Retirada'
                    : [
                        order.customer.neighborhood,
                        order.city,
                        order.state,
                      ]
                        .filter(Boolean)
                        .join(' — ') || order.customer.address}
                </p>
                {order.customer.address && !order.isPickup && (
                  <p className="text-xs text-muted-foreground">{order.customer.address}</p>
                )}
              </div>
              <span className="tabular-nums text-sm font-bold text-foreground">
                {formatPrice(order.total)}
              </span>
            </div>

            {/* Items */}
            <div className="mt-3 space-y-1">
              {order.items.map((item) => (
                <p key={item.id} className="text-xs text-muted-foreground">
                  {item.quantity}x {item.product.name} — {formatPrice(item.unitPrice * item.quantity)}
                </p>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-3 flex gap-2">
              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => advanceStatus(order.id, order.status)}
                  className="rounded-button bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                >
                  Avançar Status
                </motion.button>
              )}
              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    handleStatusChange(order.id, 'cancelled');
                    toast({ title: 'Pedido cancelado' });
                  }}
                  className="rounded-button border border-destructive px-3 py-1.5 text-xs font-medium text-destructive"
                >
                  Cancelar
                </motion.button>
              )}
            </div>

            <p className="mt-2 text-[10px] text-muted-foreground">
              {formatDatetimeBR(order.createdAt)}
              {order.paymentMethod && ` • ${order.paymentMethod.toUpperCase()}`}
              {order.cep && ` • CEP ${order.cep}`}
            </p>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">Nenhum pedido encontrado</p>
        )}
      </div>
    </div>
  );
}
