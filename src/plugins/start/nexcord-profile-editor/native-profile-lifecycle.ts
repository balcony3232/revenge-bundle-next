import { onFluxEventDispatched } from '@revenge-mod/discord/flux'
import { localAccentSessions } from './local-accent-sessions'
import { observeProfileLifecycle } from './profile-lifecycle'

export function observeNativeProfileLifecycle() {
    return observeProfileLifecycle((type, notify) =>
        onFluxEventDispatched(type, payload => {
            notify()
            localAccentSessions.event(type)
            return payload
        }),
    )
}
