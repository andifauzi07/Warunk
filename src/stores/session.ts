import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export const useSessionStore = defineStore('session', () => {
  const user = ref<User | null>(null);
  const loading = ref(true);

  async function init() {
    const { data } = await supabase.auth.getSession();
    user.value = data.session?.user ?? null;
    loading.value = false;
    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null;
    });
  }

  async function waitForSession() {
    if (!loading.value) return;
    await new Promise<void>((resolve) => {
      const stop = watch(loading, (val) => {
        if (!val) {
          stop();
          resolve();
        }
      });
    });
  }

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    user.value = data.session?.user ?? null;
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  return { user, loading, init, waitForSession, login, logout };
});
