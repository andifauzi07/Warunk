import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';
import { ANON_KEY, SUPABASE_URL } from './constants';
import { E2E_USER } from './global-setup';

function todayString() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function yesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Seed data untuk test:
 * - Yesterday: rekonsiliasi malam_selesai dengan sisa Ayam 5 porsi (carry-over)
 * - Today: rekonsiliasi pagi_pending dengan detail yang punya carry-over dari kemarin
 * - Master lauk: Ayam (aktif), Telur (aktif)
 */
async function seedTestData() {
  const user = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
  });
  const { error: signInError } = await user.auth.signInWithPassword({
    email: E2E_USER.email,
    password: E2E_USER.password,
  });
  if (signInError) throw signInError;

  // Bersihkan data test sebelumnya.
  // Hapus detail_stok_harian secara eksplisit terlebih dahulu untuk menghindari
  // foreign key constraint (lauk_id on delete restrict, dan self-ref carry_over_dari_id).
  const { error: detailErr } = await user
    .from('detail_stok_harian')
    .delete()
    .eq('user_id', E2E_USER.id);
  if (detailErr) throw detailErr;

  const { error: rekDeleteErr } = await user
    .from('rekonsiliasi_harian')
    .delete()
    .eq('user_id', E2E_USER.id);
  if (rekDeleteErr) throw rekDeleteErr;

  const { error: laukDeleteErr } = await user
    .from('master_lauk')
    .delete()
    .eq('user_id', E2E_USER.id);
  if (laukDeleteErr) throw laukDeleteErr;

  // Seed master lauk
  const { data: laukData, error: laukErr } = await user
    .from('master_lauk')
    .insert([
      {
        user_id: E2E_USER.id,
        nama_lauk: 'Ayam',
        harga_jual_porsi: 10000,
        hpp_estimasi_porsi: 6000,
        is_active: true,
      },
      {
        user_id: E2E_USER.id,
        nama_lauk: 'Telur',
        harga_jual_porsi: 5000,
        hpp_estimasi_porsi: 3000,
        is_active: true,
      },
    ])
    .select();
  if (laukErr) throw laukErr;

  const laukAyam = laukData!.find((l) => l.nama_lauk === 'Ayam')!;
  const laukTelur = laukData!.find((l) => l.nama_lauk === 'Telur')!;

  // Seed kemarin: malam_selesai dengan sisa Ayam 5 porsi
  const { data: rekKemarin, error: rekErr } = await user
    .from('rekonsiliasi_harian')
    .insert({
      user_id: E2E_USER.id,
      tanggal: yesterdayString(),
      status: 'malam_selesai',
    })
    .select()
    .single();
  if (rekErr) throw rekErr;

  const { error: detailKemarinErr } = await user.from('detail_stok_harian').insert([
    {
      user_id: E2E_USER.id,
      rekonsiliasi_id: rekKemarin.id,
      lauk_id: laukAyam.id,
      porsi_baru_dimasak: 20,
      modal_baru_total: 120000,
      hpp_baru_porsi: 6000,
      porsi_sisa_layak_jual: 5,
    },
    {
      user_id: E2E_USER.id,
      rekonsiliasi_id: rekKemarin.id,
      lauk_id: laukTelur.id,
      porsi_baru_dimasak: 10,
      modal_baru_total: 30000,
      hpp_baru_porsi: 3000,
      porsi_sisa_layak_jual: 0,
    },
  ]);
  if (detailKemarinErr) throw detailKemarinErr;

  // Seed hari ini: pagi_pending dengan carry-over Ayam 5 porsi dari kemarin
  const { data: rekHariIni, error: rekHariErr } = await user
    .from('rekonsiliasi_harian')
    .insert({
      user_id: E2E_USER.id,
      tanggal: todayString(),
      status: 'pagi_pending',
    })
    .select()
    .single();
  if (rekHariErr) throw rekHariErr;

  const { data: detailKemarin, error: detailKemarinLookupErr } = await user
    .from('detail_stok_harian')
    .select('id')
    .eq('rekonsiliasi_id', rekKemarin.id)
    .eq('lauk_id', laukAyam.id)
    .single();
  if (detailKemarinLookupErr) throw detailKemarinLookupErr;

  const { error: detailHariIniErr } = await user.from('detail_stok_harian').insert([
    {
      user_id: E2E_USER.id,
      rekonsiliasi_id: rekHariIni.id,
      lauk_id: laukAyam.id,
      carry_over_dari_id: detailKemarin?.id ?? null,
      porsi_carry_over: 5,
      hpp_carry_over_porsi: 6000,
    },
    {
      user_id: E2E_USER.id,
      rekonsiliasi_id: rekHariIni.id,
      lauk_id: laukTelur.id,
      porsi_carry_over: 0,
      hpp_carry_over_porsi: 0,
    },
  ]);
  if (detailHariIniErr) throw detailHariIniErr;
}

