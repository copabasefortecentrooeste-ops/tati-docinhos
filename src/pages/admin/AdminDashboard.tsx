import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { formatPrice } from '@/lib/format';
import { ORDER_STATUS_LABELS } from '@/lib/orderStatus';

export default function AdminDashboard() {
  const orders = useOrderStore((s) => s.orders);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter((o) => o.createdAt.startsWith(today));
    const revenue = todayOrders.reduce((s, o) => s + o.total, 0);
    const avg = todayOrders.length ? revenue / todayOrders.length : 0;

    const byStatus: Record<string, number> = {};
    orders.forEach((o) => {
      byStatus[o.status] = (byStatus[o.status] || 0) + 1;
    });

    return { todayCount: todayOrders.length, revenue, avg, byStatus, total: orders.length };
  }, [orders]);

  const cards = [
    { label: 'Pedidos Hoje', value: stats.todayCount, icon: ShoppingBag, color: 'text-primary' },
    { label: 'Faturamento', value: formatPrice(stats.revenue), icon: DollarSign, color: 'text-green-600' },
    { label: 'Ticket Médio', value: formatPrice(stats.avg), icon: TrendingUp, color: 'text-blue-600' },
    { label: 'Total Pedidos', value: stats.total, icon: Clock, color: 'text-orange-600' },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Visão geral do dia</p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-card border border-border bg-card p-4 shadow-soft"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{card.label}</span>
                <Icon size={16} className={card.color} />
              </div>
              <p className="mt-2 tabular-nums text-2xl font-bold text-foreground">{card.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* By status */}
      <div className="mt-8">
        <h2 className="label-caps text-muted-foreground">Por Status</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(ORDER_STATUS_LABELS).map(([key, { label, color }]) => (
            <span key={key} className={`rounded-button px-3 py-1.5 text-xs font-medium ${color}`}>
              {label}: {stats.byStatus[key] || 0}
            </span>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div className="mt-8">
        <h2 className="label-caps text-muted-foreground">Últimos Pedidos</h2>
        <div className="mt-3 space-y-2">
          {orders.slice(0, 10).map((order) => (
            <div key={order.id} className="flex items-center justify-between rounded-card border border-border bg-card p-3">
              <div>
                <span className="tabular-nums text-sm font-semibold text-foreground">{order.code}</span>
                <span className="ml-2 text-xs text-muted-foreground">{order.customer.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="tabular-nums text-sm font-medium">{formatPrice(order.total)}</span>
                <span className={`rounded-button px-2 py-0.5 text-[10px] font-medium ${ORDER_STATUS_LABELS[order.status]?.color}`}>
                  {ORDER_STATUS_LABELS[order.status]?.label}
                </span>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum pedido ainda</p>
          )}
        </div>
      </div>
    </div>
  );
}
