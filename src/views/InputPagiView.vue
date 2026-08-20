<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useDetailRows } from '@/composables/useDetailRows';
import { useHariStore } from '@/stores/hari';
import Stepper from '@/components/Stepper.vue';
import LaukFormSheet from '@/components/LaukFormSheet.vue';
import { hppBaruPorsi, stokAktifAwal } from '@/lib/engine';
import { formatAngka, formatRupiah, parseCurrency, pesanError } from '@/lib/format';
import type { RowDetail } from '@/composables/useDetailRows';

const { tanggal } = storeToRefs(useHariStore());
const { rows, hariError, hari, toItemKalkulasi, resetInitialized, refreshHariAfterTambah } =
  useDetailRows(tanggal);

function tandaiLayak(r: RowDetail) {
  r.basiPagi = 0;
}

function tandaiBasi(r: RowDetail) {
  r.basiPagi = r.porsiCarryOver;
}

const terkunci = computed(() => hari.rekonsiliasi.value?.status === 'malam_selesai');
const sudahSelesaiPagi = computed(() => hari.rekonsiliasi.value?.status === 'pagi_selesai');
const editMode = ref(false);
const tampilReview = computed(() => sudahSelesaiPagi.value && !editMode.value);
const simpanError = ref('');
const simpanLoading = ref(false);

async function simpan() {
  simpanError.value = '';
  simpanLoading.value = true;
  try {
    const items = rows.value.map((r) => {
      const item = toItemKalkulasi(r);
      return {
        id: r.id,
        lauk_id: r.laukId,
        porsi_carry_over: r.porsiCarryOver,
        hpp_carry_over_porsi: r.hppCarryOver,
        porsi_basi_pagi: r.basiPagi,
        porsi_baru_dimasak: r.porsiBaru,
        modal_baru_total: r.modalBaru,
        hpp_baru_porsi: hppBaruPorsi(item),
      };
    });
    await hari.simpanPagi.mutateAsync(items);
    resetInitialized();
    editMode.value = false;
  } catch (e) {
    simpanError.value = pesanError(e);
  } finally {
    simpanLoading.value = false;
  }
}

const semuaModalTerisi = computed(() => rows.value.every((r) => r.modalBaru > 0));

const showLaukForm = ref(false);

async function handleLaukSaved() {
  await refreshHariAfterTambah();
}
</script>

