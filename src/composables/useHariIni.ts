import { ref } from 'vue'
import * as svc from '@/lib/services/rekonsiliasi'
import type {
  DetailStokLengkap,
  MasterLauk,
  RekonsiliasiHarian,
} from '@/types/database'

export function useHariIni() {
  const rekonsiliasi = ref<RekonsiliasiHarian | null>(null)
  const detail = ref<DetailStokLengkap[]>([])
  const loading = ref(false)
  const error = ref('')

  async function muat(tanggal: string, laukAktif: MasterLauk[]) {
    loading.value = true
    error.value = ''
    try {
      const hasil = await svc.siapkanHari(tanggal, laukAktif)
      rekonsiliasi.value = hasil.rekonsiliasi
      detail.value = hasil.detail
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Gagal memuat data'
    } finally {
      loading.value = false
    }
  }

  async function simpanPagi(items: svc.DetailPagiInput[]) {
    if (!rekonsiliasi.value) throw new Error('Hari belum disiapkan')
    await svc.simpanPagi(rekonsiliasi.value.id, items)
    rekonsiliasi.value.status = 'pagi_selesai'
  }

  async function simpanMalam(
    items: svc.DetailMalamInput[],
    uangLaci: number,
    uangDigital: number,
    modalKembalianPakai: number,
  ) {
    if (!rekonsiliasi.value) throw new Error('Hari belum disiapkan')
    await svc.simpanMalam(
      rekonsiliasi.value.id,
      items,
      uangLaci,
      uangDigital,
      modalKembalianPakai,
    )
    const r = rekonsiliasi.value
    r.status = 'malam_selesai'
    r.total_uang_laci = uangLaci
    r.total_uang_digital = uangDigital
    r.modal_kembalian_pakai = modalKembalianPakai
  }

  async function tandaiLibur(tanggal: string) {
    const r = await svc.tandaiLibur(tanggal)
    rekonsiliasi.value = r
  }

  async function bukaLag() {
    if (!rekonsiliasi.value) throw new Error('Hari belum disiapkan')
    await svc.updateStatusRekonsiliasi(rekonsiliasi.value.id, 'pagi_pending')
    rekonsiliasi.value.status = 'pagi_pending'
  }

  return {
    rekonsiliasi,
    detail,
    loading,
    error,
    muat,
    simpanPagi,
    simpanMalam,
    tandaiLibur,
    bukaLag,
  }
}
