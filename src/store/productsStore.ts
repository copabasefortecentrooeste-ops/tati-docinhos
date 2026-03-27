import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, Category } from '@/types';
import { products as defaultProducts, categories as defaultCategories } from '@/data/mockData';
import { supabase } from '@/lib/supabase';

// ── Mappers ────────────────────────────────────────────────
const prodFromDB = (r: Record<string, unknown>): Product => ({
  id: r.id as string,
  name: r.name as string,
  description: (r.description as string) ?? '',
  basePrice: r.base_price as number,
  image: (r.image as string) ?? '',
  categoryId: (r.category_id as string) ?? '',
  minQuantity: (r.min_quantity as number) ?? 1,
  options: (r.options as Product['options']) ?? [],
  featured: (r.featured as boolean) ?? false,
  bestSeller: (r.best_seller as boolean) ?? false,
  inStock: r.in_stock !== undefined ? (r.in_stock as boolean) : true,
  stockQty: r.stock_qty as number | null | undefined,
  active: r.active !== undefined ? (r.active as boolean) : true,
  manageStock: (r.manage_stock as boolean) ?? false,
  stockAlertQty: (r.stock_alert_qty as number) ?? 5,
  allowSellWhenEmpty: (r.allow_sell_when_empty as boolean) ?? false,
  emptyStockBehavior: (r.empty_stock_behavior as 'unavailable' | 'whatsapp') ?? 'unavailable',
});

const prodToDB = (p: Product) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  base_price: p.basePrice,
  image: p.image,
  category_id: p.categoryId,
  min_quantity: p.minQuantity,
  options: p.options,
  featured: p.featured,
  best_seller: p.bestSeller,
  in_stock: p.inStock ?? true,
  stock_qty: p.stockQty ?? null,
  active: p.active ?? true,
  manage_stock: p.manageStock ?? false,
  stock_alert_qty: p.stockAlertQty ?? 5,
  allow_sell_when_empty: p.allowSellWhenEmpty ?? false,
  empty_stock_behavior: p.emptyStockBehavior ?? 'unavailable',
});

const catFromDB = (r: Record<string, unknown>): Category => ({
  id: r.id as string,
  name: r.name as string,
  slug: r.slug as string,
  image: (r.image as string) ?? '',
  description: (r.description as string) ?? '',
  sortOrder: (r.sort_order as number) ?? 0,
  active: (r.active as boolean) ?? true,
});

const catToDB = (c: Category) => ({
  id: c.id, name: c.name, slug: c.slug, image: c.image ?? '', description: c.description ?? '',
  sort_order: c.sortOrder ?? 0, active: c.active ?? true,
});

// ── Store ──────────────────────────────────────────────────
interface ProductsState {
  products: Product[];
  categories: Category[];
  /** True while initFromDB is in flight. Never persisted. */
  loading: boolean;
  loadError: boolean;

  // Products
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Categories
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<{ ok: boolean; reason?: string }>;

  initFromDB: () => Promise<void>;
}

export const useProductsStore = create<ProductsState>()(
  persist(
    (set, get) => ({
      products: defaultProducts,
      categories: defaultCategories,
      loading: true,
      loadError: false,

      // ── Init ──────────────────────────────────────────────
      initFromDB: async () => {
        set({ loading: true, loadError: false });
        try {
          const [{ data: prods }, { data: cats }] = await Promise.all([
            supabase.from('products').select('*'),
            supabase.from('categories').select('*'),
          ]);

          if (cats && cats.length > 0) {
            set({ categories: cats.map(catFromDB) });
          } else {
            await supabase.from('categories').upsert(get().categories.map(catToDB));
          }

          if (prods && prods.length > 0) {
            set({ products: prods.map(prodFromDB) });
          } else {
            await supabase.from('products').upsert(get().products.map(prodToDB));
          }

          set({ loading: false });
        } catch (err) {
          console.warn('[products] offline, using local data', err);
          set({ loading: false, loadError: true });
        }
      },

      // ── Product CRUD ──────────────────────────────────────
      addProduct: async (product) => {
        const prevProducts = get().products;
        const prevCategories = get().categories;
        set((s) => ({ products: [...s.products, product] }));
        try {
          await supabase.from('products').insert(prodToDB(product));
        } catch (err) {
          set({ products: prevProducts, categories: prevCategories });
          throw err;
        }
      },

      updateProduct: async (id, updates) => {
        const prevProducts = get().products;
        const prevCategories = get().categories;
        set((s) => ({ products: s.products.map((p) => p.id === id ? { ...p, ...updates } : p) }));
        const updated = get().products.find((p) => p.id === id);
        if (updated) {
          try {
            await supabase.from('products').update(prodToDB(updated)).eq('id', id);
          } catch (err) {
            set({ products: prevProducts, categories: prevCategories });
            throw err;
          }
        }
      },

      deleteProduct: async (id) => {
        const prevProducts = get().products;
        const prevCategories = get().categories;
        set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
        try {
          await supabase.from('products').delete().eq('id', id);
        } catch (err) {
          set({ products: prevProducts, categories: prevCategories });
          throw err;
        }
      },

      // ── Category CRUD ─────────────────────────────────────
      addCategory: async (category) => {
        const prevProducts = get().products;
        const prevCategories = get().categories;
        set((s) => ({ categories: [...s.categories, category] }));
        try {
          await supabase.from('categories').insert(catToDB(category));
        } catch (err) {
          set({ products: prevProducts, categories: prevCategories });
          throw err;
        }
      },

      updateCategory: async (id, updates) => {
        const prevProducts = get().products;
        const prevCategories = get().categories;
        set((s) => ({
          categories: s.categories.map((c) => c.id === id ? { ...c, ...updates } : c),
        }));
        const updated = get().categories.find((c) => c.id === id);
        if (updated) {
          try {
            await supabase.from('categories').update(catToDB(updated)).eq('id', id);
          } catch (err) {
            set({ products: prevProducts, categories: prevCategories });
            throw err;
          }
        }
      },

      deleteCategory: async (id) => {
        const hasProducts = get().products.some((p) => p.categoryId === id);
        if (hasProducts) {
          return { ok: false, reason: 'Existem produtos vinculados a esta categoria. Remova ou mova os produtos primeiro.' };
        }
        const prevProducts = get().products;
        const prevCategories = get().categories;
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
        try {
          await supabase.from('categories').delete().eq('id', id);
        } catch (err) {
          set({ products: prevProducts, categories: prevCategories });
          throw err;
        }
        return { ok: true };
      },
    }),
    {
      name: 'taty-products',
      partialize: (s) => ({ products: s.products, categories: s.categories }),
    },
  ),
);
