import { getModules } from '@revenge-mod/modules/finders'
import { withProps } from '@revenge-mod/modules/finders/filters'

/**
 * Locate Discord's actual profile form and save action.
 *
 * The normal Save button calls Discord's own save handler. Do not patch that
 * handler until the pending form shape is known: doing so could accidentally
 * upload local-only appearance values to Discord.
 */
export type NativeEditorDiscovery = {
  path: string | null
  exportNames: string[]
}

const state: NativeEditorDiscovery = { path: null, exportNames: [] }
const listeners = new Set<() => void>()
let started = false
const unsubscribers: (() => void)[] = []

function notify(): void {
  for (const listener of listeners) listener()
}

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

  const targets = [
    'UserSettingsEditUserProfile',
    'UserProfileEditForm',
    'useUserProfileEditForm',
    'saveProfileAndAccountChanges',
  ] as const

  for (const name of targets) {
    try {
      const unsub = getModules(withProps(name), exports => {
        if (!started || !exports || typeof exports !== 'object') return
        const names = Object.keys(exports as Record<string, unknown>)
        if (!names.includes(name)) return
        state.exportNames = [...new Set([...state.exportNames, name])]
        if (name === 'saveProfileAndAccountChanges') {
          state.path = 'Native profile Save handler located (not modified)'
        } else if (!state.path) {
          state.path = 'Native profile editor module located'
        }
        notify()
      }, { cached: true, returnNamespace: true })
      unsubscribers.push(unsub)
    } catch (error) {
      nativeLoggingHook('Nexcord profile discovery failed: ' + String(error), 2)
    }
  }
}

export function stopNativeEditorIntegration(): void {
  started = false
  for (const unsubscribe of unsubscribers.splice(0)) unsubscribe()
  state.path = null
  state.exportNames = []
  notify()
}
