import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Copy, ArrowRight } from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { useStoreConfigStore } from '@/store/storeConfigStore';
import { formatPrice } from '@/lib/format';
import { toast } from '@/hooks/use-toast';
import { useTenantSlug } from '@/hooks/useTenantSlug';
import { tenantRoutes } from '@/lib/tenantRoutes';

export default function OrderConfirmation() {
  const { code } = useParams();
  const slug = useTenantSlug();
  const routes = tenantRoutes(slug);
  const order = useOrderStore((s) => s.getOrderByCode(code || ''));
  const { config } = useStoreConfigStore();

  if (!order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Pedido não encontrado</p>
      </div>
    );
  }

  const copyCode = () => {
    navigator.clipboard.writeText(order.code);
    toast({ title: 'Código copiado!' });
  };

  return (
    <div className="min-h-screen py-10">
      <div className="container max-w-lg text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <CheckCircle size={64} className="mx-auto text-primary" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h1 className="mt-6 font-display text-3xl font-bold text-foreground">Pedido Confirmado!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Obrigada por escolher {config.name || 'nossa loja'} 💕
          </p>

          <div className="mx-auto mt-6 rounded-container bg-secondary p-6">
            <p className="label-caps text-muted-foreground">Código do pedido</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="tabular-nums text-2xl font-bold text-foreground">{order.code}</span>
              <button onClick={copyCode} className="text-muted-foreground hover:text-foreground">
                <Copy size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-2 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="tabular-nums font-semibold">{formatPrice(order.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pagamento</span>
                <span className="capitalize">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entrega</span>
                <span>{order.isPickup ? 'Retirada' : `Delivery — ${order.customer.neighborhood}`}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link to={`${routes.tracking}?code=${order.code}&phone=${encodeURIComponent(order.customer.phone)}`}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex w-full items-center justify-center gap-2 rounded-button bg-primary py-3 text-sm font-semibold text-primary-foreground"
              >
                Acompanhar Pedido <ArrowRight size={16} />
              </motion.button>
            </Link>
            <Link to={routes.home} className="text-sm text-primary hover:underline">
              Voltar ao início
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
