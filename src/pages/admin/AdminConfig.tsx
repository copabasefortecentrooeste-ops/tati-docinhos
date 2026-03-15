import { useState, useRef } from 'react';
import { Phone, Instagram, MapPin, Key, FileText, Upload, Save, Store } from 'lucide-react';
import { useStoreConfigStore } from '@/store/storeConfigStore';
import { compressImage } from '@/lib/imageUtils';
import { toast } from '@/hooks/use-toast';

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
    updateConfig(form);
    await new Promise((r) => setTimeout(r, 250));
    setSaving(false);
    toast({ title: 'Configurações salvas!' });
  };

  const inputCls =
    'w-full rounded-button border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">Configurações</h1>
      <p className="mt-1 text-sm text-muted-foreground">Dados da loja</p>

      {/* Logo */}
      <div className="mt-6 rounded-card border border-border bg-card p-4 shadow-soft">
        <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Store size={13} /> Logo da Loja
        </p>
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded-lg object-cover border border-border" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground">
              <Store size={22} />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-button border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
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

      {/* Fields */}
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
