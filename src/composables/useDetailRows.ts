import { computed, ref, watch, type Ref } from 'vue';
import { useMasterLauk } from '@/composables/useMasterLauk';
import { useHariIni } from '@/composables/useHariIni';
import type { ItemKalkulasi } from '@/lib/engine';

export interface RowDetail {
  id: string;
  laukId: string;
  namaLauk: string;
  hargaJualPorsi: number;
  hppEstimasi: number;
  porsiCarryOver: number;
  hppCarryOver: number;
  basiPagi: number;
  porsiBaru: number;
  modalBaru: number;
  sisaLayak: number;
  rusakMalam: number;
  konsumsi: number;
}

function initRowsFromDetail(detail: import('@/types/database').DetailStokLengkap[]): RowDetail[] {
  return detail.map((d) => ({
    id: d.id,
    laukId: d.lauk_id,
    namaLauk: d.lauk?.nama_lauk ?? 'Lauk',
    hargaJualPorsi: d.lauk?.harga_jual_porsi ?? 0,
    hppEstimasi: d.lauk?.hpp_estimasi_porsi ?? 0,
    porsiCarryOver: d.porsi_carry_over,
    hppCarryOver: d.hpp_carry_over_porsi,
    basiPagi: d.porsi_basi_pagi,
    porsiBaru: d.porsi_baru_dimasak,
    modalBaru: d.modal_baru_total,
    sisaLayak: d.porsi_sisa_layak_jual,
    rusakMalam: d.porsi_rusak_malam,
    konsumsi: d.porsi_konsumsi,
  }));
}

export function toItemKalkulasi(r: RowDetail): ItemKalkulasi {
  return {
    porsi_carry_over: r.porsiCarryOver,
    hpp_carry_over_porsi: r.hppCarryOver,
    porsi_basi_pagi: r.basiPagi,
    porsi_baru_dimasak: r.porsiBaru,
    modal_baru_total: r.modalBaru,
    porsi_sisa_layak_jual: r.sisaLayak,
    porsi_rusak_malam: r.rusakMalam,
    porsi_konsumsi: r.konsumsi,
    harga_jual_porsi: r.hargaJualPorsi,
    hpp_estimasi_porsi: r.hppEstimasi,
  };
}

export function useDetailRows(tanggal: Ref<string>) {
  const { data: laukList, isLoading: laukLoading, refreshHariAfterTambah } = useMasterLauk();
  const laukAktif = computed(() => (laukList.value ?? []).filter((l) => l.is_active));
  const hari = useHariIni(tanggal, laukAktif);
  const { error: hariError } = hari;

  const rows = ref<RowDetail[]>([]);
  let initialized = false;

  watch(
    hari.detail,
    (d) => {
      if (d.length > 0 && !initialized) {
        const activeIds = new Set(laukAktif.value.map((l) => l.id));
        rows.value = initRowsFromDetail(d).filter((r) => activeIds.has(r.laukId));
        initialized = true;
      } else if (initialized && d.length > 0) {
        const existingLaukIds = new Set(rows.value.map((r) => r.laukId));
        const activeIds = new Set(laukAktif.value.map((l) => l.id));
        const newItems = initRowsFromDetail(d).filter(
          (r) => !existingLaukIds.has(r.laukId) && activeIds.has(r.laukId),
        );
        if (newItems.length > 0) {
          rows.value = [...rows.value, ...newItems];
        }
      }
    },
    { immediate: true },
  );

  function resetInitialized() {
    initialized = false;
  }

  return {
    rows,
    hariError,
    laukLoading,
    laukAktif,
    hari,
    toItemKalkulasi,
    resetInitialized,
    refreshHariAfterTambah,
  };
}
