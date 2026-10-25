import { describe, expect, it, vi } from 'vitest'
import { observeNativeProfileLifecycle } from './native-profile-lifecycle'

const state = vi.hoisted(() => ({
    callbacks: new Map<string, (payload: object) => unknown>(),
    remove: vi.fn(),
}))
vi.mock('@revenge-mod/discord/flux', () => ({
    onFluxEventDispatched: (
        type: string,
        callback: (payload: object) => unknown,
    ) => {
        state.callbacks.set(type, callback)
        return state.remove
    },
}))

describe('native profile event adapter', () => {
    it('passes the exact payload through without copying profile data into the report', () => {
        const observer = observeNativeProfileLifecycle()
        const payload = Object.freeze({
            type: 'USER_PROFILE_SETTINGS_SUBMIT',
            bio: 'private bio',
        })
        expect(state.callbacks.get(payload.type)!(payload)).toBe(payload)
        expect(observer.snapshot()).toEqual({ USER_PROFILE_SETTINGS_SUBMIT: 1 })
        expect(JSON.stringify(observer.snapshot())).not.toContain('private bio')
        observer.stop()
        expect(state.remove).toHaveBeenCalledTimes(6)
    })
})
