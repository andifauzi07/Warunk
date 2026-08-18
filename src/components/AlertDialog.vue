<script setup lang="ts">
defineProps<{
  open: boolean;
  pesan: string;
}>();

defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        role="dialog"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
        @click.self="$emit('cancel')"
      >
        <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
          <p class="text-base text-zinc-800">{{ pesan }}</p>
          <div class="mt-5 flex gap-3">
            <button
              class="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-base font-medium text-zinc-700 active:bg-zinc-100"
              @click="$emit('cancel')"
            >
              Batal
            </button>
            <button
              class="flex-1 rounded-xl bg-green-600 px-4 py-3 text-base font-semibold text-white active:bg-green-700"
              @click="$emit('confirm')"
            >
              Ya
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
