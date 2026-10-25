import { getJsonStorage, pluginStoragePathFor } from '@revenge-mod/json-storage'
import { clientProfileOverrides, type ProfileOverrideEntry } from './profile-overrides'
import { validateAppearance, type ProfileAppearance } from './profile-editor'

type StoredProfiles = { entries: ProfileOverrideEntry[] }
const storage = getJsonStorage<StoredProfiles>(
  pluginStoragePathFor('nexcord.profile-editor'),
  { default: { entries: [] } },
)

/** Local-only persistence. Never writes Discord account data. */
export async function loadLocalProfiles(): Promise<number> {
  const saved = await storage.get()
  let count = 0
  for (const entry of saved?.entries ?? []) {
    if (!entry || typeof entry.userId !== 'string' || !validateAppearance(entry.appearance)) continue
    try {
      clientProfileOverrides.set(entry.userId, entry.appearance)
      count++
    } catch {
      // Ignore malformed or obsolete entries instead of crashing Discord.
    }
  }
  return count
}

export async function saveLocalProfile(userId: string, appearance: ProfileAppearance): Promise<void> {
  clientProfileOverrides.set(userId, appearance)
  await storage.set({ entries: clientProfileOverrides.exportEntries() }, true)
}

export async function removeLocalProfile(userId: string): Promise<void> {
  clientProfileOverrides.remove(userId)
  await storage.set({ entries: clientProfileOverrides.exportEntries() }, true)
}
