import { expect, test } from '@playwright/test'
import { E2E_USER } from './global-setup'
import { resetHariIni } from './reset'

test('deep-link rute terproteksi tanpa sesi dialihkan ke /login', async ({ page }) => {
  await page.goto('/malam')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('button', { name: 'Masuk' })).toBeVisible()
})

test('login mengarahkan ke home; /login saat sudah masuk kembali dialihkan ke home', async ({ page }) => {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(E2E_USER.email)
  await page.locator('input[type="password"]').fill(E2E_USER.password)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('Status hari ini')).toBeVisible()

  await page.goto('/login')
  await expect(page).toHaveURL(/\/$/)
})

test('keluar menutup akses rute terproteksi', async ({ page }) => {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(E2E_USER.email)
  await page.locator('input[type="password"]').fill(E2E_USER.password)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await expect(page).toHaveURL(/\/$/)

  await page.goto('/pengaturan')
  await page.getByRole('button', { name: 'Keluar' }).click()
  await expect(page).toHaveURL(/\/login$/)

  await page.goto('/pagi')
  await expect(page).toHaveURL(/\/login$/)
})

test('warung libur lalu Buka Lagi mengembalikan ke pagi_pending', async ({ page }) => {
  await resetHariIni()
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(E2E_USER.email)
  await page.locator('input[type="password"]').fill(E2E_USER.password)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('Input Stok Pagi')).toBeVisible()

  await page.getByRole('button', { name: 'Warung libur hari ini' }).click()
  await expect(page.getByText('Hari ini libur')).toBeVisible()

  await page.getByRole('button', { name: 'Buka Lagi' }).click()
  await expect(page.getByText('Input Stok Pagi')).toBeVisible()
})