import { registerSettingsItems, registerSettingsSection } from '@revenge-mod/discord/modules/settings'
import { registerInternalPlugin } from '@revenge-mod/plugins/_'
import manifest from './manifest.json'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'

/**
 * Crash isolation stage A: restore only the settings route.
 * Deliberately do not start native discovery, load saved profiles, or enable
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
    registerSettingsItems({ NexcordProfileEditor: EditorSetting })
    registerSettingsSection('NEXCORD_PROFILE', {
      label: 'Nexcord',
      settings: ['NexcordProfileEditor'],
    })
  },
  stop() {},
})
