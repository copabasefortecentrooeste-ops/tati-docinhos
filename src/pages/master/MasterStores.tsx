import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Store, Plus, Search, ExternalLink, Eye, EyeOff, RefreshCw, PauseCircle } from 'lucide-react';

// SERVICE_KEY removido do frontend — operação privilegiada agora é
// tratada pela Edge Function "create-store" no servidor.

const RESERVED_SLUGS = [
  'admin','login','master','api','planos','contato','suporte','sobre','demo',
  'catalogo','carrinho','checkout','confirmacao','acompanhar','minha-conta',
  'perfil','termos','privacidade','not-found','404',
];

const SEGMENTS = [
  { value: 'confeitaria', label: 'Confeitaria' },
  { value: 'lanchonete', label: 'Lanchonete' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'marmitaria', label: 'Marmitaria' },
  { value: 'pizzaria', label: 'Pizzaria' },
  { value: 'padaria', label: 'Padaria' },
  { value: 'outro', label: 'Outro' },
];

type StoreRow = Record<string, unknown>;

interface NewStoreForm {
  name: string;
  slug: string;
  segment: string;
  plan: 'trial' | 'basic' | 'pro';
  trialEndsAt: string;
  adminEmail: string;
  adminPassword: string;
}

const emptyForm: NewStoreForm = {
  name: '',
  slug: '',
  segment: 'confeitaria',
  plan: 'trial',
  trialEndsAt: '',
  adminEmail: '',
  adminPassword: '',
};

function slugify(val: string) {
  return val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function validateSlug(slug: string): string | null {
  if (!slug) return 'Slug é obrigatório';
  if (!/^[a-z0-9-]+$/.test(slug)) return 'Slug só pode ter letras minúsculas, números e hifens';
  if (RESERVED_SLUGS.includes(slug)) return 'Este slug é reservado pelo sistema';
  return null;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    expired: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  };
  const labels: Record<string, string> = { active: 'Ativa', suspended: 'Suspensa', expired: 'Expirada' };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? map.expired}`}>
      {labels[status] ?? status}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, string> = {
    trial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    basic: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    pro: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };
  const labels: Record<string, string> = { trial: 'Trial', basic: 'Básico', pro: 'Pro' };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[plan] ?? map.trial}`}>
      {labels[plan] ?? plan}
    </span>
  );
}

