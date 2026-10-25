import { waitForModuleWithImportedPath } from '@revenge-mod/discord/utils/modules/finders'

/**
 * Probe known native profile-editing module paths without mutating account
 * actions. Discord changes module names between OTA releases, so this
 * discovery phase must be non-destructive.
 */
const candidatePaths = [
  'modules/user_profile/native/UserProfileSettingsScreen.tsx',
  'modules/user_settings/profile/native/ProfileSettingsScreen.tsx',
  'modules/user_profile/native/ProfileCustomizationScreen.tsx',
  'modules/user_profile/native/ProfileEditorScreen.tsx',
] as const

export type NativeEditorDiscovery = {
  path: string | null
  exportNames: string[]
}

const state: NativeEditorDiscovery = { path: null, exportNames: [] }
const listeners = new Set<() => void>()
let started = false

export function getNativeEditorDiscovery(): NativeEditorDiscovery {
  return { path: state.path, exportNames: [...state.exportNames] }
}

export function subscribeNativeEditorDiscovery(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function beginNativeEditorDiscovery(): void {
  if (started) return
  started = true
  for (const path of candidatePaths) {
    try {
      waitForModuleWithImportedPath<Record<string, unknown>>(path, exports => {
        if (state.path) return
        state.path = path
        state.exportNames = Object.keys(exports)
        for (const listener of listeners) listener()
      })
    } catch {
      // An unknown path must never break Discord startup.
    }
  }
}
