import { describe, expect, it, vi } from 'vitest'
import {
    observeProfileLifecycle,
    profileLifecycleEvents,
} from './profile-lifecycle'

describe('profile lifecycle metadata', () => {
    it('counts only registered events and cleans up all subscriptions', () => {
        const callbacks = new Map<string, () => void>()
        const remove = vi.fn()
        const observer = observeProfileLifecycle((type, callback) => {
            callbacks.set(type, callback)
            return remove
        })
        expect([...callbacks.keys()]).toEqual([...profileLifecycleEvents])
        callbacks.get('USER_PROFILE_SETTINGS_INIT')!()
        callbacks.get('USER_PROFILE_SETTINGS_RESET_AND_CLOSE_FORM')!()
        expect(observer.snapshot()).toEqual({
            USER_PROFILE_SETTINGS_INIT: 1,
            USER_PROFILE_SETTINGS_RESET_AND_CLOSE_FORM: 1,
        })
        observer.snapshot().USER_PROFILE_SETTINGS_INIT = 99
        expect(observer.snapshot().USER_PROFILE_SETTINGS_INIT).toBe(1)
        observer.stop()
        callbacks.get('USER_PROFILE_SETTINGS_INIT')!()
        expect(observer.snapshot().USER_PROFILE_SETTINGS_INIT).toBe(1)
        expect(remove).toHaveBeenCalledTimes(profileLifecycleEvents.length)
    })
    it('removes earlier registrations if setup fails', () => {
        const remove = vi.fn()
        let calls = 0
        expect(() =>
            observeProfileLifecycle(() => {
                if (++calls === 2) throw Error('register failed')
                return remove
            }),
        ).toThrow('register failed')
        expect(remove).toHaveBeenCalledOnce()
    })
})
