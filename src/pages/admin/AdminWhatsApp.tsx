import { useEffect, useState } from 'react';
import {
  MessageCircle, Settings, Zap, FileText, History,
  WifiOff, RefreshCw, CheckCircle, XCircle, Clock,
  ExternalLink, ChevronDown, Eye, Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { useWhatsAppStore } from '@/store/whatsappStore';
import { useStoreConfigStore } from '@/store/storeConfigStore';
import {
  WA_EVENT_LABELS,
  TEMPLATE_VARIABLE_DOCS,
  interpolate,
  type WhatsAppEventKey,
  type WhatsAppTemplate,
  type WhatsAppAutomationRule,
} from '@/lib/whatsapp';
import { formatDatetimeBR } from '@/lib/dateTime';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

const STORE_ID = 'default';

const STATUS_COLORS: Record<string, string> = {
  sent:     'text-green-600 bg-green-50',
  failed:   'text-red-600 bg-red-50',
  pending:  'text-yellow-600 bg-yellow-50',
  fallback: 'text-blue-600 bg-blue-50',
};

const STATUS_LABELS: Record<string, string> = {
  sent:     'Enviado',
  failed:   'Falhou',
  pending:  'Pendente',
  fallback: 'Fallback',
};

// ── Mock variables for template preview ─────────────────────
const PREVIEW_VARS = {
  nome: 'Maria Silva',
  codigo: 'PED-001',
  loja: 'Taty Docinhos',
  status: 'Em Produção',
  produto: 'Brigadeiro Gourmet',
  valor_total: 'R$ 89,00',
  previsao_entrega: '18:00',
  link_pedido: 'localhost:8080/acompanhar',
  telefone_loja: '(67) 99999-9999',
};

export default function AdminWhatsApp() {
  const {
    connection, templates, rules, logs,
    loading, loadError, saving,
    initFromDB, saveConnection, saveTemplate, saveRule,
    validateConnection, refreshLogs,
  } = useWhatsAppStore();
  const { config } = useStoreConfigStore();

  // Config tab state
  const [connForm, setConnForm] = useState({
    isEnabled: false,
    displayPhone: '',
    fallbackWhatsappNumber: '',
    providerName: 'fallback_link' as 'fallback_link' | 'official_cloud_api',
    businessPhoneNumberId: '',
    verifyToken: '',
    webhookUrl: '',
    defaultCountryCode: '55',
    useOfficialApi: false,
  });
  const [testingConn, setTestingConn] = useState(false);
  const [connStatus, setConnStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  // Template tab state
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    initFromDB(STORE_ID);
  }, [initFromDB]);

  // Sync form when connection loads
  useEffect(() => {
    if (connection) {
      setConnForm({
        isEnabled:               connection.isEnabled,
        displayPhone:            connection.displayPhone,
        fallbackWhatsappNumber:  connection.fallbackWhatsappNumber ?? '',
        providerName:            connection.providerName,
        businessPhoneNumberId:   connection.businessPhoneNumberId ?? '',
        verifyToken:             connection.verifyToken ?? '',
        webhookUrl:              connection.webhookUrl ?? '',
        defaultCountryCode:      connection.defaultCountryCode,
        useOfficialApi:          connection.useOfficialApi,
      });
    }
  }, [connection]);

  const handleSaveConnection = async () => {
    try {
      await saveConnection({ ...connForm, storeId: STORE_ID });
      toast.success('Configurações salvas');
    } catch {
      toast.error('Erro ao salvar configurações');
    }
  };

  const handleTestConnection = async () => {
    setTestingConn(true);
    setConnStatus(null);
    try {
      const result = await validateConnection();
      setConnStatus({ ok: result.ok, msg: result.error ?? 'Conexão OK' });
    } catch {
      setConnStatus({ ok: false, msg: 'Erro inesperado ao testar' });
    } finally {
      setTestingConn(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    try {
      await saveTemplate({
        id:       editingTemplate.id,
        storeId:  STORE_ID,
        eventKey: editingTemplate.eventKey,
        name:     editingTemplate.name,
        body:     editingTemplate.body,
        isActive: editingTemplate.isActive,
      });
      setEditingTemplate(null);
      toast.success('Template salvo');
    } catch {
      toast.error('Erro ao salvar template');
    }
  };

  const handleToggleRule = async (rule: WhatsAppAutomationRule, field: 'isActive' | 'sendMode', value: boolean | string) => {
    try {
      await saveRule({
        storeId:    STORE_ID,
        eventKey:   rule.eventKey,
        templateId: rule.templateId,
        isActive:   field === 'isActive' ? (value as boolean) : rule.isActive,
        sendMode:   field === 'sendMode' ? (value as 'auto' | 'manual') : rule.sendMode,
      });
    } catch {
      toast.error('Erro ao salvar automação');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-center gap-2 text-destructive">
          <WifiOff size={16} />
          <span className="text-sm font-medium">Erro ao carregar configurações de WhatsApp</span>
        </div>
        <button
          onClick={() => initFromDB(STORE_ID)}
          className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw size={12} /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
            <MessageCircle size={20} className="text-green-600" />
            WhatsApp
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Notificações automáticas por status do pedido
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connection?.isEnabled ? (
            <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Integração ativa
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              Inativa
            </span>
          )}
        </div>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config" className="gap-1.5">
            <Settings size={13} /> Configurações
          </TabsTrigger>
          <TabsTrigger value="automations" className="gap-1.5">
            <Zap size={13} /> Automações
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <FileText size={13} /> Templates
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <History size={13} /> Logs
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Configurações ──────────────────────────────── */}
        <TabsContent value="config" className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5 space-y-5">
            {/* Enable toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Integração WhatsApp</p>
                <p className="text-xs text-muted-foreground">
                  Ativa envio de notificações automáticas
                </p>
              </div>
              <Switch
                checked={connForm.isEnabled}
                onCheckedChange={(v) => setConnForm((f) => ({ ...f, isEnabled: v }))}
              />
            </div>

            <div className="border-t border-border" />

            {/* Phone numbers */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Número de exibição
                </label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="(67) 99999-9999"
                  value={connForm.displayPhone}
                  onChange={(e) => setConnForm((f) => ({ ...f, displayPhone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Número de fallback
                  <span className="ml-1 text-muted-foreground">(para link wa.me)</span>
                </label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="5511999000000"
                  value={connForm.fallbackWhatsappNumber}
                  onChange={(e) => setConnForm((f) => ({ ...f, fallbackWhatsappNumber: e.target.value }))}
                />
              </div>
            </div>

            {/* Provider */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Provider</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={connForm.providerName}
                onChange={(e) => setConnForm((f) => ({
                  ...f,
                  providerName: e.target.value as typeof f.providerName,
                  useOfficialApi: e.target.value === 'official_cloud_api',
                }))}
              >
                <option value="fallback_link">Fallback Link (wa.me — sem API, funciona agora)</option>
                <option value="official_cloud_api">Meta Cloud API (produção)</option>
              </select>
            </div>

            {/* Official API fields */}
            {connForm.providerName === 'official_cloud_api' && (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 space-y-3">
                <p className="text-xs font-medium text-yellow-800">
                  Meta Cloud API — configuração de produção
                </p>
                <p className="text-xs text-yellow-700">
                  O access_token deve ser configurado em variável de ambiente server-side
                  (<code>WHATSAPP_ACCESS_TOKEN</code>), nunca no frontend.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Business Phone Number ID</label>
                    <input
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="123456789012345"
                      value={connForm.businessPhoneNumberId}
                      onChange={(e) => setConnForm((f) => ({ ...f, businessPhoneNumberId: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Verify Token (webhook)</label>
                    <input
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="meu-verify-token-secreto"
                      value={connForm.verifyToken}
                      onChange={(e) => setConnForm((f) => ({ ...f, verifyToken: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-foreground">Webhook URL</label>
                    <input
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="https://sua-api.com/webhooks/whatsapp"
                      value={connForm.webhookUrl}
                      onChange={(e) => setConnForm((f) => ({ ...f, webhookUrl: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Connection test result */}
            {connStatus && (
              <div className={`rounded-md p-3 flex items-center gap-2 text-sm ${connStatus.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {connStatus.ok
                  ? <CheckCircle size={14} />
                  : <XCircle size={14} />
                }
                {connStatus.msg}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSaveConnection}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Save size={13} />
                {saving ? 'Salvando...' : 'Salvar configurações'}
              </button>
              <button
                onClick={handleTestConnection}
                disabled={testingConn}
                className="flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50"
              >
                {testingConn
                  ? <RefreshCw size={13} className="animate-spin" />
                  : <Zap size={13} />
                }
                Testar conexão
              </button>
            </div>
          </div>

          {/* Env vars reference */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <p className="text-xs font-medium text-foreground">Variáveis de ambiente necessárias</p>
            <div className="space-y-1 font-mono text-xs text-muted-foreground">
              <div>VITE_WA_API_URL=<span className="text-foreground">https://sua-api.com</span> <span className="text-muted-foreground/60"># proxy server-side</span></div>
              <div>WHATSAPP_ACCESS_TOKEN=<span className="text-foreground">seu_token</span> <span className="text-muted-foreground/60"># NUNCA no frontend</span></div>
              <div>WHATSAPP_WEBHOOK_SECRET=<span className="text-foreground">seu_secret</span></div>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 2: Automações ─────────────────────────────────── */}
        <TabsContent value="automations" className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Configure quais eventos disparam mensagens automáticas ao cliente.
          </p>
          {rules.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <Zap size={24} className="mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Nenhuma automação encontrada. Verifique a migration 010.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Evento</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Template</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Modo</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">Ativo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rules.map((rule) => {
                    const tpl = templates.find((t) => t.id === rule.templateId || t.eventKey === rule.eventKey);
                    return (
                      <tr key={rule.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <span className="font-medium text-foreground">
                            {WA_EVENT_LABELS[rule.eventKey] ?? rule.eventKey}
                          </span>
                          <span className="ml-2 text-[10px] font-mono text-muted-foreground">
                            {rule.eventKey}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {tpl?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={rule.sendMode}
                            onChange={(e) => handleToggleRule(rule, 'sendMode', e.target.value)}
                            className="rounded border border-input bg-background px-2 py-1 text-xs"
                          >
                            <option value="auto">Automático</option>
                            <option value="manual">Manual</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={(v) => handleToggleRule(rule, 'isActive', v)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── TAB 3: Templates ──────────────────────────────────── */}
        <TabsContent value="templates" className="space-y-4">
          {editingTemplate ? (
            /* ── Template editor ── */
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">
                  Editando: {editingTemplate.name}
                </h3>
                <button
                  onClick={() => setPreviewMode((p) => !p)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Eye size={12} /> {previewMode ? 'Editar' : 'Pré-visualizar'}
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Nome do template</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate((t) => t && ({ ...t, name: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Mensagem</label>
                {previewMode ? (
                  <div className="min-h-[100px] rounded-md border border-input bg-green-50 px-3 py-2.5 text-sm whitespace-pre-wrap text-gray-800">
                    {interpolate(editingTemplate.body, PREVIEW_VARS)}
                  </div>
                ) : (
                  <textarea
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                    value={editingTemplate.body}
                    onChange={(e) => setEditingTemplate((t) => t && ({ ...t, body: e.target.value }))}
                  />
                )}
              </div>

              {/* Variable chips */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Variáveis disponíveis</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(TEMPLATE_VARIABLE_DOCS).map(([key, desc]) => (
                    <button
                      key={key}
                      title={desc}
                      onClick={() => setEditingTemplate((t) => t && ({ ...t, body: t.body + `{{${key}}}` }))}
                      className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    >
                      {`{{${key}}}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Save size={13} />
                  {saving ? 'Salvando...' : 'Salvar template'}
                </button>
                <button
                  onClick={() => { setEditingTemplate(null); setPreviewMode(false); }}
                  className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            /* ── Template list ── */
            <div className="space-y-2">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-start justify-between rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted/30"
                >
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">{t.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {t.eventKey}
                      </span>
                      {!t.isActive && (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{t.body}</p>
                  </div>
                  <button
                    onClick={() => { setEditingTemplate(t); setPreviewMode(false); }}
                    className="ml-3 shrink-0 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    Editar
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── TAB 4: Logs ───────────────────────────────────────── */}
        <TabsContent value="logs" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Últimas {logs.length} mensagens
            </p>
            <button
              onClick={() => refreshLogs(STORE_ID)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw size={11} /> Atualizar
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <History size={24} className="mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Nenhuma mensagem enviada ainda
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Data</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Pedido</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Telefone</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Evento</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Erro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20">
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                        {formatDatetimeBR(log.createdAt)}
                      </td>
                      <td className="px-3 py-2.5 font-medium">
                        {log.orderCode ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">
                        {log.recipientPhone}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {log.eventKey ? (WA_EVENT_LABELS[log.eventKey as WhatsAppEventKey] ?? log.eventKey) : '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[log.status] ?? ''}`}>
                          {STATUS_LABELS[log.status] ?? log.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-red-500 max-w-[200px] truncate">
                        {log.errorMessage ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary metrics */}
          {logs.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(['sent', 'failed', 'fallback', 'pending'] as const).map((s) => {
                const count = logs.filter((l) => l.status === s).length;
                return (
                  <div key={s} className="rounded-lg border border-border bg-card p-3 text-center">
                    <p className="text-lg font-semibold text-foreground">{count}</p>
                    <p className={`text-xs ${STATUS_COLORS[s]?.split(' ')[0] ?? 'text-muted-foreground'}`}>
                      {STATUS_LABELS[s]}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
