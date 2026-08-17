export type StatusHarian = 'pagi_pending' | 'pagi_selesai' | 'malam_selesai' | 'libur';

export interface MasterLauk {
  id: string;
  nama_lauk: string;
  harga_jual_porsi: number;
  hpp_estimasi_porsi: number;
  is_active: boolean;
  created_at: string;
}

export interface RekonsiliasiHarian {
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
  created_at: string;
}

export interface DetailStokHarian {
  id: string;
  rekonsiliasi_id: string;
  lauk_id: string;
  carry_over_dari_id: string | null;
  porsi_carry_over: number;
  hpp_carry_over_porsi: number;
  porsi_basi_pagi: number;
  porsi_baru_dimasak: number;
  modal_baru_total: number;
  hpp_baru_porsi: number;
  porsi_sisa_layak_jual: number;
  porsi_rusak_malam: number;
  porsi_konsumsi: number;
  stok_aktif_awal: number;
  hpp_gabungan_porsi: number;
  porsi_dikonsumsi: number;
  created_at: string;
}

export interface PengaturanWarung {
  id: string;
  user_id: string;
  modal_kembalian_default: number;
  toleransi_selisih_persen: number;
  terima_pembayaran_digital: boolean;
}

/** Detail lauk yang dilengkapi data master (hasil join) untuk layar pagi/malam */
export interface DetailStokLengkap extends DetailStokHarian {
  lauk?: MasterLauk;
}

export const STATUS_LABEL: Record<StatusHarian, string> = {
  pagi_pending: 'Input Pagi',
  pagi_selesai: 'Input Malam',
  malam_selesai: 'Selesai',
  libur: 'Libur',
};
