import { supabase } from '@/lib/supabase'
import type { PengaturanWarung } from '@/types/database'

export async function fetchPengaturan(): Promise<PengaturanWarung | null> {
  const { data, error } = await supabase
    .from('pengaturan_warung')
    .select('*')
    .maybeSingle()
  if (error) throw error
  return data as PengaturanWarung | null
}

export async function upsertPengaturan(
  input: Partial<PengaturanWarung> & { user_id: string },
): Promise<PengaturanWarung> {
  const { data, error } = await supabase
    .from('pengaturan_warung')
    .upsert(input)
    .select()
    .single()
  if (error) throw error
  return data as PengaturanWarung
}
