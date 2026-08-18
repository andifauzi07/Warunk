import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
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

const laukA: MasterLauk = {
  id: 'lauk-a',
  nama_lauk: 'Ayam',
  harga_jual_porsi: 10000,
  hpp_estimasi_porsi: 6000,
  is_active: true,
  created_at: '',
};

const detailCarryOver = {
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
  lauk: laukA,
};

let queryClient: QueryClient;

async function mountView(
  status: string,
  detail: unknown[] = [detailCarryOver],
): Promise<VueWrapper> {
  setActivePinia(createPinia());
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  vi.mocked(svc.siapkanHari).mockResolvedValue({
    rekonsiliasi: {
      id: 'rek-1',
      tanggal: '2026-08-16',
      status,
      total_uang_laci: 0,
      total_uang_digital: 0,
      modal_kembalian_pakai: 0,
      total_pendapatan_estimasi: 0,
      total_hpp_nyata: 0,
      total_kerugian: 0,
      keuntungan_bersih: 0,
      selisih_kas: 0,
    } as never,
    detail: detail as never,
  });
  vi.mocked(fetchMasterLauk).mockResolvedValue([laukA]);

  const wrapper = mount(InputPagiView, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
    },
  });
  await flushPromises();
  return wrapper;
}

describe('InputPagiView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    queryClient?.clear();
  });

  it('hari pagi_selesai menampilkan mode ringkasan + tombol Ubah, tanpa tombol simpan', async () => {
    const wrapper = await mountView('pagi_selesai');
    expect(wrapper.text()).toContain('Input pagi tersimpan');
    expect(wrapper.text()).toContain('Ubah Input Pagi');
    expect(wrapper.text()).not.toContain('Selesai Input Pagi');
  });

  it('tombol Ubah Input Pagi kembali ke mode edit', async () => {
    const wrapper = await mountView('pagi_selesai');
    await wrapper.find('button').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Selesai Input Pagi');
  });

  it('Basi — Catat Rugi menandai seluruh carry-over dan mengurangi stok aktif', async () => {
    const wrapper = await mountView('pagi_pending');
    const buttons = wrapper.findAll('button');
    const basiBtn = buttons.find((b) => b.text().includes('Basi'));
    expect(basiBtn).toBeTruthy();
    await basiBtn!.trigger('click');
    await flushPromises();
    // (5 carry-over − 5 basi) + 0 baru = 0 stok aktif
    expect(wrapper.text()).toContain('Stok aktif hari ini: 0 porsi');
  });

  it('simpan pagi mengirim payload state lengkap (regresi fix-simpan-pagi-error-403)', async () => {
    const wrapper = await mountView('pagi_pending');
    const rows = (wrapper.vm as unknown as { rows: Array<Record<string, number | string>> }).rows;
    rows[0].porsiBaru = 10;
    rows[0].modalBaru = 70000;
    await flushPromises();

    const buttons = wrapper.findAll('button');
    const simpanBtn = buttons.find((b) => b.text().includes('Selesai Input Pagi'));
    await simpanBtn!.trigger('click');
    await flushPromises();

    expect(svc.simpanPagi).toHaveBeenCalledTimes(1);
    const items = vi.mocked(svc.simpanPagi).mock.calls[0]![1];
    expect(items).toHaveLength(1);
    const payload = items[0];
    expect(payload).toEqual({
      id: 'd1',
      lauk_id: 'lauk-a',
      porsi_carry_over: 5,
      hpp_carry_over_porsi: 6000,
      porsi_basi_pagi: 0,
      porsi_baru_dimasak: 10,
      modal_baru_total: 70000,
      hpp_baru_porsi: 7000,
    });
  });
});
