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
  categoryId: r.category_id as string,
  minQuantity: (r.min_quantity as number) ?? 1,
  options: (r.options as Product['options']) ?? [],
  featured: (r.featured as boolean) ?? false,
  bestSeller: (r.best_seller as boolean) ?? false,
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
});

const catFromDB = (r: Record<string, unknown>): Category => ({
  id: r.id as string,
  name: r.name as string,
  slug: r.slug as string,
  image: (r.image as string) ?? '',
  description: (r.description as string) ?? '',
});

const catToDB = (c: Category) => ({
  id: c.id, name: c.name, slug: c.slug, image: c.image, description: c.description,
});

// ── Store ──────────────────────────────────────────────────
interface ProductsState {
  products: Product[];
  categories: Category[];
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  initFromDB: () => Promise<void>;
}

export const useProductsStore = create<ProductsState>()(
  persist(
    (set, get) => ({
      products: defaultProducts,
      categories: defaultCategories,

      initFromDB: async () => {
        try {
          const [{ data: prods }, { data: cats }] = await Promise.all([
            supabase.from('products').select('*'),
            supabase.from('categories').select('*'),
          ]);
          if (prods && prods.length > 0) {
            set({ products: prods.map(prodFromDB) });
          } else {
            // Seed defaults
            await supabase.from('categories').upsert(get().categories.map(catToDB));
            await supabase.from('products').upsert(get().products.map(prodToDB));
          }
          if (cats && cats.length > 0) set({ categories: cats.map(catFromDB) });
        } catch (e) {
          console.warn('[products] offline, using local data');
        }
      },

      addProduct: async (product) => {
        set((s) => ({ products: [...s.products, product] }));
        try { await supabase.from('products').insert(prodToDB(product)); } catch { /**/ }
      },

      updateProduct: async (id, updates) => {
        set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...updates } : p)) }));
        const updated = get().products.find((p) => p.id === id);
        if (updated) {
          try { await supabase.from('products').update(prodToDB(updated)).eq('id', id); } catch { /**/ }
        }
      },

      deleteProduct: async (id) => {
        set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
        try { await supabase.from('products').delete().eq('id', id); } catch { /**/ }
      },
    }),
    { name: 'taty-products' }
  )
);
