import { describe, expect, it } from 'vitest'
import {
    initialAccentDraft,
    isAccentDraftValid,
    updateAccentDraft,
} from './accent-draft'

describe('local accent draft', () => {
    it('accepts RGB hex input without changing the previous draft', () => {
        const before = Object.freeze({ ...initialAccentDraft })
        expect(updateAccentDraft(before, '#aabbcc')).toEqual({
            input: '#aabbcc',
            preview: '#AABBCC',
        })
        expect(before).toEqual(initialAccentDraft)
    })
    it('keeps the valid preview for incomplete and invalid input', () => {
        const before = updateAccentDraft(initialAccentDraft, '#112233')
        for (const input of [
            '',
            '#',
            '#FFF',
            'red',
            '#GG0000',
            '#1234567',
            '123456',
        ]) {
            const draft = updateAccentDraft(before, input)
            expect(draft.preview).toBe('#112233')
            expect(isAccentDraftValid(draft)).toBe(false)
        }
    })
})
