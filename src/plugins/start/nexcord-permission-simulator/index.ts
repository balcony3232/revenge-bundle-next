import { registerInternalPlugin } from '@revenge-mod/plugins/_'
import manifest from './manifest.json'

/** No permission-gating bypass or remote API modification. */
export default registerInternalPlugin(manifest, {
  start() {},
  stop() {},
})
