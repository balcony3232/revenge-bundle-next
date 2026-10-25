import { applyLocalAppearance, validateAppearance, type ProfileAppearance } from './profile-editor'

/**
 * Client-wide local appearance resolver.
 * Discord render adapters should call resolveAppearance(userId, original) for
 * message headers, member lists, DMs, search, mentions, and profile screens.
 * This never mutates upstream user records or sends changes to Discord.
 */
export type ProfileSurface =
  | 'message' | 'member-list' | 'dm' | 'search' | 'mention' | 'profile' | 'other'

export type ProfileOverrideEntry = {
  userId: string
  appearance: ProfileAppearance
}

export class ClientProfileOverrides {
  private readonly entries = new Map<string, ProfileAppearance>()
  private readonly listeners = new Set<() => void>()
  private active = false

  setEnabled(enabled: boolean): void {
    if (this.active === enabled) return
    this.active = enabled
    this.notify()
  }

  isEnabled(): boolean {
    return this.active
  }

  set(userId: string, appearance: ProfileAppearance): void {
    if (!/^\d{16,22}$/.test(userId)) throw new Error('Invalid Discord user ID')
    if (!validateAppearance(appearance)) throw new Error('Invalid profile appearance')
    this.entries.set(userId, { ...appearance, badgeIds: appearance.badgeIds?.slice() })
    this.notify()
  }

  remove(userId: string): void {
    if (this.entries.delete(userId)) this.notify()
  }

  clear(): void {
    if (!this.entries.size) return
    this.entries.clear()
    this.notify()
  }

  resolve<T extends Record<string, unknown>>(
    userId: string,
    original: T,
    _surface: ProfileSurface = 'other',
  ): T {
    const override = this.active ? this.entries.get(userId) : undefined
    return override ? applyLocalAppearance(original, override) : original
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  exportEntries(): ProfileOverrideEntry[] {
    return [...this.entries].map(([userId, appearance]) => ({
      userId, appearance: { ...appearance, badgeIds: appearance.badgeIds?.slice() },
    }))
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }
}

export const clientProfileOverrides = new ClientProfileOverrides()
