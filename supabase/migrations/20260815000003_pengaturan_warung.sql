-- =========================================================
-- 4. PENGATURAN WARUNG (single-row per pengguna)
-- =========================================================
create table public.pengaturan_warung (
    id                       uuid primary key default gen_random_uuid(),
    user_id                  uuid not null unique references auth.users(id) on delete cascade,
    modal_kembalian_default  numeric(12,2) not null default 0,
    toleransi_selisih_persen numeric(5,2) not null default 5,
    terima_pembayaran_digital boolean not null default false,
    created_at               timestamptz not null default now()
);
