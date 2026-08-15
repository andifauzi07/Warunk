<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { usePengaturan } from '@/composables/usePengaturan'
import { useHariStore } from '@/stores/hari'
import { useAnalitik } from '@/composables/useAnalitik'
import { statusSelisih } from '@/lib/engine'
import { formatAngka, formatRupiah, tambahHari } from '@/lib/format'
import type { StatusHarian } from '@/types/database'

const { tanggal } = storeToRefs(useHariStore())
const { data: pengaturan } = usePengaturan()

const rentang = ref(30)
const { ringkasanHariIni, tren, ranking, dari } = useAnalitik(tanggal.value, rentang)

const ringkasanData = ringkasanHariIni.data
const ringkasanError = ringkasanHariIni.error
const ringkasanLoading = ringkasanHariIni.isLoading
const trenError = tren.error
const trenLoading = tren.isLoading
const trenData = tren.data
const rankingError = ranking.error
const rankingLoading = ranking.isLoading
const rankingData = ranking.data

const ringkasan = computed(() => ringkasanData.value)

const statusLabel: Record<StatusHarian, string> = {
  pagi_pending: 'Input pagi belum selesai',
  pagi_selesai: 'Menunggu input malam',
  malam_selesai: 'Selesai & terkunci',
  libur: 'Libur',
}

const toleransi = computed(() => pengaturan.value?.toleransi_selisih_persen ?? 5)

const levelSelisih = computed(() => {
  const r = ringkasan.value
  if (!r) return 'aman'
  return statusSelisih(r.selisih_kas, r.total_pendapatan_estimasi, toleransi.value)
})

const warnaSelisih: Record<string, string> = {
  aman: 'text-green-700',
  waspada: 'text-amber-600',
  kritis: 'text-red-600',
}

const labelSelisih: Record<string, string> = {
  aman: 'Selisih wajar',
  waspada: 'Periksa uang laci',
  kritis: 'Selisih besar — cek ulang',
}

interface Batang {
  tanggal: string
  label: string
  nilai: number | null
  status: StatusHarian | 'lupa' | 'nanti'
}

const batang = computed<Batang[]>(() => {
  const data = trenData.value ?? []
  const peta = new Map(data.map((d) => [d.tanggal, d]))
  const list: Batang[] = []
  for (let i = 0; i < rentang.value; i++) {
    const t = tambahHari(dari.value, i)
    const d = peta.get(t)
    if (!d) {
      list.push({ tanggal: t, label: labelTanggal(t), nilai: null, status: 'lupa' })
      continue
    }
    list.push({
      tanggal: t,
      label: labelTanggal(t),
      nilai: d.keuntungan_bersih,
      status: d.status,
    })
  }
  return list
})

const skalaMaks = computed(() => {
  const vals = batang.value.map((b) => Math.abs(b.nilai ?? 0))
  return Math.max(1, ...vals)
})

function labelTanggal(t: string): string {
  return t.slice(8, 10)
}

function tinggiBar(b: Batang): number {
  if (b.nilai === null) return 6
  return Math.max(6, (Math.abs(b.nilai) / skalaMaks.value) * 120)
}

function warnaBar(b: Batang): string {
  if (b.status === 'libur') return 'bg-zinc-300'
  if (b.status === 'lupa') return 'bg-red-300'
  if (b.nilai === null || b.nilai === 0) return 'bg-zinc-300'
  return b.nilai > 0 ? 'bg-green-600' : 'bg-red-500'
}

const ringkasanTren = computed(() => {
  const data = trenData.value ?? []
  const hari = data.filter((d) => d.status === 'malam_selesai' && d.keuntungan_bersih !== null)
  if (hari.length === 0) return null
  const total = hari.reduce((a, d) => a + (d.keuntungan_bersih ?? 0), 0)
  const rata = total / hari.length
  return { total, rata, jumlahHari: hari.length }
})

const daftarLupa = computed(() => batang.value.filter((b) => b.status === 'lupa'))

