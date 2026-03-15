import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Save, Upload, Star, TrendingUp } from 'lucide-react';
import { useProductsStore } from '@/store/productsStore';
import { compressImage } from '@/lib/imageUtils';
import { formatPrice } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';
import type { Product } from '@/types';

type FormState = {
  name: string;
  description: string;
  basePrice: string;
  minQuantity: string;
  categoryId: string;
  featured: boolean;
  bestSeller: boolean;
  image: string;
};

const emptyForm = (): FormState => ({
  name: '',
  description: '',
  basePrice: '',
  minQuantity: '1',
  categoryId: '',
  featured: false,
  bestSeller: false,
  image: '',
});

function productToForm(p: Product): FormState {
  return {
    name: p.name,
    description: p.description,
    basePrice: String(p.basePrice),
    minQuantity: String(p.minQuantity),
    categoryId: p.categoryId,
    featured: p.featured,
    bestSeller: p.bestSeller,
    image: p.image,
  };
}

export default function AdminProducts() {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useProductsStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [imgPreview, setImgPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const openAdd = () => {
    setForm(emptyForm());
    setImgPreview('');
    setEditingId(null);
    setAdding(true);
  };

  const openEdit = (p: Product) => {
    setForm(productToForm(p));
    setImgPreview(p.image);
    setAdding(false);
    setEditingId(p.id);
  };

  const closeForm = () => {
    setAdding(false);
    setEditingId(null);
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await compressImage(file, 400);
      setImgPreview(b64);
      setForm((f) => ({ ...f, image: b64 }));
    } catch {
      toast({ title: 'Erro ao processar imagem', variant: 'destructive' });
    }
  };

  const handleImageUrl = (url: string) => {
    setForm((f) => ({ ...f, image: url }));
    setImgPreview(url);
  };

  const validate = () => {
    if (!form.name.trim()) { toast({ title: 'Nome obrigatório', variant: 'destructive' }); return false; }
    if (!form.basePrice || isNaN(Number(form.basePrice))) { toast({ title: 'Preço inválido', variant: 'destructive' }); return false; }
    if (!form.categoryId) { toast({ title: 'Selecione uma categoria', variant: 'destructive' }); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      basePrice: parseFloat(form.basePrice),
      minQuantity: Math.max(1, parseInt(form.minQuantity) || 1),
      categoryId: form.categoryId,
      featured: form.featured,
      bestSeller: form.bestSeller,
      image: form.image || imgPreview,
      options: [],
    };
    if (editingId) {
      updateProduct(editingId, data);
      toast({ title: 'Produto atualizado!' });
    } else {
      addProduct({ ...data, id: crypto.randomUUID() });
      toast({ title: 'Produto adicionado!' });
    }
    await new Promise((r) => setTimeout(r, 200));
    setSaving(false);
    closeForm();
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    setConfirmDelete(null);
    toast({ title: 'Produto removido' });
  };

  const inputCls =
    'w-full rounded-button border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  const showForm = adding || editingId !== null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Produtos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie o cardápio</p>
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-button bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> Novo Produto
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="mt-6">
        <h2 className="label-caps text-muted-foreground">Categorias ({categories.length})</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span key={cat.id} className="rounded-button bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
              {cat.name}
            </span>
          ))}
        </div>
      </div>

      {/* Form (add or edit) */}
      {showForm && (
        <div className="mt-6 rounded-card border border-border bg-card p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              {adding ? 'Novo Produto' : 'Editar Produto'}
            </h2>
            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>

          {/* Image */}
          <div className="mb-4 flex items-start gap-4">
            {imgPreview ? (
              <img src={imgPreview} alt="" className="h-20 w-20 rounded-lg object-cover border border-border shrink-0" />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground text-xs text-center">
                Sem imagem
              </div>
            )}
            <div className="flex flex-1 flex-col gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-button border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Upload size={14} /> Enviar imagem
              </button>
              <input
                type="text"
                placeholder="…ou cole uma URL de imagem"
                value={form.image.startsWith('data:') ? '' : form.image}
                onChange={(e) => handleImageUrl(e.target.value)}
                className="rounded-button border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">Nome *</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Preço (R$) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.basePrice}
                onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Quantidade mínima</label>
              <input
                type="number"
                min="1"
                value={form.minQuantity}
                onChange={(e) => setForm((f) => ({ ...f, minQuantity: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">Categoria *</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className={inputCls}
              >
                <option value="">Selecione…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                className="h-4 w-4 accent-primary"
              />
              <Star size={14} className="text-primary" /> Destaque
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.bestSeller}
                onChange={(e) => setForm((f) => ({ ...f, bestSeller: e.target.checked }))}
                className="h-4 w-4 accent-primary"
              />
              <TrendingUp size={14} className="text-accent" /> Mais Vendido
            </label>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-button bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Salvando…' : editingId ? 'Salvar Alterações' : 'Adicionar Produto'}
          </button>
        </div>
      )}

      {/* Product list */}
      <div className="mt-6 space-y-3">
        {products.map((product) => {
          const cat = categories.find((c) => c.id === product.categoryId);
          const isConfirmingDelete = confirmDelete === product.id;
          return (
            <div key={product.id} className="rounded-card border border-border bg-card p-3 shadow-soft">
              <div className="flex items-center gap-4">
                <img src={product.image} alt={product.name} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-sm font-semibold text-foreground">{product.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{cat?.name}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="tabular-nums text-sm font-medium text-primary">{formatPrice(product.basePrice)}</span>
                    {product.minQuantity > 1 && (
                      <span className="text-[10px] text-muted-foreground">Mín. {product.minQuantity}</span>
                    )}
                    {product.bestSeller && (
                      <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">Top</span>
                    )}
                    {product.featured && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Destaque</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => openEdit(product)}
                    className="flex h-8 w-8 items-center justify-center rounded-button border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(product.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-button border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {isConfirmingDelete && (
                <div className="mt-3 flex items-center gap-3 rounded-button bg-destructive/10 p-3">
                  <span className="flex-1 text-xs text-destructive">Excluir "{product.name}"?</span>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="rounded-button bg-destructive px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Excluir
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="rounded-button border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
      )}
    </div>
  );
}
