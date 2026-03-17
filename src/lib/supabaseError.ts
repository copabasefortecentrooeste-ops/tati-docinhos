/**
 * Maps Supabase/PostgreSQL errors to user-friendly Portuguese messages.
 * PostgreSQL error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */

interface SupabaseErrorLike {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
  status?: number;
}

export interface MappedError {
  /** Short title for the toast header */
  title: string;
  /** Longer description for the toast body */
  description: string;
  /** Original error, preserved for console logging */
  original: unknown;
}

/**
 * Per-table unique violation messages.
 * Keyed by the constraint name returned in error.message.
 */
const UNIQUE_MESSAGES: Record<string, string> = {
  orders_code_key:              'Já existe um pedido com este código.',
  orders_request_id_key:        'Este pedido já foi enviado. Aguarde a confirmação.',
  neighborhoods_name_unique:    'Já existe um bairro com este nome.',
  coupons_code_key:             'Já existe um cupom com este código.',
  categories_slug_key:          'Já existe uma categoria com este nome.',
  business_hours_day_unique:    'Já existe uma configuração para este dia da semana.',
};

/**
 * Per-constraint check violation messages.
 */
const CHECK_MESSAGES: Record<string, string> = {
  orders_status_valid:          'Status do pedido inválido.',
  orders_total_nonneg:          'O total do pedido não pode ser negativo.',
  orders_payment_method_valid:  'Método de pagamento inválido.',
  orders_items_nonempty:        'O pedido deve conter pelo menos um item.',
  products_base_price_positive: 'O preço do produto deve ser maior que zero.',
  products_min_quantity_valid:  'A quantidade mínima deve ser pelo menos 1.',
  coupons_value_positive:       'O valor do cupom deve ser maior que zero.',
  coupons_percentage_max:       'O desconto percentual não pode ultrapassar 100%.',
  neighborhoods_fee_nonneg:     'A taxa de entrega não pode ser negativa.',
  store_config_name_nonempty:   'O nome da loja não pode estar vazio.',
  customers_cep_format:         'O CEP deve estar no formato 00000-000.',
};

/**
 * Extract the constraint name from a Supabase error message.
 * Supabase typically includes the constraint name in the message or details.
 */
function extractConstraint(err: SupabaseErrorLike): string | null {
  const haystack = `${err.message ?? ''} ${err.details ?? ''}`.toLowerCase();
  // Try to find a known constraint name anywhere in the error text
  for (const key of [...Object.keys(UNIQUE_MESSAGES), ...Object.keys(CHECK_MESSAGES)]) {
    if (haystack.includes(key.toLowerCase())) return key;
  }
  return null;
}

/**
 * Returns true if the error looks like a network/connectivity failure.
 */
function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) return true;
  if (err instanceof Error && (
    err.message.includes('Failed to fetch') ||
    err.message.includes('NetworkError') ||
    err.message.includes('network') ||
    err.message.includes('ERR_INTERNET_DISCONNECTED')
  )) return true;
  return false;
}

/**
 * Maps any thrown error to a { title, description, original } object.
 * Safe to call with any value (string, Error, Supabase error object, etc.)
 */
export function mapSupabaseError(err: unknown): MappedError {
  console.error('[Supabase error]', err);

  // Network / offline
  if (isNetworkError(err)) {
    return {
      title: 'Sem conexão',
      description: 'Verifique sua internet e tente novamente.',
      original: err,
    };
  }

  const e = err as SupabaseErrorLike;

  // Auth / authorization (HTTP 401, 403 or Supabase auth errors)
  if (e?.status === 401 || e?.status === 403 || e?.code === 'PGRST301') {
    return {
      title: 'Não autorizado',
      description: 'Sua sessão pode ter expirado. Faça login novamente.',
      original: err,
    };
  }

  switch (e?.code) {
    // ── 23505: unique_violation ───────────────────────────────
    case '23505': {
      const constraint = extractConstraint(e);
      const specific = constraint ? UNIQUE_MESSAGES[constraint] : null;
      return {
        title: 'Registro duplicado',
        description: specific ?? 'Já existe um registro com estes dados.',
        original: err,
      };
    }

    // ── 23503: foreign_key_violation ──────────────────────────
    case '23503':
      return {
        title: 'Vínculo inválido',
        description:
          'Este registro está vinculado a outro dado que não existe ou foi removido. Verifique as dependências.',
        original: err,
      };

    // ── 23514: check_violation ────────────────────────────────
    case '23514': {
      const constraint = extractConstraint(e);
      const specific = constraint ? CHECK_MESSAGES[constraint] : null;
      return {
        title: 'Dado inválido',
        description: specific ?? 'Um valor enviado não passou na validação do banco.',
        original: err,
      };
    }

    // ── 23502: not_null_violation ─────────────────────────────
    case '23502':
      return {
        title: 'Campo obrigatório ausente',
        description: `Um campo obrigatório não foi preenchido: ${e?.message ?? ''}`.trim(),
        original: err,
      };

    // ── 42501: insufficient_privilege ────────────────────────
    case '42501':
      return {
        title: 'Permissão negada',
        description: 'Você não tem permissão para realizar esta operação.',
        original: err,
      };

    // ── PGRST116: row not found (PostgREST) ───────────────────
    case 'PGRST116':
      return {
        title: 'Registro não encontrado',
        description: 'O item que você tentou atualizar não existe mais.',
        original: err,
      };

    default:
      return {
        title: 'Erro ao salvar',
        description: e?.message
          ? `Erro: ${e.message}`
          : 'Ocorreu um erro inesperado. Tente novamente.',
        original: err,
      };
  }
}
