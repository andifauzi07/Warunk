<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useMasterLauk } from '@/composables/useMasterLauk';
import { useHariStore } from '@/stores/hari';
import { formatRupiah, parseCurrency, pesanError } from '@/lib/format';
import { getCarryOverForLauk, zeroCarryOverForLauk } from '@/lib/services/rekonsiliasi';
import AlertDialog from '@/components/AlertDialog.vue';
import type { MasterLauk } from '@/types/database';
import { useStatusHari } from '@/composables/useStatusHari';

const { data: laukList, isLoading, error, tambah, ubah } = useMasterLauk();
const { tanggal } = storeToRefs(useHariStore());
const { rekonsiliasi, isFetching: hariFetching, error: hariError } = useStatusHari(tanggal);
const hariTerkunci = computed(() => rekonsiliasi.value?.status === 'malam_selesai');
const hariSiap = computed(() => !!rekonsiliasi.value && !hariFetching.value);
const halamanMemuat = computed(() => isLoading.value || hariFetching.value);
const showForm = ref(false);
const editing = ref<MasterLauk | null>(null);
const nama = ref('');
const hargaJual = ref('');
const hppEstimasi = ref('');
const simpanError = ref('');
const simpanLoading = ref(false);

function alasanBlokir(): string | null {
  if (!hariSiap.value) return hariError.value || 'Memuat status hari…';
  if (hariTerkunci.value) return 'Hari ini sudah terkunci, tidak bisa memodifikasi lauk';
  return null;
}

function mulaiTambah() {
  const alasan = alasanBlokir();
  if (alasan) {
    toggleError.value = alasan;
    return;
  }
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
  const alasan = alasanBlokir();
  if (alasan) {
    simpanError.value = alasan;
    return;
  }
  simpanError.value = '';
  if (!nama.value.trim()) {
    simpanError.value = 'Nama lauk wajib diisi';
    return;
  }
  simpanLoading.value = true;
  const harga = parseCurrency(hargaJual.value);
  const hpp = parseCurrency(hppEstimasi.value);
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

const toggleError = ref('');
const alertDialog = ref({ open: false, pesan: '' });
let pendingToggle: { lauk: MasterLauk; carryOver: number } | null = null;

async function toggleAktif(lauk: MasterLauk) {
  toggleError.value = '';

  const alasan = alasanBlokir();
  if (alasan) {
    toggleError.value = alasan;
    return;
  }
  if (!lauk.is_active) {
    await ubah.mutateAsync({ id: lauk.id, input: { is_active: true } });
    return;
  }
  const carryOver = await getCarryOverForLauk(lauk.id, tanggal.value);
  const pesan =
    carryOver > 0
      ? 'Menonaktifkan lauk ini, akan membuat sisa porsi kemarin dianggap basi/rusak !'
      : 'Yakin menonaktifkan lauk ini ?';

  pendingToggle = { lauk, carryOver };
  alertDialog.value = { open: true, pesan };
}

async function konfirmasiToggle() {
  const pending = pendingToggle;
  pendingToggle = null;
  alertDialog.value = { open: false, pesan: '' };
  if (!pending) return;

  if (pending.carryOver > 0) {
    await zeroCarryOverForLauk(pending.lauk.id, tanggal.value);
  }
  await ubah.mutateAsync({ id: pending.lauk.id, input: { is_active: false } });
}

function batalToggle() {
  pendingToggle = null;
  alertDialog.value = { open: false, pesan: '' };
}

const jumlahAktif = computed(() => laukList.value?.filter((l) => l.is_active).length ?? 0);
</script>

<template>
  <div
    v-if="halamanMemuat"
    class="mt-6 flex h-screen items-center justify-center text-center text-zinc-500"
  >
    Memuat…
  </div>

  <div class="p-4 pb-20">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold">Master Lauk</h1>
        <p class="text-sm text-zinc-500">{{ jumlahAktif }} lauk aktif</p>
      </div>
      <button
        v-if="!hariTerkunci"
        class="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white active:bg-green-700"
        @click="mulaiTambah"
      >
        + Lauk
      </button>
    </div>

    <p v-if="error" class="mt-4 text-sm text-red-600">{{ pesanError(error) }}</p>
    <p v-if="hariError" class="mt-4 text-sm text-red-600">{{ hariError }}</p>
    <p v-if="toggleError" class="mt-4 text-sm text-red-600">{{ toggleError }}</p>

    <ul v-if="laukList" class="mt-4 flex flex-col gap-2">
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
            :disabled="!hariSiap"
            class="rounded-lg border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50"
            :title="lauk.is_active ? 'Nonaktifkan' : 'Aktifkan'"
            @click="toggleAktif(lauk)"
          >
            {{ lauk.is_active ? 'Aktif' : 'Nonaktif' }}
          </button>
          <button
            v-if="!hariTerkunci"
            class="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white active:bg-zinc-900 disabled:opacity-50"
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

    <AlertDialog
      :open="alertDialog.open"
      :pesan="alertDialog.pesan"
      @confirm="konfirmasiToggle"
      @cancel="batalToggle"
    />
  </div>
</template>
