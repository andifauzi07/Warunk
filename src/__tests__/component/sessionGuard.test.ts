import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory, type Router } from 'vue-router';
import { defineComponent } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useSessionStore } from '@/stores/session';
import { useAuthGuard } from '@/composables/useAuthGuard';
import { arahkanKe } from '@/lib/sessionNavigation';

vi.mock('@/lib/supabase', () => {
  const auth = {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    signInWithPassword: vi.fn(),
  };
  return { supabase: { auth }, currentUserId: vi.fn().mockResolvedValue(null) };
});

import { supabase } from '@/lib/supabase';

const Dummy = defineComponent({ template: '<div>stub</div>' });

function buildRouter(): Router {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: Dummy, meta: { public: true } },
      { path: '/', name: 'home', component: Dummy },
      { path: '/pagi', name: 'pagi', component: Dummy },
      { path: '/malam', name: 'malam', component: Dummy },
      { path: '/dashboard', name: 'dashboard', component: Dummy },
      { path: '/lauk', name: 'lauk', component: Dummy },
      { path: '/pengaturan', name: 'pengaturan', component: Dummy },
    ],
  });
  router.beforeEach(async (to) => {
    const session = useSessionStore();
    await session.waitForSession();
    return arahkanKe({ user: session.user, route: to }) ?? true;
  });
  return router;
}

const fakeUser = { id: 'user-1', email: 'a@b.c', app_metadata: {}, user_metadata: {} } as never;

async function bootstrap(session: { user: unknown } | null) {
  setActivePinia(createPinia());
  const store = useSessionStore();
  vi.mocked(supabase.auth.getSession).mockResolvedValue(
    session ? ({ data: { session } } as never) : ({ data: { session: null } } as never),
  );
  await store.init();
  return store;
}

describe('guard rute session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tanpa sesi: setiap rute terproteksi dialihkan ke /login', async () => {
    await bootstrap(null);
    const router = buildRouter();

    for (const name of ['home', 'pagi', 'malam', 'dashboard', 'lauk', 'pengaturan']) {
      await router.push({ name });
      await router.isReady();
      expect(router.currentRoute.value.name, `rute ${name}`).toBe('login');
    }
  });

  it('tanpa sesi: rute publik /login tetap terbuka', async () => {
    await bootstrap(null);
    const router = buildRouter();
    await router.push({ name: 'login' });
    await router.isReady();
    expect(router.currentRoute.value.name).toBe('login');
  });

  it('dengan sesi: rute terproteksi diizinkan, /login dialihkan ke home', async () => {
    await bootstrap({ user: fakeUser });
    const router = buildRouter();

    await router.push({ name: 'dashboard' });
    await router.isReady();
    expect(router.currentRoute.value.name).toBe('dashboard');

    await router.push({ name: 'login' });
    await router.isReady();
    expect(router.currentRoute.value.name).toBe('home');
  });

  it('watcher useAuthGuard: login mengalihkan /login → home, logout mengalihkan rute proteksi → /login', async () => {
    const store = await bootstrap(null);
    const router = buildRouter();
    await router.push({ name: 'login' });
    await router.isReady();
    expect(router.currentRoute.value.name).toBe('login');

    const GuardProbe = defineComponent({
      setup() {
        useAuthGuard();
        return () => null;
      },
    });
    mount(GuardProbe, { global: { plugins: [router] } });

    // login: user berubah → watcher memutuskan ke home
    store.user = fakeUser;
    await expect.poll(() => router.currentRoute.value.name).toBe('home');

    // logout: user hilang → watcher memutuskan ke /login
    store.user = null;
    await expect.poll(() => router.currentRoute.value.name).toBe('login');
  });
});