<template>
  <div class="p-4 pb-20">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold">Input Stok Pagi</h1>
        <p class="text-sm text-zinc-500">Baseline stok untuk hari ini</p>
      </div>

      <RouterLink
        v-if="terkunci"
        to="/lauk"
        class="rounded-lg bg-zinc-800 px-3 py-2 text-sm font-semibold text-white active:bg-zinc-900"
      >
        Daftar Lauk
      </RouterLink>
    </div>

    <p v-if="hariError" class="mt-4 text-sm text-red-600">{{ hariError }}</p>
    <p v-if="simpanError" class="mt-4 text-sm text-red-600">{{ simpanError }}</p>

    <div v-else-if="terkunci || tampilReview" class="mt-4 flex flex-col gap-3">
      <div
        v-if="terkunci"
        class="rounded-xl border border-zinc-300 bg-zinc-100 p-4 text-center text-zinc-600"
      >
        Hari ini sudah terkunci (input malam selesai). Tidak bisa mengubah input pagi.
      </div>
      <div v-else class="rounded-xl bg-green-50 p-4 text-green-800">
        <p class="font-semibold">✓ Input pagi tersimpan</p>
      </div>

      <div v-if="rows.length > 0" class="flex flex-col gap-3">
        <div
          v-for="row in rows"
          :key="row.id"
          class="rounded-xl border border-zinc-200 bg-white p-4"
        >
          <div class="flex items-center justify-between">
            <p class="font-semibold">{{ row.namaLauk }}</p>
            <p class="text-sm text-zinc-500">{{ formatRupiah(row.hargaJualPorsi) }}/porsi</p>
          </div>
          <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
            <span v-if="row.porsiCarryOver > 0"
              >Sisa kemarin: <strong>{{ row.porsiCarryOver }}</strong> porsi</span
            >
            <span v-if="row.basiPagi > 0" class="text-red-600"
              >Basi: <strong>{{ row.basiPagi }}</strong> porsi</span
            >
            <span
              >Masak baru: <strong>{{ row.porsiBaru }}</strong> porsi</span
            >
            <span
              >Modal: <strong>{{ formatRupiah(row.modalBaru) }}</strong></span
            >
          </div>
          <div class="mt-2 border-t border-dashed border-zinc-200 pt-2 text-sm text-zinc-600">
            Stok aktif hari ini: <strong>{{ stokAktifAwal(toItemKalkulasi(row)) }} porsi</strong>
          </div>
        </div>
      </div>

      <button
        v-if="!terkunci"
        class="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base font-medium text-zinc-700 active:bg-zinc-100"
        @click="editMode = true"
      >
        Ubah Input Pagi
      </button>
    </div>

    <!-- Mode input -->
    <div v-else class="mt-4 flex flex-col gap-3">
      <div v-for="row in rows" :key="row.id" class="rounded-xl border border-zinc-200 bg-white p-4">
        <div class="flex items-center justify-between">
          <p class="font-semibold">{{ row.namaLauk }}</p>
          <p class="text-sm text-zinc-500">{{ formatRupiah(row.hargaJualPorsi) }}/porsi</p>
        </div>

        <!-- Carry-over -->
        <div v-if="row.porsiCarryOver > 0" class="mt-3 rounded-lg bg-zinc-50 p-3">
          <p class="text-sm text-zinc-600">
            Sisa kemarin: <strong>{{ row.porsiCarryOver }} porsi</strong> (HPP
            {{ formatRupiah(row.hppCarryOver) }})
          </p>
          <div class="mt-2 flex gap-2">
            <button
              class="flex-1 rounded-lg px-3 py-3 text-sm font-semibold"
              :class="
                row.basiPagi === 0
                  ? 'bg-green-600 text-white'
                  : 'border border-zinc-300 text-zinc-700'
              "
              @click="tandaiLayak(row)"
            >
              ✓ Masih Layak Jual
            </button>
            <button
              class="flex-1 rounded-lg px-3 py-3 text-sm font-semibold"
              :class="
                row.basiPagi > 0 ? 'bg-red-600 text-white' : 'border border-zinc-300 text-zinc-700'
              "
              @click="tandaiBasi(row)"
            >
              ✗ Basi — Catat Rugi
            </button>
          </div>
        </div>

        <!-- Porsi masak baru -->
        <div class="mt-3 flex items-center justify-between">
          <div>
            <p class="text-sm font-medium">Masak baru (porsi)</p>
            <p v-if="row.porsiBaru > 0 && row.modalBaru === 0" class="text-xs text-amber-600">
              Modal belum diisi — HPP memakai estimasi
            </p>
          </div>
          <Stepper v-model="row.porsiBaru" />
        </div>

        <label class="mt-3 flex items-center justify-between gap-3">
          <span class="text-sm font-medium">Total modal keseluruhan (Rp)</span>
          <input
            v-currency
            :value="formatAngka(row.modalBaru)"
            type="text"
            inputmode="numeric"
            class="no-spinner w-36 rounded-lg border border-zinc-300 px-3 py-3 text-right text-base tabular-nums"
            placeholder="0"
            @input="row.modalBaru = parseCurrency(($event.target as HTMLInputElement).value)"
          />
        </label>

        <div class="mt-3 border-t border-dashed border-zinc-200 py-2 text-sm text-zinc-600">
          Stok aktif hari ini: <strong>{{ stokAktifAwal(toItemKalkulasi(row)) }} porsi</strong>
        </div>
        <div class="border-t border-dashed border-zinc-200 pt-2 text-sm text-zinc-600">
          Estimasi HPP/Porsi : <strong>{{ formatRupiah(row.hppEstimasi) }}</strong>
        </div>
      </div>

      <button
        v-if="!terkunci && hari.rekonsiliasi.value"
        class="rounded-lg border border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-500 active:bg-zinc-50"
        @click="showLaukForm = true"
      >
        + Tambah Lauk Baru
      </button>

      <button
        v-if="rows.length > 0 && !terkunci"
        :disabled="simpanLoading || !semuaModalTerisi"
        class="mt-2 rounded-xl bg-green-600 px-4 py-4 text-base font-bold text-white active:bg-green-700"
        @click="simpan"
      >
        {{ simpanLoading ? 'Menyimpan…' : 'Selesai Input Pagi' }}
      </button>
    </div>

    <LaukFormSheet v-model:open="showLaukForm" @saved="handleLaukSaved" />
  </div>
</template>
