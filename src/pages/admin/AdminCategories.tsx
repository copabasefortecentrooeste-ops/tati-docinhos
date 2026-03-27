import { useState } from 'react';
import { Plus, Pencil, Trash2, Save, X, WifiOff, RefreshCw, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { useProductsStore } from '@/store/productsStore';
import { useStoreCtx } from '@/contexts/StoreContext';
import { supabase } from '@/lib/supabase';
import { mapSupabaseError } from '@/lib/supabaseError';
import { inputCls } from '@/lib/adminStyles';
import { toast } from '@/hooks/use-toast';
import type { Category } from '@/types';

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

type FormState = { name: string; description: string };
const emptyForm = (): FormState => ({ name: '', description: '' });

type DeleteDialog =
  | null
  | { id: string; name: string; productCount: number; mode: 'confirm' | 'move' }

export default function AdminCategories() {
  const { categories, products, loadError, initFromDB, addCategory, updateCategory, deleteCategory } =
    useProductsStore();
  const { storeId } = useStoreCtx();
  const [retrying, setRetrying] = useState(false);

  // Sorted categories
  const sorted = [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const handleRetry = async () => {
    setRetrying(true);
    await initFromDB(storeId || undefined);
    setRetrying(false);
  };

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialog>(null);
  const [moveToCatId, setMoveToCatId] = useState('');
  const [deleting, setDeleting] = useState(false);

  const openAdd = () => { setForm(emptyForm()); setEditingId(null); setAdding(true); };
  const openEdit = (c: Category) => {
    setForm({ name: c.name, description: c.description ?? '' });
    setAdding(false);
    setEditingId(c.id);
  };
  const closeForm = () => { setAdding(false); setEditingId(null); };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Nome da categoria obrigatório', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateCategory(editingId, { name: form.name.trim(), description: form.description.trim() });
        toast({ title: 'Categoria atualizada!' });
      } else {
        const maxOrder = sorted.length > 0 ? Math.max(...sorted.map((c) => c.sortOrder ?? 0)) : -1;
        await addCategory({
          id: crypto.randomUUID(),
          name: form.name.trim(),
          slug: slugify(form.name),
          description: form.description.trim(),
          image: '',
          sortOrder: maxOrder + 1,
          active: true,
        });
        toast({ title: 'Categoria criada!' });
      }
      closeForm();
    } catch (err) {
      const mapped = mapSupabaseError(err);
      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await updateCategory(cat.id, { active: !(cat.active ?? true) });
      toast({ title: cat.active !== false ? 'Categoria desativada' : 'Categoria ativada' });
    } catch (err) {
      const mapped = mapSupabaseError(err);
      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
    }
  };

  const handleMoveOrder = async (catId: string, direction: 'up' | 'down') => {
    const idx = sorted.findIndex((c) => c.id === catId);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const current = sorted[idx];
    const swap = sorted[swapIdx];

    try {
      await Promise.all([
        supabase.from('categories').update({ sort_order: swap.sortOrder ?? swapIdx }).eq('id', current.id),
        supabase.from('categories').update({ sort_order: current.sortOrder ?? idx }).eq('id', swap.id),
      ]);
      // Update local store
      await updateCategory(current.id, { sortOrder: swap.sortOrder ?? swapIdx });
      await updateCategory(swap.id, { sortOrder: current.sortOrder ?? idx });
    } catch (err) {
      const mapped = mapSupabaseError(err);
      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
    }
  };

  const openDeleteDialog = (cat: Category) => {
    const productCount = products.filter((p) => p.categoryId === cat.id).length;
    setDeleteDialog({ id: cat.id, name: cat.name, productCount, mode: 'confirm' });
    setMoveToCatId('');
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      if (deleteDialog.productCount > 0 && deleteDialog.mode === 'move') {
        if (!moveToCatId) {
          toast({ title: 'Selecione a categoria de destino', variant: 'destructive' });
          setDeleting(false);
          return;
        }
        // Move products to target category
        const { error } = await supabase
          .from('products')
          .update({ category_id: moveToCatId })
          .eq('category_id', deleteDialog.id);
        if (error) throw error;
        // Refresh store products after move
        await initFromDB(storeId || undefined);
      }

      const result = await deleteCategory(deleteDialog.id);
      if (!result.ok) {
        toast({ title: 'Não foi possível excluir', description: result.reason, variant: 'destructive' });
      } else {
        toast({ title: 'Categoria removida' });
      }
      setDeleteDialog(null);
    } catch (err) {
      const mapped = mapSupabaseError(err);
      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handleInstead = async () => {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      await updateCategory(deleteDialog.id, { active: false });
      toast({ title: 'Categoria desativada' });
      setDeleteDialog(null);
    } catch (err) {
      const mapped = mapSupabaseError(err);
      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Categorias</h1>
          <p className="mt-1 text-sm text-muted-foreground">Organize e reordene categorias do cardápio</p>
        </div>
        {!adding && editingId === null && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-button bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> Nova Categoria
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

      {/* Add / Edit form */}
      {(adding || editingId !== null) && (
        <div className="mt-6 rounded-card border border-border bg-card p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {adding ? 'Nova Categoria' : 'Editar Categoria'}
            </h2>
            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Nome *</label>
              <input
                autoFocus
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputCls}
                placeholder="Ex: Brigadeiros"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Descrição</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={inputCls}
                placeholder="Descrição opcional"
              />
            </div>
          </div>
          {adding && form.name && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Slug gerado: <span className="font-mono">{slugify(form.name)}</span>
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 flex items-center gap-2 rounded-button bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save size={14} /> {saving ? 'Salvando…' : editingId ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      )}

      {/* List */}
      <div className="mt-6 space-y-2">
        {sorted.map((cat, idx) => {
          const count = products.filter((p) => p.categoryId === cat.id).length;
          const isActive = cat.active !== false;
          return (
            <div key={cat.id} className="rounded-card border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => handleMoveOrder(cat.id, 'up')}
                      disabled={idx === 0}
                      className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                      title="Mover para cima"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      onClick={() => handleMoveOrder(cat.id, 'down')}
                      disabled={idx === sorted.length - 1}
                      className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                      title="Mover para baixo"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                  <GripVertical size={14} className="text-muted-foreground/40 shrink-0" />

                  {/* Active toggle dot */}
                  <button
                    onClick={() => handleToggleActive(cat)}
                    title={isActive ? 'Clique para desativar' : 'Clique para ativar'}
                    className={`h-2.5 w-2.5 rounded-full transition-colors shrink-0 ${isActive ? 'bg-green-500' : 'bg-red-400'}`}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                        {cat.name}
                      </span>
                      <span className={`text-[10px] ${isActive ? 'text-green-600' : 'text-red-500'}`}>
                        {isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground font-mono">{cat.slug}</span>
                      {cat.description && (
                        <span className="text-[11px] text-muted-foreground">· {cat.description}</span>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        · {count} produto{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => openEdit(cat)}
                    className="flex h-7 w-7 items-center justify-center rounded-button border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => openDeleteDialog(cat)}
                    className="flex h-7 w-7 items-center justify-center rounded-button border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p>
      )}

      {/* Delete Dialog */}
      {deleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-card border border-border bg-card p-5 shadow-elevated">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Excluir categoria</h2>
              <button onClick={() => setDeleteDialog(null)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            {deleteDialog.productCount === 0 ? (
              <>
                <p className="text-sm text-foreground">
                  Tem certeza que deseja excluir a categoria <strong>"{deleteDialog.name}"</strong>?
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Esta ação não pode ser desfeita.</p>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 rounded-button bg-destructive py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {deleting ? 'Excluindo…' : 'Excluir'}
                  </button>
                  <button
                    onClick={() => setDeleteDialog(null)}
                    className="flex-1 rounded-button border border-border py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-foreground">
                  A categoria <strong>"{deleteDialog.name}"</strong> possui{' '}
                  <strong>{deleteDialog.productCount} produto{deleteDialog.productCount > 1 ? 's' : ''} vinculado{deleteDialog.productCount > 1 ? 's' : ''}</strong>.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">O que deseja fazer?</p>

                {/* Option 1: Move products */}
                <div
                  onClick={() => setDeleteDialog((d) => d ? { ...d, mode: 'move' } : d)}
                  className={`mt-3 cursor-pointer rounded-card border p-3 transition-colors ${
                    deleteDialog.mode === 'move' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">Mover produtos para outra categoria</p>
                  {deleteDialog.mode === 'move' && (
                    <select
                      value={moveToCatId}
                      onChange={(e) => setMoveToCatId(e.target.value)}
                      className="mt-2 w-full rounded-button border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">Selecione a categoria destino…</option>
                      {categories
                        .filter((c) => c.id !== deleteDialog.id)
                        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                        .map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                  )}
                </div>

                {/* Option 2: Just deactivate */}
                <div className="mt-2 rounded-card border border-border p-3 hover:bg-muted/30">
                  <p className="text-sm font-medium text-foreground">Apenas desativar a categoria</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Os produtos ficam cadastrados mas a categoria fica oculta no cardápio.
                  </p>
                </div>

                <div className="mt-5 flex gap-3">
                  {deleteDialog.mode === 'move' ? (
                    <button
                      onClick={handleDelete}
                      disabled={deleting || !moveToCatId}
                      className="flex-1 rounded-button bg-destructive py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {deleting ? 'Processando…' : 'Mover e Excluir'}
                    </button>
                  ) : (
                    <button
                      onClick={handleInstead}
                      disabled={deleting}
                      className="flex-1 rounded-button bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      {deleting ? 'Salvando…' : 'Desativar'}
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteDialog(null)}
                    className="flex-1 rounded-button border border-border py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
