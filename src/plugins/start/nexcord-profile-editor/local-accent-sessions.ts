import type { LocalAccentSession } from './local-accent-session'

const sessions = new Map<string, LocalAccentSession>()
const tracked = new Set<LocalAccentSession>()
const listeners = new Set<() => void>()
let revision = 0
function notify() {
    revision++
    for (const listener of listeners) listener()
}

export const localAccentSessions = {
    revision: () => revision,
    subscribe: (listener: () => void) => {
        listeners.add(listener)
        return () => {
            listeners.delete(listener)
        }
    },
    get: (routeKey: string | undefined) =>
        routeKey ? sessions.get(routeKey) : undefined,
    register(routeKey: string, session: LocalAccentSession) {
        sessions.set(routeKey, session)
        tracked.add(session)
        notify()
        return () => {
            if (sessions.get(routeKey) === session) {
                sessions.delete(routeKey)
                notify()
            }
            session.dispose()
            void session.whenIdle().then(() => {
                tracked.delete(session)
            })
        }
    },
    event(type: string) {
        for (const session of tracked) session.event(type)
    },
    diagnostics: () => ({
        activeForms: sessions.size,
        connectedHeaders: [...sessions.values()].filter(
            session => session.snapshot().headerConnected,
        ).length,
        dirtyForms: [...sessions.values()].filter(
            session => session.snapshot().dirty,
        ).length,
        savingForms: [...sessions.values()].filter(
            session => session.snapshot().saving,
        ).length,
    }),
    stop() {
        for (const session of tracked) session.cancel()
        sessions.clear()
        tracked.clear()
        notify()
    },
}
