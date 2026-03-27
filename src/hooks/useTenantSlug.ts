import { useParams } from 'react-router-dom';

/** Returns the current store slug from the URL params, or empty string. */
export function useTenantSlug(): string {
  const { slug } = useParams<{ slug?: string }>();
  return slug ?? '';
}
