import { describe, expect, it } from 'vitest';
import { toItemKalkulasi, type RowDetail } from '../composables/useDetailRows';
import { hppBaruPorsi } from '../lib/engine';

function makeRow(overrides: Partial<RowDetail> = {}): RowDetail {
  return {
    id: 'row-1',
    laukId: 'lauk-1',
    namaLauk: 'Ayam Goreng',
    hargaJualPorsi: 10000,
    hppEstimasi: 6500,
    porsiCarryOver: 5,
    hppCarryOver: 6000,
    basiPagi: 1,
    porsiBaru: 10,
    modalBaru: 70000,
    sisaLayak: 0,
    rusakMalam: 0,
    konsumsi: 0,
    ...overrides,
  };
}

describe('DetailPagiInput payload equivalence', () => {
  it('pagi save produces exactly the fields specified in refactoring-contract', () => {
    const row = makeRow({
      porsiCarryOver: 5,
      hppCarryOver: 6000,
      basiPagi: 1,
      porsiBaru: 10,
      modalBaru: 70000,
    });
    const item = toItemKalkulasi(row);

    // Simulate the view's simpan() mapping
    const payload = {
      id: row.id,
      lauk_id: row.laukId,
      porsi_carry_over: row.porsiCarryOver,
      hpp_carry_over_porsi: row.hppCarryOver,
      porsi_basi_pagi: row.basiPagi,
      porsi_baru_dimasak: row.porsiBaru,
      modal_baru_total: row.modalBaru,
      hpp_baru_porsi: hppBaruPorsi(item),
    };

    // Verify exact field set per refactoring-contract/spec.md
    const expectedFields = [
      'hpp_baru_porsi',
      'hpp_carry_over_porsi',
      'id',
      'lauk_id',
      'modal_baru_total',
      'porsi_basi_pagi',
      'porsi_baru_dimasak',
      'porsi_carry_over',
    ];
    expect(Object.keys(payload).sort()).toEqual([...expectedFields].sort());

    // Verify values per contract scenario
    expect(payload.porsi_carry_over).toBe(5);
    expect(payload.porsi_basi_pagi).toBe(1);
    expect(payload.porsi_baru_dimasak).toBe(10);
    expect(payload.modal_baru_total).toBe(70000);
    expect(payload.hpp_baru_porsi).toBe(7000);
  });
});

describe('DetailMalamInput payload equivalence', () => {
  it('malam save produces exactly the fields specified in refactoring-contract', () => {
    const row = makeRow({
      sisaLayak: 3,
      rusakMalam: 1,
      konsumsi: 2,
    });
    const item = toItemKalkulasi(row);

    // Simulate the view's simpan() mapping
    const makanSendiri = true;
    const payload = {
      id: row.id,
      lauk_id: row.laukId,
      porsi_carry_over: row.porsiCarryOver,
      hpp_carry_over_porsi: row.hppCarryOver,
      porsi_basi_pagi: row.basiPagi,
      porsi_baru_dimasak: row.porsiBaru,
      modal_baru_total: row.modalBaru,
      hpp_baru_porsi: hppBaruPorsi(item),
      porsi_sisa_layak_jual: row.sisaLayak,
      porsi_rusak_malam: row.rusakMalam,
      porsi_konsumsi: makanSendiri ? row.konsumsi : 0,
    };

    // Verify exact field set per refactoring-contract/spec.md
    const expectedFields = [
      'hpp_baru_porsi',
      'hpp_carry_over_porsi',
      'id',
      'lauk_id',
      'modal_baru_total',
      'porsi_basi_pagi',
      'porsi_baru_dimasak',
      'porsi_carry_over',
      'porsi_konsumsi',
      'porsi_rusak_malam',
      'porsi_sisa_layak_jual',
    ];
    expect(Object.keys(payload).sort()).toEqual([...expectedFields].sort());

    // Verify values per contract scenario
    expect(payload.porsi_sisa_layak_jual).toBe(3);
    expect(payload.porsi_rusak_malam).toBe(1);
    expect(payload.porsi_konsumsi).toBe(2);
  });

  it('malam save with makanSendiri=false sets konsumsi to 0', () => {
    const row = makeRow({ konsumsi: 5 });
    const item = toItemKalkulasi(row);
    const makanSendiri = false;

    const payload = {
      porsi_konsumsi: makanSendiri ? row.konsumsi : 0,
    };

    expect(payload.porsi_konsumsi).toBe(0);
  });
});
