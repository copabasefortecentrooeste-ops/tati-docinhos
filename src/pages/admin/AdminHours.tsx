import { useState } from 'react';
import { Save, Clock, CheckCircle, PauseCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useHoursStore } from '@/store/hoursStore';
import { useStoreConfigStore } from '@/store/storeConfigStore';
import { getStoreStatus, getTodayHours } from '@/lib/storeStatus';
import { toast } from '@/hooks/use-toast';
import type { ManualStoreStatus } from '@/types';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-red-100 text-red-800 border-red-200',
  paused: 'bg-amber-100 text-amber-800 border-amber-200',
  outside_hours: 'bg-orange-100 text-orange-800 border-orange-200',
};

export default function AdminHours() {
  const { hours, updateHours } = useHoursStore();
  const { config, updateConfig } = useStoreConfigStore();
  const [draft, setDraft] = useState(() => hours.map((h) => ({ ...h })));
  const [saving, setSaving] = useState(false);

  const status = getStoreStatus(config, hours);
  const todayHours = getTodayHours(hours);

  const setField = (id: string, field: string, value: string | boolean) =>
    setDraft((prev) => prev.map((h) => (h.id === id ? { ...h, [field]: value } : h)));

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(draft.map((h) => updateHours(h.id, h)));
      toast({ title: 'Horários salvos!' });
    } catch (err) {
      toast({
        title: 'Erro ao salvar horários',
        description: 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleManualStatus = async (value: ManualStoreStatus) => {
    await updateConfig({ manualStatus: value });
    const labels: Record<string, string> = {
      open: 'Forçado Aberto',
      closed: 'Fechado',
      paused: 'Pausado',
    };
    toast({ title: value === null ? 'Modo automático ativado' : `Status: ${labels[value]}` });
  };

  const inputCls =
    'rounded-button border border-input bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring tabular-nums';

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">Horários</h1>
      <p className="mt-1 text-sm text-muted-foreground">Horários de funcionamento e status operacional</p>

      {/* Live status preview */}
      <div
        className={`mt-4 flex items-center gap-2 rounded-card border px-4 py-3 text-sm font-medium ${STATUS_COLORS[status.type]}`}
      >
        {status.type === 'open' && <CheckCircle size={14} />}
        {status.type === 'closed' && <XCircle size={14} />}
        {status.type === 'paused' && <PauseCircle size={14} />}
        {status.type === 'outside_hours' && <AlertTriangle size={14} />}
        <span>
          Status atual: <strong>{status.label}</strong>
          {status.type === 'open' && todayHours?.active && (
            <span className="ml-2 font-normal opacity-80">
              · Hoje {todayHours.openTime}–{todayHours.closeTime}
            </span>
          )}
          {status.type !== 'open' && status.message && (
            <span className="ml-2 font-normal opacity-80">— {status.message}</span>
          )}
        </span>
      </div>

      {/* Manual status override */}
      <div className="mt-6 rounded-card border border-border bg-card p-4 shadow-soft">
        <p className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Clock size={13} /> Controle Manual (substitui os horários automáticos)
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              { value: null, label: '🕐 Automático', desc: 'Usa os horários abaixo' },
              { value: 'open' as ManualStoreStatus, label: '✅ Forçar Aberto', desc: 'Aceita pedidos sempre' },
              { value: 'paused' as ManualStoreStatus, label: '⏸ Pausado', desc: 'Pedidos temporariamente bloqueados' },
              { value: 'closed' as ManualStoreStatus, label: '🔴 Fechado', desc: 'Loja fechada — bloqueia pedidos' },
            ]
          ).map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => handleManualStatus(opt.value as ManualStoreStatus)}
              className={`rounded-card border p-3 text-left transition-colors ${
                config.manualStatus === opt.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-background hover:bg-muted/40'
              }`}
            >
              <p className="text-xs font-semibold text-foreground">{opt.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Hours per day */}
      <div className="mt-6 space-y-3">
        {draft.map((h) => (
          <div
            key={h.id}
            className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-card p-4 shadow-soft"
          >
            <button
              onClick={() => setField(h.id, 'active', !h.active)}
              title={h.active ? 'Clique para fechar' : 'Clique para ativar'}
              className={`h-2.5 w-2.5 shrink-0 rounded-full transition-colors ${h.active ? 'bg-green-500' : 'bg-red-400'}`}
            />
            <span className="w-20 shrink-0 text-sm font-medium text-foreground">
              {DAY_NAMES[h.dayOfWeek]}
            </span>
            {h.active ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="time"
                  value={h.openTime}
                  onChange={(e) => setField(h.id, 'openTime', e.target.value)}
                  className={inputCls}
                />
                <span className="text-xs text-muted-foreground">até</span>
                <input
                  type="time"
                  value={h.closeTime}
                  onChange={(e) => setField(h.id, 'closeTime', e.target.value)}
                  className={inputCls}
                />
              </div>
            ) : (
              <span className="flex-1 text-sm text-muted-foreground">Fechado</span>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-button bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        <Save size={16} />
        {saving ? 'Salvando…' : 'Salvar Horários'}
      </button>
    </div>
  );
}
