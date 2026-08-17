import { computed, type Ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import * as svc from '@/lib/services/rekonsiliasi'
import { QUERY_DEFAULTS } from '@/lib/queryConfig'
import type {
  DetailStokLengkap,
  MasterLauk,
  RekonsiliasiHarian,
} from '@/types/database'

export const hariIniKey = (tanggal: string) => ['hari-ini', tanggal] as const

export function useHariIni(
  tanggal: Ref<string>,
  laukAktif: Ref<MasterLauk[]>,
) {
  const qc = useQueryClient()
  const key = computed(() => hariIniKey(tanggal.value))

  const q = useQuery({
    queryKey: key,
    queryFn: () => svc.siapkanHari(tanggal.value, laukAktif.value),
    enabled: computed(() => laukAktif.value.length > 0),
    ...QUERY_DEFAULTS,
  })

  const invalidateHari = () => {
    qc.invalidateQueries({ queryKey: ['hari-ini'] })
    qc.invalidateQueries({ queryKey: ['hari-status'] })
  }

  const rekonsiliasi = computed<RekonsiliasiHarian | null>(
    () => q.data.value?.rekonsiliasi ?? null,
  )
  const detail = computed<DetailStokLengkap[]>(
    () => q.data.value?.detail ?? [],
  )
  const error = computed(() => q.error.value?.message ?? '')

  const simpanPagi = useMutation({
    mutationFn: (items: svc.DetailPagiInput[]) => {
      const rek = rekonsiliasi.value
      if (!rek) throw new Error('Hari belum disiapkan')
      return svc.simpanPagi(rek.id, items)
    },
    onSuccess: () => invalidateHari(),
  })

  const simpanMalam = useMutation({
    mutationFn: (input: {
      items: svc.DetailMalamInput[]
      uangLaci: number
      uangDigital: number
      modalKembalianPakai: number
    }) => {
      const rek = rekonsiliasi.value
      if (!rek) throw new Error('Hari belum disiapkan')
      return svc.simpanMalam(
        rek.id,
        input.items,
        input.uangLaci,
        input.uangDigital,
        input.modalKembalianPakai,
      )
    },
    onSuccess: () => {
      invalidateHari()
      qc.invalidateQueries({ queryKey: ['ringkasan-harian'] })
      qc.invalidateQueries({ queryKey: ['tren'] })
      qc.invalidateQueries({ queryKey: ['ranking-lauk'] })
    },
  })

  return {
    rekonsiliasi,
    detail,
    error,
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    refetch: q.refetch,
    simpanPagi,
    simpanMalam,
  }
}
