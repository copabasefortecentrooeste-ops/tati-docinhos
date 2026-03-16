import { useState, useRef } from 'react';
import { Phone, Instagram, MapPin, Key, FileText, Upload, Save, Store, Truck } from 'lucide-react';
import { useStoreConfigStore } from '@/store/storeConfigStore';
import { compressImage } from '@/lib/imageUtils';
import { toast } from '@/hooks/use-toast';
import type { DeliveryMode } from '@/types';

export default function AdminConfig() {
  const { config, updateConfig } = useStoreConfigStore();
  const [form, setForm] = useState({ ...config });
  const [logoPreview, setLogoPreview] = useState<string>(config.logo || '');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await compressImage(file, 400);
      setLogoPreview(b64);
      setForm((f) => ({ ...f, logo: b64 }));
    } catch {
      toast({ title: 'Erro ao processar imagem', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast({ title: 'Nome e telefone são obrigatórios', variant: 'destructive' });
      return;
    }
    setSaving(true);
    await updateConfig(form);
    await new Promise((r) => setTimeout(r, 250));
    setSaving(false);
    toast({ title: 'Configurações salvas!' });
  };

  const inputCls =
    'w-full rounded-button border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">Configurações</h1>
      <p className="mt-1 text-sm text-muted-foreground">Dados da loja e regras de entrega</p>

      {/* Logo */}
      <div className="mt-6 rounded-card border border-border bg-card p-4 shadow-soft">
        <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Store size={13} /> Logo da Loja
        </p>
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded-lg border border-border object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground">
              <Store size={22} />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-button border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Upload size={14} /> Enviar imagem
            </button>
            <input
              type="text"
              placeholder="…ou cole uma URL de imagem"
              value={form.logo || ''}
              onChange={(e) => {
                setForm((f) => ({ ...f, logo: e.target.value }));
                setLogoPreview(e.target.value);
              }}
              className="rounded-button border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
        </div>
      </div>

      {/* Store info fields */}
      <div className="mt-4 space-y-4">
        {(
          [
            { key: 'name', label: 'Nome da Loja', Icon: Store },
            { key: 'phone', label: 'Telefone / WhatsApp', Icon: Phone },
            { key: 'instagram', label: 'Instagram', Icon: Instagram },
            { key: 'address', label: 'Endereço', Icon: MapPin },
            { key: 'pixKey', label: 'Chave PIX', Icon: Key },
          ] as const
        ).map(({ key, label, Icon }) => (
          <div key={key} className="rounded-card border border-border bg-card p-4 shadow-soft">
            <label className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              <Icon size={13} /> {label}
            </label>
            <input type="text" value={form[key] as string} onChange={set(key)} className={inputCls} />
          </div>
        ))}

        <div className="rounded-card border border-border bg-card p-4 shadow-soft">
          <label className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            <FileText size={13} /> Política de Entrega
          </label>
          <textarea
            value={form.deliveryPolicy}
            onChange={set('deliveryPolicy')}
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>
      </div>

      {/* Delivery Mode */}
      <div className="mt-8">
        <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <Truck size={18} /> Configuração de Entrega
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Define se a loja aceita pedidos somente na cidade padrão ou de qualquer local.
        </p>

        {/* Mode toggle */}
        <div className="rounded-card border border-border bg-card p-4 shadow-soft">
          <p className="mb-3 text-xs font-medium text-muted-foreground">Modo de entrega</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(
              [
                { value: 'city_only', label: '📍 Somente cidade padrão', desc: 'Bloqueia pedidos fora da cidade configurada' },
                { value: 'free', label: '🌎 Entrega livre', desc: 'Aceita pedidos de qualquer cidade' },
              ] as { value: DeliveryMode; label: string; desc: string }[]
            ).map((mode) => (
              <button
                key={mode.value}
                onClick={() => setForm((f) => ({ ...f, deliveryMode: mode.value }))}
                className={`rounded-card border p-4 text-left transition-colors ${
                  form.deliveryMode === mode.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-background hover:bg-muted/40'
                }`}
              >
                <p className="text-sm font-medium text-foreground">{mode.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{mode.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Default city fields */}
        <div className="mt-4 space-y-3">
          <div className="rounded-card border border-border bg-card p-4 shadow-soft">
            <label className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin size={13} /> Cidade padrão
            </label>
            <input
              type="text"
              placeholder="Pitangui"
              value={form.defaultCity ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, defaultCity: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-card border border-border bg-card p-4 shadow-soft">
              <label className="mb-1.5 text-xs text-muted-foreground">Estado</label>
              <input
                type="text"
                placeholder="MG"
                value={form.defaultState ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, defaultState: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="rounded-card border border-border bg-card p-4 shadow-soft">
              <label className="mb-1.5 text-xs text-muted-foreground">CEP padrão</label>
              <input
                type="text"
                placeholder="35650-000"
                value={form.defaultCep ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, defaultCep: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {form.deliveryMode === 'city_only' && (
          <div className="mt-3 rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            ⚠️ Modo ativo: clientes só conseguirão finalizar pedidos com entrega em{' '}
            <strong>{form.defaultCity || 'cidade não definida'}/{form.defaultState || 'UF'}</strong>.
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-button bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        <Save size={16} />
        {saving ? 'Salvando…' : 'Salvar Configurações'}
      </button>
    </div>
  );
}
