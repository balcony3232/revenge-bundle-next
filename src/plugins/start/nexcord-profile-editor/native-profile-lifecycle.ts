import { onFluxEventDispatched } from '@revenge-mod/discord/flux'
import { observeProfileLifecycle } from './profile-lifecycle'

export function observeNativeProfileLifecycle() {
    return observeProfileLifecycle((type, notify) =>
        onFluxEventDispatched(type, payload => {
            notify()
            return payload
        }),
    )
}
