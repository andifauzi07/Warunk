<script setup lang="ts">
import { ref, watch } from 'vue';
import { useMasterLauk } from '@/composables/useMasterLauk';
import { parseCurrency, pesanError } from '@/lib/format';

const open = defineModel<boolean>('open', { default: false });
// const emit = defineEmits<{ saved: [] }>();

const { data: laukList, tambah } = useMasterLauk();

const nama = ref('');
const hargaJual = ref('');
const hppEstimasi = ref('');
const simpanError = ref('');
const simpanLoading = ref(false);

watch(open, (v) => {
  if (v) resetForm();
});

function resetForm() {
  nama.value = '';
  hargaJual.value = '';
  hppEstimasi.value = '';
  simpanError.value = '';
}

function batal() {
  open.value = false;
}

async function simpan() {
  simpanError.value = '';

  if (!nama.value.trim()) {
    simpanError.value = 'Nama lauk wajib diisi';
    return;
  }

  const isDuplicate = (laukList.value ?? []).some(
    (l) => l.nama_lauk.trim().toLowerCase() === nama.value.trim().toLowerCase(),
  );
  if (isDuplicate) {
    simpanError.value = 'Nama lauk sudah ada';
    return;
  }

  simpanLoading.value = true;
  try {
    await tambah.mutateAsync({
      nama_lauk: nama.value.trim(),
      harga_jual_porsi: parseCurrency(hargaJual.value),
      hpp_estimasi_porsi: parseCurrency(hppEstimasi.value),
    });

    batal();
  } catch (e) {
    simpanError.value = pesanError(e);
  } finally {
    simpanLoading.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
        @click.self="batal"
      >
        <div class="w-full max-w-md rounded-t-2xl bg-white p-5 pb-8">
          <h2 class="text-lg font-bold">Lauk Baru</h2>

          <div class="mt-4 flex flex-col gap-3">
            <label class="flex flex-col gap-1">
              <span class="text-sm font-medium">Nama lauk</span>
              <input
                v-model="nama"
                type="text"
                class="rounded-lg border border-zinc-300 px-4 py-3 text-base"
                placeholder="cth: Ayam Goreng"
              />
            </label>

            <label class="flex flex-col gap-1">
              <span class="text-sm font-medium">Harga jual per porsi (Rp)</span>
              <input
                v-model="hargaJual"
                v-currency
                type="text"
                inputmode="numeric"
                class="rounded-lg border border-zinc-300 px-4 py-3 text-base"
                placeholder="10000"
              />
            </label>

            <label class="flex flex-col gap-1">
              <span class="text-sm font-medium">HPP estimasi per porsi (Rp)</span>
              <input
                v-model="hppEstimasi"
                v-currency
                type="text"
                inputmode="numeric"
                class="rounded-lg border border-zinc-300 px-4 py-3 text-base"
                placeholder="6500"
              />
            </label>

            <p v-if="simpanError" class="text-sm text-red-600">{{ simpanError }}</p>

            <div class="mt-2 flex gap-2">
              <button
                class="flex-1 rounded-lg border border-zinc-300 px-4 py-3 text-base"
                @click="batal"
              >
                Batal
              </button>
              <button
                :disabled="simpanLoading"
                class="flex-1 rounded-lg bg-green-600 px-4 py-3 text-base font-semibold text-white active:bg-green-700"
                @click="simpan"
              >
                {{ simpanLoading ? 'Menyimpan…' : 'Simpan' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
