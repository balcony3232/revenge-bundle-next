import { mInitialized } from '@revenge-mod/modules/metro/patches'
import { onAnyModuleInitialized } from '@revenge-mod/modules/metro/subscriptions'
import { getInitializedModuleExports } from '@revenge-mod/modules/metro/utils'
import { afterJSX } from '@revenge-mod/react/jsx-runtime'
import { ProfileJSXProbe } from './jsx-probe'
import type { observeProfileLifecycle } from './profile-lifecycle'

let testRowEnabled = false
let testRowInsertions = 0
let testRowErrors = 0
let lifecycle: ReturnType<typeof observeProfileLifecycle> | undefined
let lifecycleErrors = 0
const probe = new ProfileJSXProbe((type, observe, name) =>
    afterJSX(type, element => {
        const original = observe(element)
        if (
            !testRowEnabled ||
            !['UserProfileEditForm', 'UserProfileEditTheme'].includes(name) ||
            !original
        )
            return original
        try {
            const result =
                require('./NativeProfileTestRow').withNativeProfileTestRow(
                    original,
                    name,
                )
            testRowInsertions++
            return result
        } catch {
            testRowErrors++
            return original
        }
    }),
)
let unsubscribe: (() => void) | undefined

export function getProfileJSXProbe() {
    return {
        ...probe.snapshot(),
        testRowEnabled,
        testRowInsertions,
        testRowErrors,
        lifecycleEvents: lifecycle?.snapshot() ?? {},
        lifecycleErrors,
    }
}

export function setNativeProfileTestRowEnabled(enabled: boolean): void {
    testRowEnabled = enabled
    if (enabled) startProfileJSXProbe()
}

export function startProfileJSXProbe(): void {
    if (unsubscribe) return
    probe.start()
    try {
        lifecycle =
            require('./native-profile-lifecycle').observeNativeProfileLifecycle()
    } catch {
        lifecycleErrors++
    }
    unsubscribe = onAnyModuleInitialized((_id, namespace) =>
        probe.inspect(namespace),
    )
    refreshProfileJSXProbe()
}

export function refreshProfileJSXProbe() {
    if (!probe.snapshot().active) return getProfileJSXProbe()
    for (const id of [...mInitialized]) {
        try {
            probe.inspect(getInitializedModuleExports(id))
        } catch {
            /* Uninspectable namespaces. */
        }
    }
    return getProfileJSXProbe()
}

export function stopProfileJSXProbe(): void {
    testRowEnabled = false
    lifecycle?.stop()
    lifecycle = undefined
    unsubscribe?.()
    unsubscribe = undefined
    probe.stop()
}
