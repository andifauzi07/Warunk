-- =========================================================
-- 5. AGREGAT HARIAN: trigger + VIEW untuk dashboard
-- Agregat dihitung dari detail; TIDAK dihitung ulang setelah hari
-- terkunci (status malam_selesai) -> prinsip snapshot terkunci.
-- =========================================================

create or replace function public.hitung_agregat_rekonsiliasi()
returns trigger
language plpgsql
security invoker
as $$
declare
  r_id uuid;
  r record;
begin
  r_id := coalesce(new.rekonsiliasi_id, old.rekonsiliasi_id);

  for r in
    select
      coalesce(sum(d.porsi_dikonsumsi * l.harga_jual_porsi), 0) as pendapatan,
      coalesce(sum(d.porsi_dikonsumsi * d.hpp_gabungan_porsi), 0) as hpp,
      coalesce(sum(
        (d.porsi_basi_pagi * d.hpp_carry_over_porsi)
        + (d.porsi_rusak_malam * d.hpp_gabungan_porsi)
      ), 0) as kerugian
    from public.detail_stok_harian d
    join public.master_lauk l on l.id = d.lauk_id
    where d.rekonsiliasi_id = r_id
  loop
    update public.rekonsiliasi_harian
      set total_pendapatan_estimasi = r.pendapatan,
          total_hpp_nyata = r.hpp,
          total_kerugian = r.kerugian
      where id = r_id
        and status <> 'malam_selesai';
  end loop;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger trg_hitung_agregat
after insert or update or delete on public.detail_stok_harian
for each row execute function public.hitung_agregat_rekonsiliasi();

-- VIEW ringkasan harian untuk dashboard (menghormati RLS pengguna)
create or replace view public.ringkasan_harian
with (security_invoker = on) as
select
  r.id,
  r.tanggal,
  r.status,
  r.total_uang_laci,
  r.total_uang_digital,
  r.modal_kembalian_pakai,
  r.total_pendapatan_estimasi,
  r.total_hpp_nyata,
  r.total_kerugian,
  r.keuntungan_bersih,
  r.selisih_kas,
  coalesce(sum(d.porsi_dikonsumsi), 0) as total_porsi_dikonsumsi,
  count(d.id) as jumlah_lauk
from public.rekonsiliasi_harian r
left join public.detail_stok_harian d on d.rekonsiliasi_id = r.id
group by r.id;
