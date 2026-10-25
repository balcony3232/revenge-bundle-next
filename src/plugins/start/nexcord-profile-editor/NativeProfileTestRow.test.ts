import { act, createElement } from 'react'
import { create } from 'react-test-renderer'
import { describe, expect, it, vi } from 'vitest'
import { withNativeProfileTestRow } from './NativeProfileTestRow'
import type { ReactNode } from 'react'

vi.mock('react-native', () => ({
    View: 'View',
    Text: 'Text',
    TextInput: 'TextInput',
    Pressable: 'Pressable',
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true

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
        expect((result.props as { children: ReactNode }).children).toBe(element)
        expect(form).not.toHaveBeenCalled()
        expect(save).not.toHaveBeenCalled()
    })

    it('limits drafts to the form theme slot, preserves native changes, and discards on close', async () => {
        const save = vi.fn()
        const theme = () => createElement('NativeTheme')
        const renderForm = vi.fn((props: { onSave: () => void; bio: string }) =>
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
                createElement(renderForm, { key: 'form', onSave: save, bio }),
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
})
