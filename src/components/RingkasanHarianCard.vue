<script setup lang="ts">
import { computed } from 'vue'
import { formatRupiah } from '@/lib/format'

interface Props {
  pendapatan: number
  uangDigital?: number
  hppNyata: number
  kerugian: number
  profit: number
  uangLaci?: number
  modalKembalian?: number
  selisihKas?: number
  showDigital?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  uangDigital: 0,
  uangLaci: 0,
  modalKembalian: 0,
  selisihKas: 0,
  showDigital: false,
})

const tunai = computed(() => props.pendapatan - (props.showDigital ? props.uangDigital : 0))

const selisihColor = computed(() => {
  if (props.selisihKas === 0) return 'text-green-700'
  return props.selisihKas > 0 ? 'text-amber-600' : 'text-red-600'
})

const profitColor = computed(() => {
  return props.profit >= 0 ? 'text-green-700' : 'text-red-600'
})
</script>

<template>
  <div class="rounded-xl bg-white p-4 shadow-sm">
    <p class="text-sm font-medium text-zinc-500">Ringkasan Hari Ini</p>
    <div class="mt-2 flex flex-col gap-1.5 text-sm">
      <div class="flex justify-between">
        <span>Pendapatan estimasi</span>
        <span class="font-semibold tabular-nums">{{ formatRupiah(pendapatan) }}</span>
      </div>
      <template v-if="showDigital">
        <div class="flex justify-between text-zinc-600">
          <span>─ dari digital</span>
          <span class="tabular-nums">{{ formatRupiah(uangDigital) }}</span>
        </div>
        <div class="flex justify-between text-zinc-600">
          <span>─ tunai diharapkan</span>
          <span class="tabular-nums">{{ formatRupiah(tunai) }}</span>
        </div>
      </template>
      <template v-else>
        <div class="flex justify-between text-zinc-600">
          <span>─ tunai</span>
          <span class="tabular-nums">{{ formatRupiah(pendapatan) }}</span>
        </div>
      </template>
      <div class="flex justify-between">
        <span>HPP nyata</span>
        <span class="font-semibold tabular-nums">{{ formatRupiah(hppNyata) }}</span>
      </div>
      <div class="flex justify-between">
        <span>Kerugian (basi/rusak)</span>
        <span class="font-semibold tabular-nums">{{ formatRupiah(kerugian) }}</span>
      </div>
      <div class="flex justify-between border-t border-zinc-200 pt-1.5">
        <span>Keuntungan bersih</span>
        <span class="angka-besar font-semibold" :class="profitColor">{{ formatRupiah(profit) }}</span>
      </div>
      <template v-if="uangLaci !== undefined && modalKembalian !== undefined">
        <div class="flex justify-between">
          <span>Uang di laci (net)</span>
          <span class="tabular-nums">{{ formatRupiah(uangLaci - modalKembalian) }}</span>
        </div>
      </template>
      <template v-if="selisihKas !== undefined">
        <div class="flex justify-between border-t border-zinc-200 pt-1.5">
          <span>Selisih kas</span>
          <span class="font-bold tabular-nums" :class="selisihColor">
            {{ formatRupiah(selisihKas) }}
          </span>
        </div>
      </template>
    </div>
  </div>
</template>
