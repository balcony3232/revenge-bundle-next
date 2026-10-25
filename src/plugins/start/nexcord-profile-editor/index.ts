import { registerSettingsItems, registerSettingsSection } from '@revenge-mod/discord/modules/settings'
import { registerInternalPlugin } from '@revenge-mod/plugins/_'
import manifest from './manifest.json'
import { loadLocalProfiles } from '~/nexcord/plugins/profile-storage'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'

/**
 * Crash isolation stage B: restore settings route and local profile loading.
 * Deliberately do not start native discovery or enable
 * client-wide overrides. No Discord function patching is performed here.
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
    void loadLocalProfiles().catch(error => nativeLoggingHook('Nexcord profile load failed: ' + String(error), 2))
    registerSettingsItems({ NexcordProfileEditor: EditorSetting })
    registerSettingsSection('NEXCORD_PROFILE', {
      label: 'Nexcord',
      settings: ['NexcordProfileEditor'],
    })
  },
  stop() {},
})
