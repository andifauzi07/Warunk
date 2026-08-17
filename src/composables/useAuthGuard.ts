import { watch } from 'vue';
import { useRouter } from 'vue-router';
import { arahkanKe } from '@/lib/sessionNavigation';
import { useSessionStore } from '@/stores/session';

export function useAuthGuard() {
  const router = useRouter();
  const session = useSessionStore();

  watch(
    () => session.user,
    () => {
      if (session.loading) return;
      const sekarang = router.currentRoute.value;
      const tujuan = arahkanKe({ user: session.user, route: sekarang });
      if (tujuan && tujuan.name !== sekarang.name) {
        router.replace(tujuan);
      }
    },
  );
}
