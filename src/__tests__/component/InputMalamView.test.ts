import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import InputMalamView from '../../views/InputMalamView.vue';
import * as svc from '../../lib/services/rekonsiliasi';
import { fetchMasterLauk } from '../../lib/services/masterLauk';
import { fetchPengaturan } from '../../lib/services/pengaturan';
import type { MasterLauk } from '../../types/database';

vi.mock('vue-router', () => ({
  useRoute: vi.fn().mockReturnValue({ query: {} }),
  useRouter: vi.fn().mockReturnValue({ push: vi.fn(), replace: vi.fn() }),
}));

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

vi.mock('@/lib/services/pengaturan', () => ({
  fetchPengaturan: vi.fn(),
  upsertPengaturan: vi.fn(),
}));

const laukA: MasterLauk = {
  id: 'lauk-a',
  nama_lauk: 'Ayam',
  harga_jual_porsi: 10000,
  hpp_estimasi_porsi: 6000,
  is_active: true,
  created_at: '',
};
const laukB: MasterLauk = {
  id: 'lauk-b',
  nama_lauk: 'Telur',
  harga_jual_porsi: 5000,
  hpp_estimasi_porsi: 3000,
  is_active: true,
  created_at: '',
};

const detailA = {
  id: 'd1',
  rekonsiliasi_id: 'rek-1',
  lauk_id: 'lauk-a',
  porsi_carry_over: 0,
  hpp_carry_over_porsi: 0,
  porsi_basi_pagi: 0,
  porsi_baru_dimasak: 10,
  modal_baru_total: 70000,
  hpp_baru_porsi: 7000,
  porsi_sisa_layak_jual: 2,
  porsi_rusak_malam: 0,
  porsi_konsumsi: 0,
  stok_aktif_awal: 10,
  hpp_gabungan_porsi: 7000,
  porsi_dikonsumsi: 8,
  lauk: laukA,
};

function rekonsiliasi(status: string) {
  return {
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
  };
}

let queryClient: QueryClient;

async function mountView(status: string): Promise<VueWrapper> {
  setActivePinia(createPinia());
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  vi.mocked(svc.siapkanHari).mockResolvedValue({
    rekonsiliasi: rekonsiliasi(status) as never,
    detail: [detailA] as never,
  });
  vi.mocked(fetchMasterLauk).mockResolvedValue([laukA, laukB]);
  vi.mocked(fetchPengaturan).mockResolvedValue({
    id: 'p1',
    user_id: 'user-1',
    modal_kembalian_default: 100000,
    toleransi_selisih_persen: 5,
    terima_pembayaran_digital: false,
  });

  const wrapper = mount(InputMalamView, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
    },
  });
  await flushPromises();
  return wrapper;
}

describe('InputMalamView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    queryClient?.clear();
  });

  it('hari pagi_pending menampilkan peringatan input pagi belum selesai', async () => {
    const wrapper = await mountView('pagi_pending');
    expect(wrapper.text()).toContain('Input pagi belum selesai');
    expect(wrapper.text()).not.toContain('Simpan & Kunci Hari Ini');
  });

  it('hari malam_selesai menampilkan ringkasan read-only dengan tombol Ubah Input Malam', async () => {
    const wrapper = await mountView('malam_selesai');
    expect(wrapper.text()).toContain('Input malam tersimpan');
    expect(wrapper.text()).not.toContain('Simpan & Kunci Hari Ini');
    expect(wrapper.text()).toContain('Ubah Input Malam');
  });

  it('hari pagi_selesai menampilkan opname dengan tombol simpan', async () => {
    const wrapper = await mountView('pagi_selesai');
    expect(wrapper.text()).toContain('Simpan & Kunci Hari Ini');
    expect(wrapper.text()).toContain('Sisa layak jual besok');
  });

  it('opname melebihi stok memblokir simpan dan menandai baris merah', async () => {
    const wrapper = await mountView('pagi_selesai');
    const rows = (wrapper.vm as unknown as { rows: Array<Record<string, number>> }).rows;
    rows[0].sisaLayak = 9;
    rows[0].rusakMalam = 2;
    await flushPromises();

    expect(wrapper.text()).toContain('Melebihi stok!');
    const buttons = wrapper.findAll('button');
    const simpanBtn = buttons.find((b) => b.text().includes('Simpan & Kunci Hari Ini'));
    expect(simpanBtn?.attributes('disabled')).toBeDefined();
  });

  it('uang laci kosong menolak simpan dengan pesan', async () => {
    const wrapper = await mountView('pagi_selesai');
    const buttons = wrapper.findAll('button');
    const simpanBtn = buttons.find((b) => b.text().includes('Simpan & Kunci Hari Ini'));
    expect(simpanBtn?.exists()).toBe(true);
    await simpanBtn!.trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Uang di laci wajib diisi.');
  });

  it('toggle makan sendiri menyembunyikan kolom konsumsi', async () => {
    const wrapper = await mountView('pagi_selesai');
    expect(wrapper.text()).toContain('Dimakan sendiri');

    const toggle = wrapper.findAll('button').find((b) => b.text().includes('makan sendiri'));
    await toggle!.trigger('click');
    await flushPromises();
    expect(wrapper.text()).not.toContain('Dimakan sendiri');
  });

  it('field modal bahan tidak ditampilkan di view malam', async () => {
    const wrapper = await mountView('pagi_selesai');
    expect(wrapper.text()).not.toContain('Modal bahan');
  });

  it('tombol Ubah Input Malam muncul saat malam_selesai', async () => {
    const wrapper = await mountView('malam_selesai');
    const ubahBtn = wrapper.findAll('button').find((b) => b.text().includes('Ubah Input Malam'));
    expect(ubahBtn?.exists()).toBe(true);
  });

  it('klik Ubah Input Malam menampilkan dialog konfirmasi', async () => {
    const wrapper = await mountView('malam_selesai');
    const ubahBtn = wrapper.findAll('button').find((b) => b.text().includes('Ubah Input Malam'));
    await ubahBtn!.trigger('click');
    await flushPromises();
    expect(document.body.textContent).toContain('Yakin ingin mengedit input malam hari ini');
  });
});
