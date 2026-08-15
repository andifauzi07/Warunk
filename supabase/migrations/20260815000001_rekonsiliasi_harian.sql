-- =========================================================
-- 2. REKONSILIASI HARIAN (1 baris = 1 hari operasional)
-- Status: pagi_pending -> pagi_selesai -> malam_selesai (terkunci), libur
-- =========================================================
create table public.rekonsiliasi_harian (
    id                      uuid primary key default gen_random_uuid(),
    user_id                 uuid not null references auth.users(id) on delete cascade,
    tanggal                 date not null,
    status                  text not null default 'pagi_pending'
                            check (status in ('pagi_pending','pagi_selesai','malam_selesai','libur')),
    total_uang_laci         numeric(12,2),
    total_uang_digital      numeric(12,2) not null default 0,
    modal_kembalian_pakai   numeric(12,2) not null default 0,

    -- Agregat, diisi oleh trigger (lihat migrasi agregat)
    total_pendapatan_estimasi numeric(12,2) not null default 0,
    total_hpp_nyata            numeric(12,2) not null default 0,
    total_kerugian             numeric(12,2) not null default 0,

    -- Generated columns
    keuntungan_bersih       numeric(12,2) generated always as (
        total_pendapatan_estimasi - total_hpp_nyata - total_kerugian
    ) stored,
    selisih_kas             numeric(12,2) generated always as (
        (total_uang_laci - modal_kembalian_pakai) + total_uang_digital
        - total_pendapatan_estimasi
    ) stored,

    created_at              timestamptz not null default now(),
    unique (user_id, tanggal)
);

create index idx_rekonsiliasi_user_tanggal on public.rekonsiliasi_harian(user_id, tanggal);
