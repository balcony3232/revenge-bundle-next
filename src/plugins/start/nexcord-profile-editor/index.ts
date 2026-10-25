import {
    registerSettingsItems,
    registerSettingsSection,
} from '@revenge-mod/discord/modules/settings'
import { registerInternalPlugin } from '@revenge-mod/plugins/_'
import { clientProfileOverrides } from '~/nexcord/plugins/profile-overrides'
import { loadLocalProfiles } from '~/nexcord/plugins/profile-storage'
import manifest from './manifest.json'
import {
    beginNativeEditorDiscovery,
    stopNativeEditorIntegration,
} from './native-editor'
import { stopProfileJSXProbe } from './native-jsx-probe'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'

/** Stage E: read-only discovery with an optional JSX metadata probe. */
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
        void loadLocalProfiles().catch(error =>
            nativeLoggingHook(
                'Nexcord profile load failed: ' + String(error),
                2,
            ),
        )
        registerSettingsItems({ NexcordProfileEditor: EditorSetting })
        registerSettingsSection('NEXCORD_PROFILE', {
            label: 'Nexcord',
            settings: ['NexcordProfileEditor'],
        })
    },
    stop() {
        stopProfileJSXProbe()
        stopNativeEditorIntegration()
        clientProfileOverrides.setEnabled(false)
    },
})
