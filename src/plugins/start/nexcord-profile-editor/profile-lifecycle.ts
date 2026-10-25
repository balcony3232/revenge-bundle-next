export const profileLifecycleEvents = [
    'USER_PROFILE_SETTINGS_INIT',
    'USER_PROFILE_SETTINGS_SUBMIT',
    'USER_PROFILE_SETTINGS_SUBMIT_SUCCESS',
    'USER_PROFILE_SETTINGS_SUBMIT_FAILURE',
    'USER_PROFILE_SETTINGS_RESET_PENDING_CHANGES',
    'USER_PROFILE_SETTINGS_RESET_AND_CLOSE_FORM',
] as const

/** Counts lifecycle events without accepting profile values. */
export function observeProfileLifecycle(
    register: (type: string, notify: () => void) => () => void,
) {
    const counts: Record<string, number> = {}
    let active = true
    const remove: (() => void)[] = []
    const stop = () => {
        active = false
        for (const unregister of remove.splice(0)) unregister()
    }
    try {
        for (const type of profileLifecycleEvents) {
            remove.push(
                register(type, () => {
                    if (active) counts[type] = (counts[type] ?? 0) + 1
                }),
            )
        }
    } catch (error) {
        stop()
        throw error
    }
    return { snapshot: () => ({ ...counts }), stop }
}
