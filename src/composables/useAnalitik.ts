import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, ref, type Ref } from 'vue';
import {
  fetchRankingLauk,
  fetchRekonsiliasiRange,
  fetchRingkasanHarian,
  fetchRiwayatPendapatan,
} from '@/lib/services/analitik';
import { tambahHari } from '@/lib/format';

export function useAnalitik(tanggal: string, rentangRef?: Ref<number>) {
  const rentang = rentangRef ?? ref(30);
  const dari = computed(() => tambahHari(tanggal, -(rentang.value - 1)));

  const ringkasanHariIni = useQuery({
    queryKey: computed(() => ['ringkasan-harian', tanggal]),
    queryFn: () => fetchRingkasanHarian(tanggal),
  });

  const tren = useQuery({
    queryKey: computed(() => ['tren', rentang.value, tanggal]),
    queryFn: () => fetchRekonsiliasiRange(dari.value, tanggal),
    placeholderData: keepPreviousData,
  });

  const ranking = useQuery({
    queryKey: computed(() => ['ranking-lauk', rentang.value, tanggal]),
    queryFn: () => fetchRankingLauk(dari.value, tanggal),
    placeholderData: keepPreviousData,
  });

  const riwayat = useQuery({
    queryKey: computed(() => ['riwayat-pendapatan', rentang.value, tanggal]),
    queryFn: () => fetchRiwayatPendapatan(dari.value, tanggal),
    placeholderData: keepPreviousData,
  });

  return { ringkasanHariIni, tren, ranking, riwayat, dari, rentang };
}
