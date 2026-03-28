/** Build tenant-prefixed routes for a given store slug.
 *  When slug is empty (legacy global routes), falls back to absolute paths
 *  without a prefix to avoid double-slash URLs like "//catalogo". */
export const tenantRoutes = (slug: string) => {
  const p = slug ? `/${slug}` : '';
  return {
    home: p || '/',
    catalog: `${p}/catalogo`,
    product: (id: string) => `${p}/produto/${id}`,
    cart: `${p}/carrinho`,
    checkout: `${p}/checkout`,
    confirmation: (code: string) => `${p}/confirmacao/${code}`,
    tracking: `${p}/acompanhar`,
    login: (returnTo?: string) =>
      returnTo
        ? `${p}/login?returnTo=${encodeURIComponent(returnTo)}`
        : `${p}/login`,
    account: `${p}/conta`,
    admin: `${p}/admin`,
  };
};
