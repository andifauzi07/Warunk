import { describe, expect, it } from 'vitest';
import {
  formatAngka,
  formatRupiah,
  parseCurrency,
  pesanError,
  tambahHari,
  tanggalBaca,
} from '../lib/format';

describe('formatRupiah', () => {
  it('memformat angka menjadi Rupiah id-ID', () => {
    expect(formatRupiah(170000)).toBe('Rp 170.000');
  });

  it('nilai 0 menjadi Rp 0', () => {
    expect(formatRupiah(0)).toBe('Rp 0');
  });

  it('null/undefined diperlakukan sebagai 0', () => {
    expect(formatRupiah(null)).toBe('Rp 0');
    expect(formatRupiah(undefined)).toBe('Rp 0');
  });
});

describe('formatAngka', () => {
  it('memformat ribuan dengan titik id-ID', () => {
    expect(formatAngka(12345)).toBe('12.345');
  });

  it('null/undefined menjadi 0', () => {
    expect(formatAngka(null)).toBe('0');
    expect(formatAngka(undefined)).toBe('0');
  });
});

describe('tanggalBaca', () => {
  it('memformat tanggal dalam bahasa Indonesia', () => {
    expect(tanggalBaca('2026-08-17')).toBe('Senin, 17 Agustus 2026');
  });
});

describe('pesanError', () => {
  it('mengambil message dari Error', () => {
    expect(pesanError(new Error('simpan gagal'))).toBe('simpan gagal');
  });

  it('mengambil message dari object', () => {
    expect(pesanError({ message: 'object message' })).toBe('object message');
  });

  it('fallback ke details jika message kosong', () => {
    expect(pesanError({ message: '', details: 'detail dari DB' })).toBe('detail dari DB');
  });

  it('pesan generik untuk tipe lain', () => {
    expect(pesanError('teks biasa')).toBe('Terjadi kesalahan');
    expect(pesanError({})).toBe('Terjadi kesalahan');
    expect(pesanError(null)).toBe('Terjadi kesalahan');
  });
});

describe('tambahHari', () => {
  it('melompati batas tahun', () => {
    expect(tambahHari('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('mundur melompati batas bulan (Februari non-kabisat)', () => {
    expect(tambahHari('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('mundur melompati batas bulan (Februari kabisat)', () => {
    expect(tambahHari('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('maju 30 hari dari pertengahan Januari', () => {
    expect(tambahHari('2026-01-15', 30)).toBe('2026-02-14');
  });

  it('zero offset mengembalikan tanggal sama', () => {
    expect(tambahHari('2026-08-17', 0)).toBe('2026-08-17');
  });
});

describe('parseCurrency', () => {
  it('parse angka dengan pemisah ribuan', () => {
    expect(parseCurrency('170.000')).toBe(170000);
  });

  it('parse string kosong menjadi 0', () => {
    expect(parseCurrency('')).toBe(0);
  });

  it('parse string dengan karakter non-digit', () => {
    expect(parseCurrency('Rp 170.000')).toBe(170000);
  });

  it('parse angka tanpa pemisah', () => {
    expect(parseCurrency('170000')).toBe(170000);
  });

  it('parse 0', () => {
    expect(parseCurrency('0')).toBe(0);
  });
});
