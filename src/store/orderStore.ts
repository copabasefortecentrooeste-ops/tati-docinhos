import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order } from '@/types';
import { supabase } from '@/lib/supabase';
import { whatsAppService, ORDER_STATUS_TO_WA_EVENT } from '@/lib/whatsapp';
import { formatPrice } from '@/lib/format';

const TATY_STORE_ID = 'aaaaaaaa-0000-0000-0000-000000000001';

// ── Mappers ────────────────────────────────────────────────
const fromDB = (r: Record<string, unknown>): Order => ({
  id: r.id as string,
  code: r.code as string,
  status: r.status as Order['status'],
  items: r.items as Order['items'],
  customer: r.customer as Order['customer'],
  customerId: r.customer_id as string | undefined,
  isPickup: r.is_pickup as boolean,
  deliveryFee: r.delivery_fee as number,
  subtotal: r.subtotal as number,
  discount: r.discount as number,
  total: r.total as number,
  city: r.city as string | undefined,
  state: r.state as string | undefined,
  cep: r.cep as string | undefined,
  paymentMethod: r.payment_method as string,
  changeFor: r.change_for as number | undefined,
  couponCode: r.coupon_code as string | undefined,
  scheduledDate: r.scheduled_date as string | undefined,
  scheduledTime: r.scheduled_time as string | undefined,
  outsideHours: (r.outside_hours as boolean) ?? false,
  requestId: r.request_id as string | undefined,
  createdAt: r.created_at as string,
});

const toDB = (o: Order) => ({
  id: o.id,
  code: o.code,
  status: o.status,
  items: o.items,
  customer: o.customer,
  customer_id: o.customerId ?? null,
  is_pickup: o.isPickup,
  delivery_fee: o.deliveryFee,
  subtotal: o.subtotal,
  discount: o.discount,
  total: o.total,
  city: o.city ?? null,
  state: o.state ?? null,
  cep: o.cep ?? null,
  payment_method: o.paymentMethod,
  change_for: o.changeFor ?? null,
  coupon_code: o.couponCode ?? null,
  scheduled_date: o.scheduledDate ?? null,
  scheduled_time: o.scheduledTime ?? null,
  outside_hours: o.outsideHours ?? false,
  request_id: o.requestId ?? null,
  created_at: o.createdAt,
});

// ── Store ──────────────────────────────────────────────────
interface OrderState {
  orders: Order[];
  /** True while initFromDB is in flight. Always starts true (never persisted). */
  loading: boolean;
  loadError: boolean;
  addOrder: (order: Order, storeId?: string) => Promise<void>;
  updateStatus: (id: string, status: Order['status']) => Promise<void>;
  getOrderByCode: (code: string) => Order | undefined;
  initFromDB: (storeId?: string) => Promise<void>;
  /**
   * Subscribe to Supabase Realtime for INSERT/UPDATE on the orders table.
   * Returns a cleanup function — call it on component unmount.
   *
   * Deduplication: INSERT events are ignored if the order id is already in
   * the list (prevents doubling the addOrder optimistic update).
   */
  subscribeRealtime: (storeId?: string) => () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      loading: true, // starts true; set to false after first initFromDB
      loadError: false,

      initFromDB: async (storeId?: string) => {
        const sid = storeId || TATY_STORE_ID;
        set({ loading: true, loadError: false });
        try {
          const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('store_id', sid)
            .order('created_at', { ascending: false });
          set({ orders: data ? data.map(fromDB) : [], loading: false });
        } catch (err) {
          console.warn('[orders] offline', err);
          set({ loading: false, loadError: true });
        }
      },

      subscribeRealtime: (storeId?: string) => {
        const sid = storeId || TATY_STORE_ID;
        const channel = supabase
          .channel(`admin-orders-realtime-${sid}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'orders', filter: `store_id=eq.${sid}` },
            (payload) => {
              const newOrder = fromDB(payload.new as Record<string, unknown>);
              set((s) => {
                // Skip if already present from addOrder optimistic insert
                if (s.orders.some((o) => o.id === newOrder.id)) return s;
                return { orders: [newOrder, ...s.orders] };
              });
            },
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'orders', filter: `store_id=eq.${sid}` },
            (payload) => {
              const updated = fromDB(payload.new as Record<string, unknown>);
              set((s) => ({
                orders: s.orders.map((o) => (o.id === updated.id ? updated : o)),
              }));
            },
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      },

      addOrder: async (order, storeId?: string) => {
        const sid = storeId || TATY_STORE_ID;
        set((s) => ({ orders: [order, ...s.orders] }));
        try {
          await supabase.from('orders').insert({ ...toDB(order), store_id: sid });
          // Decrement stock for managed-stock products
          for (const item of order.items) {
            const product = item.product;
            if (product.manageStock === true) {
              const currentQty = product.stockQty ?? 0;
              const newQty = Math.max(0, currentQty - item.quantity);
              // Update stock_qty in DB
              await supabase
                .from('products')
                .update({ stock_qty: newQty })
                .eq('id', product.id);
              // Insert stock movement
              await supabase.from('stock_movements').insert({
                product_id: product.id,
                type: 'saida',
                qty: item.quantity,
                note: `Pedido #${order.code}`,
                store_id: sid,
              });
            }
          }
        } catch (err) {
          throw err;
        }
      },

      updateStatus: async (id, status) => {
        const prevOrders = get().orders;
        set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) }));
        try {
          await supabase.from('orders').update({ status }).eq('id', id);

          // Fire WhatsApp notification (fire-and-forget — never blocks the UI)
          const order = get().orders.find((o) => o.id === id);
          const eventKey = ORDER_STATUS_TO_WA_EVENT[status];
          if (order && eventKey && order.customer.phone) {
            whatsAppService.sendForOrder({
              eventKey,
              phone: order.customer.phone,
              variables: {
                nome:          order.customer.name,
                codigo:        order.code,
                loja:          'Loja',
                status,
                valor_total:   formatPrice(order.total),
                link_pedido:   `${window.location.origin}/acompanhar`,
              },
              orderId:   order.id,
              orderCode: order.code,
            }).catch(console.warn);
          }
        } catch (err) {
          set({ orders: prevOrders });
          throw err;
        }
      },

      getOrderByCode: (code) => get().orders.find((o) => o.code === code),
    }),
    {
      name: 'taty-orders',
      // Exclude transient states from localStorage — loading/loadError always
      // reset from initialState on app start, never from persisted value.
      partialize: (s) => ({ orders: s.orders }),
    },
  ),
);
