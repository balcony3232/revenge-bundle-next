import { getModules } from '@revenge-mod/modules/finders'
import { withProps } from '@revenge-mod/modules/finders/filters'
import { before } from '@revenge-mod/patcher'

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
  saveCalls: number
  saveArgumentShapes: string[]
  formCalls: number
  hookCalls: number
  observerStatus: string[]
}

const state: NativeEditorDiscovery = { path: null, exportNames: [], saveCalls: 0, saveArgumentShapes: [], formCalls: 0, hookCalls: 0, observerStatus: [] }
const listeners = new Set<() => void>()
let started = false
const unsubscribers: (() => void)[] = []
let unpatchSave: (() => void) | undefined
const formUnpatchers: (() => void)[] = []

function describeShape(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (typeof value !== 'object') return typeof value
  const safe = Object.keys(value).filter(key => !/token|secret|password|email|phone|auth|session|cookie|value|content/i.test(key)).slice(0, 20)
  return 'object keys: ' + safe.join(', ')
}

function notify(): void {
  for (const listener of listeners) listener()
}

export function getNativeEditorDiscovery(): NativeEditorDiscovery {
  return { path: state.path, exportNames: [...state.exportNames], saveCalls: state.saveCalls, saveArgumentShapes: [...state.saveArgumentShapes], formCalls: state.formCalls, hookCalls: state.hookCalls, observerStatus: [...state.observerStatus] }
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
          state.path = 'Native profile Save handler located (observing argument shapes only)'
          if (!unpatchSave && typeof (exports as Record<string, unknown>)[name] === 'function') {
            try {
              unpatchSave = before(exports as Record<typeof name, (...args: unknown[]) => unknown>, name, args => {
                state.saveCalls++
                state.saveArgumentShapes = args.slice(0, 8).map(describeShape)
                notify()
              })
            } catch (error) {
              nativeLoggingHook('Nexcord Save observer failed: ' + String(error), 2)
            }
          }
        } else {
          if (!state.path) state.path = 'Native profile editor module located'
          if ((name === 'UserProfileEditForm' || name === 'useUserProfileEditForm') && typeof (exports as Record<string, unknown>)[name] === 'function' && !state.observerStatus.some(x => x.startsWith(name + ':'))) {
            try {
              const undo = before(exports as Record<typeof name, (...args: unknown[]) => unknown>, name, () => {
                if (name === 'UserProfileEditForm') state.formCalls++
                else state.hookCalls++
                notify()
              })
              formUnpatchers.push(undo)
              state.observerStatus.push(name + ': attached')
            } catch (error) {
              state.observerStatus.push(name + ': failed (' + String(error).slice(0, 120) + ')')
            }
          }
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
  for (const unpatch of formUnpatchers.splice(0)) unpatch()
  unpatchSave?.()
  unpatchSave = undefined
  for (const unsubscribe of unsubscribers.splice(0)) unsubscribe()
  state.path = null
  state.exportNames = []
  state.saveCalls = 0
  state.saveArgumentShapes = []
  state.formCalls = 0
  state.hookCalls = 0
  state.observerStatus = []
  notify()
}
