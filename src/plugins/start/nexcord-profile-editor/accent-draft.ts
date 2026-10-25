export const initialAccentDraft = {
    input: '#7162DA',
    preview: '#7162DA',
} as const
export type AccentDraft = { input: string; preview: string }

/** Keeps incomplete input separate from the last valid preview color. */
export function updateAccentDraft(
    previous: AccentDraft,
    input: string,
): AccentDraft {
    return {
        input,
        preview: /^#[0-9a-f]{6}$/i.test(input)
            ? input.toUpperCase()
            : previous.preview,
    }
}

export function isAccentDraftValid(draft: AccentDraft): boolean {
    return /^#[0-9a-f]{6}$/i.test(draft.input)
}
