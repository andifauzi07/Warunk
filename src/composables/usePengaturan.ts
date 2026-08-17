import { computed } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import * as svc from '@/lib/services/pengaturan';
import { QUERY_DEFAULTS } from '@/lib/queryConfig';
import type { PengaturanWarung } from '@/types/database';

const KEY = ['pengaturan'];

export function usePengaturan() {
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: KEY,
    queryFn: svc.fetchPengaturan,
    ...QUERY_DEFAULTS,
  });

  const data = computed(() => q.data.value ?? null);
  const isLoading = computed(() => q.isLoading.value);
  const error = computed(() => q.error.value?.message ?? '');

  const simpan = useMutation({
    mutationFn: (input: Partial<PengaturanWarung> & { user_id: string }) =>
      svc.upsertPengaturan(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  return {
    data,
    isLoading,
    error,
    simpan,
  };
}
