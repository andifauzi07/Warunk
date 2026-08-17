import { createClient } from '@supabase/supabase-js';
import { useSessionStore } from '@/stores/session';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;

  const session = useSessionStore();
  return session.user?.id ?? null;
}
