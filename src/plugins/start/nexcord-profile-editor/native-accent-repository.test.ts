import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nativeAccentRepository } from './native-accent-repository'

const disk = vi.hoisted(() => ({
    contents: null as string | null,
    ignoreWrites: false,
    write: vi.fn(),
}))
vi.mock('@revenge-mod/json-storage', () => ({
    pluginStoragePathFor: (id: string, file: string) => `/local/${id}/${file}`,
}))
vi.mock('@revenge-mod/modules/native/fs', () => ({
    exists: async () => disk.contents !== null,
    readFile: async () => disk.contents,
    writeFile: async (path: string, contents: string) => {
        disk.write(path, contents)
        if (!disk.ignoreWrites) disk.contents = contents
    },
}))
beforeEach(() => {
    disk.contents = null
    disk.ignoreWrites = false
    disk.write.mockClear()
})
describe('native accent persistence adapter', () => {
    it('uses only the local plugin file and verifies the result', async () => {
        await nativeAccentRepository.save('123456789012345678', '#FF5500')
        expect(disk.write.mock.calls[0][0]).toBe(
            '/local/nexcord.profile-editor/native-accent.json',
        )
        expect(await nativeAccentRepository.load('123456789012345678')).toBe(
            '#FF5500',
        )
    })
    it('rejects a silently ignored write', async () => {
        disk.ignoreWrites = true
        await expect(
            nativeAccentRepository.save('123456789012345678', '#FF5500'),
        ).rejects.toThrow('verification failed')
    })
})
