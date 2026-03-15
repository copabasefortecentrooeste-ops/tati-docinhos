import { useState } from 'react';
import { Save } from 'lucide-react';
import { useHoursStore } from '@/store/hoursStore';
import { toast } from '@/hooks/use-toast';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function AdminHours() {
  const { hours, updateHours } = useHoursStore();
  const [draft, setDraft] = useState(() => hours.map((h) => ({ ...h })));
  const [saving, setSaving] = useState(false);

  const setField = (id: string, field: string, value: string | boolean) =>
    setDraft((prev) => prev.map((h) => (h.id === id ? { ...h, [field]: value } : h)));

  const handleSave = async () => {
    setSaving(true);
    draft.forEach((h) => updateHours(h.id, h));
    await new Promise((r) => setTimeout(r, 250));
    setSaving(false);
    toast({ title: 'Horários salvos!' });
  };

  const inputCls =
    'rounded-button border border-input bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring tabular-nums';

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">Horários</h1>
      <p className="mt-1 text-sm text-muted-foreground">Horários de funcionamento</p>

      <div className="mt-6 space-y-3">
        {draft.map((h) => (
          <div key={h.id} className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-card p-4 shadow-soft">
            <button
              onClick={() => setField(h.id, 'active', !h.active)}
              title={h.active ? 'Clique para fechar' : 'Clique para ativar'}
              className={`h-2.5 w-2.5 shrink-0 rounded-full transition-colors ${h.active ? 'bg-green-500' : 'bg-red-400'}`}
            />
            <span className="w-20 shrink-0 text-sm font-medium text-foreground">{DAY_NAMES[h.dayOfWeek]}</span>
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
