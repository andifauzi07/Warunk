import { supabase } from '@/lib/supabase';
import type { StatusHarian } from '@/types/database';

export interface RingkasanHarianRow {
  id: string;
  tanggal: string;
  status: StatusHarian;
  total_uang_laci: number | null;
  total_uang_digital: number;
  modal_kembalian_pakai: number;
  total_pendapatan_estimasi: number;
  total_hpp_nyata: number;
  total_kerugian: number;
  keuntungan_bersih: number;
  selisih_kas: number;
  total_porsi_dikonsumsi: number;
  jumlah_lauk: number;
}

export interface TrendRow {
  tanggal: string;
  status: StatusHarian;
  keuntungan_bersih: number | null;
}

export interface RankingRow {
  lauk_id: string;
  nama_lauk: string;
  porsi_dikonsumsi: number;
  porsi_rusak_total: number;
}

export async function fetchRingkasanHarian(tanggal: string): Promise<RingkasanHarianRow | null> {
  const { data, error } = await supabase
    .from('ringkasan_harian')
    .select('*')
    .eq('tanggal', tanggal)
    .maybeSingle();
  if (error) throw error;
  return data as RingkasanHarianRow | null;
}

export async function fetchRekonsiliasiRange(dari: string, sampai: string): Promise<TrendRow[]> {
  const { data, error } = await supabase
    .from('rekonsiliasi_harian')
    .select('tanggal, status, keuntungan_bersih')
    .gte('tanggal', dari)
    .lte('tanggal', sampai)
    .order('tanggal', { ascending: true });
  if (error) throw error;
  return data as TrendRow[];
}

export async function fetchRankingLauk(dari: string, sampai: string): Promise<RankingRow[]> {
  const { data, error } = await supabase
    .from('detail_stok_harian')
    .select(
      'lauk_id, porsi_dikonsumsi, porsi_basi_pagi, porsi_rusak_malam, lauk:lauk_id(nama_lauk), rekonsiliasi_harian!inner(tanggal, status)',
    )
    .gte('rekonsiliasi_harian.tanggal', dari)
    .lte('rekonsiliasi_harian.tanggal', sampai)
    .eq('rekonsiliasi_harian.status', 'malam_selesai');
  if (error) throw error;

  const map = new Map<string, { nama: string; terjual: number; rusak: number }>();
  for (const row of data ?? []) {
    const r = row as unknown as {
      lauk_id: string;
      porsi_dikonsumsi: number;
      porsi_basi_pagi: number;
      porsi_rusak_malam: number;
      lauk: { nama_lauk: string } | null;
    };
    const cur = map.get(r.lauk_id) ?? { nama: r.lauk?.nama_lauk ?? 'Lauk', terjual: 0, rusak: 0 };
    cur.terjual += Math.max(0, r.porsi_dikonsumsi);
    cur.rusak += r.porsi_basi_pagi + r.porsi_rusak_malam;
    map.set(r.lauk_id, cur);
  }

  return Array.from(map.entries()).map(([lauk_id, v]) => ({
    lauk_id,
    nama_lauk: v.nama,
    porsi_dikonsumsi: v.terjual,
    porsi_rusak_total: v.rusak,
  }));
}
