import { nextTick } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import * as svc from '@/lib/services/masterLauk';
import { QUERY_DEFAULTS } from '@/lib/queryConfig';
import type { MasterLauk } from '@/types/database';

const KEY = ['master-lauk'];

async function invalidateTerkait(qc: ReturnType<typeof useQueryClient>) {
  await qc.invalidateQueries({ queryKey: KEY });
  await nextTick();
  qc.invalidateQueries({ queryKey: ['hari-ini'] });
}

export function useMasterLauk() {
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: KEY,
    queryFn: svc.fetchMasterLauk,
    ...QUERY_DEFAULTS,
  });

  const tambah = useMutation({
    mutationFn: svc.createLauk,
    onSuccess: () => invalidateTerkait(qc),
  });

  const ubah = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MasterLauk> }) =>
      svc.updateLauk(id, input),
    onSuccess: () => invalidateTerkait(qc),
  });

  return {
    data: q.data,
    isLoading: q.isLoading,
    error: q.error,
    success: q.isSuccess,
    tambah,
    ubah,
  };
}

export const masterLaukKey = () => KEY;
