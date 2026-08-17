import { createClient } from '@supabase/supabase-js';
import { ANON_KEY, SUPABASE_URL } from './constants';
import { E2E_USER } from './global-setup';

function todayString() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Reset data E2E user ke state pagi_pending untuk hari ini:
 * hapus rekonsiliasi (cascade ke detail_stok_harian) lalu seed ulang master_lauk.
 * Dipanggil di `beforeEach` agar tiap spec berjalan dari state bersih.
 */
export async function resetHariIni() {
  const user = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
  });
  const { error: signInError } = await user.auth.signInWithPassword({
    email: E2E_USER.email,
    password: E2E_USER.password,
  });
  if (signInError) throw signInError;

  const { error: resetError } = await user
    .from('rekonsiliasi_harian')
    .delete()
    .eq('user_id', E2E_USER.id)
    .gte('tanggal', todayString());
  if (resetError) throw resetError;

  await user.from('master_lauk').delete().eq('user_id', E2E_USER.id);

  const { error: laukError } = await user.from('master_lauk').insert([
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
  ]);
  if (laukError) throw laukError;
}
