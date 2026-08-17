/**
 * Engine rekonsiliasi mundur — pure functions.
 * Dipakai untuk feedback live di UI sebelum disimpan.
 * Database menyimpan hasilnya via generated columns + trigger (nilai terkunci).
 */

export interface ItemKalkulasi {
  porsi_carry_over: number;
  hpp_carry_over_porsi: number;
  porsi_basi_pagi: number;
  porsi_baru_dimasak: number;
  modal_baru_total: number;
  porsi_sisa_layak_jual: number;
  porsi_rusak_malam: number;
  porsi_konsumsi: number;
  harga_jual_porsi?: number;
  hpp_estimasi_porsi?: number;
}

export function stokAktifAwal(i: ItemKalkulasi): number {
  return i.porsi_carry_over - i.porsi_basi_pagi + i.porsi_baru_dimasak;
}

/** HPP porsi baru; fallback ke HPP estimasi master jika modal belum diinput. */
export function hppBaruPorsi(i: ItemKalkulasi): number {
  if (i.porsi_baru_dimasak <= 0) return 0;
  if (i.modal_baru_total > 0) return i.modal_baru_total / i.porsi_baru_dimasak;
  return i.hpp_estimasi_porsi ?? 0;
}

export function hppGabungan(i: ItemKalkulasi): number {
  const stok = stokAktifAwal(i);
  if (stok <= 0) return 0;
  const modalCarry = (i.porsi_carry_over - i.porsi_basi_pagi) * i.hpp_carry_over_porsi;
  const modalBaru = i.porsi_baru_dimasak * hppBaruPorsi(i);
  return (modalCarry + modalBaru) / stok;
}

export function porsiDikonsumsi(i: ItemKalkulasi): number {
  return stokAktifAwal(i) - i.porsi_sisa_layak_jual - i.porsi_rusak_malam - i.porsi_konsumsi;
}

export function pendapatanItem(i: ItemKalkulasi): number {
  return Math.max(0, porsiDikonsumsi(i)) * (i.harga_jual_porsi ?? 0);
}

export function hppNyataItem(i: ItemKalkulasi): number {
  return Math.max(0, porsiDikonsumsi(i)) * hppGabungan(i);
}

export function kerugianItem(i: ItemKalkulasi): number {
  return i.porsi_basi_pagi * i.hpp_carry_over_porsi + i.porsi_rusak_malam * hppGabungan(i);
}

export interface AgregatHarian {
  pendapatan: number;
  hppNyata: number;
  kerugian: number;
  profit: number;
}

export function hitungAgregat(items: ItemKalkulasi[]): AgregatHarian {
  const pendapatan = items.reduce((s, i) => s + pendapatanItem(i), 0);
  const hppNyata = items.reduce((s, i) => s + hppNyataItem(i), 0);
  const kerugian = items.reduce((s, i) => s + kerugianItem(i), 0);
  return {
    pendapatan,
    hppNyata,
    kerugian,
    profit: pendapatan - hppNyata - kerugian,
  };
}

export function selisihKas(
  uangLaci: number,
  modalKembalian: number,
  uangDigital: number,
  pendapatan: number,
): number {
  return uangLaci - modalKembalian + uangDigital - pendapatan;
}

/** Warna indikator detektor selisih kas berdasarkan ambang toleransi (% pendapatan). */
export function statusSelisih(
  selisih: number,
  pendapatan: number,
  toleransiPersen: number,
): 'aman' | 'waspada' | 'kritis' {
  const a = Math.abs(selisih);
  if (pendapatan <= 0) return a > 0 ? 'kritis' : 'aman';
  const ambang = pendapatan * (toleransiPersen / 100);
  if (a <= ambang) return 'aman';
  if (a <= ambang * 2) return 'waspada';
  return 'kritis';
}
