import { supabase, currentUserId } from '@/lib/supabase'
import type {
  DetailStokHarian,
  DetailStokLengkap,
  MasterLauk,
  RekonsiliasiHarian,
  StatusHarian,
} from '@/types/database'

export async function getRekonsiliasiByTanggal(
  tanggal: string,
): Promise<RekonsiliasiHarian | null> {
  const { data, error } = await supabase
    .from('rekonsiliasi_harian')
    .select('*')
    .eq('tanggal', tanggal)
    .maybeSingle()
  if (error) throw error
  return data as RekonsiliasiHarian | null
}

export async function createRekonsiliasi(
  tanggal: string,
  status: StatusHarian = 'pagi_pending',
): Promise<RekonsiliasiHarian> {
  const user_id = await currentUserId()
  if (!user_id) throw new Error('Belum login')
  const { data, error } = await supabase
    .from('rekonsiliasi_harian')
    .insert({ tanggal, status, user_id })
    .select()
    .single()
  if (error) throw error
  return data as RekonsiliasiHarian
}

export async function updateStatusRekonsiliasi(
  id: string,
  status: StatusHarian,
): Promise<void> {
  const { error } = await supabase
    .from('rekonsiliasi_harian')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

/** Hari operasional terakhir sebelum `tanggal` yang sudah menuntaskan malam (malam_selesai). */
export async function getHariOperasionalTerakhir(
  tanggal: string,
): Promise<RekonsiliasiHarian | null> {
  const { data, error } = await supabase
    .from('rekonsiliasi_harian')
    .select('*')
    .lt('tanggal', tanggal)
    .eq('status', 'malam_selesai')
    .order('tanggal', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as RekonsiliasiHarian | null
}

export async function getDetailByRekonsiliasi(
  rekonsiliasiId: string,
): Promise<DetailStokLengkap[]> {
  const { data, error } = await supabase
    .from('detail_stok_harian')
    .select('*, lauk:lauk_id(*)')
    .eq('rekonsiliasi_id', rekonsiliasiId)
  if (error) throw error
  return data as unknown as DetailStokLengkap[]
}

export async function getCarryOverDetail(
  rekonsiliasiId: string,
): Promise<DetailStokLengkap[]> {
  const { data, error } = await supabase
    .from('detail_stok_harian')
    .select('*, lauk:lauk_id(*)')
    .eq('rekonsiliasi_id', rekonsiliasiId)
    .gt('porsi_sisa_layak_jual', 0)
  if (error) throw error
  return data as unknown as DetailStokLengkap[]
}

/**
 * Memastikan baris detail untuk hari ini tersedia untuk setiap lauk aktif.
 * Carry-over diambil dari hari operasional terakhir (dapat melompati hari libur).
 * Fungsi ini dipanggil saat layar pagi/malam dibuka; idempotent.
 *
 * Mengembalikan daftar detail lengkap (baris yang sudah ada + baris hasil seed)
 * sehingga pemanggil tidak perlu mengambil ulang detail setelah seed.
 */
export async function seedDetailHariIni(
  rekonsiliasiId: string,
  tanggal: string,
  laukAktif: MasterLauk[],
): Promise<DetailStokLengkap[]> {
  const existing = await getDetailByRekonsiliasi(rekonsiliasiId)
  const existingLaukIds = new Set(existing.map((d) => d.lauk_id))
  const perlu = laukAktif.filter((l) => !existingLaukIds.has(l.id))
  if (perlu.length === 0) return existing

  const sumber = await getHariOperasionalTerakhir(tanggal)
  const carryMap = new Map<string, DetailStokHarian>()
  if (sumber) {
    const carryRows = await getCarryOverDetail(sumber.id)
    for (const r of carryRows) {
      carryMap.set(r.lauk_id, r)
    }
  }

  const user_id = await currentUserId()
  if (!user_id) throw new Error('Belum login')

  const rows = perlu.map((lauk) => {
    const c = carryMap.get(lauk.id)
    return {
      user_id,
      rekonsiliasi_id: rekonsiliasiId,
      lauk_id: lauk.id,
      carry_over_dari_id: c?.id ?? null,
      porsi_carry_over: c?.porsi_sisa_layak_jual ?? 0,
      hpp_carry_over_porsi: c?.hpp_gabungan_porsi ?? 0,
    }
  })

  const { data, error } = await supabase
    .from('detail_stok_harian')
    .insert(rows)
    .select()
  if (error) throw error

  const inserted = (data ?? []) as DetailStokHarian[]
  const laukById = new Map(laukAktif.map((l) => [l.id, l]))
  const lengkap: DetailStokLengkap[] = inserted.map((d) => ({
    ...d,
    lauk: laukById.get(d.lauk_id),
  }))
  return [...existing, ...lengkap]
}

export interface DetailPagiInput {
  id: string
  lauk_id: string
  porsi_carry_over: number
  hpp_carry_over_porsi: number
  porsi_basi_pagi: number
  porsi_baru_dimasak: number
  modal_baru_total: number
  hpp_baru_porsi: number
}

export async function simpanPagi(
  rekonsiliasiId: string,
  items: DetailPagiInput[],
): Promise<void> {
  const user_id = await currentUserId()
  if (!user_id) throw new Error('Belum login')
  const { error } = await supabase
    .from('detail_stok_harian')
    .upsert(items.map((i) => ({ ...i, user_id, rekonsiliasi_id: rekonsiliasiId })))
  if (error) throw error

  const { error: errStatus } = await supabase
    .from('rekonsiliasi_harian')
    .update({ status: 'pagi_selesai' })
    .eq('id', rekonsiliasiId)
  if (errStatus) throw errStatus
}

export interface DetailMalamInput {
  id: string
  lauk_id: string
  porsi_carry_over: number
  hpp_carry_over_porsi: number
  porsi_basi_pagi: number
  porsi_baru_dimasak: number
  modal_baru_total: number
  hpp_baru_porsi: number
  porsi_sisa_layak_jual: number
  porsi_rusak_malam: number
  porsi_konsumsi: number
}

export async function simpanMalam(
  rekonsiliasiId: string,
  items: DetailMalamInput[],
  uangLaci: number,
  uangDigital: number,
  modalKembalianPakai: number,
): Promise<void> {
  const user_id = await currentUserId()
  if (!user_id) throw new Error('Belum login')
  // Detail dulu (trigger menghitung ulang agregat saat status belum terkunci),
  // lalu kunci status + kolom uang.
  const { error } = await supabase
    .from('detail_stok_harian')
    .upsert(items.map((i) => ({ ...i, user_id, rekonsiliasi_id: rekonsiliasiId })))
  if (error) throw error

  const { error: errStatus } = await supabase
    .from('rekonsiliasi_harian')
    .update({
      status: 'malam_selesai',
      total_uang_laci: uangLaci,
      total_uang_digital: uangDigital,
      modal_kembalian_pakai: modalKembalianPakai,
    })
    .eq('id', rekonsiliasiId)
  if (errStatus) throw errStatus
}

export async function tandaiLibur(tanggal: string): Promise<RekonsiliasiHarian> {
  const ada = await getRekonsiliasiByTanggal(tanggal)
  if (ada) {
    const { error } = await supabase
      .from('rekonsiliasi_harian')
      .update({ status: 'libur' })
      .eq('id', ada.id)
    if (error) throw error
    return { ...ada, status: 'libur' }
  }
  return createRekonsiliasi(tanggal, 'libur')
}

/** Get-or-create rekonsiliasi + detail untuk tanggal tertentu (alur pagi/malam). */
export async function siapkanHari(
  tanggal: string,
  laukAktif: MasterLauk[],
): Promise<{ rekonsiliasi: RekonsiliasiHarian; detail: DetailStokLengkap[] }> {
  let rekonsiliasi = await getRekonsiliasiByTanggal(tanggal)
  if (!rekonsiliasi) {
    rekonsiliasi = await createRekonsiliasi(tanggal)
  }
  const detail = await seedDetailHariIni(rekonsiliasi.id, tanggal, laukAktif)
  return { rekonsiliasi, detail }
}