export default function MasterStores() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<NewStoreForm>(emptyForm);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slugError, setSlugError] = useState('');

  const loadStores = async () => {
    setLoading(true);
    const { data } = await supabase.from('stores').select('*').order('created_at', { ascending: false });
    setStores((data ?? []) as StoreRow[]);
    setLoading(false);
  };

  useEffect(() => { loadStores(); }, []);

  const filtered = stores.filter(s => {
    const name = (s.name as string ?? '').toLowerCase();
    const slug = (s.slug as string ?? '').toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = !q || name.includes(q) || slug.includes(q);
    const matchStatus = !filterStatus || s.status === filterStatus;
    const matchPlan = !filterPlan || s.plan === filterPlan;
    return matchSearch && matchStatus && matchPlan;
  });

  const handleToggleStatus = async (store: StoreRow) => {
    const newStatus = store.status === 'active' ? 'suspended' : 'active';
    const { error } = await supabase.from('stores').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', store.id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: newStatus === 'active' ? 'Loja reativada' : 'Loja suspensa', description: `${store.name} foi ${newStatus === 'active' ? 'reativada' : 'suspensa'}.` });
      loadStores();
    }
  };

  const handleSlugChange = (val: string) => {
    const clean = slugify(val);
    setForm(f => ({ ...f, slug: clean }));
    setSlugError(validateSlug(clean) ?? '');
  };

  const handleNameChange = (val: string) => {
    setForm(f => ({ ...f, name: val, slug: slugify(val) }));
    setSlugError('');
  };

  const handleSave = async () => {
    const slugErr = validateSlug(form.slug);
    if (slugErr) { setSlugError(slugErr); return; }
    if (!form.name.trim()) { toast({ title: 'Nome obrigatório', variant: 'destructive' }); return; }
    if (!form.adminEmail.trim()) { toast({ title: 'E-mail do admin obrigatório', variant: 'destructive' }); return; }
    if (form.adminPassword.length < 8) { toast({ title: 'Senha deve ter ao menos 8 caracteres', variant: 'destructive' }); return; }

    setSaving(true);

    // Toda a criação privilegiada acontece na Edge Function server-side.
    // O service_role key nunca toca o browser.
    const { data, error } = await supabase.functions.invoke('create-store', {
      body: {
        name: form.name.trim(),
        slug: form.slug,
        segment: form.segment,
        plan: form.plan,
        trialEndsAt: form.trialEndsAt || null,
        adminEmail: form.adminEmail.trim(),
        adminPassword: form.adminPassword,
      },
    });

    setSaving(false);

    // supabase.functions.invoke retorna data=null e error=FunctionsHttpError quando a função
    // responde com status não-2xx. O erro real do servidor está em error.context (Response).
    if (error || (data as Record<string, unknown> | null)?.error) {
      let description = (data as Record<string, unknown> | null)?.error as string | undefined;
      if (!description && error) {
        try {
          const body = await (error as { context?: Response }).context?.json?.();
          description = body?.error ?? error.message;
        } catch {
          description = error.message;
        }
      }
      toast({
        title: 'Erro ao criar loja',
        description: description ?? 'Erro desconhecido',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Loja criada com sucesso!', description: `${form.name} está pronta em /${form.slug}` });
    setShowDialog(false);
    setForm(emptyForm);
    loadStores();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lojas</h1>
          <p className="text-sm text-muted-foreground">{stores.length} loja{stores.length !== 1 ? 's' : ''} cadastrada{stores.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Nova Loja
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text" placeholder="Buscar por nome ou slug..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Todos os status</option>
          <option value="active">Ativa</option>
          <option value="suspended">Suspensa</option>
          <option value="expired">Expirada</option>
        </select>
        <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Todos os planos</option>
          <option value="trial">Trial</option>
          <option value="basic">Básico</option>
          <option value="pro">Pro</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Store size={32} className="text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhuma loja encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Loja</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Segmento</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plano</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Criada em</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(store => (
                  <tr key={store.id as string} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{store.name as string}</p>
                        <p className="text-xs text-muted-foreground">/{store.slug as string}</p>
                        {store.owner_email && <p className="text-xs text-muted-foreground">{store.owner_email as string}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{store.segment as string}</td>
                    <td className="px-4 py-3"><PlanBadge plan={store.plan as string} /></td>
                    <td className="px-4 py-3"><StatusBadge status={store.status as string} /></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(store.created_at as string).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a href={`/${store.slug as string}`} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Ver loja">
                          <ExternalLink size={14} />
                        </a>
                        <a href={`/${store.slug as string}/admin`} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Admin da loja">
                          <Store size={14} />
                        </a>
                        <button onClick={() => handleToggleStatus(store)}
                          className={`p-1.5 rounded-md transition-colors ${store.status === 'active' ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                          title={store.status === 'active' ? 'Suspender loja' : 'Reativar loja'}>
                          {store.status === 'active' ? <PauseCircle size={14} /> : <RefreshCw size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setShowDialog(false); }}>
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-foreground text-lg">Nova Loja</h2>
              <button onClick={() => setShowDialog(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Nome da loja *</label>
                <input type="text" placeholder="Ex: Doces da Maria" value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              {/* Slug */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Slug (URL) *</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground shrink-0">seusite.com/</span>
                  <input type="text" placeholder="minha-loja" value={form.slug}
                    onChange={e => handleSlugChange(e.target.value)}
                    className={`flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${slugError ? 'border-red-400' : 'border-border'}`} />
                </div>
                {slugError && <p className="mt-1 text-xs text-red-500">{slugError}</p>}
              </div>
              {/* Segment */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Segmento</label>
                <select value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              {/* Plan */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Plano</label>
                <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value as 'trial' | 'basic' | 'pro' }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="trial">Trial (gratuito)</option>
                  <option value="basic">Básico (R$97/mês)</option>
                  <option value="pro">Pro (R$197/mês)</option>
                </select>
              </div>
              {/* Trial ends */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Vencimento / Fim do trial</label>
                <input type="date" value={form.trialEndsAt} onChange={e => setForm(f => ({ ...f, trialEndsAt: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <hr className="border-border" />
              {/* Admin email */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">E-mail do admin *</label>
                <input type="email" placeholder="admin@loja.com" value={form.adminEmail}
                  onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              {/* Admin password */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Senha inicial *</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" value={form.adminPassword}
                    onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setShowDialog(false)} disabled={saving}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !!slugError}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {saving ? 'Criando...' : 'Criar Loja'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
