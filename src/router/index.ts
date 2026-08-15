import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from '@/stores/session'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/pagi',
      name: 'pagi',
      component: () => import('@/views/InputPagiView.vue'),
    },
    {
      path: '/malam',
      name: 'malam',
      component: () => import('@/views/InputMalamView.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
    },
    {
      path: '/lauk',
      name: 'lauk',
      component: () => import('@/views/MasterLaukView.vue'),
    },
    {
      path: '/pengaturan',
      name: 'pengaturan',
      component: () => import('@/views/PengaturanView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const session = useSessionStore()
  await session.waitForSession()
  if (to.meta.public && session.user) return { name: 'home' }
  if (to.meta.public) return true
  if (!session.user) return { name: 'login' }
  return true
})

export default router
