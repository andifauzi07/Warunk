import { supabase, currentUserId } from '@/lib/supabase'
import type { MasterLauk } from '@/types/database'

export async function fetchMasterLauk(): Promise<MasterLauk[]> {
  const { data, error } = await supabase
    .from('master_lauk')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as MasterLauk[]
}

export type LaukInput = Pick<MasterLauk, 'nama_lauk' | 'harga_jual_porsi' | 'hpp_estimasi_porsi'>

export async function createLauk(input: LaukInput): Promise<MasterLauk> {
  const user_id = await currentUserId()
  if (!user_id) throw new Error('Belum login')
  const { data, error } = await supabase
    .from('master_lauk')
    .insert({ ...input, user_id })
    .select()
    .single()
  if (error) throw error
  return data as MasterLauk
}

export async function updateLauk(id: string, input: Partial<MasterLauk>): Promise<MasterLauk> {
  const { data, error } = await supabase
    .from('master_lauk')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as MasterLauk
}
