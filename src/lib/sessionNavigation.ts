export interface RouteInfo {
  meta: { public?: boolean }
}

export type TargetNavigasi = { name: 'home' } | { name: 'login' }

export interface ArahkanInput {
  user: unknown
  route: RouteInfo
}

export function arahkanKe({ user, route }: ArahkanInput): TargetNavigasi | null {
  if (route.meta.public) return user ? { name: 'home' } : null
  return user ? null : { name: 'login' }
}
