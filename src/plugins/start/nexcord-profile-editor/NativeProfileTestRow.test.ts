import { NavigationRouteContext } from '@react-navigation/native'
import { act, createElement, Fragment } from 'react'
import { create } from 'react-test-renderer'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { localAccentSessions } from './local-accent-sessions'
import { withNativeProfileTestRow } from './NativeProfileTestRow'

vi.mock('react-native', () => ({
    View: 'View',
    Text: 'Text',
    TextInput: 'TextInput',
    Pressable: 'Pressable',
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true
const fake = vi.hoisted(() => ({
    colours: new Map<string, string>(),
    save: vi.fn(),
}))
vi.mock('@react-navigation/native', async () => {
    const { createContext } = await import('react')
    return { NavigationRouteContext: createContext({ key: 'profile' }) }
})
vi.mock('./native-accent-repository', () => ({
    nativeAccentRepository: {
        load: async (id: string) => fake.colours.get(id) ?? '#7162DA',
        save: async (id: string, colour: string) => {
            fake.save(id, colour)
            fake.colours.set(id, colour)
        },
    },
}))
beforeEach(() => {
    localAccentSessions.stop()
    fake.colours.clear()
    fake.save.mockClear()
})

it('preserves the native callback receiver, arguments, and promise for mixed edits', async () => {
    const receiver = { native: true }
    const payload = Object.freeze({ nativeField: 'unchanged' })
    let finish!: () => void
    const nativeResult = new Promise<void>(resolve => {
        finish = resolve
    })
    const nativeSave = vi.fn(function (this: unknown, value: unknown) {
        expect(this).toBe(receiver)
        expect(value).toBe(payload)
        localAccentSessions.event('USER_PROFILE_SETTINGS_SUBMIT')
        return nativeResult
    })
    const theme = () => createElement('NativeTheme')
    const header = (props: object) => createElement('NativeSaveButton', props)
    const form = (props: { currentUser: { id: string } }) =>
        createElement(
            'NativeForm',
            props,
            withNativeProfileTestRow(
                createElement(theme),
                'UserProfileEditTheme',
            ),
        )
    let renderer!: ReturnType<typeof create>
    await act(async () => {
        renderer = create(
            createElement(
                Fragment,
                null,
                withNativeProfileTestRow(
                    createElement(header, {
                        text: 'Save',
                        disabled: false,
                        onPress: nativeSave,
                    }),
                    'HeaderTextButton',
                ),
                withNativeProfileTestRow(
                    createElement(form, {
                        currentUser: { id: '123456789012345678' },
                    }),
                ),
            ),
        )
    })
    await act(async () => {
        renderer.root.findByType('TextInput').props.onChangeText('#FF5500')
    })
    await act(async () => {
        const result = renderer.root
            .findByType('NativeSaveButton')
            .props.onPress.call(receiver, payload)
        expect(result).toBe(nativeResult)
        expect(fake.save).not.toHaveBeenCalled()
        localAccentSessions.event('USER_PROFILE_SETTINGS_SUBMIT_SUCCESS')
        finish()
        await result
    })
    expect(nativeSave).toHaveBeenCalledOnce()
    expect(fake.save).toHaveBeenCalledExactlyOnceWith(
        '123456789012345678',
        '#FF5500',
    )
    await act(async () => {
        renderer.unmount()
    })
})

describe('native profile information row', () => {
    it('preserves the original keyed form, props and Save callback without rendering it', () => {
        const form = vi.fn((_props: { onSave: () => void }) => null)
        const save = vi.fn()
        const element = createElement(form, {
            key: 'discord-form',
            onSave: save,
        })
        const result = withNativeProfileTestRow(element)
        expect(result.key).toBe(element.key)
        expect((result.props as { original: unknown }).original).toBe(element)
        expect(form).not.toHaveBeenCalled()
        expect(save).not.toHaveBeenCalled()
    })

    it('limits drafts to the form theme slot, preserves native changes, and discards on close', async () => {
        const save = vi.fn()
        const theme = () => createElement('NativeTheme')
        const renderForm = vi.fn(
            (props: {
                onSave: () => void
                bio: string
                currentUser: { id: string }
            }) =>
                createElement(
                    'NativeForm',
                    props,
                    withNativeProfileTestRow(
                        createElement(theme, { key: 'theme' }),
                        'UserProfileEditTheme',
                    ),
                ),
        )
        const makeForm = (bio: string) =>
            withNativeProfileTestRow(
                createElement(renderForm, {
                    key: 'form',
                    onSave: save,
                    bio,
                    currentUser: { id: '123456789012345678' },
                }),
            )
        let renderer!: ReturnType<typeof create>
        await act(async () => {
            renderer = create(makeForm('original'))
        })
        const field = () => renderer.root.findByType('TextInput')
        await act(async () => {
            field().props.onChangeText('#ff0000')
        })
        expect(
            renderer.root.findByProps({
                accessibilityLabel: 'Local accent preview #FF0000',
            }),
        ).toBeTruthy()
        await act(async () => {
            field().props.onChangeText('#GG')
        })
        expect(field().props.value).toBe('#GG')
        expect(
            renderer.root.findByProps({ accessibilityRole: 'alert' }),
        ).toBeTruthy()
        expect(
            renderer.root.findByProps({
                accessibilityLabel: 'Local accent preview #FF0000',
            }),
        ).toBeTruthy()
        await act(async () => {
            renderer.update(makeForm('normal native edit'))
        })
        expect(field().props.value).toBe('#GG')
        expect(renderer.root.findByType('NativeForm').props.bio).toBe(
            'normal native edit',
        )
        expect(renderer.root.findByType('NativeForm').props.onSave).toBe(save)
        expect(renderer.root.findByType('NativeForm').props).not.toHaveProperty(
            'accentColor',
        )
        expect(save).not.toHaveBeenCalled()
        await act(async () => {
            renderer.root.findByType('Pressable').props.onPress()
        })
        expect(field().props.value).toBe('#7162DA')
        await act(async () => {
            field().props.onChangeText('#123456')
        })
        await act(async () => {
            renderer.unmount()
        })
        await act(async () => {
            renderer = create(makeForm('reopened'))
        })
        expect(field().props.value).toBe('#7162DA')
        await act(async () => {
            renderer.unmount()
        })

        await act(async () => {
            renderer = create(
                withNativeProfileTestRow(
                    createElement(theme),
                    'UserProfileEditTheme',
                ),
            )
        })
        expect(renderer.root.findAllByType('TextInput')).toHaveLength(0)
        await act(async () => {
            renderer.unmount()
        })
    })

    it('enables the same Save button for local-only edits, bypasses native submit, and restores the saved colour', async () => {
        const nativeSave = vi.fn()
        const theme = () => createElement('NativeTheme')
        const header = (props: object) =>
            createElement('NativeSaveButton', props)
        const form = (props: { currentUser: { id: string } }) =>
            createElement(
                'NativeForm',
                props,
                withNativeProfileTestRow(
                    createElement(theme),
                    'UserProfileEditTheme',
                ),
            )
        const screen = (userId = '123456789012345678') =>
            createElement(
                Fragment,
                null,
                withNativeProfileTestRow(
                    createElement(header, {
                        key: 'save',
                        text: 'Save',
                        disabled: true,
                        onPress: nativeSave,
                    }),
                    'HeaderTextButton',
                ),
                withNativeProfileTestRow(
                    createElement(form, {
                        key: 'form',
                        currentUser: { id: userId },
                    }),
                ),
            )
        let renderer!: ReturnType<typeof create>
        await act(async () => {
            renderer = create(screen())
        })
        const button = () => renderer.root.findByType('NativeSaveButton')
        const field = () => renderer.root.findByType('TextInput')
        expect(button().props.disabled).toBe(true)
        await act(async () => {
            field().props.onChangeText('#FF5500')
        })
        expect(button().props.disabled).toBe(false)
        await act(async () => {
            await button().props.onPress()
        })
        expect(nativeSave).not.toHaveBeenCalled()
        expect(fake.save).toHaveBeenCalledExactlyOnceWith(
            '123456789012345678',
            '#FF5500',
        )
        expect(button().props.disabled).toBe(true)
        await act(async () => {
            renderer.unmount()
        })
        await act(async () => {
            renderer = create(screen())
        })
        expect(field().props.value).toBe('#FF5500')
        await act(async () => {
            renderer.update(screen('987654321098765432'))
        })
        expect(field().props.value).toBe('#7162DA')
        await act(async () => {
            renderer.unmount()
        })
    })

    it('leaves Save on another route unchanged while a local draft is dirty', async () => {
        const nativeSave = vi.fn()
        const theme = () => createElement('NativeTheme')
        const header = (props: object) =>
            createElement('NativeSaveButton', props)
        const form = (props: { currentUser: { id: string } }) =>
            createElement(
                'NativeForm',
                props,
                withNativeProfileTestRow(
                    createElement(theme),
                    'UserProfileEditTheme',
                ),
            )
        let renderer!: ReturnType<typeof create>
        await act(async () => {
            renderer = create(
                createElement(
                    Fragment,
                    null,
                    createElement(
                        NavigationRouteContext.Provider,
                        { value: { key: 'other' } as never },
                        withNativeProfileTestRow(
                            createElement(header, {
                                text: 'Save',
                                disabled: true,
                                onPress: nativeSave,
                            }),
                            'HeaderTextButton',
                        ),
                    ),
                    withNativeProfileTestRow(
                        createElement(form, {
                            currentUser: { id: '123456789012345678' },
                        }),
                    ),
                ),
            )
        })
        await act(async () => {
            renderer.root.findByType('TextInput').props.onChangeText('#FF5500')
        })
        const button = renderer.root.findByType('NativeSaveButton')
        expect(button.props.disabled).toBe(true)
        expect(button.props.onPress).toBe(nativeSave)
        await act(async () => {
            renderer.unmount()
        })
    })
})
