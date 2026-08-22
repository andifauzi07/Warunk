<script setup lang="ts">
import {
  formatAngka,
  formatRupiah,
  pesanError,
  tanggalPendek,
  tanggalPendekAngka,
} from '@/lib/format';
import type { RiwayatPendapatanRow } from '@/lib/services/analitik';

interface Props {
  rows?: RiwayatPendapatanRow[];
  loading?: boolean;
  error?: unknown;
  rentang?: number;
}

const props = withDefaults(defineProps<Props>(), {
  rows: () => [],
  loading: false,
  error: undefined,
  rentang: 30,
});
</script>

<template>
  <div class="rounded-2xl bg-white p-5 shadow-sm">
    <div class="flex items-center justify-between">
      <p class="font-semibold">Riwayat pendapatan</p>
      <span class="text-xs text-zinc-400">{{ props.rentang }} hari</span>
    </div>

    <div v-if="props.loading" class="mt-3 animate-pulse space-y-3">
      <div
        v-for="i in 5"
        :key="i"
        class="flex items-center justify-between rounded-xl bg-zinc-50 p-3"
      >
        <div class="space-y-1.5">
          <div class="h-3 w-28 rounded bg-zinc-200"></div>
          <div class="h-3 w-20 rounded bg-zinc-200"></div>
        </div>
        <div class="space-y-1.5 text-right">
          <div class="h-4 w-28 rounded bg-zinc-200"></div>
          <div class="h-3 w-20 rounded bg-zinc-200"></div>
        </div>
      </div>
    </div>

    <p v-else-if="props.error" class="mt-3 text-sm text-red-600">
      {{ pesanError(props.error) }}
    </p>

    <p v-else-if="props.rows.length === 0" class="mt-3 text-sm text-zinc-500">Belum ada data.</p>

    <ol v-else class="mt-3 flex max-h-105 flex-col gap-2 overflow-y-auto pr-1">
      <li
        v-for="r in props.rows"
        :key="r.tanggal"
        class="flex items-stretch gap-3 rounded-xl bg-zinc-50 p-3"
      >
        <span
          class="w-1 rounded-full"
          :class="r.keuntungan_bersih >= 0 ? 'bg-green-600' : 'bg-red-500'"
        ></span>
        <div class="flex flex-1 items-center justify-between">
          <div>
            <p class="text-sm font-medium">
              {{ tanggalPendek(r.tanggal).hari }}, {{ tanggalPendek(r.tanggal).tgl }}
            </p>
            <p class="text-xs text-zinc-400">
              {{ tanggalPendekAngka(r.tanggal) }} · 🍚
              {{ formatAngka(r.total_porsi_dikonsumsi) }} porsi
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold tabular-nums">
              {{ formatRupiah(r.total_pendapatan_estimasi) }}
            </p>
            <p
              class="text-xs font-semibold tabular-nums"
              :class="r.keuntungan_bersih >= 0 ? 'text-green-700' : 'text-red-600'"
            >
              {{ formatRupiah(r.keuntungan_bersih) }}
            </p>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>
