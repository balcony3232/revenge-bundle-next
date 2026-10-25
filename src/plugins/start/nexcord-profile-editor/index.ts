import { registerSettingsItems, registerSettingsSection } from '@revenge-mod/discord/modules/settings'
import { registerInternalPlugin } from '@revenge-mod/plugins/_'
import manifest from './manifest.json'
import { loadLocalProfiles } from '~/nexcord/plugins/profile-storage'
import { clientProfileOverrides } from '~/nexcord/plugins/profile-overrides'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'

/**
 * Crash isolation stage C: restore settings, storage, and override manager activation.
 * Deliberately do not start native discovery or patch Discord functions. No Discord function patching is performed here.
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
    void loadLocalProfiles().catch(error => nativeLoggingHook('Nexcord profile load failed: ' + String(error), 2))
    registerSettingsItems({ NexcordProfileEditor: EditorSetting })
    registerSettingsSection('NEXCORD_PROFILE', {
      label: 'Nexcord',
      settings: ['NexcordProfileEditor'],
    })
  },
  stop() { clientProfileOverrides.setEnabled(false) },
})
