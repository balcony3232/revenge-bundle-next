import { registerInternalPlugin } from '@revenge-mod/plugins/_'
import manifest from './manifest.json'

/** Temporary isolation build: disable the entire Nexcord Profile Editor startup.
 * No settings route, local overrides, storage initialization, or native discovery.
 * This helps determine whether the Customize Profile unmount crash originates
 * from this plugin or another client/core patch. Restore after diagnosis.
 */
export default registerInternalPlugin(manifest, {
  start() {},
  stop() {},
})
