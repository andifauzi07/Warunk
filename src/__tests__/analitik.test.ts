import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchRiwayatPendapatan } from '../lib/services/analitik';

const mocks = vi.hoisted(() => ({
  state: {
    ringkasan_harian: [] as Record<string, unknown>[],
  },
}));

vi.mock('@/lib/supabase', () => {
  const m = mocks;
  const client = {
    from: (table: string) => {
      type Op = 'eq' | 'gte' | 'lte' | 'lt' | 'gt';
      const filters: Array<[string, unknown, Op]> = [];
      let sort: { column: string; ascending: boolean } | null = null;

      const matches = (): Record<string, unknown>[] => {
        let rows = table === 'ringkasan_harian' ? m.state.ringkasan_harian : [];
        for (const [k, v, op] of filters) {
          rows = rows.filter((r) => {
            if (op === 'eq') return r[k] === v;
            if (op === 'gte') return (r[k] as string) >= (v as string);
            if (op === 'lte') return (r[k] as string) <= (v as string);
            return true;
          });
        }
        if (sort) {
          rows = [...rows].sort((a, b) => {
            const av = a[sort.column] as string;
            const bv = b[sort.column] as string;
            return sort.ascending ? av.localeCompare(bv) : bv.localeCompare(av);
          });
        }
        return rows;
      };

      const q: Record<string, unknown> = {
        select: () => q,
        eq: (k: string, v: unknown) => {
          filters.push([k, v, 'eq']);
          return q;
        },
        gte: (k: string, v: unknown) => {
          filters.push([k, v, 'gte']);
          return q;
        },
        lte: (k: string, v: unknown) => {
          filters.push([k, v, 'lte']);
          return q;
        },
        order: (column: string, opts?: { ascending?: boolean }) => {
          sort = { column, ascending: opts?.ascending ?? true };
          return q;
        },
        then: (resolve: (v: unknown) => void) => {
          resolve({ data: matches(), error: null });
        },
      };
      return q;
    },
  };
  return { supabase: client, currentUserId: async () => 'user-1' };
});

function seed() {
  mocks.state.ringkasan_harian = [
    {
      tanggal: '2026-08-20',
      status: 'malam_selesai',
      total_pendapatan_estimasi: 980000,
      total_porsi_dikonsumsi: 118,
      keuntungan_bersih: 210000,
    },
    {
      tanggal: '2026-08-19',
      status: 'libur',
      total_pendapatan_estimasi: 0,
      total_porsi_dikonsumsi: 0,
      keuntungan_bersih: 0,
    },
    {
      tanggal: '2026-08-22',
      status: 'malam_selesai',
      total_pendapatan_estimasi: 1300000,
      total_porsi_dikonsumsi: 142,
      keuntungan_bersih: 480000,
    },
    {
      tanggal: '2026-08-21',
      status: 'pagi_selesai',
      total_pendapatan_estimasi: 0,
      total_porsi_dikonsumsi: 0,
      keuntungan_bersih: 0,
    },
  ];
}

describe('fetchRiwayatPendapatan', () => {
  beforeEach(() => {
    seed();
  });

  it('hanya mengembalikan hari malam_selesai (skip libur & belum selesai)', async () => {
    const rows = await fetchRiwayatPendapatan('2026-08-01', '2026-08-31');
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.status === 'malam_selesai')).toBe(true);
    expect(rows.map((r) => r.tanggal)).not.toContain('2026-08-19');
    expect(rows.map((r) => r.tanggal)).not.toContain('2026-08-21');
  });

  it('mengurutkan tanggal menurun (baru → lama)', async () => {
    const rows = await fetchRiwayatPendapatan('2026-08-01', '2026-08-31');
    expect(rows.map((r) => r.tanggal)).toEqual(['2026-08-22', '2026-08-20']);
  });

  it('memetakan kolom dengan benar', async () => {
    const rows = await fetchRiwayatPendapatan('2026-08-01', '2026-08-31');
    const terbaru = rows[0];
    expect(terbaru.total_pendapatan_estimasi).toBe(1300000);
    expect(terbaru.total_porsi_dikonsumsi).toBe(142);
    expect(terbaru.keuntungan_bersih).toBe(480000);
  });

  it('membatasi pada rentang tanggal (gte/lte)', async () => {
    const rows = await fetchRiwayatPendapatan('2026-08-20', '2026-08-20');
    expect(rows.map((r) => r.tanggal)).toEqual(['2026-08-20']);
  });
});
