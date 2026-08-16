import { describe, expect, it, vi, beforeEach } from 'vitest'
import { siapkanHari } from '../lib/services/rekonsiliasi'
import type { MasterLauk } from '../types/database'

const mocks = vi.hoisted(() => ({
  state: {
    rekonsiliasi_harian: [] as Record<string, unknown>[],
    detail_stok_harian: [] as Record<string, unknown>[],
  },
  stats: {
    detailGetToday: 0,
    detailInsert: 0,
    rekInsert: 0,
  },
}))

vi.mock('@/lib/supabase', () => {
  const m = mocks
  const client = {
    from: (table: string) => {
      const filters: Array<[string, unknown, 'eq' | 'lt' | 'gt']> = []
      let rowLimit: number | null = null

      const matches = (): Record<string, unknown>[] => {
        let rows: Record<string, unknown>[] = []
        if (table === 'rekonsiliasi_harian') rows = m.state.rekonsiliasi_harian
        if (table === 'detail_stok_harian') rows = m.state.detail_stok_harian
        for (const [k, v, op] of filters) {
          rows = rows.filter((r) => {
            if (op === 'eq') return r[k] === v
            if (op === 'lt') return (r[k] as number) < (v as number)
            if (op === 'gt') return (r[k] as number) > (v as number)
            return true
          })
        }
        return rowLimit ? rows.slice(0, rowLimit) : rows
      }

      const recordRead = () => {
        if (table !== 'detail_stok_harian') return
        const eqId = filters.some(([k, , op]) => op === 'eq' && k === 'rekonsiliasi_id')
        const hasGt = filters.some(([, , op]) => op === 'gt')
        if (eqId && !hasGt) m.stats.detailGetToday++
      }

      const q: Record<string, unknown> = {
        select: () => q,
        eq: (k: string, v: unknown) => {
          filters.push([k, v, 'eq'])
          return q
        },
        lt: (k: string, v: unknown) => {
          filters.push([k, v, 'lt'])
          return q
        },
        gt: (k: string, v: unknown) => {
          filters.push([k, v, 'gt'])
          return q
        },
        order: () => q,
        limit: (n: number) => {
          rowLimit = n
          return q
        },
        maybeSingle: async () => {
          recordRead()
          return { data: matches()[0] ?? null, error: null }
        },
        single: async () => {
          recordRead()
          return { data: matches()[0] ?? null, error: null }
        },
        then: (resolve: (v: unknown) => void) => {
          recordRead()
          resolve({ data: matches(), error: null })
        },
        insert: (payload: unknown) => {
          if (table === 'detail_stok_harian') m.stats.detailInsert++
          if (table === 'rekonsiliasi_harian') m.stats.rekInsert++
          const arr = (Array.isArray(payload) ? payload : [payload]).map((p) => ({
            ...(p as Record<string, unknown>),
            id: (p as Record<string, unknown>).id ?? `seed-${Math.random()}`,
          }))
          const store =
            table === 'detail_stok_harian'
              ? m.state.detail_stok_harian
              : m.state.rekonsiliasi_harian
          store.push(...arr)
          const ins: Record<string, unknown> = {
            select: () => ins,
            single: async () => ({ data: arr[0] ?? null, error: null }),
            then: (resolve: (v: unknown) => void) =>
              resolve({ data: arr, error: null }),
          }
          return ins
        },
      }
      return q
    },
  }
  return {
    supabase: client,
    currentUserId: async () => 'user-1',
  }
})

const laukA: MasterLauk = {
  id: 'lauk-a',
  nama_lauk: 'Ayam',
  harga_jual_porsi: 10000,
  hpp_estimasi_porsi: 6000,
  is_active: true,
  created_at: '',
}
const laukB: MasterLauk = {
  id: 'lauk-b',
  nama_lauk: 'Telur',
  harga_jual_porsi: 5000,
  hpp_estimasi_porsi: 3000,
  is_active: true,
  created_at: '',
}

function reset(
  rekonsiliasi: Record<string, unknown>[] = [],
  detail: Record<string, unknown>[] = [],
) {
  mocks.state.rekonsiliasi_harian = rekonsiliasi
  mocks.state.detail_stok_harian = detail
  mocks.stats.detailGetToday = 0
  mocks.stats.detailInsert = 0
  mocks.stats.rekInsert = 0
}

describe('siapkanHari', () => {
  beforeEach(() => {
    reset()
  })

  it('hari sudah disiapkan: tidak menambah baris, satu GET detail per siklus', async () => {
    reset(
      [{ id: 'rek-1', tanggal: '2026-08-16', status: 'pagi_pending' }],
      [
        { id: 'd1', rekonsiliasi_id: 'rek-1', lauk_id: 'lauk-a', lauk: laukA },
        { id: 'd2', rekonsiliasi_id: 'rek-1', lauk_id: 'lauk-b', lauk: laukB },
      ],
    )

    const hasil = await siapkanHari('2026-08-16', [laukA, laukB])
    expect(hasil.rekonsiliasi.id).toBe('rek-1')
    expect(hasil.detail).toHaveLength(2)
    expect(mocks.stats.detailGetToday).toBe(1)
    expect(mocks.stats.detailInsert).toBe(0)

    const lagi = await siapkanHari('2026-08-16', [laukA, laukB])
    expect(lagi.detail).toHaveLength(2)
    expect(mocks.stats.detailGetToday).toBe(2)
    expect(mocks.stats.detailInsert).toBe(0)
  })

  it('hari pertama: membuat rekonsiliasi dan men-seed detail sekali (idempotent)', async () => {
    reset(
      [
        {
          id: 'rek-kemarin',
          tanggal: '2026-08-15',
          status: 'malam_selesai',
        },
      ],
      [
        {
          id: 'd-kemarin',
          rekonsiliasi_id: 'rek-kemarin',
          lauk_id: 'lauk-a',
          porsi_sisa_layak_jual: 5,
          hpp_gabungan_porsi: 6000,
        },
      ],
    )

    const hasil = await siapkanHari('2026-08-16', [laukA, laukB])
    expect(mocks.stats.rekInsert).toBe(1)
    expect(hasil.detail).toHaveLength(2)
    expect(hasil.detail[0].lauk_id).toBe('lauk-a')
    expect(hasil.detail[0].porsi_carry_over).toBe(5)
    expect(hasil.detail[0].hpp_carry_over_porsi).toBe(6000)
    expect(hasil.detail[1].lauk_id).toBe('lauk-b')
    expect(hasil.detail[1].porsi_carry_over).toBe(0)
    expect(mocks.stats.detailGetToday).toBe(1)
    expect(mocks.stats.detailInsert).toBe(1)

    const lagi = await siapkanHari('2026-08-16', [laukA, laukB])
    expect(lagi.detail).toHaveLength(2)
    expect(mocks.stats.detailInsert).toBe(1)
    expect(mocks.stats.detailGetToday).toBe(2)
  })
})
