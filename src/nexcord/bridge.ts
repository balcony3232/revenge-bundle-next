/**
 * Nexcord Bridge v1 — transport-independent draft validation.
 *
 * No Discord account tokens, automatic sending, or background transmission.
 * Transport and user confirmation will be implemented separately.
 */
export const NEXCORD_BRIDGE_VERSION = 1 as const

export type NexcordEmbedDraft = {
    title?: string
    description?: string
    color?: number
    url?: string
    footer?: string
    fields?: Array<{ name: string; value: string; inline?: boolean }>
}

export type NexcordBridgeMessage = {
    protocol: 'nexcord.bridge'
    version: typeof NEXCORD_BRIDGE_VERSION
    type: 'embed.draft'
    payload: NexcordEmbedDraft
}

export function validateBridgeMessage(value: unknown): value is NexcordBridgeMessage {
    if (!value || typeof value !== 'object') return false
    const message = value as Record<string, unknown>
    if (message.protocol !== 'nexcord.bridge' || message.version !== 1 || message.type !== 'embed.draft') return false
    const draft = message.payload
    if (!draft || typeof draft !== 'object' || Array.isArray(draft)) return false
    const d = draft as Record<string, unknown>
    if (d.title !== undefined && (typeof d.title !== 'string' || d.title.length > 256)) return false
    if (d.description !== undefined && (typeof d.description !== 'string' || d.description.length > 4096)) return false
    if (d.footer !== undefined && (typeof d.footer !== 'string' || d.footer.length > 2048)) return false
    if (d.url !== undefined && (typeof d.url !== 'string' || !/^https:\/\//.test(d.url) || d.url.length > 2048)) return false
    if (d.color !== undefined && (!Number.isInteger(d.color) || (d.color as number) < 0 || (d.color as number) > 0xffffff)) return false
    if (d.fields !== undefined) {
        if (!Array.isArray(d.fields) || d.fields.length > 25) return false
        for (const field of d.fields) {
            if (!field || typeof field !== 'object' || typeof field.name !== 'string' || typeof field.value !== 'string') return false
            if (field.name.length > 256 || field.value.length > 1024) return false
            if (field.inline !== undefined && typeof field.inline !== 'boolean') return false
        }
    }
    return true
}