test.describe('Deaktivasi lauk dengan carry-over', () => {
  test.beforeEach(async () => {
    await seedTestData();
  });

  test('nonaktifkan lauk yang punya carry-over → sisa menjadi basi, lauk hilang dari /pagi', async ({
    page,
  }) => {
    // Buka halaman master lauk
    await page.goto('/lauk');
    await expect(page.getByText('Master Lauk')).toBeVisible();
    await expect(page.getByText('2 lauk aktif')).toBeVisible();

    // Tombol "Aktif" untuk Ayam → klik untuk nonaktifkan
    const ayamRow = page.locator('li').filter({ hasText: 'Ayam' });
    await ayamRow.getByRole('button', { name: 'Aktif' }).click();

    // AlertDialog muncul dengan pesan carry-over
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText(
        'Menonaktifkan lauk ini, akan membuat sisa porsi kemarin dianggap basi/rusak !',
      ),
    ).toBeVisible();

    // Konfirmasi deaktivasi
    await dialog.getByRole('button', { name: 'Ya' }).click();
    await expect(dialog).toBeHidden();

    // Ayam sekarang nonaktif (tombol berubah jadi "Nonaktif")
    await expect(ayamRow.getByRole('button', { name: 'Nonaktif' })).toBeVisible();
    await expect(page.getByText('1 lauk aktif')).toBeVisible();

    // Buka /pagi → Ayam tidak tampil
    await page.goto('/pagi');
    await expect(page.getByText('Input Stok Pagi')).toBeVisible();
    await expect(page.getByText('Ayam')).toHaveCount(0);
    await expect(page.getByText('Telur')).toBeVisible();
  });

  test('aktifkan kembali lauk → stok 0, tanpa carry-over', async ({ page }) => {
    // Nonaktifkan Ayam terlebih dahulu
    await page.goto('/lauk');
    const ayamRow = page.locator('li').filter({ hasText: 'Ayam' });
    await ayamRow.getByRole('button', { name: 'Aktif' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Ya' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText('1 lauk aktif')).toBeVisible();

    // Aktifkan kembali Ayam
    await ayamRow.getByRole('button', { name: 'Nonaktif' }).click();
    await expect(page.getByText('2 lauk aktif')).toBeVisible();

    // Buka /pagi → Ayam tampil dengan carry-over 0
    await page.goto('/pagi');
    await expect(page.getByText('Input Stok Pagi')).toBeVisible();

    const pagiAyam = page.locator('div.rounded-xl.border').filter({ hasText: 'Ayam' }).first();
    await expect(pagiAyam).toBeVisible();

    // Tidak ada bagian "Sisa kemarin" (karena carry-over 0)
    await expect(pagiAyam.getByText('Sisa kemarin')).toHaveCount(0);

    // Stok aktif 0 (belum masak baru)
    await expect(pagiAyam.getByText('Stok aktif hari ini: 0 porsi')).toBeVisible();
  });
});
