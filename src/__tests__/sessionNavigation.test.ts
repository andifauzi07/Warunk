import { describe, expect, it } from 'vitest'
import { arahkanKe } from '../lib/sessionNavigation'
import type { RouteInfo } from '../lib/sessionNavigation'

const pengguna = { id: 'u1' }
const publik = (): RouteInfo => ({ meta: { public: true } })
const terlindung = (): RouteInfo => ({ meta: {} })

describe('arahkanKe', () => {
  it('public + user → halaman utama', () => {
    expect(arahkanKe({ user: pengguna, route: publik() })).toEqual({ name: 'home' })
  })

  it('public + tanpa user → lanjut (null)', () => {
    expect(arahkanKe({ user: null, route: publik() })).toBeNull()
  })

  it('terlindung + tanpa user → halaman login', () => {
    expect(arahkanKe({ user: null, route: terlindung() })).toEqual({ name: 'login' })
  })

  it('terlindung + user → lanjut (null)', () => {
    expect(arahkanKe({ user: pengguna, route: terlindung() })).toBeNull()
  })
})
