import { expect, test } from '@playwright/test';
import { resetHariIni } from './reset';

test.beforeEach(async () => {
  await resetHariIni();
});

test('siklus harian: pagi → malam → terkunci → dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Input Stok Pagi')).toBeVisible();

  // Input pagi: masak baru 10 porsi, modal 70.000
  await page.goto('/pagi');
  const ayamRow = page.locator('div.rounded-xl.border').filter({ hasText: 'Ayam' }).first();
  await expect(ayamRow).toBeVisible();
  for (let i = 0; i < 10; i++) {
    await ayamRow.getByRole('button', { name: 'Tambah' }).click();
  }
  await ayamRow.getByLabel('Total modal keseluruhan (Rp)').fill('70000');
  const telurRow = page.locator('div.rounded-xl.border').filter({ hasText: 'Telur' }).first();
  await telurRow.getByLabel('Total modal keseluruhan (Rp)').fill('30000');
  await page.getByRole('button', { name: 'Selesai Input Pagi' }).click();
  await expect(page.getByText('✓ Input pagi tersimpan')).toBeVisible();

  // Home mencerminkan pagi_selesai → kartu "Input Malam"
  await page.goto('/');
  await expect(page.getByText('Rekonsiliasi & kunci hari ini')).toBeVisible();

  // Input malam: sisa 1 porsi, uang laci 80.000
  await page.goto('/malam');
  await expect(page.getByText('Sisa layak jual besok').first()).toBeVisible();
  const malamAyam = page.locator('div.rounded-xl.border').filter({ hasText: 'Ayam' }).first();
  await malamAyam.getByRole('button', { name: 'Tambah' }).first().click();
  await page.getByLabel('Total uang di laci').fill('80000');
  await page.getByRole('button', { name: 'Simpan & Kunci Hari Ini' }).click();

  // Terkunci: ringkasan read-only, tombol simpan hilang
  await expect(page.getByText('✓ Input malam tersimpan')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Simpan & Kunci Hari Ini' })).toHaveCount(0);

  // Dashboard menampilkan laba
  await page.goto('/dashboard');
  await expect(page.getByText('Selesai & terkunci')).toBeVisible();
  await expect(page.getByText('Keuntungan bersih')).toBeVisible();
});
