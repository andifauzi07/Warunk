<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMasterLauk } from '@/composables/useMasterLauk';
import { formatRupiah, pesanError } from '@/lib/format';
import type { MasterLauk } from '@/types/database';

const { data: laukList, isLoading, error, tambah, ubah } = useMasterLauk();

const showForm = ref(false);
const editing = ref<MasterLauk | null>(null);
const nama = ref('');
const hargaJual = ref('');
const hppEstimasi = ref('');
const simpanError = ref('');
const simpanLoading = ref(false);

function mulaiTambah() {
  editing.value = null;
  nama.value = '';
  hargaJual.value = '';
  hppEstimasi.value = '';
  simpanError.value = '';
  showForm.value = true;
}

function mulaiEdit(lauk: MasterLauk) {
  editing.value = lauk;
  nama.value = lauk.nama_lauk;
  hargaJual.value = String(lauk.harga_jual_porsi);
  hppEstimasi.value = String(lauk.hpp_estimasi_porsi);
  simpanError.value = '';
  showForm.value = true;
}

function batal() {
  showForm.value = false;
  editing.value = null;
}

async function simpan() {
  simpanError.value = '';
  if (!nama.value.trim()) {
    simpanError.value = 'Nama lauk wajib diisi';
    return;
  }
  simpanLoading.value = true;
  const harga = Number(hargaJual.value) || 0;
  const hpp = Number(hppEstimasi.value) || 0;
  try {
    if (editing.value) {
      await ubah.mutateAsync({
        id: editing.value.id,
        input: {
          nama_lauk: nama.value.trim(),
          harga_jual_porsi: harga,
          hpp_estimasi_porsi: hpp,
        },
      });
    } else {
      await tambah.mutateAsync({
        nama_lauk: nama.value.trim(),
        harga_jual_porsi: harga,
        hpp_estimasi_porsi: hpp,
      });
    }
    batal();
  } catch (e) {
    simpanError.value = pesanError(e);
  } finally {
    simpanLoading.value = false;
  }
}

async function toggleAktif(lauk: MasterLauk) {
  await ubah.mutateAsync({ id: lauk.id, input: { is_active: !lauk.is_active } });
}

const jumlahAktif = computed(() => laukList.value?.filter((l) => l.is_active).length ?? 0);
</script>

<template>
  <div class="p-4 pb-20">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold">Master Lauk</h1>
        <p class="text-sm text-zinc-500">{{ jumlahAktif }} lauk aktif</p>
      </div>
      <button
        class="rounded-lg bg-green-600 px-4 py-3 text-base font-semibold text-white active:bg-green-700"
        @click="mulaiTambah"
      >
        + Lauk
      </button>
    </div>

    <p v-if="error" class="mt-4 text-sm text-red-600">{{ pesanError(error) }}</p>

    <div v-if="isLoading" class="mt-6 text-center text-zinc-500">Memuat…</div>

    <ul v-else-if="laukList" class="mt-4 flex flex-col gap-2">
      <li
        v-for="lauk in laukList"
        :key="lauk.id"
        class="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3"
        :class="{ 'opacity-50': !lauk.is_active }"
      >
        <div class="min-w-0">
          <p class="truncate font-medium">{{ lauk.nama_lauk }}</p>
          <p class="text-sm text-zinc-500">
            Jual {{ formatRupiah(lauk.harga_jual_porsi) }} · HPP est.
            {{ formatRupiah(lauk.hpp_estimasi_porsi) }}
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <button
            class="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            :title="lauk.is_active ? 'Nonaktifkan' : 'Aktifkan'"
            @click="toggleAktif(lauk)"
          >
            {{ lauk.is_active ? 'Aktif' : 'Nonaktif' }}
          </button>
          <button
            class="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white active:bg-zinc-900"
            @click="mulaiEdit(lauk)"
          >
            Edit
          </button>
        </div>
      </li>
      <li v-if="laukList.length === 0" class="mt-6 text-center text-zinc-500">
        Belum ada lauk. Tambahkan lauk pertamamu.
      </li>
    </ul>

    <!-- Form tambah/edit -->
    <div
      v-if="showForm"
      class="fixed inset-0 z-20 flex items-end justify-center bg-black/40"
      @click.self="batal"
    >
      <div class="w-full max-w-md rounded-t-2xl bg-white p-5 pb-8">
        <h2 class="text-lg font-bold">{{ editing ? 'Edit Lauk' : 'Lauk Baru' }}</h2>

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
              type="number"
              inputmode="numeric"
              min="0"
              class="rounded-lg border border-zinc-300 px-4 py-3 text-base"
              placeholder="10000"
            />
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium">HPP estimasi per porsi (Rp)</span>
            <input
              v-model="hppEstimasi"
              type="number"
              inputmode="numeric"
              min="0"
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
  </div>
</template>
