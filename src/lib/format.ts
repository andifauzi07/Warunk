export function formatRupiah(value: number | null | undefined): string {
  const n = Number(value ?? 0)
  return 'Rp ' + n.toLocaleString('id-ID', { maximumFractionDigits: 0 })
}

export function formatAngka(value: number | null | undefined): string {
  const n = Number(value ?? 0)
  return n.toLocaleString('id-ID')
}

export function tanggalBaca(tanggal: string): string {
  const d = new Date(tanggal + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function pesanError(e: unknown): string {
  if (e instanceof Error) return e.message
  return 'Terjadi kesalahan'
}

export function tambahHari(tanggal: string, hari: number): string {
  const d = new Date(tanggal + 'T00:00:00')
  d.setDate(d.getDate() + hari)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const t = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${t}`
}
