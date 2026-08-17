import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import DashboardView from '@/views/DashboardView.vue'
import { fetchRingkasanHarian, fetchRekonsiliasiRange, fetchRankingLauk } from '@/lib/services/analitik'
import { fetchPengaturan } from '@/lib/services/pengaturan'
import { tambahHari } from '@/lib/format'

vi.mock('@/lib/supabase', () => ({
  supabase: {},
  currentUserId: vi.fn().mockResolvedValue('user-1'),
}))

vi.mock('@/lib/services/pengaturan', () => ({
  fetchPengaturan: vi.fn(),
  upsertPengaturan: vi.fn(),
}))

vi.mock('@/lib/services/analitik', () => ({
  fetchRingkasanHarian: vi.fn(),
  fetchRekonsiliasiRange: vi.fn(),
  fetchRankingLauk: vi.fn(),
}))

function todayString() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const ringkasan = {
  tanggal: todayString(),
  status: 'malam_selesai',
  total_pendapatan_estimasi: 250000,
  total_uang_digital: 50000,
  total_hpp_nyata: 120000,
  total_kerugian: 10000,
  keuntungan_bersih: 120000,
  selisih_kas: 3000,
}

let queryClient: QueryClient

async function mountView(): Promise<VueWrapper> {
  setActivePinia(createPinia())
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  vi.mocked(fetchPengaturan).mockResolvedValue({
    id: 'p1',
    user_id: 'user-1',
    modal_kembalian_default: 100000,
    toleransi_selisih_persen: 5,
    terima_pembayaran_digital: false,
  })
  const hariIni = todayString()
  vi.mocked(fetchRekonsiliasiRange).mockResolvedValue([
    { tanggal: tambahHari(hariIni, -2), status: 'malam_selesai', keuntungan_bersih: 50000 },
    { tanggal: tambahHari(hariIni, -1), status: 'malam_selesai', keuntungan_bersih: 75000 },
  ])
  vi.mocked(fetchRankingLauk).mockResolvedValue([
    { lauk_id: 'a', nama_lauk: 'Ayam', porsi_dikonsumsi: 8, porsi_rusak_total: 0 },
    { lauk_id: 'b', nama_lauk: 'Telur', porsi_dikonsumsi: 5, porsi_rusak_total: 2 },
  ])

  const wrapper = mount(DashboardView, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
    },
  })
  await flushPromises()
  return wrapper
}

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    queryClient?.clear()
  })

  it('tanpa ringkasan menampilkan ajakan mengisi input malam', async () => {
    vi.mocked(fetchRingkasanHarian).mockResolvedValue(null)
    const wrapper = await mountView()
    expect(wrapper.text()).toContain('Belum ada data hari ini. Selesaikan input malam untuk melihat laba.')
  })

  it('menampilkan ringkasan laba dan status hari', async () => {
    vi.mocked(fetchRingkasanHarian).mockResolvedValue(ringkasan as never)
    const wrapper = await mountView()
    const t = wrapper.text()
    expect(t).toContain('Selesai & terkunci')
    expect(t).toContain('Rp 250.000')
    expect(t).toContain('Rp 120.000')
    expect(t).toContain('Rp 10.000')
    expect(t).toContain('Rp 50.000')
  })

  it('selisih dalam toleransi menampilkan label Selisih wajar', async () => {
    vi.mocked(fetchRingkasanHarian).mockResolvedValue(ringkasan as never)
    const wrapper = await mountView()
    expect(wrapper.text()).toContain('Selisih wajar')
    expect(wrapper.text()).toContain('Rp 3.000')
  })

  it('selisih besar menampilkan level kritis', async () => {
    vi.mocked(fetchRingkasanHarian).mockResolvedValue({
      ...ringkasan,
      selisih_kas: 60000,
    } as never)
    const wrapper = await mountView()
    expect(wrapper.text()).toContain('Selisih besar — cek ulang')
  })

  it('tren menghitung total dan rata-rata hari terkunci', async () => {
    vi.mocked(fetchRingkasanHarian).mockResolvedValue(ringkasan as never)
    const wrapper = await mountView()
    const t = wrapper.text()
    expect(t).toContain('Total 2 hari')
    expect(t).toContain('Rp 125.000')
    expect(t).toContain('Rp 62.500')
  })

  it('tombol rentang 7 hari mengubah rentang tren', async () => {
    vi.mocked(fetchRingkasanHarian).mockResolvedValue(ringkasan as never)
    const wrapper = await mountView()
    const btn7 = wrapper.findAll('button').find((b) => b.text() === '7 hari')
    expect(btn7).toBeTruthy()
    await btn7!.trigger('click')
    await flushPromises()
    const btn7a = wrapper.findAll('button').find((b) => b.text() === '7 hari')
    expect(btn7a?.classes()).toContain('bg-white')
    expect(btn7a?.classes()).toContain('font-medium')
  })

  it('menampilkan ranking lauk terlaris dan sering basi/rusak', async () => {
    vi.mocked(fetchRingkasanHarian).mockResolvedValue(ringkasan as never)
    const wrapper = await mountView()
    const t = wrapper.text()
    expect(t).toContain('Lauk terlaris')
    expect(t).toContain('Ayam')
    expect(t).toContain('8 porsi')
    expect(t).toContain('Sering basi/rusak')
    expect(t).toContain('Telur')
    expect(t).toContain('2 porsi')
  })
})
