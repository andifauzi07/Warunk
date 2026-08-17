import { mkdirSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { chromium } from '@playwright/test'
import { ANON_KEY, SERVICE_ROLE_KEY, SUPABASE_URL } from './constants'

export const E2E_USER = {
  id: '00000000-0000-4000-8000-0000000000e2',
  email: 'e2e@warunk.test',
  password: 'warunk-e2e-123',
}

export const E2E_STATE_PATH = 'e2e/.auth/user.json'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173'

function todayString() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/**
 * Seed data E2E terhadap Supabase local:
 * 1. pastikan user E2E ada (createUser idempoten),
 * 2. reset data hari ini + seed master lauk,
 * 3. login via UI → simpan storageState agar spec autentik langsung masuk.
 */
export default async function globalSetup() {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const { error: createError } = await admin.auth.admin.createUser({
    id: E2E_USER.id,
    email: E2E_USER.email,
    password: E2E_USER.password,
    email_confirm: true,
  })
  if (
    createError &&
    createError.status !== 409 &&
    createError.status !== 422
  ) {
    throw new Error(`gagal membuat user E2E: ${createError.message}`)
  }

  // Pakai client anon ber-sesi user E2E (RLS owner_all) — service_role
  // tidak punya privilege tabel di migrasi ini.
  const user = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
  })
  const { error: signInError } = await user.auth.signInWithPassword({
    email: E2E_USER.email,
    password: E2E_USER.password,
  })
  if (signInError) throw signInError

  const { error: resetError } = await user
    .from('rekonsiliasi_harian')
    .delete()
    .eq('user_id', E2E_USER.id)
    .gte('tanggal', todayString())
  if (resetError) throw resetError

  await user.from('master_lauk').delete().eq('user_id', E2E_USER.id)

  const { error: laukError } = await user.from('master_lauk').insert([
    { user_id: E2E_USER.id, nama_lauk: 'Ayam', harga_jual_porsi: 10000, hpp_estimasi_porsi: 6000, is_active: true },
    { user_id: E2E_USER.id, nama_lauk: 'Telur', harga_jual_porsi: 5000, hpp_estimasi_porsi: 3000, is_active: true },
  ])
  if (laukError) throw laukError

  const browser = await chromium.launch()
  const page = await browser.newPage({ baseURL: BASE_URL })
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(E2E_USER.email)
  await page.locator('input[type="password"]').fill(E2E_USER.password)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL(`${BASE_URL}/`)
  await page.getByText('Status hari ini').waitFor()

  mkdirSync('e2e/.auth', { recursive: true })
  await page.context().storageState({ path: E2E_STATE_PATH })
  await browser.close()
}