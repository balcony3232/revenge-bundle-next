import { describe, expect, it, vi } from 'vitest'
import { LocalAccentSession } from './local-accent-session'

const id = '123456789012345678'
const submit = 'USER_PROFILE_SETTINGS_SUBMIT'
const success = 'USER_PROFILE_SETTINGS_SUBMIT_SUCCESS'
const failure = 'USER_PROFILE_SETTINGS_SUBMIT_FAILURE'
const close = 'USER_PROFILE_SETTINGS_RESET_AND_CLOSE_FORM'
async function setup() {
    const repository = {
        load: vi.fn(async () => '#7162DA'),
        save: vi.fn(async () => {}),
    }
    const session = new LocalAccentSession(repository, id)
    await session.load()
    return { session, repository }
}

describe('local Save session', () => {
    it('saves cosmetic-only edits without invoking native Save and restores the clean state', async () => {
        const { session, repository } = await setup()
        const native = vi.fn()
        session.change('#ff5500')
        await session.save(false, native)
        expect(native).not.toHaveBeenCalled()
        expect(repository.save).toHaveBeenCalledExactlyOnceWith(id, '#FF5500')
        expect(session.snapshot()).toMatchObject({
            dirty: false,
            saving: false,
            saved: '#FF5500',
        })
    })
    it('discards unsaved drafts on close and refuses invalid cosmetic-only writes', async () => {
        const { session, repository } = await setup()
        session.change('#GG')
        await session.save(false, vi.fn())
        session.change('#123456')
        session.dispose()
        await session.save(false, vi.fn())
        expect(repository.save).not.toHaveBeenCalled()
    })
    it('preserves native-only callback results and does not block native edits for an invalid local draft', async () => {
        const { session, repository } = await setup()
        const result = Object.freeze({ native: true })
        const native = vi.fn(() => result)
        expect(session.save(true, native)).toBe(result)
        session.change('#invalid')
        expect(session.save(true, native)).toBe(result)
        expect(native).toHaveBeenCalledTimes(2)
        expect(repository.save).not.toHaveBeenCalled()
    })
    it('commits mixed edits only after the original promise and success event agree', async () => {
        const { session, repository } = await setup()
        session.change('#123456')
        let finish!: () => void
        const nativeResult = new Promise<void>(resolve => {
            finish = resolve
        })
        const native = vi.fn(() => {
            session.event(submit)
            return nativeResult
        })
        expect(session.save(true, native)).toBe(nativeResult)
        expect(repository.save).not.toHaveBeenCalled()
        session.event(success)
        expect(repository.save).not.toHaveBeenCalled()
        finish()
        await session.whenIdle()
        expect(native).toHaveBeenCalledOnce()
        expect(repository.save).toHaveBeenCalledExactlyOnceWith(id, '#123456')
    })
    it.each([
        'no-events',
        'failure',
        'resolved-failure',
        'void-result',
        'cancel',
        'success-then-failure',
    ])('keeps local edits unsaved for %s', async scenario => {
        const { session, repository } = await setup()
        session.change('#123456')
        let finish!: () => void
        const result = new Promise<void>(resolve => {
            finish = resolve
        })
        session.save(true, () => {
            if (scenario !== 'no-events') session.event(submit)
            if (scenario === 'success-then-failure') session.event(success)
            if (scenario.includes('failure')) session.event(failure)
            if (scenario === 'cancel') {
                session.event(close)
                session.dispose()
            }
            return scenario === 'void-result' ? undefined : result
        })
        finish()
        await session.whenIdle()
        expect(repository.save).not.toHaveBeenCalled()
    })
    it('preserves thrown and rejected native failures without local persistence', async () => {
        const { session, repository } = await setup()
        session.change('#123456')
        expect(() =>
            session.save(true, () => {
                throw Error('native failure')
            }),
        ).toThrow('native failure')
        const rejected = Promise.reject(Error('request failed'))
        expect(session.save(true, () => rejected)).toBe(rejected)
        await expect(rejected).rejects.toThrow('request failed')
        await session.whenIdle()
        expect(repository.save).not.toHaveBeenCalled()
    })
    it('finishes an explicit successful Save after the native screen closes', async () => {
        const { session, repository } = await setup()
        session.change('#123456')
        session.save(true, () => {
            session.event(submit)
            session.event(success)
            session.event(close)
            session.dispose()
            return Promise.resolve()
        })
        await session.whenIdle()
        expect(repository.save).toHaveBeenCalledOnce()
    })
    it('keeps a failed local write dirty and supports retry; duplicate taps do not double-save', async () => {
        const { session, repository } = await setup()
        repository.save.mockRejectedValueOnce(Error('disk full'))
        session.change('#123456')
        const pending = session.save(false, vi.fn())
        session.save(false, vi.fn())
        await pending
        expect(session.snapshot()).toMatchObject({
            dirty: true,
            saved: '#7162DA',
            saving: false,
        })
        expect(repository.save).toHaveBeenCalledOnce()
        await session.save(false, vi.fn())
        expect(repository.save).toHaveBeenCalledTimes(2)
        expect(session.snapshot().dirty).toBe(false)
    })
})
