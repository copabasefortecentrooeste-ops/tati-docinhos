import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Save, Upload, Star, TrendingUp, ChevronDown, ChevronUp, Tag, WifiOff, RefreshCw, BarChart2 } from 'lucide-react';
import { useProductsStore } from '@/store/productsStore';
import { useStoreCtx } from '@/contexts/StoreContext';
import { compressImage } from '@/lib/imageUtils';
import { uploadProductImage } from '@/lib/storageUtils';
import { formatPrice } from '@/lib/format';
import { mapSupabaseError } from '@/lib/supabaseError';
import { inputCls } from '@/lib/adminStyles';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { Product, Category, StockMovement } from '@/types';

// ── helpers ───────────────────────────────────────────────
function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ── types ─────────────────────────────────────────────────
type ProductForm = {
  name: string; description: string; basePrice: string;
  minQuantity: string; categoryId: string; featured: boolean; bestSeller: boolean; image: string;
  manageStock: boolean; stockQty: string; stockAlertQty: string;
  allowSellWhenEmpty: boolean; emptyStockBehavior: 'unavailable' | 'whatsapp';
};
type CatForm = { name: string; description: string };

const emptyProduct = (): ProductForm => ({
  name: '', description: '', basePrice: '', minQuantity: '1',
  categoryId: '', featured: false, bestSeller: false, image: '',
  manageStock: false, stockQty: '', stockAlertQty: '5',
  allowSellWhenEmpty: false, emptyStockBehavior: 'unavailable',
});
const emptyCat = (): CatForm => ({ name: '', description: '' });

function productToForm(p: Product): ProductForm {
  return {
    name: p.name, description: p.description, basePrice: String(p.basePrice),
    minQuantity: String(p.minQuantity), categoryId: p.categoryId,
    featured: p.featured, bestSeller: p.bestSeller, image: p.image,
    manageStock: p.manageStock ?? false,
    stockQty: p.stockQty != null ? String(p.stockQty) : '',
    stockAlertQty: String(p.stockAlertQty ?? 5),
    allowSellWhenEmpty: p.allowSellWhenEmpty ?? false,
    emptyStockBehavior: p.emptyStockBehavior ?? 'unavailable',
  };
}

