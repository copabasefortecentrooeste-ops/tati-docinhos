import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity: number, selectedOptions: Record<string, string>, notes?: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity, selectedOptions, notes) => {
        const optionsPrice = product.options.reduce((sum, opt) => {
          const selectedId = selectedOptions[opt.id];
          const choice = opt.choices.find(c => c.id === selectedId);
          return sum + (choice?.priceAdd || 0);
        }, 0);
        const unitPrice = product.basePrice + optionsPrice;
        const id = `${product.id}-${JSON.stringify(selectedOptions)}-${Date.now()}`;

        set((state) => ({
          items: [...state.items, { id, product, quantity, selectedOptions, notes, unitPrice }],
        }));
      },

      removeItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      })),

      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, quantity: Math.max(item.product.minQuantity, quantity) } : item
        ),
      })),

      clearCart: () => set({ items: [] }),

      getSubtotal: () => get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),

      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    { name: 'taty-cart' }
  )
);