const rentangLupa = computed(() => {
  const l = daftarLupa.value
  const awal = l[0]
  const akhir = l[l.length - 1]
  if (!awal || !akhir) return null
  return { awal: awal.tanggal, akhir: akhir.tanggal, jumlah: l.length }
})

const terjual = computed(() =>
  (rankingData.value ?? []).filter((r) => r.porsi_dikonsumsi > 0).slice(0, 5),
)
const seringRusak = computed(() =>
  (rankingData.value ?? []).filter((r) => r.porsi_rusak_total > 0).slice(0, 5),
)

const loading = computed(
  () => ringkasanLoading.value || trenLoading.value || rankingLoading.value,
)
</script>

<template>
  <div class="p-4">
    <h1 class="text-xl font-bold">Analisis</h1>
    <p class="text-sm text-zinc-500">Laba & kesehatan kas warungmu</p>

    <p v-if="ringkasanError || trenError || rankingError" class="mt-4 text-sm text-red-600">
      {{ ringkasanError?.message || trenError?.message || rankingError?.message }}
    </p>

    <div v-if="loading" class="mt-8 text-center text-zinc-500">Memuat…</div>

    <template v-else>
      <!-- Ringkasan Hari Ini -->
      <div class="mt-4 rounded-2xl bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-sm text-zinc-500">Hari ini</p>
          <span
            v-if="ringkasan"
            class="rounded-full px-3 py-1 text-xs font-medium"
            :class="ringkasan.status === 'malam_selesai' ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-600'"
          >
            {{ statusLabel[ringkasan.status] }}
          </span>
        </div>

        <p v-if="!ringkasan" class="mt-4 text-sm text-zinc-500">
          Belum ada data hari ini. Selesaikan input malam untuk melihat laba.
        </p>

        <template v-else>
          <div class="mt-3 flex flex-col gap-1.5 text-sm">
            <div class="flex justify-between">
              <span>Pendapatan estimasi</span>
              <span class="font-semibold tabular-nums">{{ formatRupiah(ringkasan.total_pendapatan_estimasi) }}</span>
            </div>
            <div class="flex justify-between text-zinc-600">
              <span>─ tunai</span>
              <span class="tabular-nums">{{ formatRupiah(ringkasan.total_pendapatan_estimasi - ringkasan.total_uang_digital) }}</span>
            </div>
            <div class="flex justify-between text-zinc-600">
              <span>─ digital</span>
              <span class="tabular-nums">{{ formatRupiah(ringkasan.total_uang_digital) }}</span>
            </div>
            <div class="flex justify-between">
              <span>HPP nyata</span>
              <span class="tabular-nums">{{ formatRupiah(ringkasan.total_hpp_nyata) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Kerugian (basi/rusak)</span>
              <span class="tabular-nums">{{ formatRupiah(ringkasan.total_kerugian) }}</span>
            </div>
            <div class="flex justify-between border-t border-zinc-200 pt-2">
              <span class="font-semibold">Keuntungan bersih</span>
              <span
                class="angka-besar"
                :class="ringkasan.keuntungan_bersih >= 0 ? 'text-green-700' : 'text-red-600'"
              >
                {{ formatRupiah(ringkasan.keuntungan_bersih) }}
              </span>
            </div>
          </div>

          <div class="mt-3 rounded-xl border p-3" :class="levelSelisih === 'aman' ? 'border-green-200 bg-green-50' : levelSelisih === 'waspada' ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium">Selisih kas (toleransi {{ toleransi }}%)</span>
              <span class="text-xs" :class="warnaSelisih[levelSelisih]">{{ labelSelisih[levelSelisih] }}</span>
            </div>
            <p class="mt-1 text-lg font-bold tabular-nums" :class="warnaSelisih[levelSelisih]">
              {{ formatRupiah(ringkasan.selisih_kas) }}
            </p>
          </div>
        </template>
      </div>

      <!-- Tren -->
      <div class="mt-4 rounded-2xl bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="font-semibold">Tren keuntungan</p>
          <div class="flex rounded-lg bg-zinc-100 p-1">
            <button
              class="rounded-md px-3 py-1 text-sm"
              :class="rentang === 7 ? 'bg-white font-medium shadow-sm' : 'text-zinc-500'"
              @click="rentang = 7"
            >
              7 hari
            </button>
            <button
              class="rounded-md px-3 py-1 text-sm"
              :class="rentang === 30 ? 'bg-white font-medium shadow-sm' : 'text-zinc-500'"
              @click="rentang = 30"
            >
              30 hari
            </button>
          </div>
        </div>

        <div class="mt-4 flex h-36 items-end gap-1">
          <div
            v-for="(b, i) in batang"
            :key="b.tanggal"
            class="flex flex-1 flex-col items-center justify-end"
          >
            <div
              :class="warnaBar(b)"
              class="w-full rounded-t"
              :style="{ height: tinggiBar(b) + 'px' }"
            ></div>
            <span
              v-if="rentang === 7 || i % 5 === 4 || i === batang.length - 1"
              class="mt-1 text-[10px] text-zinc-400"
            >
              {{ b.label }}
            </span>
          </div>
        </div>

        <div v-if="ringkasanTren" class="mt-3 flex justify-between rounded-xl bg-zinc-50 p-3 text-sm">
          <div>
            <p class="text-zinc-500">Total {{ ringkasanTren.jumlahHari }} hari</p>
            <p class="font-semibold tabular-nums">{{ formatRupiah(ringkasanTren.total) }}</p>
          </div>
          <div class="text-right">
            <p class="text-zinc-500">Rata-rata/hari</p>
            <p class="font-semibold tabular-nums">{{ formatRupiah(ringkasanTren.rata) }}</p>
          </div>
        </div>

        <div v-if="rentangLupa" class="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <p class="font-semibold">⚠ {{ rentangLupa.jumlah }} hari tanpa input</p>
          <p class="text-xs">Tanggal {{ rentangLupa.awal }}{{ rentangLupa.jumlah > 1 ? ' s.d. ' + rentangLupa.akhir : '' }} tidak punya data.</p>
        </div>

        <div class="mt-2 flex gap-4 text-xs text-zinc-500">
          <span class="flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-sm bg-green-600"></span> Laba</span>
          <span class="flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-sm bg-red-500"></span> Rugi</span>
          <span class="flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-sm bg-zinc-300"></span> Libur/0</span>
          <span class="flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-sm bg-red-300"></span> Lupa input</span>
        </div>
      </div>

      <!-- Ranking -->
      <div class="mt-4 grid grid-cols-1 gap-4">
        <div class="rounded-2xl bg-white p-5 shadow-sm">
          <p class="font-semibold">Lauk terlaris</p>
          <p v-if="terjual.length === 0" class="mt-2 text-sm text-zinc-500">Belum ada data.</p>
          <ol v-else class="mt-2 flex flex-col gap-2">
            <li v-for="(r, i) in terjual" :key="r.lauk_id" class="flex items-center justify-between text-sm">
              <span class="flex items-center gap-2">
                <span class="w-5 font-semibold text-zinc-400">{{ i + 1 }}</span>
                {{ r.nama_lauk }}
              </span>
              <span class="font-semibold tabular-nums">{{ formatAngka(r.porsi_dikonsumsi) }} porsi</span>
            </li>
          </ol>
        </div>

        <div class="rounded-2xl bg-white p-5 shadow-sm">
          <p class="font-semibold">Sering basi/rusak</p>
          <p v-if="seringRusak.length === 0" class="mt-2 text-sm text-zinc-500">Bagus — tidak ada yang terbuang.</p>
          <ol v-else class="mt-2 flex flex-col gap-2">
            <li v-for="(r, i) in seringRusak" :key="r.lauk_id" class="flex items-center justify-between text-sm">
              <span class="flex items-center gap-2">
                <span class="w-5 font-semibold text-zinc-400">{{ i + 1 }}</span>
                {{ r.nama_lauk }}
              </span>
              <span class="font-semibold text-red-600 tabular-nums">{{ formatAngka(r.porsi_rusak_total) }} porsi</span>
            </li>
          </ol>
        </div>
      </div>
    </template>
  </div>
</template>
