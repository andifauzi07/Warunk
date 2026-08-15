<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { usePengaturan } from '@/composables/usePengaturan'
import { useSessionStore } from '@/stores/session'
import { pesanError } from '@/lib/format'

const { data, isLoading, simpan } = usePengaturan()
const session = useSessionStore()

const form = reactive({
  modal_kembalian_default: 0 as number | null,
  toleransi_selisih_persen: 5,
  terima_pembayaran_digital: false,
})

watch(
  data,
  (p) => {
    if (!p) return
    form.modal_kembalian_default = p.modal_kembalian_default
    form.toleransi_selisih_persen = p.toleransi_selisih_persen
    form.terima_pembayaran_digital = p.terima_pembayaran_digital
  },
  { immediate: true },
)

const pesan = ref('')
const error = ref('')
const saving = ref(false)

async function simpanSemua() {
  error.value = ''
  pesan.value = ''
  if (form.toleransi_selisih_persen < 0 || form.toleransi_selisih_persen > 100) {
    error.value = 'Toleransi harus antara 0–100%.'
    return
  }
  saving.value = true
  try {
    await simpan.mutateAsync({
      user_id: session.user?.id ?? '',
      modal_kembalian_default: form.modal_kembalian_default ?? 0,
      toleransi_selisih_persen: form.toleransi_selisih_persen,
      terima_pembayaran_digital: form.terima_pembayaran_digital,
    })
    pesan.value = 'Pengaturan tersimpan.'
  } catch (e) {
    error.value = pesanError(e)
  } finally {
    saving.value = false
  }
}

async function keluar() {
  await session.logout()
}
</script>

<template>
  <div class="p-4">
    <h1 class="text-xl font-bold">Pengaturan</h1>
    <p class="text-sm text-zinc-500">Warung & detektor kas</p>

    <p v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>
    <p v-if="pesan" class="mt-4 text-sm text-green-700">{{ pesan }}</p>

    <div v-if="isLoading" class="mt-8 text-center text-zinc-500">Memuat…</div>

    <form v-else class="mt-4 rounded-2xl bg-white p-5 shadow-sm">
      <label class="block">
        <span class="text-sm font-medium">Modal kembalian (uang kecil di laci)</span>
        <input
          v-model.number="form.modal_kembalian_default"
          type="number"
          inputmode="numeric"
          min="0"
          class="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-3 text-base tabular-nums"
          placeholder="Contoh: 150000"
        />
        <span class="mt-1 block text-xs text-zinc-500">
          Dipakai untuk hari baru; hari yang sudah terkunci tetap memakai nilai lamanya.
        </span>
      </label>

      <label class="mt-4 block">
        <span class="text-sm font-medium">Toleransi selisih kas (%)</span>
        <input
          v-model.number="form.toleransi_selisih_persen"
          type="number"
          inputmode="numeric"
          min="0"
          max="100"
          step="0.5"
          class="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-3 text-base tabular-nums"
          placeholder="Contoh: 5"
        />
        <span class="mt-1 block text-xs text-zinc-500">
          Ambang hijau → kuning → merah pada detektor selisih kas.
        </span>
      </label>

      <label class="mt-4 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4">
        <span>
          <span class="block text-sm font-medium">Menerima pembayaran digital</span>
          <span class="block text-xs text-zinc-500">QRIS, GoPay, dst. Munculkan input uang digital di input malam.</span>
        </span>
        <button
          type="button"
          role="switch"
          :aria-checked="form.terima_pembayaran_digital"
          class="relative h-7 w-12 shrink-0 rounded-full transition-colors"
          :class="form.terima_pembayaran_digital ? 'bg-green-600' : 'bg-zinc-300'"
          @click="form.terima_pembayaran_digital = !form.terima_pembayaran_digital"
        >
          <span
            class="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all"
            :class="form.terima_pembayaran_digital ? 'left-6' : 'left-1'"
          ></span>
        </button>
      </label>

      <button
        type="submit"
        @click.prevent="simpanSemua"
        :disabled="saving"
        class="mt-5 w-full rounded-xl bg-green-600 px-4 py-4 text-base font-bold text-white active:bg-green-700"
      >
        {{ saving ? 'Menyimpan…' : 'Simpan Pengaturan' }}
      </button>
    </form>

    <div class="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
      <p class="font-semibold">Akun</p>
      <p class="mt-1 text-sm text-zinc-500">{{ session.user?.email }}</p>
      <button
        @click="keluar"
        class="mt-3 w-full rounded-xl border border-red-300 px-4 py-3 text-base font-medium text-red-600"
      >
        Keluar
      </button>
    </div>
  </div>
</template>
