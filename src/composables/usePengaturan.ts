import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import * as svc from '@/lib/services/pengaturan'
import type { PengaturanWarung } from '@/types/database'

const KEY = ['pengaturan']

export function usePengaturan() {
  const qc = useQueryClient()

  const q = useQuery({
    queryKey: KEY,
    queryFn: svc.fetchPengaturan,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const simpan = useMutation({
    mutationFn: (input: Partial<PengaturanWarung> & { user_id: string }) =>
      svc.upsertPengaturan(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })

  return {
    data: q.data,
    isLoading: q.isLoading,
    error: q.error,
    simpan,
  }
}
