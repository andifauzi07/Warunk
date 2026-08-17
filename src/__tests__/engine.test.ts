import { describe, expect, it } from 'vitest';
import {
  hitungAgregat,
  hppBaruPorsi,
  hppGabungan,
  hppNyataItem,
  kerugianItem,
  pendapatanItem,
  porsiDikonsumsi,
  selisihKas,
  statusSelisih,
  stokAktifAwal,
} from '../lib/engine';
import type { ItemKalkulasi } from '../lib/engine';

// Contoh dari PRD §3.4: carry-over 5 porsi HPP 6.000, masak baru 20 porsi modal 140.000
const base: ItemKalkulasi = {
  porsi_carry_over: 5,
  hpp_carry_over_porsi: 6000,
  porsi_basi_pagi: 0,
  porsi_baru_dimasak: 20,
  modal_baru_total: 140000,
  porsi_sisa_layak_jual: 5,
  porsi_rusak_malam: 1,
  porsi_konsumsi: 2,
  harga_jual_porsi: 10000,
  hpp_estimasi_porsi: 6500,
};

describe('stokAktifAwal', () => {
  it('stok aktif = carry-over layak + porsi baru', () => {
    expect(stokAktifAwal(base)).toBe(25);
  });

  it('basi pagi dikeluarkan dari stok aktif', () => {
    expect(stokAktifAwal({ ...base, porsi_basi_pagi: 2 })).toBe(23);
  });
});

describe('hppGabungan (weighted average)', () => {
  it('sesuai contoh PRD: (5×6000 + 20×7000) ÷ 25 = 6800', () => {
    expect(hppGabungan(base)).toBe(6800);
  });

  it('nol saat tidak ada stok', () => {
    expect(hppGabungan({ ...base, porsi_carry_over: 0, porsi_baru_dimasak: 0 })).toBe(0);
  });

  it('fallback HPP estimasi saat modal belum diinput', () => {
    const tanpaModal = { ...base, modal_baru_total: 0, hpp_estimasi_porsi: 6500 };
    const hasil = (5 * 6000 + 20 * 6500) / 25;
    expect(hppGabungan(tanpaModal)).toBe(hasil);
  });
});

describe('porsiDikonsumsi', () => {
  it('stok 25 − sisa 5 − rusak 1 − konsumsi 2 = 17 terjual', () => {
    expect(porsiDikonsumsi(base)).toBe(17);
  });
});

describe('pendapatan', () => {
  it('hanya porsi terjual yang menghasilkan pendapatan', () => {
    expect(pendapatanItem(base)).toBe(17 * 10000);
  });
});

describe('kerugian', () => {
  it('basi pagi × HPP carry + rusak malam × HPP gabungan', () => {
    // basi pagi mengurangi stok aktif, sehingga HPP gabungan berubah (3×6000+20×7000)/23
    const item = { ...base, porsi_basi_pagi: 2 };
    const hppGab = hppGabungan(item);
    const kerugian = kerugianItem(item);
    expect(kerugian).toBeCloseTo(2 * 6000 + 1 * hppGab);
  });
});

describe('hitungAgregat', () => {
  it('profit = pendapatan − HPP nyata − kerugian', () => {
    const a = hitungAgregat([base]);
    expect(a.pendapatan).toBe(170000);
    expect(a.hppNyata).toBeCloseTo(17 * 6800);
    expect(a.kerugian).toBeCloseTo(6800);
    expect(a.profit).toBeCloseTo(170000 - 17 * 6800 - 6800);
  });

  it('konsumsi tidak menambah pendapatan tapi tetap membebani HPP', () => {
    const tanpaKonsumsi = { ...base, porsi_konsumsi: 0 };
    const a1 = hitungAgregat([base]);
    const a2 = hitungAgregat([tanpaKonsumsi]);
    // porsi terjual bertambah 2, sehingga pendapatan & HPP nyata naik
    expect(a1.pendapatan).toBe(a2.pendapatan - 2 * 10000);
  });
});

describe('statusSelisih', () => {
  it('hijau saat selisih dalam toleransi', () => {
    expect(statusSelisih(10000, 500000, 5)).toBe('aman');
  });

  it('kuning saat selisih menengah (hingga 2× toleransi)', () => {
    expect(statusSelisih(40000, 500000, 5)).toBe('waspada');
  });

  it('merah saat selisih besar', () => {
    expect(statusSelisih(60000, 500000, 5)).toBe('kritis');
  });
});

describe('selisihKas', () => {
  it('laci 480rb − float 100rb + digital 120rb − pendapatan 500rb = 0', () => {
    expect(selisihKas(480000, 100000, 120000, 500000)).toBe(0);
  });

  it('warung tunai murni', () => {
    expect(selisihKas(500000, 100000, 0, 400000)).toBe(0);
  });

  it('negatif = potensi kebocoran', () => {
    expect(selisihKas(300000, 100000, 0, 400000)).toBe(-200000);
  });
});

describe('hppBaruPorsi (fallback estimasi)', () => {
  it('modal diisi → modal ÷ porsi', () => {
    expect(hppBaruPorsi(base)).toBe(7000);
  });

  it('modal nol → pakai HPP estimasi', () => {
    expect(hppBaruPorsi({ ...base, modal_baru_total: 0, hpp_estimasi_porsi: 6500 })).toBe(6500);
  });

  it('modal nol dan estimasi tidak ada → 0', () => {
    expect(
      hppBaruPorsi({
        ...base,
        modal_baru_total: 0,
        hpp_estimasi_porsi: undefined,
      }),
    ).toBe(0);
  });

  it('tanpa porsi baru → 0 (hindari pembagian nol)', () => {
    expect(hppBaruPorsi({ ...base, porsi_baru_dimasak: 0 })).toBe(0);
  });
});

describe('hitungAgregat tanpa item', () => {
  it('mengembalikan agregat nol semua', () => {
    expect(hitungAgregat([])).toEqual({ pendapatan: 0, hppNyata: 0, kerugian: 0, profit: 0 });
  });
});

describe('porsi dikonsumsi negatif di-clamp', () => {
  it('pendapatan & HPP nyata 0 saat sisa melebihi stok', () => {
    const over = {
      ...base,
      porsi_sisa_layak_jual: 30,
      porsi_rusak_malam: 0,
      porsi_konsumsi: 0,
    };
    expect(porsiDikonsumsi(over)).toBeLessThan(0);
    expect(pendapatanItem(over)).toBe(0);
    expect(hppNyataItem(over)).toBe(0);
  });
});

describe('statusSelisih saat pendapatan ≤ 0', () => {
  it('selisih 0 dengan pendapatan 0 → aman', () => {
    expect(statusSelisih(0, 0, 5)).toBe('aman');
  });

  it('selisih bukan 0 dengan pendapatan 0 → kritis', () => {
    expect(statusSelisih(1000, 0, 5)).toBe('kritis');
    expect(statusSelisih(1000, -100, 5)).toBe('kritis');
  });
});
