import { useState } from 'react';
import { Plus, Pencil, Trash2, Save, X, WifiOff, RefreshCw } from 'lucide-react';
import { useCouponsStore } from '@/store/couponsStore';
import { useStoreCtx } from '@/contexts/StoreContext';
import { formatPrice } from '@/lib/format';
import { mapSupabaseError } from '@/lib/supabaseError';
import { inputCls } from '@/lib/adminStyles';
import { toast } from '@/hooks/use-toast';
import type { Coupon } from '@/types';

type FormState = {
  code: string;
  type: 'percentage' | 'fixed';
  value: string;
  minOrder: string;
};

const emptyForm = (): FormState => ({ code: '', type: 'percentage', value: '', minOrder: '' });

function couponToForm(c: Coupon): FormState {
  return { code: c.code, type: c.type, value: String(c.value), minOrder: c.minOrder ? String(c.minOrder) : '' };
}

export default function AdminCoupons() {
  const { coupons, loadError, initFromDB, addCoupon, updateCoupon, deleteCoupon, toggleActive } = useCouponsStore();
  const { storeId } = useStoreCtx();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    await initFromDB(storeId || undefined);
    setRetrying(false);
  };
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const openAdd = () => { setForm(emptyForm()); setEditingId(null); setAdding(true); };
  const openEdit = (c: Coupon) => { setForm(couponToForm(c)); setAdding(false); setEditingId(c.id); };
  const closeForm = () => { setAdding(false); setEditingId(null); };

  const handleSave = async () => {
    if (!form.code.trim()) { toast({ title: 'Código obrigatório', variant: 'destructive' }); return; }
    const value = parseFloat(form.value);
    if (isNaN(value) || value <= 0) { toast({ title: 'Valor inválido', variant: 'destructive' }); return; }
    const minOrder = form.minOrder.trim() ? parseFloat(form.minOrder) : undefined;

    const data = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value,
      active: true,
      ...(minOrder !== undefined ? { minOrder } : {}),
    };

    try {
      if (editingId) {
        await updateCoupon(editingId, data);
        toast({ title: 'Cupom atualizado!' });
      } else {
        await addCoupon({ ...data, id: crypto.randomUUID() });
        toast({ title: 'Cupom adicionado!' });
      }
      closeForm();
    } catch (err) {
      const mapped = mapSupabaseError(err);
      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCoupon(id);
      toast({ title: 'Cupom removido' });
    } catch (err) {
      const mapped = mapSupabaseError(err);
      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
    }
    setConfirmDelete(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Cupons</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie cupons de desconto</p>
        </div>
        {!adding && editingId === null && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-button bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> Novo Cupom
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

      {/* Form */}
      {(adding || editingId !== null) && (
        <div className="mt-6 rounded-card border border-border bg-card p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">{adding ? 'Novo Cupom' : 'Editar Cupom'}</h2>
            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Código *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                className={inputCls}
                placeholder="EX: DESCONTO10"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Tipo *</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'percentage' | 'fixed' }))}
                className={inputCls}
              >
                <option value="percentage">Porcentagem (%)</option>
                <option value="fixed">Valor fixo (R$)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Desconto {form.type === 'percentage' ? '(%)' : '(R$)'} *
              </label>
              <input
                type="number"
                min="0"
                step={form.type === 'percentage' ? '1' : '0.50'}
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Pedido mínimo (R$) — opcional</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.minOrder}
                onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))}
                className={inputCls}
                placeholder="Sem mínimo"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            className="mt-4 flex items-center gap-2 rounded-button bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Save size={14} /> {editingId ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      )}

      {/* List */}
      <div className="mt-6 space-y-3">
        {coupons.map((c) => (
          <div key={c.id} className="rounded-card border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <span className="tabular-nums text-sm font-bold text-foreground">{c.code}</span>
                <p className="text-xs text-muted-foreground">
                  {c.type === 'percentage' ? `${c.value}% de desconto` : `${formatPrice(c.value)} de desconto`}
                  {c.minOrder ? ` • Mín. ${formatPrice(c.minOrder)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      await toggleActive(c.id);
                    } catch (err) {
                      const mapped = mapSupabaseError(err);
                      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
                    }
                  }}
                  className={`rounded-button px-2 py-0.5 text-[10px] font-medium transition-colors ${
                    c.active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {c.active ? 'Ativo' : 'Inativo'}
                </button>
                <button
                  onClick={() => openEdit(c)}
                  className="flex h-7 w-7 items-center justify-center rounded-button border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => setConfirmDelete(c.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-button border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            {confirmDelete === c.id && (
              <div className="mt-3 flex items-center gap-3 rounded-button bg-destructive/10 p-3">
                <span className="flex-1 text-xs text-destructive">Excluir cupom "{c.code}"?</span>
                <button onClick={() => handleDelete(c.id)} className="rounded-button bg-destructive px-3 py-1.5 text-xs font-semibold text-white">Excluir</button>
                <button onClick={() => setConfirmDelete(null)} className="rounded-button border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">Cancelar</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {coupons.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">Nenhum cupom cadastrado.</p>
      )}
    </div>
  );
}
