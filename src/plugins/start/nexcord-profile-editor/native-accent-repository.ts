import { pluginStoragePathFor } from '@revenge-mod/json-storage'
import { exists, readFile, writeFile } from '@revenge-mod/modules/native/fs'
import { LocalAccentRepository } from './local-accent-repository'

const path = pluginStoragePathFor(
    'nexcord.profile-editor',
    'native-accent.json',
)
export const nativeAccentRepository = new LocalAccentRepository({
    read: async () => ((await exists(path)) ? readFile(path) : null),
    write: async contents => {
        await writeFile(path, contents)
        if ((await readFile(path)) !== contents)
            throw Error('Local accent write verification failed')
    },
})
