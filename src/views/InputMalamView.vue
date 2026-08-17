<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDetailRows } from '@/composables/useDetailRows'
import { usePengaturan } from '@/composables/usePengaturan'
import { useHariStore } from '@/stores/hari'
import Stepper from '@/components/Stepper.vue'
import RingkasanHarianCard from '@/components/RingkasanHarianCard.vue'
import {
  hitungAgregat,
  hppBaruPorsi,
  porsiDikonsumsi,
  selisihKas,
  stokAktifAwal,
} from '@/lib/engine'
import type { ItemKalkulasi } from '@/lib/engine'
import { formatRupiah, pesanError } from '@/lib/format'
import type { RowDetail } from '@/composables/useDetailRows'

const { tanggal } = storeToRefs(useHariStore())
const { rows, hariError, laukLoading, laukAktif, hari, toItemKalkulasi, resetInitialized } = useDetailRows(tanggal)
const { data: pengaturan, isLoading: pengaturanLoading } = usePengaturan()

const makanSendiri = ref(true)
const uangLaci = ref<number | null>(null)
const uangDigital = ref<number | null>(null)

function itemKalkulasi(r: RowDetail): ItemKalkulasi {
  const base = toItemKalkulasi(r)
  if (!makanSendiri.value) {
    return { ...base, porsi_konsumsi: 0 }
  }
  return base
}

function stokAktif(r: RowDetail): number {
  return stokAktifAwal(itemKalkulasi(r))
}

function validRow(r: RowDetail): boolean {
  return r.sisaLayak + r.rusakMalam + (makanSendiri.value ? r.konsumsi : 0) <= stokAktif(r)
}

const semuaValid = computed(() => rows.value.every(validRow))

const status = computed(() => hari.rekonsiliasi.value?.status)
const rek = computed(() => hari.rekonsiliasi.value)
const terkunci = computed(() => status.value === 'malam_selesai')
const belumPagi = computed(() => status.value === 'pagi_pending' || status.value === 'libur')

/** Lauk yang memakai HPP estimasi karena modal belum diisi */
const daftarEstimasi = computed(() =>
  rows.value.filter((r) => r.porsiBaru > 0 && r.modalBaru === 0),
)

const modalKembalian = computed(() => pengaturan.value?.modal_kembalian_default ?? 0)
const terimaDigital = computed(() => pengaturan.value?.terima_pembayaran_digital ?? false)

const agregat = computed(() => hitungAgregat(rows.value.map(itemKalkulasi)))
const selisih = computed(() =>
  selisihKas(uangLaci.value ?? 0, modalKembalian.value, uangDigital.value ?? 0, agregat.value.pendapatan),
)

const simpanError = ref('')
const simpanLoading = ref(false)

async function simpan() {
  simpanError.value = ''
  if (!semuaValid.value) {
    simpanError.value = 'Ada lauk yang jumlahnya melebihi stok aktif. Periksa kembali.'
    return
  }
  if (uangLaci.value === null || uangLaci.value < 0) {
    simpanError.value = 'Uang di laci wajib diisi.'
    return
  }
  simpanLoading.value = true
  try {
    const items = rows.value.map((r) => {
      const item = itemKalkulasi(r)
      return {
        id: r.id,
        lauk_id: r.laukId,
        porsi_carry_over: r.porsiCarryOver,
        hpp_carry_over_porsi: r.hppCarryOver,
        porsi_basi_pagi: r.basiPagi,
        porsi_baru_dimasak: r.porsiBaru,
        modal_baru_total: r.modalBaru,
        hpp_baru_porsi: hppBaruPorsi(item),
        porsi_sisa_layak_jual: r.sisaLayak,
        porsi_rusak_malam: r.rusakMalam,
        porsi_konsumsi: makanSendiri.value ? r.konsumsi : 0,
      }
    })
    await hari.simpanMalam.mutateAsync({
      items,
      uangLaci: uangLaci.value,
      uangDigital: terimaDigital.value ? uangDigital.value ?? 0 : 0,
      modalKembalianPakai: modalKembalian.value,
    })
    resetInitialized()
  } catch (e) {
    simpanError.value = pesanError(e)
  } finally {
    simpanLoading.value = false
  }
}
</script>

