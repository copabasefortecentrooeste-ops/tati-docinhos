import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/imageUtils';

export const PRODUCT_IMAGES_BUCKET = 'product-images';

/**
 * Compresses a File, uploads it to Supabase Storage and returns the public URL.
 * Throws with a descriptive message on failure.
 */
export async function uploadProductImage(file: File): Promise<string> {
  // Compress to JPEG (max 800px) before uploading
  const b64 = await compressImage(file, 800);

  // Convert base64 data URL → Blob
  const res = await fetch(b64);
  const blob = await res.blob();

  const filename = `${crypto.randomUUID()}.jpg`;

  const { data, error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(filename, blob, { contentType: 'image/jpeg', upsert: false });

  if (error) throw new Error(`Upload falhou: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(data.path);

  return publicUrl;
}
