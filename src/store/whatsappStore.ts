import { create } from 'zustand';
import {
  whatsAppService,
  type WhatsAppConnection,
  type WhatsAppTemplate,
  type WhatsAppAutomationRule,
  type WhatsAppMessageLog,
  type WhatsAppEventKey,
  type SendResult,
  type TemplateVariables,
} from '@/lib/whatsapp';

interface WhatsAppState {
  connection: WhatsAppConnection | null;
  templates: WhatsAppTemplate[];
  rules: WhatsAppAutomationRule[];
  logs: WhatsAppMessageLog[];
  loading: boolean;
  loadError: boolean;
  saving: boolean;

  initFromDB: (storeId?: string) => Promise<void>;
  refreshLogs: (storeId?: string) => Promise<void>;

  saveConnection: (conn: Partial<WhatsAppConnection> & { storeId: string }) => Promise<void>;
  saveTemplate: (t: Pick<WhatsAppTemplate, 'id' | 'storeId' | 'eventKey' | 'name' | 'body' | 'isActive'>) => Promise<void>;
  saveRule: (rule: Pick<WhatsAppAutomationRule, 'storeId' | 'eventKey' | 'templateId' | 'isActive' | 'sendMode'>) => Promise<void>;

  /** Trigger a WhatsApp notification for an order event */
  sendForOrder: (opts: {
    eventKey: WhatsAppEventKey;
    phone: string;
    variables: TemplateVariables;
    orderId?: string;
    orderCode?: string;
    storeId?: string;
  }) => Promise<SendResult & { fallbackUrl?: string }>;

  /** Test the current connection */
  validateConnection: () => Promise<{ ok: boolean; error?: string }>;
}

export const useWhatsAppStore = create<WhatsAppState>()((set, get) => ({
  connection: null,
  templates: [],
  rules: [],
  logs: [],
  loading: true,
  loadError: false,
  saving: false,

  initFromDB: async (storeId = 'default') => {
    set({ loading: true, loadError: false });
    try {
      const [connection, templates, rules, logs] = await Promise.all([
        whatsAppService.getConnection(storeId),
        whatsAppService.getTemplates(storeId),
        whatsAppService.getAutomationRules(storeId),
        whatsAppService.getLogs(storeId, 50),
      ]);
      set({ connection, templates, rules, logs, loading: false });
    } catch (err) {
      console.warn('[whatsapp] offline', err);
      set({ loading: false, loadError: true });
    }
  },

  refreshLogs: async (storeId = 'default') => {
    const logs = await whatsAppService.getLogs(storeId, 50);
    set({ logs });
  },

  saveConnection: async (conn) => {
    set({ saving: true });
    try {
      await whatsAppService.saveConnection(conn);
      const updated = await whatsAppService.getConnection(conn.storeId);
      set({ connection: updated, saving: false });
    } catch (err) {
      set({ saving: false });
      throw err;
    }
  },

  saveTemplate: async (t) => {
    set({ saving: true });
    try {
      await whatsAppService.saveTemplate(t);
      const templates = await whatsAppService.getTemplates(t.storeId);
      set({ templates, saving: false });
    } catch (err) {
      set({ saving: false });
      throw err;
    }
  },

  saveRule: async (rule) => {
    set({ saving: true });
    try {
      await whatsAppService.saveAutomationRule(rule);
      const rules = await whatsAppService.getAutomationRules(rule.storeId);
      set({ rules, saving: false });
    } catch (err) {
      set({ saving: false });
      throw err;
    }
  },

  sendForOrder: async (opts) => {
    const result = await whatsAppService.sendForOrder(opts);
    // Refresh logs after send attempt
    get().refreshLogs(opts.storeId);
    return result;
  },

  validateConnection: async () => {
    const { connection } = get();
    if (!connection) return { ok: false, error: 'Nenhuma conexão configurada' };
    const provider = whatsAppService.getProvider(connection.providerName);
    return provider.validateConnection(connection);
  },
}));
