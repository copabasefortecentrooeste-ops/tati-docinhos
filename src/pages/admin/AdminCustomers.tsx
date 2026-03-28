import { useEffect, useState, useMemo } from 'react';
import { Search, Pencil, Trash2, KeyRound, X, Save, ShoppingBag, Phone, Mail, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useStoreCtx } from '@/contexts/StoreContext';
import { formatPrice } from '@/lib/format';
import { mapSupabaseError } from '@/lib/supabaseError';
import { toast } from '@/hooks/use-toast';

// ── Types ──────────────────────────────────────────────────
interface CustomerRow {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  cep: string;
  neighborhood: string;
  street: string;
  number: string;
  complement?: string;
  orderCount: number;
  totalSpent: number;
}

// ── Helpers ────────────────────────────────────────────────
const fromDB = (r: Record<string, unknown>): CustomerRow => ({
  id:          r.id as string,
  fullName:    r.full_name as string,
  phone:       r.phone as string,
  email:       r.email as string,
  city:        r.city as string,
  state:       r.state as string,
  cep:         r.cep as string,
  neighborhood: r.neighborhood as string,
  street:      r.street as string,
  number:      r.number as string,
  complement:  r.complement as string | undefined,
  orderCount:  Number(r.order_count ?? 0),
  totalSpent:  Number(r.total_spent ?? 0),
});

// ── Edit Modal ─────────────────────────────────────────────
interface EditProps { customer: CustomerRow; onClose: () => void; onSaved: (c: CustomerRow) => void }

