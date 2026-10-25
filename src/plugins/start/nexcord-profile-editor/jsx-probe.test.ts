import { describe, expect, it, vi } from 'vitest'
import { ProfileJSXProbe } from './jsx-probe'
import type { ReactElement } from 'react'

describe('profile JSX metadata probe', () => {
    it('stays off until enabled and preserves frozen elements and callbacks', () => {
        const callbacks: ((el: ReactElement) => ReactElement)[] = []
        const remove = vi.fn()
        const register = vi.fn((_type, observe) => {
            callbacks.push(observe)
            return remove
        })
        const probe = new ProfileJSXProbe(register)
        const form = () => null
        probe.inspect({ UserProfileEditForm: form })
        expect(register).not.toHaveBeenCalled()
        expect(probe.snapshot().inspectedModules).toBe(0)
        probe.start()
        probe.inspect({ UserProfileEditForm: form })
        probe.inspect({ UserProfileEditForm: form })
        expect(register).toHaveBeenCalledTimes(1)
        const save = vi.fn()
        const getter = vi.fn(() => 'private value')
        const props = Object.freeze(
            Object.defineProperty(
                { onSave: save, bio: 'private bio', userId: '123' },
                'children',
                { get: getter, enumerable: true },
            ),
        )
        const element = Object.freeze({
            type: form,
            props,
            key: null,
        }) as ReactElement
        expect(callbacks[0](element)).toBe(element)
        expect(probe.snapshot().elementCalls).toBe(1)
        expect(save).not.toHaveBeenCalled()
        expect(getter).not.toHaveBeenCalled()
        const report = JSON.stringify(probe.snapshot())
        expect(report).toContain('onSave:function')
        expect(report).toContain('children:accessor')
        expect(report).not.toMatch(/private bio|private value|userId|123/)
        probe.stop()
        expect(remove).toHaveBeenCalledOnce()
        expect(callbacks[0](element)).toBe(element)
        expect(probe.snapshot().observations).toEqual([])
        probe.start()
        probe.inspect({ UserProfileEditForm: form })
        expect(register).toHaveBeenCalledTimes(2)
    })

    it('skips getters and unsupported exports without invoking them', () => {
        const register = vi.fn(() => () => {})
        const probe = new ProfileJSXProbe(register)
        probe.start()
        const getter = vi.fn(() => () => null)
        probe.inspect(
            Object.defineProperty({}, 'UserProfileEditForm', { get: getter }),
        )
        for (const value of [
            undefined,
            null,
            1,
            'text',
            { UserProfileEditForm: {} },
        ])
            probe.inspect(value)
        expect(getter).not.toHaveBeenCalled()
        expect(register).not.toHaveBeenCalled()
        expect(probe.snapshot().skipped).toContain(
            'UserProfileEditForm: accessor export (not invoked)',
        )
        expect(probe.snapshot().skipped).toContain(
            'UserProfileEditForm: object export (unsupported)',
        )
        expect(probe.snapshot().inspectedModules).toBe(6)
    })

    it('contains inspection failures and still returns the original element', () => {
        let observe!: (element: ReactElement) => ReactElement
        const probe = new ProfileJSXProbe((_type, callback) => {
            observe = callback
            return () => {}
        })
        probe.start()
        probe.inspect(
            new Proxy(
                {},
                {
                    getOwnPropertyDescriptor() {
                        throw new Error('uninspectable')
                    },
                },
            ),
        )
        probe.inspect({ UserProfileEditForm: () => null })
        const element = {
            props: new Proxy(
                {},
                {
                    ownKeys() {
                        throw new Error('uninspectable')
                    },
                },
            ),
        } as ReactElement
        expect(observe(element)).toBe(element)
        expect(probe.snapshot().errors).toBeGreaterThan(0)
    })
})
