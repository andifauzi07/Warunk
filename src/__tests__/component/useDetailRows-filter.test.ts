import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import InputPagiView from '../../views/InputPagiView.vue';
import * as svc from '../../lib/services/rekonsiliasi';
import { fetchMasterLauk } from '../../lib/services/masterLauk';
import type { MasterLauk } from '../../types/database';

vi.mock('@/lib/supabase', () => ({
  supabase: {},
  currentUserId: vi.fn().mockResolvedValue('user-1'),
}));

vi.mock('@/lib/services/rekonsiliasi', () => ({
  siapkanHari: vi.fn(),
  simpanPagi: vi.fn(),
  simpanMalam: vi.fn(),
  getRekonsiliasiByTanggal: vi.fn(),
  createRekonsiliasi: vi.fn(),
  updateStatusRekonsiliasi: vi.fn(),
  tandaiLibur: vi.fn(),
}));

vi.mock('@/lib/services/masterLauk', () => ({
  fetchMasterLauk: vi.fn(),
  createLauk: vi.fn(),
  updateLauk: vi.fn(),
}));

const laukAktif: MasterLauk = {
  id: 'lauk-a',
  nama_lauk: 'Ayam',
  harga_jual_porsi: 10000,
  hpp_estimasi_porsi: 6000,
  is_active: true,
  created_at: '',
};

const laukNonaktif: MasterLauk = {
  id: 'lauk-b',
  nama_lauk: 'Telur',
  harga_jual_porsi: 5000,
  hpp_estimasi_porsi: 3000,
  is_active: false,
  created_at: '',
};

const detailAktif = {
  id: 'd1',
  rekonsiliasi_id: 'rek-1',
  lauk_id: 'lauk-a',
  porsi_carry_over: 5,
  hpp_carry_over_porsi: 6000,
  porsi_basi_pagi: 0,
  porsi_baru_dimasak: 0,
  modal_baru_total: 0,
  hpp_baru_porsi: 0,
  porsi_sisa_layak_jual: 0,
  porsi_rusak_malam: 0,
  porsi_konsumsi: 0,
  stok_aktif_awal: 5,
  hpp_gabungan_porsi: 6000,
  porsi_dikonsumsi: 5,
  lauk: laukAktif,
};

const detailNonaktif = {
  id: 'd2',
  rekonsiliasi_id: 'rek-1',
  lauk_id: 'lauk-b',
  porsi_carry_over: 3,
  hpp_carry_over_porsi: 3000,
  porsi_basi_pagi: 0,
  porsi_baru_dimasak: 0,
  modal_baru_total: 0,
  hpp_baru_porsi: 0,
  porsi_sisa_layak_jual: 0,
  porsi_rusak_malam: 0,
  porsi_konsumsi: 0,
  stok_aktif_awal: 3,
  hpp_gabungan_porsi: 3000,
  porsi_dikonsumsi: 3,
  lauk: laukNonaktif,
};

let queryClient: QueryClient;

async function mountView(): Promise<VueWrapper> {
  setActivePinia(createPinia());
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  vi.mocked(svc.siapkanHari).mockResolvedValue({
    rekonsiliasi: {
      id: 'rek-1',
      tanggal: '2026-08-16',
      status: 'pagi_pending',
      total_uang_laci: 0,
      total_uang_digital: 0,
      modal_kembalian_pakai: 0,
      total_pendapatan_estimasi: 0,
      total_hpp_nyata: 0,
      total_kerugian: 0,
      keuntungan_bersih: 0,
      selisih_kas: 0,
    } as never,
    detail: [detailAktif, detailNonaktif] as never,
  });
  vi.mocked(fetchMasterLauk).mockResolvedValue([laukAktif, laukNonaktif]);

  const wrapper = mount(InputPagiView, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
    },
  });
  await flushPromises();
  return wrapper;
}

describe('useDetailRows filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    queryClient?.clear();
  });

  it('hanya menampilkan lauk aktif, lauk nonaktif tidak tampil', async () => {
    const wrapper = await mountView();

    expect(wrapper.text()).toContain('Ayam');
    expect(wrapper.text()).not.toContain('Telur');
  });

  it('jumlah baris sesuai jumlah lauk aktif saja', async () => {
    const wrapper = await mountView();

    const rows = (wrapper.vm as unknown as { rows: Array<Record<string, string>> }).rows;
    expect(rows).toHaveLength(1);
    expect(rows[0].laukId).toBe('lauk-a');
  });
});
