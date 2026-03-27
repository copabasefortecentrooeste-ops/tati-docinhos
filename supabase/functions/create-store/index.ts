// Edge Function: create-store
// Operação privilegiada server-side para criar nova loja + admin.
// O service_role key NUNCA sai do servidor — vem de variável de ambiente segura.
// Caller deve ser master_admin (verificado via JWT).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESERVED_SLUGS = new Set([
  'admin','login','master','api','planos','contato','suporte','sobre','demo',
  'catalogo','carrinho','checkout','confirmacao','acompanhar','minha-conta',
  'perfil','termos','privacidade','not-found','404',
]);

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    // ── 1. Cliente admin server-side (service_role fica só aqui, no servidor) ──
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Configuração de servidor incompleta');
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 2. Verificar identidade do chamador via JWT ───────────────────────────
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Token ausente' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await adminClient.auth.getUser(token);

    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── 3. Autorização: somente master_admin ─────────────────────────────────
    const role = user.app_metadata?.role;
    if (role !== 'master_admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado: requer master_admin' }), {
        status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── 4. Validar payload ───────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const { name, slug, segment, plan, trialEndsAt, adminEmail, adminPassword } = body as Record<string, string>;

    if (!name?.trim())         throw new Error('name é obrigatório');
    if (!slug?.trim())         throw new Error('slug é obrigatório');
    if (!adminEmail?.trim())   throw new Error('adminEmail é obrigatório');
    if (!adminPassword)        throw new Error('adminPassword é obrigatório');
    if (adminPassword.length < 8) throw new Error('Senha deve ter ao menos 8 caracteres');
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('Slug inválido');
    if (RESERVED_SLUGS.has(slug))   throw new Error('Slug reservado pelo sistema');

    // ── 5. Verificar slug único ──────────────────────────────────────────────
    const { data: existing } = await adminClient
      .from('stores')
      .select('id')
      .eq('slug', slug.trim())
      .maybeSingle();

    if (existing) throw new Error(`Slug "${slug}" já está em uso`);

    // ── 6. Gerar UUID da nova loja ───────────────────────────────────────────
    const storeId = crypto.randomUUID();

    // ── 7. Criar usuário admin com app_metadata correto ──────────────────────
    const { data: newUserData, error: userErr } = await adminClient.auth.admin.createUser({
      email: adminEmail.trim(),
      password: adminPassword,
      app_metadata: { role: 'admin', store_id: storeId },
      email_confirm: true,   // confirmar e-mail automaticamente
    });

    if (userErr) throw new Error(`Erro ao criar usuário: ${userErr.message}`);
    const adminUserId = newUserData.user.id;

    // ── 8. Criar registro da loja ────────────────────────────────────────────
    const { error: storeErr } = await adminClient.from('stores').insert({
      id: storeId,
      slug: slug.trim(),
      name: name.trim(),
      owner_email: adminEmail.trim(),
      segment: segment ?? 'outro',
      plan: plan ?? 'trial',
      status: 'active',
      trial_ends_at: trialEndsAt || null,
    });

    if (storeErr) {
      // rollback: apagar usuário recém-criado
      await adminClient.auth.admin.deleteUser(adminUserId);
      throw new Error(`Erro ao criar loja: ${storeErr.message}`);
    }

    // ── 9. Criar store_config padrão ─────────────────────────────────────────
    await adminClient.from('store_config').insert({
      store_id: storeId,
      name: name.trim(),
      phone: '',
      instagram: '',
      address: '',
      pix_key: '',
      delivery_policy: 'Faço entregas na cidade.',
      delivery_mode: 'free',
      default_city: '',
      default_state: '',
      default_cep: '',
      manual_status: null,
      block_orders_outside_hours: false,
      closed_message: 'Estamos fechados no momento.',
      operational_message: '',
    });

    // ── 10. Criar horários padrão (seg-sab 09-18, dom fechado) ───────────────
    const defaultHours = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      store_id: storeId,
      day_of_week: day,
      open_time:  day === 0 ? null : '09:00',
      close_time: day === 0 ? null : '18:00',
      active: day !== 0,
    }));
    await adminClient.from('business_hours').insert(defaultHours);

    // ── 11. Retornar sucesso ─────────────────────────────────────────────────
    return new Response(
      JSON.stringify({ storeId, adminUserId }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    // Log seguro: não expor stack trace ao cliente
    console.error('[create-store] error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  }
});
