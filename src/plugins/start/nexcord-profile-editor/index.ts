import { registerInternalPlugin } from '@revenge-mod/plugins/_'
import { clientProfileOverrides } from '~/nexcord/plugins/profile-overrides'
import manifest from './manifest.json'

/** Registered in Revenge's internal plugin manager. No Discord render patches yet. */
export default registerInternalPlugin(manifest, {
  start() { clientProfileOverrides.setEnabled(true) },
  stop() { clientProfileOverrides.setEnabled(false) },
})
