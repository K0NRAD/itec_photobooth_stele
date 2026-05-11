/**
 * Supabase Storage Client.
 * @module services/supabase
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET ?? 'photos';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Lädt ein Bild in den Supabase-Bucket hoch.
 * @param {Blob} blob - Das fertige Ausgabebild
 * @param {string} sessionId
 * @param {string} format - 'stripe'|'collage'|'polaroid'|'grid'
 * @returns {Promise<{publicUrl: string|null, error: string|null}>}
 */
export async function uploadPhoto(blob, sessionId, format) {
  const path = `sessions/${sessionId}/${format}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { 
      contentType: 'image/jpeg', 
      cacheControl: '3600',
      upsert: false,    
    });

  if (error) {
    console.error('[supabase] Upload-Fehler:', error.message);
    return { publicUrl: null, error: error.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl, error: null };
}
