import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag, AlertTriangle, Clock } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useStoreConfigStore } from '@/store/storeConfigStore';
import { useHoursStore } from '@/store/hoursStore';
import { getStoreStatus } from '@/lib/storeStatus';
import { formatPrice } from '@/lib/format';
import { useTenantSlug } from '@/hooks/useTenantSlug';
import { tenantRoutes } from '@/lib/tenantRoutes';

export default function Cart() {
  const slug = useTenantSlug();
  const routes = tenantRoutes(slug);
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();
  const { config } = useStoreConfigStore();
  const { hours } = useHoursStore();
  const status = getStoreStatus(config, hours);

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <ShoppingBag size={48} className="text-muted-foreground/40" />
        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">Sua cesta está esperando por doçuras</h2>
        <p className="mt-1 text-sm text-muted-foreground">Que tal explorar nosso cardápio?</p>
        <Link to={routes.catalog}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="mt-6 flex items-center gap-2 rounded-button bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Ver Cardápio <ArrowRight size={16} />
          </motion.button>
        </Link>
      </div>
    );
  }

  const closedBanner = !status.canOrder && (
    <div className="mb-4 flex items-start gap-3 rounded-card border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-medium">
          {status.type === 'closed' ? '🔴 Loja fechada' : status.type === 'paused' ? '⏸ Pedidos pausados' : '⏰ Fora do horário'}
        </p>
        <p className="mt-0.5 text-xs opacity-90">{status.message}</p>
      </div>
    </div>
  );

  const outsideHoursBanner = status.canOrder && status.isOutsideHours && (
    <div className="mb-4 flex items-start gap-3 rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <Clock size={16} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-medium">⏰ Você está pedindo fora do horário normal</p>
        <p className="mt-0.5 text-xs opacity-90">O pedido será recebido, mas poderá ser processado apenas no próximo horário disponível.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-6 pb-24">
      <div className="container max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-foreground">Sua Cesta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? 'item' : 'itens'}
        </p>

        {closedBanner}
        {outsideHoursBanner}

        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="flex gap-4 rounded-card border border-border bg-card p-4 shadow-soft"
            >
              <img src={item.product.image} alt={item.product.name} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h3 className="font-display text-sm font-semibold text-foreground">{item.product.name}</h3>
                  {Object.entries(item.selectedOptions).map(([optId, choiceId]) => {
                    const opt = item.product.options.find((o) => o.id === optId);
                    const choice = opt?.choices.find((c) => c.id === choiceId);
                    return choice && (
                      <span key={optId} className="mr-2 text-[11px] text-muted-foreground">
                        {opt?.name}: {choice.name}
                      </span>
                    );
                  })}
                  {item.notes && <p className="text-[11px] text-muted-foreground italic">"{item.notes}"</p>}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateQuantity(item.id, item.quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-button border border-border text-foreground hover:bg-muted">
                      <Minus size={12} />
                    </motion.button>
                    <span className="tabular-nums text-sm font-medium">{item.quantity}</span>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateQuantity(item.id, item.quantity + 1)} className="flex h-7 w-7 items-center justify-center rounded-button border border-border text-foreground hover:bg-muted">
                      <Plus size={12} />
                    </motion.button>
                  </div>
                  <span className="tabular-nums text-sm font-semibold text-primary">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                </div>
              </div>
              <button onClick={() => removeItem(item.id)} className="self-start text-muted-foreground hover:text-destructive">
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 rounded-container bg-secondary p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="tabular-nums text-lg font-bold text-foreground">{formatPrice(getSubtotal())}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Taxa de entrega calculada no checkout</p>
          {status.canOrder ? (
            <Link to={routes.checkout} className="mt-4 block">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex w-full items-center justify-center gap-2 rounded-button bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-card"
              >
                Finalizar Pedido <ArrowRight size={16} />
              </motion.button>
            </Link>
          ) : (
            <div className="mt-4 w-full rounded-button bg-muted py-3.5 text-center text-sm font-semibold text-muted-foreground">
              {status.type === 'closed' ? 'Loja fechada' : status.type === 'paused' ? 'Pedidos pausados' : 'Fora do horário'}
            </div>
          )}
        </div>

        <Link to={routes.catalog} className="mt-4 block text-center text-sm text-primary hover:underline">
          Continuar comprando
        </Link>
      </div>
    </div>
  );
}
