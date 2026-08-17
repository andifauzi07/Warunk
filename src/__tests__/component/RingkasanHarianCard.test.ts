import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import RingkasanHarianCard from '@/components/RingkasanHarianCard.vue';

describe('RingkasanHarianCard', () => {
  const baseProps = {
    pendapatan: 500000,
    hppNyata: 300000,
    kerugian: 50000,
    profit: 150000,
  };

  it('renders all financial fields', () => {
    const wrapper = mount(RingkasanHarianCard, { props: baseProps });
    expect(wrapper.text()).toContain('Pendapatan estimasi');
    expect(wrapper.text()).toContain('HPP nyata');
    expect(wrapper.text()).toContain('Kerugian (basi/rusak)');
    expect(wrapper.text()).toContain('Keuntungan bersih');
  });

  it('shows tunai row without showDigital', () => {
    const wrapper = mount(RingkasanHarianCard, { props: baseProps });
    expect(wrapper.text()).toContain('─ tunai');
    expect(wrapper.text()).not.toContain('─ dari digital');
  });

  it('shows digital breakdown when showDigital is true', () => {
    const wrapper = mount(RingkasanHarianCard, {
      props: { ...baseProps, showDigital: true, uangDigital: 120000 },
    });
    expect(wrapper.text()).toContain('─ dari digital');
    expect(wrapper.text()).toContain('─ tunai diharapkan');
  });

  it('shows selisih row when selisihKas is provided', () => {
    const wrapper = mount(RingkasanHarianCard, {
      props: { ...baseProps, selisihKas: 5000 },
    });
    expect(wrapper.text()).toContain('Selisih kas');
  });

  it('shows selisih row with default value 0 when selisihKas is not provided', () => {
    const wrapper = mount(RingkasanHarianCard, {
      props: { ...baseProps, selisihKas: undefined },
    });
    expect(wrapper.text()).toContain('Selisih kas');
  });

  it('shows uang laci row when uangLaci is provided', () => {
    const wrapper = mount(RingkasanHarianCard, {
      props: { ...baseProps, uangLaci: 480000, modalKembalian: 100000 },
    });
    expect(wrapper.text()).toContain('Uang di laci (net)');
  });

  describe('selisih color classes', () => {
    it('green when selisih is 0', () => {
      const wrapper = mount(RingkasanHarianCard, {
        props: { ...baseProps, selisihKas: 0 },
      });
      const selisihEl = wrapper.find('.font-bold.tabular-nums');
      expect(selisihEl.classes()).toContain('text-green-700');
    });

    it('amber when selisih is positive', () => {
      const wrapper = mount(RingkasanHarianCard, {
        props: { ...baseProps, selisihKas: 10000 },
      });
      const selisihEl = wrapper.find('.font-bold.tabular-nums');
      expect(selisihEl.classes()).toContain('text-amber-600');
    });

    it('red when selisih is negative', () => {
      const wrapper = mount(RingkasanHarianCard, {
        props: { ...baseProps, selisihKas: -10000 },
      });
      const selisihEl = wrapper.find('.font-bold.tabular-nums');
      expect(selisihEl.classes()).toContain('text-red-600');
    });
  });

  describe('profit color classes', () => {
    it('green when profit is positive', () => {
      const wrapper = mount(RingkasanHarianCard, {
        props: { ...baseProps, profit: 150000 },
      });
      const profitEl = wrapper.find('.angka-besar');
      expect(profitEl.classes()).toContain('text-green-700');
    });

    it('green when profit is 0', () => {
      const wrapper = mount(RingkasanHarianCard, {
        props: { ...baseProps, profit: 0 },
      });
      const profitEl = wrapper.find('.angka-besar');
      expect(profitEl.classes()).toContain('text-green-700');
    });

    it('red when profit is negative', () => {
      const wrapper = mount(RingkasanHarianCard, {
        props: { ...baseProps, profit: -50000 },
      });
      const profitEl = wrapper.find('.angka-besar');
      expect(profitEl.classes()).toContain('text-red-600');
    });
  });
});
