<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMasterLauk } from '@/composables/useMasterLauk'
import { useHariIni } from '@/composables/useHariIni'
import { usePengaturan } from '@/composables/usePengaturan'
import { useHariStore } from '@/stores/hari'
import Stepper from '@/components/Stepper.vue'
import {
  hitungAgregat,
  hppBaruPorsi,
  porsiDikonsumsi,
  selisihKas,
  stokAktifAwal,
} from '@/lib/engine'
import type { ItemKalkulasi } from '@/lib/engine'
import { formatRupiah, pesanError } from '@/lib/format'

interface RowMalam {
  id: string
  laukId: string
  namaLauk: string
  hargaJualPorsi: number
  hppEstimasi: number
  porsiCarryOver: number
  hppCarryOver: number
  basiPagi: number
  porsiBaru: number
  modalBaru: number
  sisaLayak: number
  rusakMalam: number
  konsumsi: number
}

const { data: laukList, isLoading: laukLoading } = useMasterLauk()
const { data: pengaturan, isLoading: pengaturanLoading } = usePengaturan()
const hari = useHariIni()
const { tanggal } = storeToRefs(useHariStore())

const rows = ref<RowMalam[]>([])
let initialized = false

const makanSendiri = ref(true)
const uangLaci = ref<number | null>(null)
const uangDigital = ref<number | null>(null)

const laukAktif = computed(() => (laukList.value ?? []).filter((l) => l.is_active))

watch(
  laukAktif,
  (lauk) => {
    if (lauk.length > 0) {
      initialized = false
      hari.muat(tanggal.value, lauk)
    }
  },
  { immediate: true },
)

watch(hari.detail, (d) => {
  if (d.length > 0 && !initialized) initRows()
})

function initRows() {
  rows.value = hari.detail.value.map((d) => ({
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
  }))
  initialized = true
}

function itemKalkulasi(r: RowMalam): ItemKalkulasi {
  return {
    porsi_carry_over: r.porsiCarryOver,
    hpp_carry_over_porsi: r.hppCarryOver,
    porsi_basi_pagi: r.basiPagi,
    porsi_baru_dimasak: r.porsiBaru,
    modal_baru_total: r.modalBaru,
    porsi_sisa_layak_jual: r.sisaLayak,
    porsi_rusak_malam: r.rusakMalam,
    porsi_konsumsi: makanSendiri.value ? r.konsumsi : 0,
    harga_jual_porsi: r.hargaJualPorsi,
    hpp_estimasi_porsi: r.hppEstimasi,
  }
}

function stokAktif(r: RowMalam): number {
  return stokAktifAwal(itemKalkulasi(r))
}

function validRow(r: RowMalam): boolean {
  return r.sisaLayak + r.rusakMalam + (makanSendiri.value ? r.konsumsi : 0) <= stokAktif(r)
}

const semuaValid = computed(() => rows.value.every(validRow))

const status = computed(() => hari.rekonsiliasi.value?.status)
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
        porsi_sisa_layak_jual: r.sisaLayak,
        porsi_rusak_malam: r.rusakMalam,
        porsi_konsumsi: makanSendiri.value ? r.konsumsi : 0,
        modal_baru_total: r.modalBaru,
        hpp_baru_porsi: hppBaruPorsi(item),
      }
    })
    await hari.simpanMalam(
      items,
      uangLaci.value,
      terimaDigital.value ? uangDigital.value ?? 0 : 0,
      modalKembalian.value,
    )
    initialized = false
    await hari.muat(tanggal.value, laukAktif.value)
  } catch (e) {
    simpanError.value = pesanError(e)
  } finally {
    simpanLoading.value = false
  }
}
</script>

<template>
  <div class="p-4">
    <h1 class="text-xl font-bold">Input Malam</h1>
    <p class="text-sm text-zinc-500">Rekonsiliasi mundur — hitung yang terjual hari ini</p>

    <p v-if="hari.error" class="mt-4 text-sm text-red-600">{{ hari.error }}</p>
    <p v-if="simpanError" class="mt-4 text-sm text-red-600">{{ simpanError }}</p>

    <!-- Status gate -->
    <div v-if="belumPagi && !terkunci" class="mt-4 rounded-xl bg-amber-50 p-4 text-amber-800">
      {{
        status === 'libur'
          ? 'Hari ini libur — tidak perlu input malam.'
          : 'Input pagi belum selesai. Lengkapi Input Stok Pagi dulu sebelum input malam.'
      }}
    </div>

    <div v-else-if="terkunci" class="mt-4 rounded-xl border border-zinc-300 bg-zinc-100 p-4 text-center text-zinc-600">
      Hari ini sudah terkunci. Data tidak dapat diubah lagi.
    </div>

    <div v-if="terkunci || (status === 'pagi_selesai' && rows.length > 0)" class="mt-4">
      <div class="rounded-xl bg-white p-4 shadow-sm">
        <p class="text-sm font-medium text-zinc-500">Ringkasan Hari Ini</p>
        <div class="mt-2 flex flex-col gap-1.5 text-sm">
          <div class="flex justify-between">
            <span>Pendapatan estimasi</span>
            <span class="font-semibold tabular-nums">{{ formatRupiah(agregat.pendapatan) }}</span>
          </div>
          <div class="flex justify-between text-zinc-600">
            <span>─ dari digital</span>
            <span class="tabular-nums">{{ formatRupiah(terimaDigital ? uangDigital ?? 0 : 0) }}</span>
          </div>
          <div class="flex justify-between text-zinc-600">
            <span>─ tunai diharapkan</span>
            <span class="tabular-nums">{{ formatRupiah(agregat.pendapatan - (terimaDigital ? uangDigital ?? 0 : 0)) }}</span>
          </div>
          <div class="flex justify-between">
            <span>HPP nyata</span>
            <span class="font-semibold tabular-nums">{{ formatRupiah(agregat.hppNyata) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Kerugian (basi/rusak)</span>
            <span class="font-semibold tabular-nums">{{ formatRupiah(agregat.kerugian) }}</span>
          </div>
          <div class="flex justify-between border-t border-zinc-200 pt-1.5">
            <span>Keuntungan bersih</span>
            <span class="angka-besar text-green-700">{{ formatRupiah(agregat.profit) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Uang di laci (net)</span>
            <span class="tabular-nums">{{ formatRupiah((uangLaci ?? 0) - modalKembalian) }}</span>
          </div>
          <div class="flex justify-between border-t border-zinc-200 pt-1.5">
            <span>Selisih kas</span>
            <span
              class="font-bold tabular-nums"
              :class="selisih === 0 ? 'text-green-700' : selisih > 0 ? 'text-amber-600' : 'text-red-600'"
            >
              {{ formatRupiah(selisih) }}
            </span>
          </div>
        </div>
      </div>

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
              class="w-32 rounded-lg border border-zinc-300 px-3 py-2 text-base text-right tabular-nums"
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
            class="w-40 rounded-lg border border-zinc-300 px-3 py-3 text-base text-right tabular-nums"
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
            class="w-40 rounded-lg border border-zinc-300 px-3 py-3 text-base text-right tabular-nums"
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
