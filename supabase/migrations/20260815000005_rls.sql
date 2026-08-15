-- =========================================================
-- 6. ROW LEVEL SECURITY (single-owner: hanya data milik sendiri)
-- =========================================================

alter table public.master_lauk enable row level security;
create policy "master_lauk_owner_all" on public.master_lauk
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table public.rekonsiliasi_harian enable row level security;
create policy "rekonsiliasi_owner_all" on public.rekonsiliasi_harian
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table public.detail_stok_harian enable row level security;
create policy "detail_stok_owner_all" on public.detail_stok_harian
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table public.pengaturan_warung enable row level security;
create policy "pengaturan_owner_all" on public.pengaturan_warung
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
