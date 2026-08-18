import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import MasterLaukView from '../../views/MasterLaukView.vue';
import AlertDialog from '../../components/AlertDialog.vue';
import * as rekonsiliasiSvc from '../../lib/services/rekonsiliasi';
import * as masterLaukSvc from '../../lib/services/masterLauk';
import type { MasterLauk } from '../../types/database';

vi.mock('@/lib/supabase', () => ({
  supabase: {},
  currentUserId: vi.fn().mockResolvedValue('user-1'),
}));

vi.mock('@/lib/services/rekonsiliasi', () => ({
  getRekonsiliasiByTanggal: vi.fn(),
  getCarryOverForLauk: vi.fn(),
  zeroCarryOverForLauk: vi.fn(),
}));

vi.mock('@/lib/services/masterLauk', () => ({
  fetchMasterLauk: vi.fn(),
  createLauk: vi.fn(),
  updateLauk: vi.fn(),
}));

function todayString() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const laukAktif: MasterLauk = {
  id: 'lauk-a',
  nama_lauk: 'Ayam',
  harga_jual_porsi: 10000,
  hpp_estimasi_porsi: 6000,
  is_active: true,
  created_at: '',
};

let queryClient: QueryClient;

async function mountView(
  status: string = 'pagi_pending',
  lauk: MasterLauk[] = [laukAktif],
): Promise<VueWrapper> {
  setActivePinia(createPinia());
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  vi.mocked(rekonsiliasiSvc.getRekonsiliasiByTanggal).mockResolvedValue({
    id: 'rek-1',
    tanggal: todayString(),
    status,
    total_uang_laci: 0,
    total_uang_digital: 0,
    modal_kembalian_pakai: 0,
    total_pendapatan_estimasi: 0,
    total_hpp_nyata: 0,
    total_kerugian: 0,
    keuntungan_bersih: 0,
    selisih_kas: 0,
  } as never);
  vi.mocked(masterLaukSvc.fetchMasterLauk).mockResolvedValue(lauk);
  vi.mocked(masterLaukSvc.updateLauk).mockResolvedValue(laukAktif);

  const wrapper = mount(MasterLaukView, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
    },
  });
  await flushPromises();
  return wrapper;
}

function findAlertDialog(wrapper: VueWrapper) {
  return wrapper.findComponent(AlertDialog);
}

describe('MasterLaukView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    queryClient?.clear();
    vi.restoreAllMocks();
  });

  it('menampilkan AlertDialog dengan pesan carry-over warning', async () => {
    vi.mocked(rekonsiliasiSvc.getCarryOverForLauk).mockResolvedValue(5);
    const wrapper = await mountView();

    const toggleBtn = wrapper.findAll('button').find((b) => b.text() === 'Aktif');
    await toggleBtn!.trigger('click');
    await flushPromises();

    const dialog = findAlertDialog(wrapper);
    expect(dialog.exists()).toBe(true);
    expect(dialog.props('pesan')).toBe(
      'Menonaktifkan lauk ini, akan membuat sisa porsi kemarin dianggap basi/rusak !',
    );
  });

  it('menampilkan AlertDialog dengan pesan sederhana tanpa carry-over', async () => {
    vi.mocked(rekonsiliasiSvc.getCarryOverForLauk).mockResolvedValue(0);
    const wrapper = await mountView();

    const toggleBtn = wrapper.findAll('button').find((b) => b.text() === 'Aktif');
    await toggleBtn!.trigger('click');
    await flushPromises();

    const dialog = findAlertDialog(wrapper);
    expect(dialog.exists()).toBe(true);
    expect(dialog.props('pesan')).toBe('Yakin menonaktifkan lauk ini ?');
  });

  it('memanggil zeroCarryOverForLauk saat konfirmasi dengan carry-over', async () => {
    vi.mocked(rekonsiliasiSvc.getCarryOverForLauk).mockResolvedValue(5);
    const wrapper = await mountView();

    const toggleBtn = wrapper.findAll('button').find((b) => b.text() === 'Aktif');
    await toggleBtn!.trigger('click');
    await flushPromises();

    const dialog = findAlertDialog(wrapper);
    dialog.vm.$emit('confirm');
    await flushPromises();

    expect(rekonsiliasiSvc.zeroCarryOverForLauk).toHaveBeenCalledWith('lauk-a', todayString());
    expect(masterLaukSvc.updateLauk).toHaveBeenCalledWith('lauk-a', { is_active: false });
  });

  it('tidak melakukan apa-apa jika user membatalkan', async () => {
    vi.mocked(rekonsiliasiSvc.getCarryOverForLauk).mockResolvedValue(5);
    const wrapper = await mountView();

    const toggleBtn = wrapper.findAll('button').find((b) => b.text() === 'Aktif');
    await toggleBtn!.trigger('click');
    await flushPromises();

    const dialog = findAlertDialog(wrapper);
    dialog.vm.$emit('cancel');
    await flushPromises();

    expect(rekonsiliasiSvc.zeroCarryOverForLauk).not.toHaveBeenCalled();
    expect(masterLaukSvc.updateLauk).not.toHaveBeenCalled();
  });

  it('menolak deaktivasi saat hari terkunci (malam_selesai)', async () => {
    const wrapper = await mountView('malam_selesai');

    const toggleBtn = wrapper.findAll('button').find((b) => b.text() === 'Aktif');
    await toggleBtn!.trigger('click');
    await flushPromises();

    const dialog = findAlertDialog(wrapper);
    expect(dialog.props('open')).toBe(false);
    expect(wrapper.text()).toContain('Hari ini sudah terkunci');
    expect(masterLaukSvc.updateLauk).not.toHaveBeenCalled();
  });
});
