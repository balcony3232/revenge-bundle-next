import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocalAccentSession } from './local-accent-session'
import { localAccentSessions } from './local-accent-sessions'

afterEach(() => localAccentSessions.stop())
describe('navigation-scoped accent sessions', () => {
    it('keeps lifecycle observations when an effect cleans up and registers the same session again', async () => {
        const repository = {
            load: async () => '#7162DA',
            save: vi.fn(async () => {}),
        }
        const session = new LocalAccentSession(repository, '123456789012345678')
        await session.load()
        const remove = localAccentSessions.register('profile', session)
        remove()
        localAccentSessions.register('profile', session)
        await session.load()
        session.change('#123456')
        session.save(true, () => {
            localAccentSessions.event('USER_PROFILE_SETTINGS_SUBMIT')
            localAccentSessions.event('USER_PROFILE_SETTINGS_SUBMIT_SUCCESS')
            return Promise.resolve()
        })
        await session.whenIdle()
        expect(repository.save).toHaveBeenCalledExactlyOnceWith(
            '123456789012345678',
            '#123456',
        )
        expect(localAccentSessions.get('unrelated')).toBeUndefined()
    })
})
