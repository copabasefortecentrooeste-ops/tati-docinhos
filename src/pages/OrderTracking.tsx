import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Package, ChefHat, Truck, CheckCircle2, XCircle, ClipboardList } from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { formatPrice } from '@/lib/format';
import { ORDER_STATUS_LABELS } from '@/lib/orderStatus';
import type { OrderStatus } from '@/types';

const statusSteps: { key: OrderStatus; icon: React.ElementType; label: string }[] = [
  { key: 'received', icon: ClipboardList, label: 'Recebido' },
  { key: 'analyzing', icon: Search, label: 'Em análise' },
  { key: 'production', icon: ChefHat, label: 'Em produção' },
  { key: 'delivery', icon: Truck, label: 'Saiu p/ entrega' },
  { key: 'delivered', icon: CheckCircle2, label: 'Entregue' },
];

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [searched, setSearched] = useState(!!searchParams.get('code'));

  const order = useOrderStore((s) => s.getOrder(code, phone));

  const handleSearch = () => {
    if (code.trim() && phone.trim()) setSearched(true);
  };

  const currentStepIndex = order ? statusSteps.findIndex((s) => s.key === order.status) : -1;
  const isCancelled = order?.status === 'cancelled';

  return (
    <div className="min-h-screen py-10">
      <div className="container max-w-lg">
        <h1 className="font-display text-3xl font-bold text-foreground">Acompanhar Pedido</h1>
        <p className="mt-1 text-sm text-muted-foreground">Informe o código e seu telefone</p>

        <div className="mt-6 space-y-3">
          <input
            type="text"
            placeholder="Código do pedido"
            value={code}
            onChange={(e) => { setCode(e.target.value); setSearched(false); }}
            className="w-full rounded-button border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="tel"
            placeholder="Seu telefone"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setSearched(false); }}
            className="w-full rounded-button border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSearch}
            className="flex w-full items-center justify-center gap-2 rounded-button bg-primary py-3 text-sm font-semibold text-primary-foreground"
          >
            <Search size={16} /> Buscar
          </motion.button>
        </div>

        {searched && !order && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center">
            <Package size={40} className="mx-auto text-muted-foreground/40" />
            <p className="mt-3 text-muted-foreground">Pedido não encontrado. Verifique os dados.</p>
          </motion.div>
        )}

        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="rounded-container bg-secondary p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-caps text-muted-foreground">Pedido</p>
                  <p className="tabular-nums text-lg font-bold text-foreground">{order.code}</p>
                </div>
                <span className={`rounded-button px-3 py-1 text-xs font-semibold ${ORDER_STATUS_LABELS[order.status]?.color}`}>
                  {ORDER_STATUS_LABELS[order.status]?.label}
                </span>
              </div>

              {/* Status timeline */}
              {!isCancelled ? (
                <div className="mt-6 space-y-0">
                  {statusSteps.map((step, i) => {
                    const isActive = i <= currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                            isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          } ${isCurrent ? 'ring-2 ring-primary/30 ring-offset-2' : ''}`}>
                            <Icon size={14} />
                          </div>
                          {i < statusSteps.length - 1 && (
                            <div className={`h-6 w-0.5 ${isActive ? 'bg-primary' : 'bg-border'}`} />
                          )}
                        </div>
                        <div className="pb-4">
                          <p className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {step.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 flex items-center gap-2 text-destructive">
                  <XCircle size={20} /> <span className="text-sm font-medium">Pedido cancelado</span>
                </div>
              )}

              {/* Order details */}
              <div className="mt-4 border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="tabular-nums font-semibold">{formatPrice(order.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entrega</span>
                  <span>{order.isPickup ? 'Retirada' : order.customer.neighborhood}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Itens</span>
                  <span>{order.items.reduce((s, i) => s + i.quantity, 0)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
