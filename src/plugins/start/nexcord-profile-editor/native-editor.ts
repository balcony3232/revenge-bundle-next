import { getModules } from '@revenge-mod/modules/finders/get'
import { withProps } from '@revenge-mod/modules/finders/filters'
import { after } from '@revenge-mod/patcher'
import { createElement, useState } from 'react'
import { Modal, Pressable, Text, View } from 'react-native'
import type { ReactNode } from 'react'

export type NativeEditorDiscovery = { path: string | null; exportNames: string[] }
const state: NativeEditorDiscovery = { path: null, exportNames: [] }
const listeners = new Set<() => void>()
let started = false
let unpatch: (() => void) | undefined
let unsubscribe: (() => void) | undefined

function notify() {
  for (const listener of listeners) listener()
}

function NativeEditorWithNexcord({ native }: { native: ReactNode }) {
  const [open, setOpen] = useState(false)
  return createElement(
    View,
    { style: { flex: 1 } },
    native,
    createElement(View, { pointerEvents: 'box-none', style: { position: 'absolute', right: 14, bottom: 18 } },
      createElement(Pressable, {
        accessibilityRole: 'button',
        onPress: () => setOpen(true),
        style: { backgroundColor: '#7162DA', borderRadius: 12, paddingVertical: 11, paddingHorizontal: 15, elevation: 6 },
      }, createElement(Text, { style: { color: '#fff', fontWeight: '700' } }, 'Nexcord Local')),
    ),
    createElement(Modal, { visible: open, animationType: 'slide', onRequestClose: () => setOpen(false) },
      createElement(View, { style: { flex: 1, backgroundColor: '#202027' } },
        createElement(Pressable, { onPress: () => setOpen(false), style: { padding: 16, backgroundColor: '#292930' } },
          createElement(Text, { style: { color: '#fff', fontWeight: '700' } }, '← Back to Customize Profile')),
        createElement(require('./ProfileEditorScreen').default),
      ),
    ),
  )
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
  unsubscribe = getModules(withProps('UserSettingsEditUserProfile'), exports => {
    if (unpatch) return
    const module = exports as { UserSettingsEditUserProfile: (...args: unknown[]) => ReactNode }
    if (typeof module.UserSettingsEditUserProfile !== 'function') return
    try {
      unpatch = after(module, 'UserSettingsEditUserProfile', native =>
        createElement(NativeEditorWithNexcord, { native }),
      )
      state.path = 'UserSettingsEditUserProfile (runtime export)'
      state.exportNames = ['UserSettingsEditUserProfile']
      notify()
    } catch (error) {
      nativeLoggingHook('Nexcord native editor hook failed: ' + String(error), 2)
    }
  }, { cached: true, returnNamespace: true })
}

export function stopNativeEditorIntegration(): void {
  unsubscribe?.()
  unsubscribe = undefined
  unpatch?.()
  unpatch = undefined
  started = false
  state.path = null
  state.exportNames = []
  notify()
}
