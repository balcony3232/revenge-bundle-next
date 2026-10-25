import { registerSettingsItems, registerSettingsSection } from '@revenge-mod/discord/modules/settings'
import { registerInternalPlugin } from '@revenge-mod/plugins/_'
import manifest from './manifest.json'
import { loadLocalProfiles } from '~/nexcord/plugins/profile-storage'
import { clientProfileOverrides } from '~/nexcord/plugins/profile-overrides'
import { beginNativeEditorDiscovery, stopNativeEditorIntegration } from './native-editor'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'

/**
 * Crash isolation stage D: restore read-only native discovery startup.
 * Native discovery remains read-only; no Discord functions are patched. No Discord function patching is performed here.
 */
const EditorSetting: SettingsItem = {
  parent: null,
  type: 'route',
  useTitle: () => 'Nexcord Profile Editor',
  useDescription: () => 'Edit local profile appearance (diagnostic mode)',
  screen: {
    route: 'NexcordProfileEditor',
    getComponent: () => require('./ProfileEditorScreen').default,
  },
}

export default registerInternalPlugin(manifest, {
  start() {
    clientProfileOverrides.setEnabled(true)
    beginNativeEditorDiscovery()
    void loadLocalProfiles().catch(error => nativeLoggingHook('Nexcord profile load failed: ' + String(error), 2))
    registerSettingsItems({ NexcordProfileEditor: EditorSetting })
    registerSettingsSection('NEXCORD_PROFILE', {
      label: 'Nexcord',
      settings: ['NexcordProfileEditor'],
    })
  },
  stop() { stopNativeEditorIntegration(); clientProfileOverrides.setEnabled(false) },
})
