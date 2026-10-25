import { registerSettingsItems, registerSettingsSection } from '@revenge-mod/discord/modules/settings'
import { registerInternalPlugin } from '@revenge-mod/plugins/_'
import { clientProfileOverrides } from '~/nexcord/plugins/profile-overrides'
import { loadLocalProfiles } from '~/nexcord/plugins/profile-storage'
import { beginNativeEditorDiscovery } from './native-editor'
import manifest from './manifest.json'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'

const EditorSetting: SettingsItem = {
  parent: null,
  type: 'route',
  useTitle: () => 'Nexcord Profile Editor',
  useDescription: () => 'Edit local profile appearance',
  screen: {
    route: 'NexcordProfileEditor',
    getComponent: () => require('./ProfileEditorScreen').default,
  },
}

export default registerInternalPlugin(manifest, {
  start() {
    clientProfileOverrides.setEnabled(true)
    beginNativeEditorDiscovery()
    void loadLocalProfiles().catch(error => nativeLoggingHook(`Nexcord local profile load failed: ${String(error)}`, 2))
    registerSettingsItems({ NexcordProfileEditor: EditorSetting })
    registerSettingsSection('NEXCORD_PROFILE', {
      label: 'Nexcord',
      settings: ['NexcordProfileEditor'],
    })
  },
  stop() { clientProfileOverrides.setEnabled(false) },
})
