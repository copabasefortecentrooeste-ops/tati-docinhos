/** Build tenant-prefixed routes for a given store slug. */
export const tenantRoutes = (slug: string) => ({
  home: `/${slug}`,
  catalog: `/${slug}/catalogo`,
  product: (id: string) => `/${slug}/produto/${id}`,
  cart: `/${slug}/carrinho`,
  checkout: `/${slug}/checkout`,
  confirmation: (code: string) => `/${slug}/confirmacao/${code}`,
  tracking: `/${slug}/acompanhar`,
  login: (returnTo?: string) =>
    returnTo
      ? `/${slug}/login?returnTo=${encodeURIComponent(returnTo)}`
      : `/${slug}/login`,
  account: `/${slug}/conta`,
  admin: `/${slug}/admin`,
});
