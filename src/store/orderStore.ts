import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order } from '@/types';
import { supabase } from '@/lib/supabase';

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
  addOrder: (order: Order) => Promise<void>;
  updateStatus: (id: string, status: Order['status']) => Promise<void>;
  getOrder: (code: string, phone: string) => Order | undefined;
  getOrderByCode: (code: string) => Order | undefined;
  getCustomerOrders: (customerId: string) => Order[];
  initFromDB: () => Promise<void>;
  /**
   * Subscribe to Supabase Realtime for INSERT/UPDATE on the orders table.
   * Returns a cleanup function — call it on component unmount.
   *
   * Deduplication: INSERT events are ignored if the order id is already in
   * the list (prevents doubling the addOrder optimistic update).
   */
  subscribeRealtime: () => () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      loading: true, // starts true; set to false after first initFromDB
      loadError: false,

      initFromDB: async () => {
        set({ loading: true, loadError: false });
        try {
          const { data } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
          set({ orders: data ? data.map(fromDB) : [], loading: false });
        } catch (err) {
          console.warn('[orders] offline', err);
          set({ loading: false, loadError: true });
        }
      },

      subscribeRealtime: () => {
        const channel = supabase
          .channel('admin-orders-realtime')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'orders' },
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
            { event: 'UPDATE', schema: 'public', table: 'orders' },
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

      addOrder: async (order) => {
        set((s) => ({ orders: [order, ...s.orders] }));
        try {
          await supabase.from('orders').insert(toDB(order));
        } catch (err) {
          throw err;
        }
      },

      updateStatus: async (id, status) => {
        const prevOrders = get().orders;
        set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) }));
        try {
          await supabase.from('orders').update({ status }).eq('id', id);
        } catch (err) {
          set({ orders: prevOrders });
          throw err;
        }
      },

      getOrder: (code, phone) =>
        get().orders.find((o) => o.code === code && o.customer.phone === phone),
      getOrderByCode: (code) => get().orders.find((o) => o.code === code),
      getCustomerOrders: (customerId) =>
        get().orders.filter((o) => o.customerId === customerId),
    }),
    {
      name: 'taty-orders',
      // Exclude transient states from localStorage — loading/loadError always
      // reset from initialState on app start, never from persisted value.
      partialize: (s) => ({ orders: s.orders }),
    },
  ),
);
