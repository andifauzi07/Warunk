-- =========================================================
-- 1. MASTER LAUK
-- =========================================================
create table public.master_lauk (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid not null references auth.users(id) on delete cascade,
    nama_lauk           text not null,
    harga_jual_porsi    numeric(12,2) not null default 0,
    hpp_estimasi_porsi  numeric(12,2) not null default 0,
    is_active           boolean not null default true,
    created_at          timestamptz not null default now()
);

create index idx_master_lauk_user on public.master_lauk(user_id);
