<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMasterLauk } from '@/composables/useMasterLauk'
import { useHariIni } from '@/composables/useHariIni'
import { useHariStore } from '@/stores/hari'
import { STATUS_LABEL } from '@/types/database'
import { tanggalBaca, pesanError } from '@/lib/format'

const { data: laukList, isLoading: laukLoading } = useMasterLauk()
const hari = useHariIni()
const { tanggal } = storeToRefs(useHariStore())

const laukAktif = computed(() => (laukList.value ?? []).filter((l) => l.is_active))

watch(
  laukAktif,
  (lauk) => {
    if (lauk.length > 0) {
      hari.muat(tanggal.value, lauk)
    }
  },
  { immediate: true },
)

const status = computed(() => hari.rekonsiliasi.value?.status)
const statusLabel = computed(() => (status.value ? STATUS_LABEL[status.value] : 'Memuat…'))
const aksiError = ref('')

const langkah = [
  { key: 'pagi_pending', label: 'Input Pagi' },
  { key: 'pagi_selesai', label: 'Input Malam' },
  { key: 'malam_selesai', label: 'Selesai' },
]
const langkahIndex = computed(() => {
  const s = status.value
  if (s === 'libur') return -1
  if (s === 'malam_selesai') return 3
  if (s === 'pagi_selesai') return 2
  return 1
})

async function tandaiLibur() {
  aksiError.value = ''
  try {
    await hari.tandaiLibur(tanggal.value)
  } catch (e) {
    aksiError.value = pesanError(e)
  }
}

async function bukaLag() {
  aksiError.value = ''
  try {
    await hari.bukaLag()
  } catch (e) {
    aksiError.value = pesanError(e)
  }
}
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold">WarungKas</h1>
        <p class="text-sm text-zinc-500">{{ tanggalBaca(tanggal) }}</p>
      </div>
      <div class="flex gap-1">
        <RouterLink
          to="/lauk"
          class="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white active:bg-zinc-900"
        >
          Lauk
        </RouterLink>
        <RouterLink
          to="/pengaturan"
          class="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white active:bg-zinc-900"
        >
          Atur
        </RouterLink>
      </div>
    </div>

    <p v-if="aksiError" class="mt-4 text-sm text-red-600">{{ aksiError }}</p>

    <div v-if="laukLoading" class="mt-8 text-center text-zinc-500">Memuat…</div>

    <!-- Status libur: tenang -->
    <div
      v-else-if="status === 'libur'"
      class="mt-6 rounded-2xl bg-zinc-100 p-6 text-center"
    >
      <p class="text-3xl">🌙</p>
      <p class="mt-2 text-lg font-semibold text-zinc-700">Hari ini libur</p>
      <p class="text-sm text-zinc-500">Tidak perlu input pagi atau malam.</p>
      <button
        @click="bukaLag"
        class="mt-4 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base font-medium"
      >
        Buka Lagi
      </button>
    </div>

    <!-- Status normal -->
    <div v-else class="mt-6">
      <div class="rounded-2xl bg-white p-5 shadow-sm">
        <p class="text-sm text-zinc-500">Status hari ini</p>
        <div class="mt-2 flex items-center gap-1">
          <div
            v-for="(l, i) in langkah"
            :key="l.key"
            class="flex h-2 flex-1 rounded-full"
            :class="i < langkahIndex ? 'bg-green-600' : 'bg-zinc-200'"
          ></div>
        </div>
        <div class="mt-2 flex justify-between text-xs text-zinc-500">
          <span v-for="l in langkah" :key="l.key">{{ l.label }}</span>
        </div>
        <p class="mt-3 text-sm font-semibold">{{ statusLabel }}</p>
      </div>

      <div v-if="status === 'pagi_pending'" class="mt-4">
        <RouterLink
          to="/pagi"
          class="flex w-full flex-col items-center rounded-2xl bg-green-600 p-5 text-white active:bg-green-700"
        >
          <span class="text-3xl">🌅</span>
          <span class="mt-1 text-lg font-bold">Input Stok Pagi</span>
          <span class="text-sm opacity-90">Baseline stok hari ini</span>
        </RouterLink>
        <button
          @click="tandaiLibur"
          class="mt-3 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-600"
        >
          Warung libur hari ini
        </button>
      </div>

      <div v-else-if="status === 'pagi_selesai'" class="mt-4">
        <RouterLink
          to="/malam"
          class="flex w-full flex-col items-center rounded-2xl bg-indigo-600 p-5 text-white active:bg-indigo-700"
        >
          <span class="text-3xl">🌙</span>
          <span class="mt-1 text-lg font-bold">Input Malam</span>
          <span class="text-sm opacity-90">Rekonsiliasi & kunci hari ini</span>
        </RouterLink>
        <RouterLink
          to="/pagi"
          class="mt-3 block w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-center text-base text-zinc-600"
        >
          Koreksi Input Pagi
        </RouterLink>
      </div>

      <div v-else-if="status === 'malam_selesai'" class="mt-4">
        <div class="rounded-2xl bg-green-50 p-5 text-center text-green-800">
          <p class="text-3xl">✅</p>
          <p class="mt-1 text-lg font-bold">Hari ini sudah selesai</p>
          <p class="text-sm">Semua input terkunci. Lihat analisis di dashboard.</p>
        </div>
        <RouterLink
          to="/dashboard"
          class="mt-3 block w-full rounded-2xl bg-green-600 px-4 py-3 text-center text-base font-semibold text-white active:bg-green-700"
        >
          Buka Dashboard
        </RouterLink>
      </div>

      <RouterLink
        to="/malam"
        class="mt-3 block w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-center text-base text-zinc-600"
      >
        Input Malam
      </RouterLink>
    </div>
  </div>
</template>
