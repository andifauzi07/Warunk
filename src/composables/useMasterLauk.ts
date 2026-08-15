import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import * as svc from '@/lib/services/masterLauk'
import type { MasterLauk } from '@/types/database'

const KEY = ['master-lauk']

export function useMasterLauk() {
  const qc = useQueryClient()

  const q = useQuery({
    queryKey: KEY,
    queryFn: svc.fetchMasterLauk,
  })

  const tambah = useMutation({
    mutationFn: svc.createLauk,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })

  const ubah = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MasterLauk> }) =>
      svc.updateLauk(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })

  return {
    data: q.data,
    isLoading: q.isLoading,
    error: q.error,
    tambah,
    ubah,
  }
}

export const masterLaukKey = () => KEY
