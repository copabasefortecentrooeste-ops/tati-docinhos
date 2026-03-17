import { useState } from 'react';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { useNeighborhoodsStore } from '@/store/neighborhoodsStore';
import { formatPrice } from '@/lib/format';
import { mapSupabaseError } from '@/lib/supabaseError';
import { toast } from '@/hooks/use-toast';
import type { DeliveryNeighborhood } from '@/types';

type FormState = { name: string; fee: string };
const emptyForm = (): FormState => ({ name: '', fee: '' });

export default function AdminNeighborhoods() {
  const { neighborhoods, addNeighborhood, updateNeighborhood, deleteNeighborhood, toggleActive } =
    useNeighborhoodsStore();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const openAdd = () => { setForm(emptyForm()); setEditingId(null); setAdding(true); };
  const openEdit = (n: DeliveryNeighborhood) => {
    setForm({ name: n.name, fee: String(n.fee) });
    setAdding(false);
    setEditingId(n.id);
  };
  const closeForm = () => { setAdding(false); setEditingId(null); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: 'Nome obrigatório', variant: 'destructive' }); return; }
    const fee = parseFloat(form.fee);
    if (isNaN(fee) || fee < 0) { toast({ title: 'Taxa inválida', variant: 'destructive' }); return; }

    try {
      if (editingId) {
        await updateNeighborhood(editingId, { name: form.name.trim(), fee });
        toast({ title: 'Bairro atualizado!' });
      } else {
        await addNeighborhood({ id: crypto.randomUUID(), name: form.name.trim(), fee, active: true });
        toast({ title: 'Bairro adicionado!' });
      }
      closeForm();
    } catch (err) {
      const mapped = mapSupabaseError(err);
      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNeighborhood(id);
      toast({ title: 'Bairro removido' });
    } catch (err) {
      const mapped = mapSupabaseError(err);
      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
    }
    setConfirmDelete(null);
  };

  const inputCls =
    'w-full rounded-button border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Bairros & Taxas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie áreas de entrega</p>
        </div>
        {!adding && editingId === null && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-button bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> Novo Bairro
          </button>
        )}
      </div>

      {/* Add / Edit form */}
      {(adding || editingId !== null) && (
        <div className="mt-6 rounded-card border border-border bg-card p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {adding ? 'Novo Bairro' : 'Editar Bairro'}
            </h2>
            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Nome *</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Taxa de entrega (R$) *</label>
              <input type="number" min="0" step="0.50" value={form.fee} onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))} className={inputCls} />
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
        {neighborhoods.map((n) => (
          <div key={n.id} className="rounded-card border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    try {
                      await toggleActive(n.id);
                    } catch (err) {
                      const mapped = mapSupabaseError(err);
                      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
                    }
                  }}
                  title={n.active ? 'Clique para desativar' : 'Clique para ativar'}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${n.active ? 'bg-green-500' : 'bg-red-400'}`}
                />
                <span className="text-sm font-medium text-foreground">{n.name}</span>
                <span className={`text-[10px] ${n.active ? 'text-green-600' : 'text-red-500'}`}>
                  {n.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="tabular-nums text-sm font-medium text-primary">{formatPrice(n.fee)}</span>
                <button
                  onClick={() => openEdit(n)}
                  className="flex h-7 w-7 items-center justify-center rounded-button border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => setConfirmDelete(n.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-button border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            {confirmDelete === n.id && (
              <div className="mt-3 flex items-center gap-3 rounded-button bg-destructive/10 p-3">
                <span className="flex-1 text-xs text-destructive">Excluir "{n.name}"?</span>
                <button onClick={() => handleDelete(n.id)} className="rounded-button bg-destructive px-3 py-1.5 text-xs font-semibold text-white">Excluir</button>
                <button onClick={() => setConfirmDelete(null)} className="rounded-button border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">Cancelar</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {neighborhoods.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">Nenhum bairro cadastrado.</p>
      )}
    </div>
  );
}
