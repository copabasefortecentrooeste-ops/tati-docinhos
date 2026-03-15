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
  isPickup: r.is_pickup as boolean,
  deliveryFee: r.delivery_fee as number,
  subtotal: r.subtotal as number,
  discount: r.discount as number,
  total: r.total as number,
  paymentMethod: r.payment_method as string,
  changeFor: r.change_for as number | undefined,
  couponCode: r.coupon_code as string | undefined,
  scheduledDate: r.scheduled_date as string | undefined,
  scheduledTime: r.scheduled_time as string | undefined,
  createdAt: r.created_at as string,
});

const toDB = (o: Order) => ({
  id: o.id,
  code: o.code,
  status: o.status,
  items: o.items,
  customer: o.customer,
  is_pickup: o.isPickup,
  delivery_fee: o.deliveryFee,
  subtotal: o.subtotal,
  discount: o.discount,
  total: o.total,
  payment_method: o.paymentMethod,
  change_for: o.changeFor ?? null,
  coupon_code: o.couponCode ?? null,
  scheduled_date: o.scheduledDate ?? null,
  scheduled_time: o.scheduledTime ?? null,
  created_at: o.createdAt,
});

// ── Store ──────────────────────────────────────────────────
interface OrderState {
  orders: Order[];
  addOrder: (order: Order) => Promise<void>;
  updateStatus: (id: string, status: Order['status']) => Promise<void>;
  getOrder: (code: string, phone: string) => Order | undefined;
  getOrderByCode: (code: string) => Order | undefined;
  initFromDB: () => Promise<void>;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],

      initFromDB: async () => {
        try {
          const { data } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
          if (data) set({ orders: data.map(fromDB) });
        } catch { console.warn('[orders] offline'); }
      },

      addOrder: async (order) => {
        set((s) => ({ orders: [order, ...s.orders] }));
        try { await supabase.from('orders').insert(toDB(order)); } catch { /**/ }
      },

      updateStatus: async (id, status) => {
        set((s) => ({ orders: s.orders.map((o) => o.id === id ? { ...o, status } : o) }));
        try { await supabase.from('orders').update({ status }).eq('id', id); } catch { /**/ }
      },

      getOrder: (code, phone) => get().orders.find((o) => o.code === code && o.customer.phone === phone),
      getOrderByCode: (code) => get().orders.find((o) => o.code === code),
    }),
    { name: 'taty-orders' }
  )
);
