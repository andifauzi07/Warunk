import { createClient } from '@supabase/supabase-js'
import { useSessionStore } from '@/stores/session'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  // Jangan crash saat build/type-check; error jelas muncul saat runtime.
  console.error(
    'WarungKas: VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY (atau ANON_KEY) belum diisi. ' +
      'Buat project di supabase.com lalu salin .env.example ke .env',
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder',
)

export async function currentUserId(): Promise<string | null> {
  const session = useSessionStore()
  return session.user?.id ?? null
}
