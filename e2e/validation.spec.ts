import { expect, test } from '@playwright/test';
import { resetHariIni } from './reset';

test.beforeEach(async () => {
  await resetHariIni();
});

test('opname melebihi stok memblokir simpan; uang laci kosong ditolak', async ({ page }) => {
  // Siapkan pagi: masak baru 10 porsi, modal 70.000 → stok aktif 10
  await page.goto('/pagi');
  const ayamRow = page.locator('div.rounded-xl.border').filter({ hasText: 'Ayam' }).first();
  await expect(ayamRow).toBeVisible();
  for (let i = 0; i < 10; i++) {
    await ayamRow.getByRole('button', { name: 'Tambah' }).click();
  }
  await ayamRow.getByLabel('Total modal bahan (Rp)').fill('70000');
  await page.getByRole('button', { name: 'Selesai Input Pagi' }).click();
  await expect(page.getByText('✓ Input pagi tersimpan')).toBeVisible();

  // Input malam
  await page.goto('/malam');
  await expect(page.getByText('Sisa layak jual besok').first()).toBeVisible();
  const malamAyam = page.locator('div.rounded-xl.border').filter({ hasText: 'Ayam' }).first();

  // sisa 5, dimakan sendiri 5 → total 10 (valid)
  for (let i = 0; i < 5; i++) {
    await malamAyam.getByRole('button', { name: 'Tambah' }).nth(0).click();
    await malamAyam.getByRole('button', { name: 'Tambah' }).nth(2).click();
  }

  // Matikan makan sendiri → konsumsi tak dihitung, sisa bisa naik sampai 10
  await page.getByRole('button', { name: /hari ini ada yang dimakan sendiri/i }).click();
  for (let i = 0; i < 5; i++) {
    await malamAyam.getByRole('button', { name: 'Tambah' }).nth(0).click();
  }

  // Nyalakan lagi → konsumsi 5 ikut dihitung → 10 + 5 > 10 → invalid
  await page.getByRole('button', { name: /tidak ada yang dimakan sendiri/i }).click();
  await expect(page.getByText('Melebihi stok!')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Simpan & Kunci Hari Ini' })).toBeDisabled();

  // Perbaiki: sisa kembali 5 → total 10 valid
  for (let i = 0; i < 5; i++) {
    await malamAyam.getByRole('button', { name: 'Kurangi' }).nth(0).click();
  }
  await expect(page.getByText('Melebihi stok!')).toHaveCount(0);

  // Uang laci kosong → tolak simpan
  await page.getByRole('button', { name: 'Simpan & Kunci Hari Ini' }).click();
  await expect(page.getByText('Uang di laci wajib diisi.')).toBeVisible();

  // Isi uang laci → terkunci
  await page.getByLabel('Total uang di laci').fill('80000');
  await page.getByRole('button', { name: 'Simpan & Kunci Hari Ini' }).click();
  await expect(page.getByText('✓ Input malam tersimpan')).toBeVisible();
});
