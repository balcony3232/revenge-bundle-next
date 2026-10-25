/** Local-only profile appearance overrides. Never writes to Discord's API. */
export interface ProfileAppearance {
  username?: string
  displayName?: string
  bio?: string
  avatarUrl?: string
  bannerUrl?: string
  badgeIds?: string[]
  effectId?: string
  accentColor?: number
}
export type ProfilePreset = { id: string; label: string; appearance: ProfileAppearance }
const textLimit = (value: unknown, max: number) => value === undefined || (typeof value === 'string' && value.length <= max)
export function validateAppearance(value: unknown): value is ProfileAppearance {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const p = value as Record<string, unknown>
  if (!textLimit(p.username, 32) || !textLimit(p.displayName, 32) || !textLimit(p.bio, 190)) return false
  for (const key of ['avatarUrl', 'bannerUrl']) {
    const url = p[key]
    if (url !== undefined && (typeof url !== 'string' || url.length > 2048 || !/^https:\/\//i.test(url))) return false
  }
  if (p.badgeIds !== undefined && (!Array.isArray(p.badgeIds) || p.badgeIds.length > 20 || !p.badgeIds.every(x => typeof x === 'string' && x.length <= 80))) return false
  if (!textLimit(p.effectId, 100)) return false
  if (p.accentColor !== undefined && (!Number.isInteger(p.accentColor) || (p.accentColor as number) < 0 || (p.accentColor as number) > 0xffffff)) return false
  return true
}
export function applyLocalAppearance<T extends Record<string, unknown>>(original: T, override: ProfileAppearance): T {
  if (!validateAppearance(override)) throw new Error('Invalid local profile override')
  return { ...original, ...Object.fromEntries(Object.entries(override).filter(([, value]) => value !== undefined)) } as T
}
