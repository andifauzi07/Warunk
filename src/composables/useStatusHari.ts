import { computed, type Ref } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import * as svc from '@/lib/services/rekonsiliasi';
import { QUERY_DEFAULTS } from '@/lib/queryConfig';

export const statusHariKey = (tanggal: string) => ['hari-status', tanggal] as const;

function invalidateHariRelated(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['hari-ini'] });
  qc.invalidateQueries({ queryKey: ['hari-status'] });
}

/** Get-or-create rekonsiliasi (tanpa seed detail — seed dilakukan di layar pagi/malam). */
async function getOrCreateRekonsiliasi(tanggal: string) {
  let rek = await svc.getRekonsiliasiByTanggal(tanggal);
  if (!rek) rek = await svc.createRekonsiliasi(tanggal);
  return rek;
}

/** Status hari ini untuk halaman utama — tidak butuh master lauk. */
export function useStatusHari(tanggal: Ref<string>) {
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: computed(() => statusHariKey(tanggal.value)),
    queryFn: () => getOrCreateRekonsiliasi(tanggal.value),
    ...QUERY_DEFAULTS,
  });

  const tandaiLibur = useMutation({
    mutationFn: () => svc.tandaiLibur(tanggal.value),
    onSuccess: () => invalidateHariRelated(qc),
  });

  const bukaLag = useMutation({
    mutationFn: () => {
      const rek = q.data.value;
      if (!rek) throw new Error('Hari belum disiapkan');
      return svc.updateStatusRekonsiliasi(rek.id, 'pagi_pending');
    },
    onSuccess: () => invalidateHariRelated(qc),
  });

  return {
    rekonsiliasi: q.data,
    error: computed(() => q.error.value?.message ?? ''),
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    tandaiLibur,
    bukaLag,
  };
}
