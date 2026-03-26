import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, DollarSign, TrendingUp, Clock, MessageCircle, CheckCircle, XCircle, Link } from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { formatPrice } from '@/lib/format';
import { ORDER_STATUS_LABELS } from '@/lib/orderStatus';
import { isTodayBR } from '@/lib/dateTime';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const orders = useOrderStore((s) => s.orders);

  const stats = useMemo(() => {
    // isTodayBR uses America/Sao_Paulo — avoids UTC boundary bug after 21h UTC
    const todayOrders = orders.filter((o) => isTodayBR(o.createdAt));
    const revenue = todayOrders.reduce((s, o) => s + o.total, 0);
    const avg = todayOrders.length ? revenue / todayOrders.length : 0;

    const byStatus: Record<string, number> = {};
    orders.forEach((o) => {
      byStatus[o.status] = (byStatus[o.status] || 0) + 1;
    });

    return { todayCount: todayOrders.length, revenue, avg, byStatus, total: orders.length };
  }, [orders]);

  // WhatsApp metrics today
  const [waStats, setWaStats] = useState({ sent: 0, failed: 0, fallback: 0 });
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    supabase
      .from('whatsapp_message_logs')
      .select('status')
      .gte('created_at', today.toISOString())
      .then(({ data }) => {
        if (!data) return;
        const counts = { sent: 0, failed: 0, fallback: 0 };
        data.forEach((r) => {
          if (r.status === 'sent')     counts.sent++;
          if (r.status === 'failed')   counts.failed++;
          if (r.status === 'fallback') counts.fallback++;
        });
        setWaStats(counts);
      });
  }, []);

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

      {/* WhatsApp metrics */}
      <div className="mt-8">
        <h2 className="label-caps text-muted-foreground">WhatsApp Hoje</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 rounded-card border border-border bg-card p-3 shadow-soft">
            <CheckCircle size={18} className="shrink-0 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Enviadas</p>
              <p className="tabular-nums text-lg font-bold text-foreground">{waStats.sent}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-card border border-border bg-card p-3 shadow-soft">
            <Link size={18} className="shrink-0 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Link (fallback)</p>
              <p className="tabular-nums text-lg font-bold text-foreground">{waStats.fallback}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-card border border-border bg-card p-3 shadow-soft">
            <XCircle size={18} className="shrink-0 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Falhas</p>
              <p className="tabular-nums text-lg font-bold text-foreground">{waStats.failed}</p>
            </div>
          </div>
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
