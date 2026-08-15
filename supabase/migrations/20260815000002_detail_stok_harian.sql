-- =========================================================
-- 3. DETAIL STOK HARIAN (1 baris = 1 lauk pada 1 hari)
-- =========================================================
create table public.detail_stok_harian (
    id                      uuid primary key default gen_random_uuid(),
    user_id                 uuid not null references auth.users(id) on delete cascade,
    rekonsiliasi_id         uuid not null references public.rekonsiliasi_harian(id) on delete cascade,
    lauk_id                 uuid not null references public.master_lauk(id) on delete restrict,
    carry_over_dari_id      uuid references public.detail_stok_harian(id),

    -- INPUT PAGI
    porsi_carry_over        integer not null default 0,
    hpp_carry_over_porsi    numeric(12,2) not null default 0,
    porsi_basi_pagi         integer not null default 0,
    porsi_baru_dimasak      integer not null default 0,
    modal_baru_total        numeric(12,2) not null default 0,
    hpp_baru_porsi          numeric(12,2) not null default 0,

    -- INPUT MALAM
    porsi_sisa_layak_jual   integer not null default 0,
    porsi_rusak_malam       integer not null default 0,
    porsi_konsumsi          integer not null default 0,

    -- GENERATED COLUMNS
    stok_aktif_awal integer generated always as (
        (porsi_carry_over - porsi_basi_pagi) + porsi_baru_dimasak
    ) stored,

    hpp_gabungan_porsi numeric(12,2) generated always as (
        case
            when (porsi_carry_over - porsi_basi_pagi) + porsi_baru_dimasak = 0 then 0
            else (
                ((porsi_carry_over - porsi_basi_pagi) * hpp_carry_over_porsi)
                + (porsi_baru_dimasak * hpp_baru_porsi)
            ) / ((porsi_carry_over - porsi_basi_pagi) + porsi_baru_dimasak)
        end
    ) stored,

    porsi_dikonsumsi integer generated always as (
        ((porsi_carry_over - porsi_basi_pagi) + porsi_baru_dimasak)
        - porsi_sisa_layak_jual - porsi_rusak_malam - porsi_konsumsi
    ) stored,

    created_at              timestamptz not null default now(),

    constraint chk_stok_non_negative check (
        porsi_sisa_layak_jual + porsi_rusak_malam + porsi_konsumsi
        <= (porsi_carry_over - porsi_basi_pagi) + porsi_baru_dimasak
    ),
    constraint chk_basi_pagi check (porsi_basi_pagi <= porsi_carry_over),
    constraint chk_porsi_non_negative check (
        porsi_carry_over >= 0 and porsi_basi_pagi >= 0
        and porsi_baru_dimasak >= 0 and porsi_sisa_layak_jual >= 0
        and porsi_rusak_malam >= 0 and porsi_konsumsi >= 0
    )
);

create index idx_detail_rekonsiliasi on public.detail_stok_harian(rekonsiliasi_id);
create index idx_detail_lauk on public.detail_stok_harian(lauk_id);
create index idx_detail_user on public.detail_stok_harian(user_id);
