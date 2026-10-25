import {
    initialAccentDraft,
    isAccentDraftValid,
    updateAccentDraft,
} from './accent-draft'
import type { AccentRepository } from './local-accent-repository'

export type AccentSessionState = {
    input: string
    preview: string
    saved: string
    ready: boolean
    saving: boolean
    valid: boolean
    dirty: boolean
    headerConnected: boolean
    status: string
}
type NativeAttempt = {
    colour: string
    submitted: boolean
    succeeded: boolean
    failed: boolean
}

/** Keeps drafts outside Discord stores and commits only explicit Save operations. */
export class LocalAccentSession {
    private state: AccentSessionState = {
        ...initialAccentDraft,
        saved: initialAccentDraft.preview,
        ready: false,
        saving: false,
        valid: true,
        dirty: false,
        headerConnected: false,
        status: 'Loading local accent…',
    }
    private listeners = new Set<() => void>()
    private alive = true
    private headers = 0
    private attempt: NativeAttempt | undefined
    private completion: Promise<void> = Promise.resolve()
    private loadVersion = 0

    constructor(
        private repository: AccentRepository,
        private userId: string,
    ) {}

    snapshot = () => this.state
    subscribe = (listener: () => void) => {
        this.listeners.add(listener)
        return () => {
            this.listeners.delete(listener)
        }
    }

    private update(patch: Partial<AccentSessionState>): void {
        if (!this.alive) return
        const next = { ...this.state, ...patch }
        next.valid = isAccentDraftValid(next)
        next.dirty = next.input.toUpperCase() !== next.saved
        this.state = next
        for (const listener of this.listeners) listener()
    }

    async load(): Promise<void> {
        this.alive = true
        const version = ++this.loadVersion
        try {
            const saved = await this.repository.load(this.userId)
            if (version !== this.loadVersion || !this.alive) return
            this.update({
                input: saved,
                preview: saved,
                saved,
                ready: true,
                status: 'Change the colour, then use the existing Save button.',
            })
        } catch {
            if (version !== this.loadVersion || !this.alive) return
            this.update({
                status: 'Could not load the local accent. Discord editing is unchanged.',
            })
        }
    }

    change(input: string): void {
        if (!this.state.ready || this.state.saving) return
        this.update({
            ...updateAccentDraft(this.state, input),
            status: 'Local draft is unsaved.',
        })
    }

    reset(): void {
        if (!this.state.ready || this.state.saving) return
        this.update({
            input: this.state.saved,
            preview: this.state.saved,
            status: 'Local draft reset to the saved colour.',
        })
    }

    connectHeader(): () => void {
        this.headers++
        this.update({ headerConnected: true })
        return () => {
            this.headers--
            this.update({ headerConnected: this.headers > 0 })
        }
    }

    event(type: string): void {
        const attempt = this.attempt
        if (!attempt) return
        if (type === 'USER_PROFILE_SETTINGS_SUBMIT') attempt.submitted = true
        if (
            type === 'USER_PROFILE_SETTINGS_SUBMIT_SUCCESS' &&
            attempt.submitted
        )
            attempt.succeeded = true
        if (type === 'USER_PROFILE_SETTINGS_SUBMIT_FAILURE')
            attempt.failed = true
        if (
            type === 'USER_PROFILE_SETTINGS_RESET_AND_CLOSE_FORM' &&
            !attempt.succeeded
        )
            attempt.failed = true
    }

    private async persist(colour: string): Promise<void> {
        try {
            await this.repository.save(this.userId, colour)
            this.update({
                saved: colour,
                saving: false,
                status: 'Accent saved on this device. No cosmetic value was sent to Discord.',
            })
        } catch {
            this.update({
                saving: false,
                status: 'Could not save locally. Your draft is still unsaved. Try Save again.',
            })
        }
    }

    save(nativeDirty: boolean, invokeNative: () => unknown): unknown {
        if (!this.alive) return nativeDirty ? invokeNative() : undefined
        if (this.state.saving) return undefined
        if (!this.state.ready || !this.state.valid || !this.state.dirty)
            return nativeDirty ? invokeNative() : undefined
        const colour = this.state.input.toUpperCase()
        this.update({
            saving: true,
            status: nativeDirty
                ? 'Waiting for Discord to finish the normal profile save…'
                : 'Saving accent on this device…',
        })
        if (!nativeDirty) {
            this.completion = this.persist(colour)
            return this.completion
        }

        const attempt: NativeAttempt = {
            colour,
            submitted: false,
            succeeded: false,
            failed: false,
        }
        this.attempt = attempt
        let result: unknown
        try {
            result = invokeNative()
        } catch (error) {
            this.attempt = undefined
            this.update({
                saving: false,
                status: 'Discord Save failed. The local accent was not saved.',
            })
            throw error
        }
        if (
            !result ||
            typeof (result as PromiseLike<unknown>).then !== 'function'
        ) {
            this.attempt = undefined
            this.update({
                saving: false,
                status: 'Normal Save was passed to Discord. Its completion could not be verified, so the local accent remains unsaved.',
            })
            return result
        }
        this.completion = Promise.resolve(result).then(
            () => {
                if (this.attempt !== attempt) return
                this.attempt = undefined
                if (
                    !attempt.submitted ||
                    !attempt.succeeded ||
                    attempt.failed
                ) {
                    this.update({
                        saving: false,
                        status: 'Discord Save was not confirmed successful. The local accent remains unsaved.',
                    })
                    return
                }
                return this.persist(attempt.colour)
            },
            () => {
                if (this.attempt !== attempt) return
                this.attempt = undefined
                this.update({
                    saving: false,
                    status: 'Discord Save failed. The local accent remains unsaved.',
                })
            },
        )
        return result
    }

    dispose(): void {
        this.alive = false
        this.loadVersion++
        if (this.attempt && !this.attempt.succeeded) this.attempt.failed = true
        this.listeners.clear()
    }

    whenIdle(): Promise<void> {
        return this.completion
    }
    cancel(): void {
        this.attempt = undefined
        this.dispose()
    }
}
