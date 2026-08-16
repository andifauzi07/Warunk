<script setup lang="ts">
import { useSessionStore } from '@/stores/session'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { useRoute } from 'vue-router'

const session = useSessionStore()
const route = useRoute()

useAuthGuard()

const navItems = [
  { to: '/', label: 'Beranda', icon: '🏠' },
  { to: '/pagi', label: 'Pagi', icon: '🌅' },
  { to: '/malam', label: 'Malam', icon: '🌙' },
  { to: '/dashboard', label: 'Analisis', icon: '📊' },
]
</script>

<template>
  <div class="mx-auto min-h-dvh max-w-md">
    <router-view />

    <nav
      v-if="session.user && route.name !== 'login'"
      class="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white"
    >
      <div class="mx-auto flex max-w-md items-stretch">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs"
          active-class="text-green-700"
        >
          <span class="text-xl leading-none">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>
  </div>
</template>
