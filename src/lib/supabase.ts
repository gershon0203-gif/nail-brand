import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

/**
 * True only when both values look like real Supabase credentials.
 * Placeholders from .env.example are deliberately rejected so the app never
 * pretends to be connected to a backend.
 */
const keyLooksValid =
  (rawKey.startsWith('sb_publishable_') && rawKey.length > 20) ||
  (rawKey.startsWith('eyJ') && rawKey.length > 60);

export const isSupabaseConfigured =
  /^https:\/\/[\w-]+\.supabase\.co\/?$/.test(rawUrl) &&
  keyLooksValid &&
  !/YOUR_|PLACEHOLDER|EXAMPLE/i.test(rawKey);

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || !isSupabaseConfigured;

const url = isSupabaseConfigured ? rawUrl : 'https://placeholder.supabase.co';
const anonKey = isSupabaseConfigured ? rawKey : 'placeholder-anon-key-not-a-real-key';

export const supabase: SupabaseClient = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'norwood-auth',
  },
  global: { headers: { 'x-application-name': 'norwood-storefront' } },
});

export const functionsUrl = (
  import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ||
  `${url}/functions/v1`
).replace(/\/$/, '');

export const STORAGE_URL = `${url}/storage/v1/object/public`;

/** Build a public URL for a Storage object path. */
export function publicImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  // Local demo assets and app-relative paths are served by Vite directly.
  if (/^https?:\/\//i.test(path) || path.startsWith('/')) return path;
  return `${STORAGE_URL}/${path.replace(/^\//, '')}`;
}

/** Extract a Storage object path from a full public URL, if applicable. */
export function storagePathFromUrl(value: string): string {
  if (!/^https?:\/\//i.test(value)) return value.replace(/^\//, '');
  const marker = '/storage/v1/object/public/';
  const index = value.indexOf(marker);
  return index >= 0 ? value.slice(index + marker.length) : value;
}
