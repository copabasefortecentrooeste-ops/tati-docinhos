import { useEffect } from 'react';

const DEFAULT_TITLE =
  'Faça Seu Pedido Aqui | Sistema de pedidos online para delivery e restaurantes';
const DEFAULT_DESC =
  'Plataforma de pedidos online para docerias, hamburguerias, pizzarias, marmitarias, açaí, lanchonetes e restaurantes. Organize pedidos, catálogo e operação em um só lugar.';

/**
 * Atualiza document.title e a meta description para a página atual.
 * Restaura os valores padrão quando o componente é desmontado.
 */
export function usePageTitle(title: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    let prevDesc = '';
    const metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (metaDesc) {
      prevDesc = metaDesc.getAttribute('content') ?? '';
      if (description) metaDesc.setAttribute('content', description);
    }

    return () => {
      document.title = prevTitle || DEFAULT_TITLE;
      if (metaDesc) metaDesc.setAttribute('content', prevDesc || DEFAULT_DESC);
    };
  }, [title, description]);
}
