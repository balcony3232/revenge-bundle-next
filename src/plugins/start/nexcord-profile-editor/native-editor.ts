import { mInitialized } from '@revenge-mod/modules/metro/patches'
import { getInitializedModuleExports } from '@revenge-mod/modules/metro/utils'

/** Read-only diagnostics. Never patch Discord's React hooks or Save handlers. */
export type NativeEditorDiscovery = {
  path: string | null
  exportNames: string[]
  saveCalls: number
  saveArgumentShapes: string[]
  formCalls: number
  hookCalls: number
  observerStatus: string[]
  exportDiagnostics: string[]
  discoveryStarted: boolean
  scannedModules: number
  scanErrors: number
  discoveryErrors: string[]
  directSavePatch: string
  automaticSavePatch: string
  additionalSaveCalls: Record<string, number>
}

const state: NativeEditorDiscovery = {
  path: null, exportNames: [], saveCalls: 0, saveArgumentShapes: [], formCalls: 0,
  hookCalls: 0, observerStatus: ['Read-only mode: all function hooks disabled'],
  exportDiagnostics: [], discoveryStarted: false, scannedModules: 0,
  scanErrors: 0, discoveryErrors: [], directSavePatch: 'disabled (safe mode)',
  automaticSavePatch: 'disabled (safe mode)', additionalSaveCalls: {},
}
const listeners = new Set<() => void>()
function notify(): void { for (const listener of listeners) listener() }
export function getNativeEditorDiscovery(): NativeEditorDiscovery {
  return { ...state, exportNames: [...state.exportNames], saveArgumentShapes: [...state.saveArgumentShapes],
    observerStatus: [...state.observerStatus], exportDiagnostics: [...state.exportDiagnostics],
    discoveryErrors: [...state.discoveryErrors], additionalSaveCalls: { ...state.additionalSaveCalls } }
}
export function subscribeNativeEditorDiscovery(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
export function beginNativeEditorDiscovery(): void {
  state.discoveryStarted = true
  notify()
}
export function rescanNativeEditorModules(): void {
  const targets = ['UserSettingsEditUserProfile', 'UserProfileEditForm', 'useUserProfileEditForm',
    'saveProfileAndAccountChanges', 'saveProfileAndAccountRequest', 'resetAndCloseUserProfileForm']
  state.scannedModules = 0
  state.scanErrors = 0
  state.discoveryErrors = []
  state.exportNames = []
  state.exportDiagnostics = []
  for (const id of mInitialized) {
    state.scannedModules++
    try {
      const namespace = getInitializedModuleExports(id)
      if (!namespace || (typeof namespace !== 'object' && typeof namespace !== 'function')) continue
      for (const name of targets) {
        if (!Object.prototype.hasOwnProperty.call(namespace, name)) continue
        const value = (namespace as Record<string, unknown>)[name]
        state.exportNames = [...new Set([...state.exportNames, name])]
        const descriptor = Object.getOwnPropertyDescriptor(namespace, name)
        state.exportDiagnostics.push(name + ': module=' + id + ', type=' + typeof value +
          ', descriptor=' + (descriptor?.get ? 'getter' : descriptor ? 'value' : 'missing'))
        if (!state.path) state.path = 'Native profile editor module located (read-only)'
      }
    } catch (error) {
      state.scanErrors++
      if (state.discoveryErrors.length < 5) state.discoveryErrors.push('Module ' + id + ': ' + String(error).slice(0, 120))
    }
  }
  notify()
}
export function stopNativeEditorIntegration(): void {
  state.discoveryStarted = false
  state.path = null
  state.exportNames = []
  state.exportDiagnostics = []
  state.scannedModules = 0
  state.scanErrors = 0
  state.discoveryErrors = []
  notify()
}
