<script setup lang="ts">
import { useSessionStore } from '@/stores/session'
import { ref } from 'vue'

const session = useSessionStore()
const email = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

async function submit() {
  error.value = ''
  submitting.value = true
  try {
    await session.login(email.value, password.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Login gagal'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center px-6">
    <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
      <h1 class="text-2xl font-bold text-green-700">WarungKas</h1>
      <p class="mt-1 text-sm text-zinc-500">Rekonsiliasi Mundur — profit harian warungmu</p>

      <form class="mt-6 flex flex-col gap-4" @submit.prevent="submit">
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">Email</span>
          <input
            v-model="email"
            type="email"
            inputmode="email"
            autocomplete="email"
            required
            class="rounded-lg border border-zinc-300 px-4 py-3 text-base"
          />
        </label>

        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">Password</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            class="rounded-lg border border-zinc-300 px-4 py-3 text-base"
          />
        </label>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <button
          type="submit"
          :disabled="submitting"
          class="rounded-lg bg-green-600 px-4 py-3 text-base font-semibold text-white active:bg-green-700"
        >
          {{ submitting ? 'Masuk…' : 'Masuk' }}
        </button>
      </form>
    </div>
  </div>
</template>
