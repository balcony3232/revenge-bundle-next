import { describe, expect, it, vi } from 'vitest'
import { LocalAccentRepository } from './local-accent-repository'

const self = '123456789012345678'
const other = '987654321098765432'
describe('local accent file', () => {
    it('persists account-scoped colours across repository instances and serializes writes', async () => {
        let disk: string | null = null
        const files = {
            read: async () => disk,
            write: vi.fn(async (contents: string) => {
                disk = contents
            }),
        }
        const repository = new LocalAccentRepository(files)
        expect(await repository.load(self)).toBe('#7162DA')
        await Promise.all([
            repository.save(self, '#aabbcc'),
            repository.save(other, '#112233'),
        ])
        const reopened = new LocalAccentRepository(files)
        expect(await reopened.load(self)).toBe('#AABBCC')
        expect(await reopened.load(other)).toBe('#112233')
        expect(JSON.parse(disk!)).toEqual({
            version: 1,
            colours: { [self]: '#AABBCC', [other]: '#112233' },
        })
    })
    it('propagates write failures and permits a retry without changing other accounts', async () => {
        let disk = JSON.stringify({
            version: 1,
            colours: { [other]: '#123456' },
        })
        const files = {
            read: async () => disk,
            write: vi.fn(async (contents: string) => {
                disk = contents
            }),
        }
        files.write.mockRejectedValueOnce(Error('disk full'))
        const repository = new LocalAccentRepository(files)
        await expect(repository.save(self, '#000000')).rejects.toThrow(
            'disk full',
        )
        expect(await repository.load(self)).toBe('#7162DA')
        await repository.save(self, '#000000')
        expect(await repository.load(other)).toBe('#123456')
    })
    it('does not overwrite malformed files or accept invalid IDs and colours', async () => {
        const files = { read: async () => '{broken', write: vi.fn() }
        const repository = new LocalAccentRepository(files)
        await expect(repository.save(self, '#000000')).rejects.toThrow()
        await expect(repository.save('__proto__', '#000000')).rejects.toThrow()
        await expect(repository.save(self, 'red')).rejects.toThrow()
        await expect(repository.load('invalid')).rejects.toThrow()
        expect(files.write).not.toHaveBeenCalled()
    })
})
