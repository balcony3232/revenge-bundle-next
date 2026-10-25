import { registerInternalPlugin } from '@revenge-mod/plugins/_'
import manifest from './manifest.json'

/** Permission engine exists; Discord member/channel screen adapters are pending. */
export default registerInternalPlugin(manifest, {
  start() {},
  stop() {},
})
