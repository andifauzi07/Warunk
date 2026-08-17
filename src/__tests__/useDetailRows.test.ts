import { describe, expect, it } from 'vitest'
import { toItemKalkulasi, type RowDetail } from '../composables/useDetailRows'
import { hppBaruPorsi, hitungAgregat, porsiDikonsumsi } from '../lib/engine'
import type { ItemKalkulasi } from '../lib/engine'

function makeRow(overrides: Partial<RowDetail> = {}): RowDetail {
  return {
    id: 'row-1',
    laukId: 'lauk-1',
    namaLauk: 'Ayam Goreng',
    hargaJualPorsi: 10000,
    hppEstimasi: 6500,
    porsiCarryOver: 5,
    hppCarryOver: 6000,
    basiPagi: 0,
    porsiBaru: 20,
    modalBaru: 140000,
    sisaLayak: 5,
    rusakMalam: 1,
    konsumsi: 2,
    ...overrides,
  }
}

describe('toItemKalkulasi', () => {
  it('maps all RowDetail fields to ItemKalkulasi', () => {
    const row = makeRow()
    const item: ItemKalkulasi = toItemKalkulasi(row)

    expect(item).toEqual({
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
    })
  })

  it('preserves basiPagi mapping', () => {
    const row = makeRow({ basiPagi: 3 })
    expect(toItemKalkulasi(row).porsi_basi_pagi).toBe(3)
  })

  it('preserves sisaLayak, rusakMalam, konsumsi', () => {
    const row = makeRow({ sisaLayak: 10, rusakMalam: 2, konsumsi: 3 })
    const item = toItemKalkulasi(row)
    expect(item.porsi_sisa_layak_jual).toBe(10)
    expect(item.porsi_rusak_malam).toBe(2)
    expect(item.porsi_konsumsi).toBe(3)
  })

  it('produces identical ItemKalkulasi as the old view-local itemKalkulasi (pagi pattern)', () => {
    const row = makeRow()
    const item = toItemKalkulasi(row)

    // Old pagi view hardcoded sisa/rusak/konsumsi to 0.
    // After refactoring, toItemKalkulasi uses real values from the row.
    // For fresh pagi rows, these values are 0 from the DB.
    // The key invariant: hppBaruPorsi(item) must return the same result.
    const itemWithZeros = {
      ...item,
      porsi_sisa_layak_jual: 0,
      porsi_rusak_malam: 0,
      porsi_konsumsi: 0,
    }
    expect(hppBaruPorsi(item)).toBe(hppBaruPorsi(itemWithZeros))
  })

  it('produces identical aggregates for malam pattern', () => {
    const row = makeRow()
    const item = toItemKalkulasi(row)

    const single = hitungAgregat([item])
    expect(single.pendapatan).toBe(porsiDikonsumsi(item) * row.hargaJualPorsi)
  })
})
