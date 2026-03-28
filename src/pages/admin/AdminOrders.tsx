import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrderStore } from '@/store/orderStore';
import { formatPrice } from '@/lib/format';
import { ORDER_STATUS_LABELS } from '@/lib/orderStatus';
import { mapSupabaseError } from '@/lib/supabaseError';
import { formatDatetimeBR } from '@/lib/dateTime';
import type { Order, OrderStatus } from '@/types';
import { toast } from '@/hooks/use-toast';
import { RefreshCw, Wifi, WifiOff, Printer, Pencil, Trash2, X, Save } from 'lucide-react';
import { useStoreConfigStore } from '@/store/storeConfigStore';
import { printOrder } from '@/lib/printOrder';
import { useStoreCtx } from '@/contexts/StoreContext';

const statusFlow: OrderStatus[] = ['received', 'analyzing', 'production', 'delivery', 'delivered'];

const PAYMENT_OPTIONS = [
  { value: 'pix',      label: 'PIX'      },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao',   label: 'Cartão'   },
  { value: 'pendente', label: 'Pendente' },
];

// ── Edit Modal ─────────────────────────────────────────────
interface EditModalProps {
  order: Order;
  onClose: () => void;
  onSave: (updates: Parameters<ReturnType<typeof useOrderStore>['updateOrder']>[1]) => Promise<void>;
}

