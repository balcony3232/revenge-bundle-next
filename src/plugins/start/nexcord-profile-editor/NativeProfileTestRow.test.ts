import { createElement, Fragment } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { withNativeProfileTestRow } from './NativeProfileTestRow'
import type { ReactElement, ReactNode } from 'react'

vi.mock('react-native', () => ({ View: 'View', Text: 'Text' }))

describe('native profile information row', () => {
    it('preserves the original keyed form, props and Save callback without rendering it', () => {
        const form = vi.fn((_props: { onSave: () => void }) => null)
        const save = vi.fn()
        const element = createElement(form, {
            key: 'discord-form',
            onSave: save,
        })
        const result = withNativeProfileTestRow(element)
        expect(result.type).toBe(Fragment)
        expect(result.key).toBe(element.key)
        const children = (result.props as { children: ReactNode[] }).children
        expect(children[0]).toBe(element)
        expect(children).toHaveLength(2)
        expect((children[1] as ReactElement).key).toBe(
            'nexcord-native-profile-test-row',
        )
        expect(form).not.toHaveBeenCalled()
        expect(save).not.toHaveBeenCalled()
    })
})
