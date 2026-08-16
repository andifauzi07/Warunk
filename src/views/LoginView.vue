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
      <img src="/main-logo.png" alt="WarunK" class="mx-auto h-48 w-48" /> 
      <!-- <p class="text-center text-sm text-zinc-500">Hitung Mundur Stok Penjualan, <br/> untung langsung keliatan</p> -->

      <form class="flex flex-col gap-4" @submit.prevent="submit">
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

        <p v-if="error" class="text-sm text-center text-red-600">{{ error }}</p>

        <button
          type="submit"
          :disabled="submitting"
          class="rounded-lg bg-green-600 px-4 py-3 text-base font-semibold text-white active:bg-green-700"
        >
          {{ submitting ? 'Masuk…' : 'Masuk' }}
        </button>
        <h1 class="text-xs text-center font-light text-green-700">Created by <a href="https://www.instagram.com/andfauzii/" target="blank">@andifauzi</a> 2026</h1>
      </form>
    </div>
  </div>
</template>