<template>
  <div class="p-4 pb-20">
    <h1 class="text-xl font-bold">Input Malam</h1>
    <p class="text-sm text-zinc-500">Rekonsiliasi mundur — hitung yang terjual hari ini</p>

    <p v-if="hariError" class="mt-4 text-sm text-red-600">{{ hariError }}</p>
    <p v-if="simpanError" class="mt-4 text-sm text-red-600">{{ simpanError }}</p>

    <!-- Status gate -->
    <div v-if="belumPagi && !terkunci" class="mt-4 rounded-xl bg-amber-50 p-4 text-amber-800">
      {{
        status === 'libur'
          ? 'Hari ini libur — tidak perlu input malam.'
          : 'Input pagi belum selesai. Lengkapi Input Stok Pagi dulu sebelum input malam.'
      }}
    </div>

    <!-- Terkunci: tampilan ringkasan read-only -->
    <div v-else-if="terkunci && rows.length > 0" class="mt-4 flex flex-col gap-3">
      <div class="rounded-xl bg-green-50 p-4 text-green-800">
        <p class="font-semibold">✓ Input malam tersimpan</p>
        <p class="mt-0.5 text-sm">Hari ini terkunci — data tidak dapat diubah lagi.</p>
      </div>

      <RingkasanHarianCard
        :pendapatan="rek?.total_pendapatan_estimasi ?? 0"
        :uang-digital="rek?.total_uang_digital ?? 0"
        :hpp-nyata="rek?.total_hpp_nyata ?? 0"
        :kerugian="rek?.total_kerugian ?? 0"
        :profit="rek?.keuntungan_bersih ?? 0"
        :uang-laci="(rek?.total_uang_laci ?? 0) - (rek?.modal_kembalian_pakai ?? 0)"
        :modal-kembalian="0"
        :selisih-kas="rek?.selisih_kas ?? 0"
        show-digital
      />

      <div v-for="row in rows" :key="row.id" class="rounded-xl border border-zinc-200 bg-white p-4">
        <div class="flex items-center justify-between">
          <p class="font-semibold">{{ row.namaLauk }}</p>
          <p class="text-sm text-zinc-500">Terjual ≈ {{ Math.max(0, porsiDikonsumsi(itemKalkulasi(row))) }} porsi</p>
        </div>
        <div class="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <span class="text-zinc-500">Stok awal</span>
            <p class="font-semibold tabular-nums">{{ stokAktif(row) }}</p>
          </div>
          <div>
            <span class="text-zinc-500">Sisa layak besok</span>
            <p class="font-semibold tabular-nums">{{ row.sisaLayak }}</p>
          </div>
          <div>
            <span class="text-zinc-500">Rusak/basi</span>
            <p class="font-semibold tabular-nums">{{ row.rusakMalam }}</p>
          </div>
          <div v-if="row.konsumsi > 0">
            <span class="text-zinc-500">Dimakan sendiri</span>
            <p class="font-semibold tabular-nums">{{ row.konsumsi }}</p>
          </div>
          <div v-if="row.modalBaru > 0">
            <span class="text-zinc-500">Modal bahan</span>
            <p class="font-semibold tabular-nums">{{ formatRupiah(row.modalBaru) }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="status === 'pagi_selesai' && rows.length > 0" class="mt-4">
      <RingkasanHarianCard
        :pendapatan="agregat.pendapatan"
        :uang-digital="terimaDigital ? uangDigital ?? 0 : 0"
        :hpp-nyata="agregat.hppNyata"
        :kerugian="agregat.kerugian"
        :profit="agregat.profit"
        :uang-laci="(uangLaci ?? 0) - modalKembalian"
        :modal-kembalian="0"
        :selisih-kas="selisih"
        show-digital
      />

      <!-- Toggle makan sendiri -->
      <button
        v-if="!terkunci"
        @click="makanSendiri = !makanSendiri"
        class="mt-4 w-full rounded-xl border px-4 py-3 text-base font-medium"
        :class="makanSendiri ? 'border-green-600 bg-green-50 text-green-800' : 'border-zinc-300 bg-white text-zinc-600'"
      >
        {{ makanSendiri ? '✓ Hari ini ada yang dimakan sendiri/keluarga' : 'Hari ini tidak ada yang dimakan sendiri (ketuk untuk ubah)' }}
      </button>

      <!-- Daftar lauk opname -->
      <div class="mt-3 flex flex-col gap-3">
        <div
          v-for="row in rows"
          :key="row.id"
          class="rounded-xl border border-zinc-200 bg-white p-4"
          :class="{ 'border-red-400': !validRow(row) }"
        >
          <div class="flex items-center justify-between">
            <p class="font-semibold">{{ row.namaLauk }}</p>
            <p class="text-sm text-zinc-500">Stok: <strong>{{ stokAktif(row) }}</strong></p>
          </div>

          <div class="mt-3 grid grid-cols-1 gap-3">
            <div class="flex items-center justify-between">
              <span class="text-sm">Sisa layak jual besok</span>
              <Stepper v-model="row.sisaLayak" :max="stokAktif(row)" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm">Rusak/basi</span>
              <Stepper v-model="row.rusakMalam" :max="stokAktif(row) - row.sisaLayak" />
            </div>
            <div v-if="makanSendiri" class="flex items-center justify-between">
              <span class="text-sm">Dimakan sendiri</span>
              <Stepper v-model="row.konsumsi" :max="stokAktif(row) - row.sisaLayak - row.rusakMalam" />
            </div>
          </div>

          <div class="mt-2 flex items-center justify-between text-xs text-zinc-500">
            <span>
              Terjual ≈ {{ Math.max(0, porsiDikonsumsi(itemKalkulasi(row))) }} porsi
            </span>
            <span v-if="!validRow(row)" class="font-semibold text-red-600">
              Melebihi stok!
            </span>
          </div>

          <!-- Modal bisa diisi belakangan di layar malam -->
          <label v-if="row.porsiBaru > 0" class="mt-2 flex items-center justify-between gap-3">
            <span class="text-sm text-zinc-600">Modal bahan (Rp)</span>
            <input
              v-model.number="row.modalBaru"
              type="number"
              inputmode="numeric"
              min="0"
              class="w-32 no-spinner rounded-lg border border-zinc-300 px-3 py-2 text-base text-right tabular-nums"
              placeholder="0"
            />
          </label>
        </div>
      </div>

      <!-- Uang -->
      <div class="mt-4 rounded-xl border border-zinc-200 bg-white p-4">
        <label class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium">Total uang di laci</span>
          <input
            v-model.number="uangLaci"
            type="number"
            inputmode="numeric"
            min="0"
            class="w-40 rounded-lg no-spinner border border-zinc-300 px-3 py-3 text-base text-right tabular-nums"
            placeholder="0"
          />
        </label>
        <label v-if="terimaDigital" class="mt-3 flex items-center justify-between gap-3">
          <span class="text-sm font-medium">Uang digital masuk (QRIS/GoPay)</span>
          <input
            v-model.number="uangDigital"
            type="number"
            inputmode="numeric"
            min="0"
            class="w-40 no-spinner rounded-lg border border-zinc-300 px-3 py-3 text-base text-right tabular-nums"
            placeholder="0"
          />
        </label>
        <p class="mt-3 text-xs text-zinc-500">
          Modal kembalian dipakai: {{ formatRupiah(modalKembalian) }} (dari pengaturan)
        </p>
      </div>

      <!-- Peringatan HPP estimasi -->
      <div v-if="daftarEstimasi.length > 0 && !terkunci" class="mt-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
        <p class="font-semibold">HPP memakai estimasi:</p>
        <ul class="ml-4 list-disc">
          <li v-for="r in daftarEstimasi" :key="r.id">{{ r.namaLauk }}</li>
        </ul>
        <p class="mt-1 text-xs">
          Isi modal bahan di atas bila ingin HPP akurat. Hari tetap bisa dikunci dengan estimasi.
        </p>
      </div>

      <button
        v-if="!terkunci"
        @click="simpan"
        :disabled="simpanLoading || !semuaValid"
        class="mt-4 w-full rounded-xl bg-green-600 px-4 py-4 text-base font-bold text-white active:bg-green-700"
      >
        {{ simpanLoading ? 'Menyimpan…' : 'Simpan & Kunci Hari Ini' }}
      </button>
    </div>

    <div v-if="laukLoading || pengaturanLoading" class="mt-8 text-center text-zinc-500">Memuat…</div>
  </div>
</template>
