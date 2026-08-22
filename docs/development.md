# Development Guide — Warunk

Panduan untuk developer yang baru masuk (termasuk pemilik di masa depan). Setelah membaca ini, Anda bisa setup project, paham di mana meletakkan kode, dan menambah fitur baru mengikuti konvensi yang sudah jalan.

## 1. Getting Started

Prasyarat: **Node ≥ 24.14.1** dan **Bun**.

```bash
# 1. Install dependensi
bun install

# 2. Siapkan environment
cp .env.example .env
#   VITE_SUPABASE_URL=              → URL project Supabase
#   VITE_SUPABASE_PUBLISHABLE_KEY=  → anon/publishable key

# 3. Jalankan dev server (hot reload)
bun dev

# 4. Type-check & lint
bun run type-check
bun run lint

# 5. Test
bun run test
```

> ⚠️ **`bun test` (runner native Bun) TIDAK didukung.** Runner tersebut mengabaikan konfigurasi Vitest sehingga gagal me-resolve alias `@/`. Selalu gunakan `bun run test` (atau `bun run test:unit` / `bun run test:component`). Untuk E2E: `bun run test:e2e` (wajib Supabase local + browser Playwright).

## 2. Bootstrap Order

`src/main.ts` menjalankan bootstrap dalam urutan ketat (top-level `await` pada `session.init()`):

```
registerSW({ immediate: true })     ← PWA service worker (auto-update)
  → createApp(App)
  → app.directive('currency', vCurrency)   ← direktif format Rupiah
  → app.use(createPinia())                  ← Pinia (client state)
  → app.use(VueQueryPlugin)                 ← TanStack Query (server state)
  → await session.init()                    ← ambil sesi Supabase (wajib sebelum router)
  → app.use(router)
  → app.mount('#app')
```

Poin krusial: `session.init()` **di-await** sebelum `router` dipasang, sehingga guard `router.beforeEach` tidak pernah berjalan dengan sesi yang belum diketahui (ini memperbaiki race condition — lihat §6 Pitfall).

## 3. Konvensi State: Pinia vs TanStack

Aturan keras yang membedakan dua layer state:

| Layer | Library | Isi | Tempat |
| --- | --- | --- | --- |
| **Client state** | Pinia | sesi auth, tanggal aktif | `src/stores/session.ts`, `src/stores/hari.ts` |
| **Server state** | TanStack Query | master lauk, pengaturan, rekonsiliasi hari ini, analitik | `useQuery` di composables |

Konfigurasi query global ada di `src/lib/queryConfig.ts`:

```ts
export const QUERY_DEFAULTS = {
  staleTime: 5 * 60 * 1000,        // 5 menit
  refetchOnWindowFocus: false,
} as const;
```

Aturan: **status autentikasi SELALU diambil dari `useSessionStore()`, bukan dari cache query.** Cache query boleh dibuang; sesi tidak.

## 4. Pola Composable

Setiap fitur data mengikuti pola di `src/composables/useHariIni.ts`:

1. **Factory query key** — fungsi pembentuk key supaya konsisten antar composable & invalidasi:
   ```ts
   export const hariIniKey = (tanggal: string) => ['hari-ini', tanggal] as const;
   ```
2. **`useQuery`** — ambil data server, `enabled` saat prasyarat tersedia, spread `QUERY_DEFAULTS`.
3. **`useMutation`** — tulis data; di `onSuccess` panggil invalidasi agar view lain ikut update.

```ts
const simpanMalam = useMutation({
  mutationFn: (input) => svc.simpanMalam(...),
  onSuccess: () => {
    invalidateHari();
    qc.invalidateQueries({ queryKey: ['ringkasan-harian'] });
    qc.invalidateQueries({ queryKey: ['tren'] });
    qc.invalidateQueries({ queryKey: ['ranking-lauk'] });
  },
});
```

Daftar query key yang dipakai (scope `src/lib/services/*` + composables):
- `['hari-ini', tanggal]`
- `['hari-status', tanggal]`
- `['master-lauk']`
- `['pengaturan']`
- `['ringkasan-harian', tanggal]`
- `['tren', rentang, tanggal]`
- `['ranking-lauk', ...]`

## 5. Walkthrough: Cara Tambah Fitur

Resep end-to-end yang sudah dipakai di repo ini:

1. **Tulis spec** di `openspec/specs/<fitur>/spec.md` — format `Purpose → Requirements → Scenario (WHEN/THEN)`.
2. **Service** di `src/lib/services/<fitur>.ts` — fungsi akses Supabase (select/insert/update), kembalikan tipe dari `src/types/database.ts`.
3. **Composable** di `src/composables/use<Fitur>.ts` — bungkus service dengan `useQuery`/`useMutation` + invalidasi (lihat pola §4). Ekspos `queryKey` factory.
4. **View** di `src/views/<Fitur>View.vue` — konsumsi composable, render dengan Tailwind (`rounded-2xl bg-white p-5 shadow-sm` untuk kartu dashboard).
5. **Test** di `src/__tests__/` (unit) atau `src/__tests__/component/` (SFC via `@vue/test-utils` + happy-dom):
   - Unit: mock Supabase in-memory (niru `rekonsiliasi.test.ts`).
   - Component: mount + props/events (niru `RingkasanHarianCard.test.ts`).

Contoh nyata: `useHariIni.ts` (composable) → `services/rekonsiliasi.ts` (service) → `InputPagiView.vue` / `InputMalamView.vue` (view) → `rekonsiliasi.test.ts` (test).

## 6. Pitfall (pelajari dari archive)

- **`bun test` tidak didukung** — selalu `bun run test` (alias `@/` gagal di runner native).
- **Race session** — dulunya guard berjalan sebelum sesi siap. Diperbaiki dengan `await session.init()` di `main.ts` + `waitForSession()` di guard. Lihat `openspec/changes/archive/2026-08-15-fix-session-race/design.md`.
- **403 simpan pagi** — RLS menolak karena `user_id` tidak diisi eksplisit saat insert `detail_stok_harian`. Lihat `openspec/changes/archive/2026-08-15-fix-simpan-pagi-error-403/design.md`.