function EditModal({ order, onClose, onSave }: EditModalProps) {
  const [name,    setName]    = useState(order.customer.name);
  const [phone,   setPhone]   = useState(order.customer.phone);
  const [address, setAddress] = useState(order.customer.address ?? '');
  const [neighborhood, setNeighborhood] = useState(order.customer.neighborhood ?? '');
  const [reference, setReference] = useState(order.customer.reference ?? '');
  const [payment, setPayment] = useState(order.paymentMethod);
  const [status,  setStatus]  = useState<OrderStatus>(order.status);
  const [discount, setDiscount] = useState(String(order.discount ?? 0));
  const [tableNumber, setTableNumber] = useState(order.tableNumber ?? '');
  const [saving, setSaving] = useState(false);

  const subtotal = order.subtotal;
  const newDiscount = parseFloat(discount) || 0;
  const newTotal = Math.max(0, subtotal - newDiscount + order.deliveryFee);

  const handleSave = async () => {
    if (!name.trim()) { toast({ title: 'Nome do cliente é obrigatório', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await onSave({
        customer: { name: name.trim(), phone: phone.trim(), address: address.trim() || undefined, neighborhood: neighborhood.trim() || undefined, reference: reference.trim() || undefined },
        paymentMethod: payment,
        status,
        discount: newDiscount,
        total: newTotal,
        tableNumber: tableNumber.trim() || undefined,
      });
      toast({ title: 'Pedido atualizado com sucesso' });
      onClose();
    } catch (err) {
      const mapped = mapSupabaseError(err);
      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-md rounded-card border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="font-semibold text-foreground">Editar Pedido</h2>
            <p className="text-xs text-muted-foreground">{order.code}</p>
          </div>
          <button onClick={onClose} className="rounded-button p-1 hover:bg-muted">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto p-4 space-y-4">

          {/* Items (read-only) */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Itens do pedido</p>
            <div className="rounded-button border border-border bg-muted/30 p-2 space-y-1">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{item.quantity}× {item.product.name}</span>
                  <span className="tabular-nums font-medium">{formatPrice(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-1 flex justify-between text-xs font-semibold">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatPrice(subtotal)}</span>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cliente</p>
            <div className="space-y-2">
              <input
                type="text" placeholder="Nome *" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-button border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="tel" placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-button border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {!order.isPickup && (
                <>
                  <input
                    type="text" placeholder="Bairro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full rounded-button border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    type="text" placeholder="Endereço" value={address} onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-button border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </>
              )}
              {order.origin === 'local' && (
                <input
                  type="text" placeholder="Mesa / Comanda" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full rounded-button border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              )}
              <input
                type="text" placeholder="Observações / Referência" value={reference} onChange={(e) => setReference(e.target.value)}
                className="w-full rounded-button border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, { label: string; color: string }][]).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => setStatus(key)}
                  className={`rounded-button px-2 py-1.5 text-xs font-medium transition-colors ${
                    status === key ? ORDER_STATUS_LABELS[key].color : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pagamento</p>
            <div className="grid grid-cols-2 gap-1.5">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPayment(opt.value)}
                  className={`rounded-button px-3 py-2 text-xs font-medium transition-colors ${
                    payment === opt.value ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Discount */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Desconto (R$)</p>
            <input
              type="number" min="0" step="0.01" placeholder="0,00"
              value={discount} onChange={(e) => setDiscount(e.target.value)}
              className="w-full rounded-button border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {newDiscount > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Novo total: <strong className="text-foreground">{formatPrice(newTotal)}</strong>
                <span className="ml-1 text-green-600">(desconto de {formatPrice(newDiscount)})</span>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-border p-4">
          <button onClick={onClose} className="flex-1 rounded-button border border-border py-2 text-sm text-muted-foreground hover:bg-muted">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-button bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Save size={14} />
            )}
            Salvar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Delete Confirmation ────────────────────────────────────
interface DeleteConfirmProps {
  order: Order;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function DeleteConfirm({ order, onClose, onConfirm }: DeleteConfirmProps) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      toast({ title: `Pedido ${order.code} excluído` });
      onClose();
    } catch (err) {
      const mapped = mapSupabaseError(err);
      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-sm rounded-card border border-border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10">
            <Trash2 size={16} className="text-destructive" />
          </div>
          <h2 className="font-semibold text-foreground">Excluir pedido?</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          O pedido <strong className="text-foreground">{order.code}</strong> de <strong className="text-foreground">{order.customer.name}</strong> ({formatPrice(order.total)}) será excluído permanentemente.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Esta ação não pode ser desfeita.</p>
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-button border border-border py-2 text-sm text-muted-foreground hover:bg-muted">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-button bg-destructive py-2 text-sm font-medium text-destructive-foreground disabled:opacity-50"
          >
            {deleting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-destructive-foreground border-t-transparent" />
            ) : (
              <Trash2 size={13} />
            )}
            Excluir
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function AdminOrders() {
  const { orders, loading, loadError, updateStatus, updateOrder, deleteOrder, initFromDB, subscribeRealtime } = useOrderStore();
  const { config: storeConfig } = useStoreConfigStore();
  const { storeId } = useStoreCtx();
  const [filter,        setFilter]        = useState<string>('all');
  const [refreshing,    setRefreshing]    = useState(false);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [editingOrder,  setEditingOrder]  = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!storeId) return;
    const unsubscribe = subscribeRealtime(storeId);
    setRealtimeActive(true);
    return () => { unsubscribe(); setRealtimeActive(false); };
  }, [subscribeRealtime, storeId]);

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
    await initFromDB(storeId || undefined);
    setRefreshing(false);
    toast({ title: 'Pedidos atualizados' });
  };

  // ── Loading skeleton ──────────────────────────────────────
  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">Pedidos</h1>
        </div>
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-card border border-border bg-card p-4">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="mt-2 h-3 w-48 rounded bg-muted" />
              <div className="mt-3 h-3 w-24 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error banner ──────────────────────────────────────────
  if (loadError) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">Pedidos</h1>
          <button
            onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Tentar novamente
          </button>
        </div>
        <div className="mt-6 rounded-card border border-destructive/40 bg-destructive/5 p-6 text-center">
          <WifiOff size={32} className="mx-auto text-destructive/60" />
          <p className="mt-3 text-sm font-medium text-destructive">Não foi possível carregar os pedidos</p>
          <p className="mt-1 text-xs text-muted-foreground">Verifique sua conexão e clique em "Tentar novamente".</p>
        </div>
      </div>
    );
  }

  // ── Main view ─────────────────────────────────────────────
  return (
    <div>
      {/* Modals */}
      <AnimatePresence>
        {editingOrder && (
          <EditModal
            key="edit"
            order={editingOrder}
            onClose={() => setEditingOrder(null)}
            onSave={(updates) => updateOrder(editingOrder.id, updates)}
          />
        )}
        {deletingOrder && (
          <DeleteConfirm
            key="delete"
            order={deletingOrder}
            onClose={() => setDeletingOrder(null)}
            onConfirm={() => deleteOrder(deletingOrder.id)}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-foreground">Pedidos</h1>
          {realtimeActive && (
            <span className="flex items-center gap-1 rounded-button bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
              <Wifi size={9} /> Ao vivo
            </span>
          )}
        </div>
        <button
          onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Status filter */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`shrink-0 rounded-button px-3 py-1.5 text-xs font-medium ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
        >
          Todos ({orders.length})
        </button>
        {Object.entries(ORDER_STATUS_LABELS).map(([key, { label, color }]) => (
          <button
            key={key} onClick={() => setFilter(key)}
            className={`shrink-0 rounded-button px-3 py-1.5 text-xs font-medium ${filter === key ? color : 'bg-muted text-muted-foreground'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Order list */}
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
                  <span className={`rounded-button px-2 py-0.5 text-[10px] font-medium ${ORDER_STATUS_LABELS[order.status]?.color}`}>
                    {ORDER_STATUS_LABELS[order.status]?.label}
                  </span>
                  {order.outsideHours && (
                    <span className="rounded-button bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">⏰ Fora do horário</span>
                  )}
                  {order.origin && order.origin !== 'online' && (
                    <span className={`rounded-button px-2 py-0.5 text-[10px] font-medium ${
                      order.origin === 'balcao'          ? 'bg-blue-100 text-blue-700' :
                      order.origin === 'local'           ? 'bg-purple-100 text-purple-700' :
                      order.origin === 'manual_delivery' ? 'bg-teal-100 text-teal-700' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {order.origin === 'balcao'          ? '🏪 Balcão' :
                       order.origin === 'local'           ? `🪑 Local${order.tableNumber ? ` • ${order.tableNumber}` : ''}` :
                       order.origin === 'manual_delivery' ? '📦 Delivery Manual' : order.origin}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{order.customer.name} • {order.customer.phone}</p>
                <p className="text-xs text-muted-foreground">
                  {order.isPickup
                    ? '🏪 Retirada'
                    : [order.customer.neighborhood, order.city, order.state].filter(Boolean).join(' — ') || order.customer.address}
                </p>
                {order.customer.address && !order.isPickup && (
                  <p className="text-xs text-muted-foreground">{order.customer.address}</p>
                )}
              </div>
              <span className="tabular-nums text-sm font-bold text-foreground">{formatPrice(order.total)}</span>
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
            <div className="mt-3 flex flex-wrap gap-2">
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
                  onClick={() => { handleStatusChange(order.id, 'cancelled'); toast({ title: 'Pedido cancelado' }); }}
                  className="rounded-button border border-destructive px-3 py-1.5 text-xs font-medium text-destructive"
                >
                  Cancelar
                </motion.button>
              )}

              {/* Edit & Delete */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditingOrder(order)}
                className="flex items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                <Pencil size={12} /> Editar
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setDeletingOrder(order)}
                className="flex items-center gap-1.5 rounded-button border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive/70 hover:bg-destructive/5 hover:text-destructive"
              >
                <Trash2 size={12} /> Excluir
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => printOrder(order, storeConfig.name)}
                className="ml-auto flex items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                <Printer size={12} /> Imprimir
              </motion.button>
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
