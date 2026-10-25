import { initialAccentDraft } from './accent-draft'

export interface AccentRepository {
    load(userId: string): Promise<string>
    save(userId: string, colour: string): Promise<void>
}

export function validProfileId(userId: string): boolean {
    return /^\d{16,22}$/.test(userId)
}

/** Stores account-scoped colors using local file operations only. */
export class LocalAccentRepository implements AccentRepository {
    private writes: Promise<void> = Promise.resolve()

    constructor(
        private files: {
            read(): Promise<string | null>
            write(contents: string): Promise<void>
        },
    ) {}

    private async readColours(): Promise<Record<string, string>> {
        const contents = await this.files.read()
        if (contents === null) return {}
        const document = JSON.parse(contents)
        if (
            document?.version !== 1 ||
            !document.colours ||
            typeof document.colours !== 'object' ||
            Array.isArray(document.colours)
        )
            throw Error('Invalid local accent file')
        const colours: Record<string, string> = {}
        for (const [id, colour] of Object.entries(document.colours)) {
            if (
                validProfileId(id) &&
                typeof colour === 'string' &&
                /^#[0-9a-f]{6}$/i.test(colour)
            )
                colours[id] = colour.toUpperCase()
        }
        return colours
    }

    async load(userId: string): Promise<string> {
        if (!validProfileId(userId)) throw Error('Invalid profile ID')
        await this.writes
        return (await this.readColours())[userId] ?? initialAccentDraft.preview
    }

    save(userId: string, colour: string): Promise<void> {
        if (!validProfileId(userId) || !/^#[0-9a-f]{6}$/i.test(colour))
            return Promise.reject(Error('Invalid local accent'))
        const write = this.writes.then(async () => {
            const colours = await this.readColours()
            colours[userId] = colour.toUpperCase()
            await this.files.write(JSON.stringify({ version: 1, colours }))
        })
        this.writes = write.catch(() => {})
        return write
    }
}
