import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import RiwayatPendapatanCard from '../../components/RiwayatPendapatanCard.vue';
import type { RiwayatPendapatanRow } from '../../lib/services/analitik';

const rowPos: RiwayatPendapatanRow = {
  tanggal: '2026-08-22',
  status: 'malam_selesai',
  total_pendapatan_estimasi: 1300000,
  total_porsi_dikonsumsi: 142,
  keuntungan_bersih: 480000,
};

const rowNeg: RiwayatPendapatanRow = {
  tanggal: '2026-08-22',
  status: 'malam_selesai',
  total_pendapatan_estimasi: 500000,
  total_porsi_dikonsumsi: 40,
  keuntungan_bersih: -20000,
};

describe('RiwayatPendapatanCard', () => {
  it('menampilkan header dan label rentang', () => {
    const wrapper = mount(RiwayatPendapatanCard, { props: { rows: [], rentang: 30 } });
    expect(wrapper.text()).toContain('Riwayat pendapatan');
    expect(wrapper.text()).toContain('30 hari');
  });

  it('label rentang mencerminkan nilai rentang', () => {
    const wrapper = mount(RiwayatPendapatanCard, { props: { rows: [], rentang: 7 } });
    expect(wrapper.text()).toContain('7 hari');
  });

  it('menampilkan 4 field per baris (hari+tgl, pendapatan, keuntungan, porsi)', () => {
    const wrapper = mount(RiwayatPendapatanCard, { props: { rows: [rowPos] } });
    const t = wrapper.text();
    expect(t).toContain('Sabtu, 22 Agu');
    expect(t).toContain('22/08');
    expect(t).toContain('Rp 1.300.000');
    expect(t).toContain('Rp 480.000');
    expect(t).toContain('🍚 142 porsi');
  });

  it('warna profit hijau untuk laba (akses bar & teks)', () => {
    const wrapper = mount(RiwayatPendapatanCard, { props: { rows: [rowPos] } });
    const li = wrapper.find('li');
    expect(li.find('span').classes()).toContain('bg-green-600');
    expect(li.find('.text-green-700').exists()).toBe(true);
  });

  it('warna profit merah untuk rugi (akses bar & teks)', () => {
    const wrapper = mount(RiwayatPendapatanCard, { props: { rows: [rowNeg] } });
    const li = wrapper.find('li');
    expect(li.find('span').classes()).toContain('bg-red-500');
    expect(li.find('.text-red-600').exists()).toBe(true);
  });

  it('menampilkan skeleton saat loading', () => {
    const wrapper = mount(RiwayatPendapatanCard, { props: { rows: [], loading: true } });
    expect(wrapper.find('.animate-pulse').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Belum ada data.');
  });

  it('menampilkan pesan error', () => {
    const wrapper = mount(RiwayatPendapatanCard, {
      props: { rows: [], error: new Error('gagal muat riwayat') },
    });
    expect(wrapper.text()).toContain('gagal muat riwayat');
  });

  it('menampilkan pesan kosong saat tidak ada data', () => {
    const wrapper = mount(RiwayatPendapatanCard, { props: { rows: [] } });
    expect(wrapper.text()).toContain('Belum ada data.');
  });

  it('merender baris sesuai urutan prop (tidak mengurutkan ulang)', () => {
    const wrapper = mount(RiwayatPendapatanCard, {
      props: {
        rows: [
          { ...rowPos, tanggal: '2026-08-20', total_pendapatan_estimasi: 980000 },
          { ...rowPos, tanggal: '2026-08-22', total_pendapatan_estimasi: 1300000 },
        ],
      },
    });
    const lis = wrapper.findAll('li');
    expect(lis[0].text()).toContain('Rp 980.000');
    expect(lis[1].text()).toContain('Rp 1.300.000');
  });
});
