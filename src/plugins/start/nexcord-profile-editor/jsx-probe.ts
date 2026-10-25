import type { ComponentType, ReactElement } from 'react'

const targets = ['UserSettingsEditUserProfile', 'UserProfileEditForm'] as const
const sensitive =
    /token|secret|password|email|phone|session|auth|cookie|user.?id/i
type Register = (
    type: ComponentType,
    observe: (element: ReactElement) => ReactElement,
) => () => unknown
export type JSXProbeSnapshot = {
    active: boolean
    attached: string[]
    observations: string[]
    errors: number
}

/** Observes element metadata without changing elements or calling form callbacks. */
export class ProfileJSXProbe {
    private active = false
    private registrations = new Map<ComponentType, () => unknown>()
    private attached = new Set<string>()
    private observations = new Map<string, string>()
    private errors = 0

    constructor(private register: Register) {}

    start(): void {
        this.active = true
    }

    inspect(namespace: unknown): void {
        if (
            !this.active ||
            !namespace ||
            (typeof namespace !== 'object' && typeof namespace !== 'function')
        )
            return
        for (const name of targets) {
            try {
                const descriptor = Object.getOwnPropertyDescriptor(
                    namespace,
                    name,
                )
                const type = descriptor?.value
                if (typeof type !== 'function' || this.registrations.has(type))
                    continue
                const remove = this.register(type, element => {
                    if (this.active) {
                        try {
                            const descriptors =
                                Object.getOwnPropertyDescriptors(
                                    element.props ?? {},
                                )
                            const shape = Object.keys(descriptors)
                                .filter(key => !sensitive.test(key))
                                .slice(0, 40)
                                .map(key => {
                                    const prop = descriptors[key]
                                    return `${key.slice(0, 80)}:${prop.get || prop.set ? 'accessor' : typeof prop.value}`
                                })
                                .join(', ')
                            this.observations.set(
                                name,
                                shape || '(no non-sensitive props)',
                            )
                        } catch {
                            this.errors++
                        }
                    }
                    return element
                })
                this.registrations.set(type, remove)
                this.attached.add(name)
            } catch {
                this.errors++
            }
        }
    }

    snapshot(): JSXProbeSnapshot {
        return {
            active: this.active,
            attached: [...this.attached],
            observations: [...this.observations].map(
                ([name, shape]) => `${name}: ${shape}`,
            ),
            errors: this.errors,
        }
    }

    stop(): void {
        this.active = false
        for (const remove of this.registrations.values()) {
            try {
                remove()
            } catch {
                this.errors++
            }
        }
        this.registrations.clear()
        this.attached.clear()
        this.observations.clear()
    }
}
