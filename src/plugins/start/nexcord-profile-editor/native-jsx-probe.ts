import { mInitialized } from '@revenge-mod/modules/metro/patches'
import { onAnyModuleInitialized } from '@revenge-mod/modules/metro/subscriptions'
import { getInitializedModuleExports } from '@revenge-mod/modules/metro/utils'
import { afterJSX } from '@revenge-mod/react/jsx-runtime'
import { ProfileJSXProbe } from './jsx-probe'

const probe = new ProfileJSXProbe((type, observe) => afterJSX(type, observe))
let unsubscribe: (() => void) | undefined

export function getProfileJSXProbe() {
    return probe.snapshot()
}

export function startProfileJSXProbe(): void {
    if (unsubscribe) return
    probe.start()
    unsubscribe = onAnyModuleInitialized((_id, namespace) =>
        probe.inspect(namespace),
    )
    refreshProfileJSXProbe()
}

export function refreshProfileJSXProbe() {
    if (!probe.snapshot().active) return probe.snapshot()
    for (const id of [...mInitialized]) {
        try {
            probe.inspect(getInitializedModuleExports(id))
        } catch {
            /* Uninspectable namespaces. */
        }
    }
    return probe.snapshot()
}

export function stopProfileJSXProbe(): void {
    unsubscribe?.()
    unsubscribe = undefined
    probe.stop()
}