// ═══════════════════════════════════════════════════════════
export default function AdminProducts() {
  const {
    products, categories, loadError, initFromDB,
    addProduct, updateProduct, deleteProduct,
    addCategory, updateCategory, deleteCategory,
  } = useProductsStore();
  const { storeId } = useStoreCtx();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    await initFromDB(storeId || undefined);
    setRetrying(false);
  };

  // ── categories state ──────────────────────────────────────
  const [catOpen, setCatOpen] = useState(false);
  const [addingCat, setAddingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState<CatForm>(emptyCat());
  const [savingCat, setSavingCat] = useState(false);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<string | null>(null);

  // ── products state ────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyProduct());
  const [imgPreview, setImgPreview] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── stock movements state ─────────────────────────────────
  const [movementsProductId, setMovementsProductId] = useState<string | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [movType, setMovType] = useState<'entrada' | 'saida' | 'ajuste'>('ajuste');
  const [movQty, setMovQty] = useState('');
  const [movNote, setMovNote] = useState('');
  const [savingMov, setSavingMov] = useState(false);

  // ── category handlers ─────────────────────────────────────
  const openAddCat = () => { setCatForm(emptyCat()); setEditingCatId(null); setAddingCat(true); };
  const openEditCat = (c: Category) => {
    setCatForm({ name: c.name, description: c.description ?? '' });
    setEditingCatId(c.id); setAddingCat(false);
  };
  const closeCatForm = () => { setAddingCat(false); setEditingCatId(null); };

  const handleSaveCat = async () => {
    if (!catForm.name.trim()) {
      toast({ title: 'Nome da categoria obrigatório', variant: 'destructive' }); return;
    }
    setSavingCat(true);
    try {
      if (editingCatId) {
        await updateCategory(editingCatId, { name: catForm.name.trim(), description: catForm.description.trim() });
        toast({ title: 'Categoria atualizada!' });
      } else {
        await addCategory({
          id: crypto.randomUUID(), name: catForm.name.trim(),
          slug: slugify(catForm.name), description: catForm.description.trim(), image: '',
        });
        toast({ title: 'Categoria criada!' });
      }
      closeCatForm();
    } catch (err) {
      const mapped = mapSupabaseError(err);
      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCat = async (id: string) => {
    try {
      const result = await deleteCategory(id);
      if (!result.ok) {
        toast({ title: 'Não foi possível excluir', description: result.reason, variant: 'destructive' });
      } else {
        toast({ title: 'Categoria removida' });
      }
    } catch (err) {
      const mapped = mapSupabaseError(err);
      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
    }
    setConfirmDeleteCat(null);
  };

  // ── product handlers ──────────────────────────────────────
  const openAdd = () => {
    setForm(emptyProduct()); setImgPreview(''); setPendingFile(null);
    setEditingId(null); setAdding(true);
  };
  const openEdit = (p: Product) => {
    setForm(productToForm(p)); setImgPreview(p.image); setPendingFile(null);
    setAdding(false); setEditingId(p.id);
  };
  const closeForm = () => { setAdding(false); setEditingId(null); };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    try {
      const preview = await compressImage(file, 400);
      setImgPreview(preview);
      setForm((f) => ({ ...f, image: '' }));
    } catch {
      toast({ title: 'Erro ao ler imagem', variant: 'destructive' });
    }
    e.target.value = '';
  };

  const handleImageUrl = (url: string) => {
    setPendingFile(null); setForm((f) => ({ ...f, image: url })); setImgPreview(url);
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

    let imageUrl = form.image;
    if (pendingFile) {
      try {
        imageUrl = await uploadProductImage(pendingFile);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        toast({ title: 'Falha no upload da imagem', description: msg, variant: 'destructive' });
        setSaving(false); return;
      }
    }

    const data = {
      name: form.name.trim(), description: form.description.trim(),
      basePrice: parseFloat(form.basePrice),
      minQuantity: Math.max(1, parseInt(form.minQuantity) || 1),
      categoryId: form.categoryId, featured: form.featured, bestSeller: form.bestSeller,
      image: imageUrl,
      options: editingId ? (products.find((p) => p.id === editingId)?.options ?? []) : [],
      manageStock: form.manageStock,
      stockQty: form.manageStock && form.stockQty !== '' ? parseInt(form.stockQty) : null,
      stockAlertQty: parseInt(form.stockAlertQty) || 5,
      allowSellWhenEmpty: form.allowSellWhenEmpty,
      emptyStockBehavior: form.emptyStockBehavior,
    };

    try {
      if (editingId) {
        await updateProduct(editingId, data);
        toast({ title: 'Produto atualizado!' });
      } else {
        await addProduct({ ...data, id: crypto.randomUUID() });
        toast({ title: 'Produto adicionado!' });
      }
      closeForm();
    } catch (err) {
      const mapped = mapSupabaseError(err);
      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      toast({ title: 'Produto removido' });
    } catch (err) {
      const mapped = mapSupabaseError(err);
      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
    }
    setConfirmDelete(null);
  };

  const openMovements = async (productId: string) => {
    setMovementsProductId(productId);
    setMovements([]);
    setMovQty(''); setMovNote(''); setMovType('ajuste');
    setLoadingMovements(true);
    try {
      const { data } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (data) {
        setMovements(data.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          productId: r.product_id as string,
          type: r.type as StockMovement['type'],
          qty: r.qty as number,
          note: r.note as string | undefined,
          createdAt: r.created_at as string,
        })));
      }
    } catch {
      toast({ title: 'Erro ao carregar movimentações', variant: 'destructive' });
    } finally {
      setLoadingMovements(false);
    }
  };

  const handleAddMovement = async () => {
    const qty = parseInt(movQty);
    if (!movementsProductId || isNaN(qty) || qty <= 0) {
      toast({ title: 'Quantidade inválida', variant: 'destructive' });
      return;
    }
    setSavingMov(true);
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .insert({ product_id: movementsProductId, type: movType, qty, note: movNote.trim() || null })
        .select()
        .single();
      if (error) throw error;
      // Adjust stock_qty in products table
      const product = products.find((p) => p.id === movementsProductId);
      if (product && product.manageStock) {
        const currentQty = product.stockQty ?? 0;
        let newQty = currentQty;
        if (movType === 'entrada') newQty = currentQty + qty;
        else if (movType === 'saida') newQty = Math.max(0, currentQty - qty);
        else newQty = qty; // ajuste = set absolute
        await updateProduct(movementsProductId, { stockQty: newQty });
      }
      const mov: StockMovement = {
        id: (data as Record<string, unknown>).id as string,
        productId: movementsProductId,
        type: movType, qty,
        note: movNote.trim() || undefined,
        createdAt: (data as Record<string, unknown>).created_at as string,
      };
      setMovements((prev) => [mov, ...prev]);
      setMovQty(''); setMovNote('');
      toast({ title: 'Movimentação registrada!' });
    } catch (err) {
      const mapped = mapSupabaseError(err);
      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
    } finally {
      setSavingMov(false);
    }
  };

  const showProductForm = adding || editingId !== null;

  // ── render ────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Produtos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie o cardápio</p>
        </div>
        {!showProductForm && (
          <button onClick={openAdd} className="flex items-center gap-2 rounded-button bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus size={16} /> Novo Produto
          </button>
        )}
      </div>

      {/* Error banner */}
      {loadError && (
        <div className="mt-4 flex items-center justify-between rounded-card border border-destructive/40 bg-destructive/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <WifiOff size={14} />
            Não foi possível carregar dados do banco. Exibindo cache local.
          </div>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="flex items-center gap-1.5 text-xs text-destructive hover:underline disabled:opacity-50"
          >
            <RefreshCw size={11} className={retrying ? 'animate-spin' : ''} />
            Tentar novamente
          </button>
        </div>
      )}

      {/* ── Categories ─────────────────────────────────────── */}
      <div className="mt-6 rounded-card border border-border bg-card shadow-soft">
        <button onClick={() => setCatOpen((v) => !v)} className="flex w-full items-center justify-between p-4 text-left">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Categorias <span className="ml-1 font-normal text-muted-foreground">({categories.length})</span>
            </span>
          </div>
          {catOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </button>

        {catOpen && (
          <div className="border-t border-border px-4 pb-4">
            <div className="mt-3 space-y-2">
              {categories.map((cat) => {
                const isEditingThis = editingCatId === cat.id;
                const isConfirmDelete = confirmDeleteCat === cat.id;
                const count = products.filter((p) => p.categoryId === cat.id).length;
                return (
                  <div key={cat.id} className="rounded-button border border-border bg-background p-2">
                    {isEditingThis ? (
                      <div className="flex items-center gap-2">
                        <input autoFocus type="text" value={catForm.name} onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="Nome" className="flex-1 rounded-button border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                        <input type="text" value={catForm.description} onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))}
                          placeholder="Descrição" className="flex-1 rounded-button border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                        <button onClick={handleSaveCat} disabled={savingCat} className="flex h-7 w-7 items-center justify-center rounded-button bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"><Save size={12} /></button>
                        <button onClick={closeCatForm} className="flex h-7 w-7 items-center justify-center rounded-button border border-border text-muted-foreground hover:text-foreground"><X size={12} /></button>
                      </div>
                    ) : isConfirmDelete ? (
                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-xs text-destructive">
                          Excluir "{cat.name}"?
                          {count > 0 && <span className="ml-1 font-semibold">({count} produto{count > 1 ? 's' : ''} vinculado{count > 1 ? 's' : ''})</span>}
                        </span>
                        <button onClick={() => handleDeleteCat(cat.id)} className="rounded-button bg-destructive px-2.5 py-1 text-xs font-semibold text-white">Excluir</button>
                        <button onClick={() => setConfirmDeleteCat(null)} className="rounded-button border border-border px-2.5 py-1 text-xs text-foreground hover:bg-muted">Cancelar</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex items-baseline gap-2">
                          <span className="text-sm font-medium text-foreground">{cat.name}</span>
                          {cat.description && <span className="text-xs text-muted-foreground">{cat.description}</span>}
                          <span className="text-[11px] text-muted-foreground">{count} produto{count !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button onClick={() => openEditCat(cat)} className="flex h-7 w-7 items-center justify-center rounded-button border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><Pencil size={12} /></button>
                          <button onClick={() => setConfirmDeleteCat(cat.id)} className="flex h-7 w-7 items-center justify-center rounded-button border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {addingCat ? (
              <div className="mt-3 flex items-center gap-2">
                <input autoFocus type="text" value={catForm.name} onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nome da categoria *" className="flex-1 rounded-button border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <input type="text" value={catForm.description} onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Descrição (opcional)" className="flex-1 rounded-button border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <button onClick={handleSaveCat} disabled={savingCat} className="flex h-8 items-center gap-1.5 rounded-button bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  <Save size={12} />{savingCat ? 'Salvando…' : 'Salvar'}
                </button>
                <button onClick={closeCatForm} className="flex h-8 w-8 items-center justify-center rounded-button border border-border text-muted-foreground hover:text-foreground"><X size={14} /></button>
              </div>
            ) : (
              <button onClick={openAddCat} className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:underline">
                <Plus size={13} /> Nova categoria
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Product form ──────────────────────────────────── */}
      {showProductForm && (
        <div className="mt-6 rounded-card border border-border bg-card p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">{adding ? 'Novo Produto' : 'Editar Produto'}</h2>
            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
          </div>

          {/* Image */}
          <div className="mb-4 flex items-start gap-4">
            {imgPreview ? (
              <img src={imgPreview} alt="" className="h-20 w-20 rounded-lg object-cover border border-border shrink-0" />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground text-xs text-center p-2">Sem imagem</div>
            )}
            <div className="flex flex-1 flex-col gap-2">
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-button border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                <Upload size={14} />
                {pendingFile ? pendingFile.name : 'Selecionar imagem'}
              </button>
              {pendingFile && <p className="text-[11px] text-muted-foreground">Upload será feito ao salvar.</p>}
              <input
                type="text"
                placeholder="…ou cole uma URL de imagem"
                value={pendingFile ? '' : (form.image.startsWith('data:') ? '' : form.image)}
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
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Preço (R$) *</label>
              <input type="number" min="0" step="0.01" value={form.basePrice} onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Quantidade mínima</label>
              <input type="number" min="1" value={form.minQuantity} onChange={(e) => setForm((f) => ({ ...f, minQuantity: e.target.value }))} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">Categoria *</label>
              <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className={inputCls}>
                <option value="">Selecione…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="h-4 w-4 accent-primary" />
              <Star size={14} className="text-primary" /> Destaque
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={form.bestSeller} onChange={(e) => setForm((f) => ({ ...f, bestSeller: e.target.checked }))} className="h-4 w-4 accent-primary" />
              <TrendingUp size={14} className="text-accent" /> Mais Vendido
            </label>
          </div>

          {/* Stock control section */}
          <div className="mt-5 rounded-card border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Controlar estoque</p>
                <p className="text-xs text-muted-foreground">Habilita rastreamento de quantidade em estoque</p>
              </div>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, manageStock: !f.manageStock }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${form.manageStock ? 'bg-primary' : 'bg-muted'}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.manageStock ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </button>
            </div>

            {form.manageStock && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Quantidade atual</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stockQty}
                    onChange={(e) => setForm((f) => ({ ...f, stockQty: e.target.value }))}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Alerta de estoque mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stockAlertQty}
                    onChange={(e) => setForm((f) => ({ ...f, stockAlertQty: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">Permitir venda quando zerado</p>
                    <p className="text-xs text-muted-foreground">Se desativado, produto ficará indisponível ou redireciona para WhatsApp</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, allowSellWhenEmpty: !f.allowSellWhenEmpty }))}
                    className={`relative h-6 w-11 rounded-full transition-colors ${form.allowSellWhenEmpty ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.allowSellWhenEmpty ? 'translate-x-5' : 'translate-x-0.5'}`}
                    />
                  </button>
                </div>
                {!form.allowSellWhenEmpty && (
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-muted-foreground">Quando zerar o estoque</label>
                    <select
                      value={form.emptyStockBehavior}
                      onChange={(e) => setForm((f) => ({ ...f, emptyStockBehavior: e.target.value as 'unavailable' | 'whatsapp' }))}
                      className={inputCls}
                    >
                      <option value="unavailable">Indisponível no cardápio</option>
                      <option value="whatsapp">Mostrar botão WhatsApp</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          <button onClick={handleSave} disabled={saving} className="mt-5 flex w-full items-center justify-center gap-2 rounded-button bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
            <Save size={16} />
            {saving ? 'Salvando…' : editingId ? 'Salvar Alterações' : 'Adicionar Produto'}
          </button>
        </div>
      )}

      {/* ── Product list ──────────────────────────────────── */}
      <div className="mt-6 space-y-3">
        {products.map((product) => {
          const cat = categories.find((c) => c.id === product.categoryId);
          const isConfirmingDelete = confirmDelete === product.id;
          const hasValidImage = product.image && !product.image.startsWith('/src/assets');
          return (
            <div key={product.id} className="rounded-card border border-border bg-card p-3 shadow-soft">
              <div className="flex items-center gap-4">
                {hasValidImage ? (
                  <img src={product.image} alt={product.name} className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).className = 'hidden'; }} />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-[10px] text-muted-foreground">sem foto</div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-sm font-semibold text-foreground">{product.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{cat?.name ?? '—'}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="tabular-nums text-sm font-medium text-primary">{formatPrice(product.basePrice)}</span>
                    {product.minQuantity > 1 && <span className="text-[10px] text-muted-foreground">Mín. {product.minQuantity}</span>}
                    {product.bestSeller && <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">Top</span>}
                    {product.featured && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Destaque</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {product.manageStock && (
                    <button
                      onClick={() => openMovements(product.id)}
                      title="Ver movimentações de estoque"
                      className="flex h-8 w-8 items-center justify-center rounded-button border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <BarChart2 size={14} />
                    </button>
                  )}
                  <button onClick={() => openEdit(product)} className="flex h-8 w-8 items-center justify-center rounded-button border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => setConfirmDelete(product.id)} className="flex h-8 w-8 items-center justify-center rounded-button border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              {isConfirmingDelete && (
                <div className="mt-3 flex items-center gap-3 rounded-button bg-destructive/10 p-3">
                  <span className="flex-1 text-xs text-destructive">Excluir "{product.name}"?</span>
                  <button onClick={() => handleDelete(product.id)} className="rounded-button bg-destructive px-3 py-1.5 text-xs font-semibold text-white">Excluir</button>
                  <button onClick={() => setConfirmDelete(null)} className="rounded-button border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">Cancelar</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {products.length === 0 && !showProductForm && (
        <p className="mt-10 text-center text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
      )}

      {/* ── Stock Movements Dialog ──────────────────────────── */}
      {movementsProductId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-card border border-border bg-card p-5 shadow-elevated max-h-[80vh] flex flex-col">
            <div className="mb-4 flex items-center justify-between shrink-0">
              <h2 className="text-base font-semibold text-foreground">
                Movimentações — {products.find((p) => p.id === movementsProductId)?.name}
              </h2>
              <button onClick={() => setMovementsProductId(null)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            {/* Add movement */}
            <div className="mb-4 rounded-card border border-border bg-muted/20 p-3 shrink-0">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Registrar movimentação</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <select
                  value={movType}
                  onChange={(e) => setMovType(e.target.value as typeof movType)}
                  className="rounded-button border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                  <option value="ajuste">Ajuste (definir)</option>
                </select>
                <input
                  type="number"
                  min="1"
                  placeholder="Quantidade"
                  value={movQty}
                  onChange={(e) => setMovQty(e.target.value)}
                  className="rounded-button border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="text"
                  placeholder="Nota (opcional)"
                  value={movNote}
                  onChange={(e) => setMovNote(e.target.value)}
                  className="rounded-button border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                onClick={handleAddMovement}
                disabled={savingMov}
                className="mt-2 flex items-center gap-1.5 rounded-button bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Save size={12} /> {savingMov ? 'Salvando…' : 'Registrar'}
              </button>
            </div>

            {/* Movements list */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {loadingMovements && (
                <p className="text-center text-xs text-muted-foreground py-4">Carregando…</p>
              )}
              {!loadingMovements && movements.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">Nenhuma movimentação registrada.</p>
              )}
              {movements.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-button border border-border bg-background px-3 py-2">
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                      m.type === 'entrada'
                        ? 'bg-green-100 text-green-700'
                        : m.type === 'saida'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {m.type}
                  </span>
                  <span className="tabular-nums text-sm font-medium text-foreground">
                    {m.type === 'entrada' ? '+' : m.type === 'saida' ? '-' : '='}{m.qty}
                  </span>
                  {m.note && <span className="flex-1 text-xs text-muted-foreground truncate">{m.note}</span>}
                  <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                    {new Date(m.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