function EditModal({ customer, onClose, onSaved }: EditProps) {
  const [form, setForm] = useState({
    fullName:     customer.fullName,
    phone:        customer.phone,
    neighborhood: customer.neighborhood,
    street:       customer.street,
    number:       customer.number,
    complement:   customer.complement ?? '',
    city:         customer.city,
    state:        customer.state,
    cep:          customer.cep,
  });
  const [saving, setSaving] = useState(false);

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.phone.trim()) {
      toast({ title: 'Nome e telefone são obrigatórios', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('customers').update({
        full_name:    form.fullName.trim(),
        phone:        form.phone.trim(),
        neighborhood: form.neighborhood.trim(),
        street:       form.street.trim(),
        number:       form.number.trim(),
        complement:   form.complement.trim() || null,
        city:         form.city.trim(),
        state:        form.state.trim(),
        cep:          form.cep.trim(),
      }).eq('id', customer.id);
      if (error) throw error;
      onSaved({ ...customer, ...form, complement: form.complement.trim() || undefined });
      toast({ title: 'Cliente atualizado!' });
      onClose();
    } catch (err) {
      const mapped = mapSupabaseError(err);
      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const inp = 'w-full rounded-button border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }}
        className="w-full max-w-md rounded-card border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="font-semibold text-foreground">Editar Cliente</h2>
            <p className="text-xs text-muted-foreground">{customer.email}</p>
          </div>
          <button onClick={onClose} className="rounded-button p-1 hover:bg-muted"><X size={16} /></button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto p-4 space-y-3">
          <input placeholder="Nome completo *" value={form.fullName} onChange={f('fullName')} className={inp} />
          <input placeholder="Telefone *" value={form.phone} onChange={f('phone')} className={inp} />
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Cidade" value={form.city} onChange={f('city')} className={inp} />
            <input placeholder="Estado" value={form.state} onChange={f('state')} className={inp} />
          </div>
          <input placeholder="CEP" value={form.cep} onChange={f('cep')} className={inp} />
          <input placeholder="Bairro" value={form.neighborhood} onChange={f('neighborhood')} className={inp} />
          <input placeholder="Rua" value={form.street} onChange={f('street')} className={inp} />
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Número" value={form.number} onChange={f('number')} className={inp} />
            <input placeholder="Complemento" value={form.complement} onChange={f('complement')} className={inp} />
          </div>
        </div>
        <div className="flex gap-2 border-t border-border p-4">
          <button onClick={onClose} className="flex-1 rounded-button border border-border py-2 text-sm text-muted-foreground hover:bg-muted">Cancelar</button>
          <button
            onClick={handleSave} disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-button bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <Save size={14} />}
            Salvar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────
interface DeleteProps { customer: CustomerRow; onClose: () => void; onDeleted: () => void }

function DeleteConfirm({ customer, onClose, onDeleted }: DeleteProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from('customers').delete().eq('id', customer.id);
      if (error) throw error;
      onDeleted();
      toast({ title: `Cliente ${customer.fullName} excluído` });
      onClose();
    } catch (err) {
      const mapped = mapSupabaseError(err);
      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }}
        className="w-full max-w-sm rounded-card border border-border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10">
            <Trash2 size={16} className="text-destructive" />
          </div>
          <h2 className="font-semibold text-foreground">Excluir cliente?</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          O perfil de <strong className="text-foreground">{customer.fullName}</strong> será removido permanentemente. A conta de acesso permanece ativa.
        </p>
        {customer.orderCount > 0 && (
          <p className="mt-1 text-xs text-orange-600">⚠️ Este cliente tem {customer.orderCount} pedido(s) no histórico.</p>
        )}
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-button border border-border py-2 text-sm text-muted-foreground hover:bg-muted">Cancelar</button>
          <button
            onClick={handleDelete} disabled={deleting}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-button bg-destructive py-2 text-sm font-medium text-destructive-foreground disabled:opacity-50"
          >
            {deleting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-destructive-foreground border-t-transparent" /> : <Trash2 size={13} />}
            Excluir
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function AdminCustomers() {
  const { storeId } = useStoreCtx();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [deleting, setDeleting] = useState<CustomerRow | null>(null);
  const [resetting, setResetting] = useState<string | null>(null); // email

  const loadCustomers = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      // Fetch all customers (admin RLS policy allows this)
      const { data: custData, error: custErr } = await supabase
        .from('customers')
        .select('*')
        .order('full_name');
      if (custErr) throw custErr;

      // Fetch order counts per customer for this store
      const { data: orderData } = await supabase
        .from('orders')
        .select('customer_id, total')
        .eq('store_id', storeId)
        .not('customer_id', 'is', null);

      // Build map: customer_id → { count, total }
      const orderMap = new Map<string, { count: number; total: number }>();
      for (const o of orderData ?? []) {
        const id = o.customer_id as string;
        const prev = orderMap.get(id) ?? { count: 0, total: 0 };
        orderMap.set(id, { count: prev.count + 1, total: prev.total + (o.total as number) });
      }

      const rows = (custData ?? []).map((r) => {
        const stats = orderMap.get(r.id as string) ?? { count: 0, total: 0 };
        return fromDB({ ...r, order_count: stats.count, total_spent: stats.total });
      });
      setCustomers(rows);
    } catch (err) {
      const mapped = mapSupabaseError(err);
      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCustomers(); }, [storeId]);

  const filtered = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter((c) =>
      c.fullName.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.neighborhood.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const handleResetPassword = async (email: string) => {
    setResetting(email);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/tatydocinhos/conta`,
      });
      if (error) throw error;
      toast({ title: 'Email de redefinição enviado!', description: `Instruções enviadas para ${email}` });
    } catch (err) {
      const mapped = mapSupabaseError(err);
      toast({ title: mapped.title, description: mapped.description, variant: 'destructive' });
    } finally {
      setResetting(null);
    }
  };

  const handleUpdated = (updated: CustomerRow) => {
    setCustomers((prev) => prev.map((c) => c.id === updated.id ? updated : c));
  };

  const handleDeleted = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // ── Render ─────────────────────────────────────────────
  return (
    <div>
      {/* Modals */}
      <AnimatePresence>
        {editing && (
          <EditModal key="edit" customer={editing} onClose={() => setEditing(null)} onSaved={handleUpdated} />
        )}
        {deleting && (
          <DeleteConfirm key="del" customer={deleting} onClose={() => setDeleting(null)} onDeleted={() => handleDeleted(deleting.id)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Clientes</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{customers.length} cadastro(s)</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mt-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text" placeholder="Buscar por nome, telefone, email, bairro..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-button border border-border bg-card py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X size={12} />
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="mt-6 space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="animate-pulse rounded-card border border-border bg-card p-4">
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="mt-2 h-3 w-56 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          {search ? `Nenhum cliente encontrado para "${search}"` : 'Nenhum cliente cadastrado'}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-card border border-border bg-card p-4 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Avatar + info */}
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    {c.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{c.fullName}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Phone size={10} /> {c.phone}</span>
                      <span className="flex items-center gap-1"><Mail size={10} /> {c.email}</span>
                      {c.neighborhood && (
                        <span className="flex items-center gap-1"><MapPin size={10} /> {c.neighborhood} — {c.city}/{c.state}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1 justify-end text-xs font-medium text-foreground">
                    <ShoppingBag size={12} className="text-primary" />
                    <span>{c.orderCount} pedido(s)</span>
                  </div>
                  {c.totalSpent > 0 && (
                    <p className="text-xs text-muted-foreground">{formatPrice(c.totalSpent)} total</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setEditing(c)}
                  className="flex items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  <Pencil size={11} /> Editar
                </button>
                <button
                  onClick={() => handleResetPassword(c.email)}
                  disabled={resetting === c.email}
                  className="flex items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
                >
                  {resetting === c.email
                    ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                    : <KeyRound size={11} />
                  }
                  Recuperar senha
                </button>
                <button
                  onClick={() => setDeleting(c)}
                  className="flex items-center gap-1.5 rounded-button border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive/70 hover:bg-destructive/5 hover:text-destructive"
                >
                  <Trash2 size={11} /> Excluir
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
