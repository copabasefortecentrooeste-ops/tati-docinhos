import { useState, useEffect } from 'react';
import { Save, RotateCcw, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PLATFORM, LANDING_CONTENT } from '@/config/platform';
import {
  loadPlatformOverrides,
  savePlatformOverrides,
  clearPlatformOverrides,
  type PlatformOverrides,
  type PlanOverride,
  type FaqOverride,
} from '@/hooks/usePlatformConfig';
import { toast } from '@/hooks/use-toast';

// ─── Helpers de estilo ────────────────────────────────────────────────────────
const cls = {
  input:
    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
  label: 'text-xs font-medium text-foreground',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className={cls.label}>{label}</label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 space-y-5">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function MasterConfig() {
  const [form, setForm] = useState<PlatformOverrides>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Carrega do Supabase primeiro, fallback para localStorage
    const loadFromSupabase = async () => {
      try {
        const { data } = await supabase
          .from('platform_settings')
          .select('config')
          .eq('id', 1)
          .single();
        const cfg = data?.config as PlatformOverrides | undefined;
        if (cfg && Object.keys(cfg).length > 0) {
          setForm(cfg);
          return;
        }
      } catch {
        /* tabela pode não existir ainda */
      }
      setForm(loadPlatformOverrides());
    };
    loadFromSupabase();
  }, []);

  function set<K extends keyof PlatformOverrides>(key: K, val: PlatformOverrides[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    // 1. Salva localmente (instantâneo — para preview no mesmo browser)
    savePlatformOverrides(form);

    // 2. Tenta salvar no Supabase (persiste para todos os usuários)
    const { error } = await supabase
      .from('platform_settings')
      .update({ config: form })
      .eq('id', 1);

    setSaving(false);

    if (error) {
      toast({
        title: '⚠️ Salvo localmente',
        description:
          'Erro ao salvar no Supabase. Execute a migração 014_platform_settings.sql no dashboard.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: '✅ Configurações salvas',
        description: 'Alterações publicadas e visíveis para todos os visitantes.',
      });
    }
  }

  function handleReset() {
    if (!window.confirm('Restaurar todos os padrões? As edições serão perdidas.')) return;
    clearPlatformOverrides();
    setForm({});
    supabase
      .from('platform_settings')
      .update({ config: {} })
      .eq('id', 1)
      .then(() =>
        toast({ title: 'Padrões restaurados', description: 'Landing page voltou para os valores originais.' })
      );
  }

  // ── Valores com fallback para os padrões do platform.ts ──────────────────
  const whatsapp = form.whatsapp ?? PLATFORM.whatsapp;
  const whatsappMessage = form.whatsappMessage ?? PLATFORM.whatsappMessage;
  const heroBadge = form.hero_badge ?? LANDING_CONTENT.hero.badge;
  const heroHeadline = form.hero_headline ?? LANDING_CONTENT.hero.headline;
  const heroHighlight = form.hero_headlineHighlight ?? LANDING_CONTENT.hero.headlineHighlight;
  const heroSub = form.hero_subheadline ?? LANDING_CONTENT.hero.subheadline;
  const segments = form.segments ?? [...LANDING_CONTENT.segments];
  const plans: PlanOverride[] =
    form.plans ??
    LANDING_CONTENT.plans.map(p => ({
      name: p.name,
      tag: p.tag,
      desc: p.desc,
      features: [...p.features],
      ctaLabel: p.ctaLabel,
      highlight: p.highlight,
    }));
  const plansCta = form.plansCta ?? LANDING_CONTENT.plansCta;
  const faqs: FaqOverride[] = form.faqs ?? LANDING_CONTENT.faqs.map(f => ({ ...f }));
  const finalHeadline = form.finalCta_headline ?? LANDING_CONTENT.finalCta.headline;
  const finalSub = form.finalCta_sub ?? LANDING_CONTENT.finalCta.sub;

  return (
    <div className="max-w-3xl space-y-6">

      {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Configurações da Landing Page</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Edite o conteúdo exibido em{' '}
            <a href="/" target="_blank" rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors">
              facaseupedidoaqui.vercel.app
            </a>
          </p>
          <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
            ℹ️ Execute a migração 014_platform_settings.sql no Supabase para persistência real.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <a href="/" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
            <ExternalLink size={13} /> Visualizar
          </a>
          <button onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
            <RotateCcw size={13} /> Restaurar padrões
          </button>
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60">
            <Save size={13} /> {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>

      {/* ── 1. WhatsApp & Contato ─────────────────────────────────────── */}
      <Section title="📞 WhatsApp & Contato">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Número (formato internacional sem +)">
            <input className={cls.input} value={whatsapp}
              onChange={e => set('whatsapp', e.target.value)}
              placeholder="5537991720481" />
          </Field>
          <Field label="Mensagem padrão dos botões">
            <input className={cls.input} value={whatsappMessage}
              onChange={e => set('whatsappMessage', e.target.value)} />
          </Field>
        </div>
        <div className="rounded-lg bg-muted px-3 py-2.5 text-xs font-mono text-muted-foreground">
          Link ativo:{' '}
          <span className="text-foreground font-semibold break-all">
            https://wa.me/{whatsapp}
          </span>
        </div>
      </Section>

      {/* ── 2. Hero — Seção Principal ─────────────────────────────────── */}
      <Section title="🎯 Hero — Seção Principal">
        <Field label="Badge (destaque pequeno acima do título)">
          <input className={cls.input} value={heroBadge}
            onChange={e => set('hero_badge', e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Headline (primeira linha)">
            <input className={cls.input} value={heroHeadline}
              onChange={e => set('hero_headline', e.target.value)} />
          </Field>
          <Field label="Destaque em vermelho (segunda linha)">
            <input className={cls.input} value={heroHighlight}
              onChange={e => set('hero_headlineHighlight', e.target.value)} />
          </Field>
        </div>
        <Field label="Subtítulo">
          <textarea className={cls.input} rows={3} value={heroSub}
            onChange={e => set('hero_subheadline', e.target.value)} />
        </Field>
      </Section>

      {/* ── 3. Segmentos ─────────────────────────────────────────────── */}
      <Section title="🏪 Segmentos — Para quem é">
        <Field label="Um segmento por linha (serão exibidos como pills)">
          <textarea
            className={cls.input}
            rows={Math.max(5, segments.length + 1)}
            value={segments.join('\n')}
            onChange={e =>
              set('segments', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))
            }
          />
        </Field>
        <p className="text-xs text-muted-foreground">{segments.length} segmento(s) cadastrado(s)</p>
      </Section>

      {/* ── 4. Planos ─────────────────────────────────────────────────── */}
      <Section title="💰 Planos">
        <div className="space-y-4">
          {plans.map((plan, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Plano {i + 1}
                </span>
                {plan.highlight && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    Destacado
                  </span>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nome do plano">
                  <input className={cls.input} value={plan.name}
                    onChange={e => {
                      const p = [...plans]; p[i] = { ...p[i], name: e.target.value }; set('plans', p);
                    }} />
                </Field>
                <Field label="Tag (ex: 'Mais escolhido' — deixe vazio para ocultar)">
                  <input className={cls.input} value={plan.tag ?? ''}
                    onChange={e => {
                      const p = [...plans]; p[i] = { ...p[i], tag: e.target.value || null }; set('plans', p);
                    }} />
                </Field>
              </div>

              <Field label="Descrição">
                <textarea className={cls.input} rows={2} value={plan.desc}
                  onChange={e => {
                    const p = [...plans]; p[i] = { ...p[i], desc: e.target.value }; set('plans', p);
                  }} />
              </Field>

              <Field label="Recursos incluídos (um por linha)">
                <textarea className={cls.input} rows={4} value={plan.features.join('\n')}
                  onChange={e => {
                    const p = [...plans];
                    p[i] = { ...p[i], features: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) };
                    set('plans', p);
                  }} />
              </Field>

              <Field label="Texto do botão CTA">
                <input className={cls.input} value={plan.ctaLabel}
                  onChange={e => {
                    const p = [...plans]; p[i] = { ...p[i], ctaLabel: e.target.value }; set('plans', p);
                  }} />
              </Field>
            </div>
          ))}
        </div>

        <Field label="Texto abaixo dos cards de planos">
          <textarea className={cls.input} rows={2} value={plansCta}
            onChange={e => set('plansCta', e.target.value)} />
        </Field>
      </Section>

      {/* ── 5. FAQ ───────────────────────────────────────────────────── */}
      <Section title="❓ FAQ — Perguntas Frequentes">
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Pergunta {i + 1}
                </span>
                <button
                  onClick={() => set('faqs', faqs.filter((_, j) => j !== i))}
                  className="flex items-center gap-1 text-xs text-destructive hover:underline transition-colors">
                  <Trash2 size={11} /> Remover
                </button>
              </div>
              <Field label="Pergunta">
                <input className={cls.input} value={faq.q}
                  onChange={e => {
                    const f = [...faqs]; f[i] = { ...f[i], q: e.target.value }; set('faqs', f);
                  }} />
              </Field>
              <Field label="Resposta">
                <textarea className={cls.input} rows={2} value={faq.a}
                  onChange={e => {
                    const f = [...faqs]; f[i] = { ...f[i], a: e.target.value }; set('faqs', f);
                  }} />
              </Field>
            </div>
          ))}
        </div>
        <button
          onClick={() => set('faqs', [...faqs, { q: '', a: '' }])}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <Plus size={14} /> Adicionar pergunta
        </button>
      </Section>

      {/* ── 6. CTA Final ─────────────────────────────────────────────── */}
      <Section title="📣 CTA Final — Seção de Encerramento">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Título">
            <input className={cls.input} value={finalHeadline}
              onChange={e => set('finalCta_headline', e.target.value)} />
          </Field>
          <Field label="Subtítulo">
            <input className={cls.input} value={finalSub}
              onChange={e => set('finalCta_sub', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* ── Botão de salvar no final ──────────────────────────────────── */}
      <div className="flex justify-end pb-10">
        <button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 shadow-sm">
          <Save size={15} /> {saving ? 'Salvando...' : 'Salvar todas as alterações'}
        </button>
      </div>
    </div>
  );
}
