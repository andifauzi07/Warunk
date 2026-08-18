import { createClient } from '@supabase/supabase-js';
import { useSessionStore } from '@/stores/session';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Jangan crash saat build/type-check; error jelas muncul saat runtime.
  console.error(
    'Warunk: VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY (atau ANON_KEY) belum diisi. ' +
      'Buat project di supabase.com lalu salin .env.example ke .env',
  );
}

// Jaring pengaman: cegah dev server tanpa sadar nyambung ke database
// non-lokal (mis. production) saat bun dev. Hanya aktif di mode dev,
// tidak pernah muncul di production build (import.meta.env.DEV di-strip Vite).
if (import.meta.env.DEV && supabaseUrl) {
  const isLocal = supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1');
  if (!isLocal) {
    console.warn(
      '%cWarunk: dev server ini terhubung ke Supabase NON-LOKAL',
      'color: white; background: #b91c1c; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
      `\nURL saat ini: ${supabaseUrl}` +
        '\nKalau ini bukan yang kamu maksud, cek .env.development.local dan pastikan ' +
        'bunx supabase start sudah jalan, lalu restart bun dev.',
    );
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder',
);

export async function currentUserId(): Promise<string | null> {
  const session = useSessionStore();
  return session.user?.id ?? null;
}
