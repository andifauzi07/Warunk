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
  const { data: laukList, isLoading: laukLoading } = useMasterLauk();
  const laukAktif = computed(() => (laukList.value ?? []).filter((l) => l.is_active));
  const hari = useHariIni(tanggal, laukAktif);
  const { error: hariError } = hari;

  const rows = ref<RowDetail[]>([]);
  let initialized = false;

  watch(
    [hari.detail, laukAktif],
    ([newDetail, currentLaukAktif]) => {
      if (!newDetail || newDetail.length === 0) return;

      const activeIds = new Set(currentLaukAktif.map((l) => l.id));

      if (!initialized) {
        rows.value = initRowsFromDetail(newDetail).filter((r) => activeIds.has(r.laukId));
        initialized = true;
      } else {
        const existingRowsMap = new Map(rows.value.map((r) => [r.laukId, r]));
        const updatedRows: RowDetail[] = [];

        initRowsFromDetail(newDetail).forEach((freshRow) => {
          if (activeIds.has(freshRow.laukId)) {
            const oldRow = existingRowsMap.get(freshRow.laukId);
            if (oldRow) {
              updatedRows.push(oldRow);
            } else {
              updatedRows.push(freshRow);
            }
          }
        });

        rows.value = updatedRows;
      }
    },
    { immediate: true, deep: true },
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
  };
}
