<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: number;
    min?: number;
    max?: number;
  }>(),
  { min: 0, max: undefined },
);

const emit = defineEmits<{ (e: 'update:modelValue', v: number): void }>();

const dapatDikurangi = computed(() => props.modelValue > (props.min ?? 0));
const dapatDitambah = computed(() =>
  props.max !== undefined ? props.modelValue < props.max : true,
);

function kurangi() {
  if (!dapatDikurangi.value) return;
  emit('update:modelValue', props.modelValue - 1);
}

function tambah() {
  if (!dapatDitambah.value) return;
  emit('update:modelValue', props.modelValue + 1);
}
</script>

<template>
  <div class="flex items-center justify-center gap-2">
    <button
      type="button"
      :disabled="!dapatDikurangi"
      class="h-12 w-12 rounded-xl border border-zinc-300 bg-white text-2xl leading-none text-zinc-700 active:bg-zinc-100"
      aria-label="Kurangi"
      @click="kurangi"
    >
      −
    </button>
    <span class="w-10 text-center text-xl font-semibold tabular-nums">{{ modelValue }}</span>
    <button
      type="button"
      :disabled="!dapatDitambah"
      class="h-12 w-12 rounded-xl bg-green-600 text-2xl leading-none text-white active:bg-green-700"
      aria-label="Tambah"
      @click="tambah"
    >
      +
    </button>
  </div>
</template>
