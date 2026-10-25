import { NavigationRouteContext } from '@react-navigation/native'
import {
    cloneElement,
    createContext,
    createElement,
    Fragment,
    useContext,
    useEffect,
    useMemo,
    useSyncExternalStore,
} from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { validProfileId } from './local-accent-repository'
import { LocalAccentSession } from './local-accent-session'
import { localAccentSessions } from './local-accent-sessions'
import { nativeAccentRepository } from './native-accent-repository'
import type { Context, ReactElement } from 'react'

const InNativeProfileForm = createContext<LocalAccentSession | null>(null)
const RouteContext = (NavigationRouteContext ??
    createContext(undefined)) as Context<{ key: string } | undefined>
const caption = { color: '#bbb', marginTop: 8 } as const
const subscribeNothing = () => () => {}
const noSession = () => null

export function NativeAccentDraft({
    session,
}: {
    session: LocalAccentSession
}) {
    const draft = useSyncExternalStore(session.subscribe, session.snapshot)
    const valid = draft.valid
    return createElement(
        View,
        {
            accessibilityLabel: 'Nexcord local accent preview',
            style: {
                marginVertical: 16,
                padding: 16,
                borderRadius: 12,
                backgroundColor: '#292930',
            },
        },
        createElement(
            Text,
            { style: { color: '#fff', fontSize: 16, fontWeight: '700' } },
            'Nexcord local cosmetics',
        ),
        createElement(Text, { style: caption }, 'Local accent colour'),
        createElement(TextInput, {
            accessibilityLabel: 'Local accent colour in hexadecimal',
            value: draft.input,
            onChangeText: (input: string) => session.change(input),
            editable: draft.ready && !draft.saving,
            placeholder: '#7162DA',
            placeholderTextColor: '#999',
            autoCapitalize: 'characters',
            autoCorrect: false,
            maxLength: 7,
            style: {
                backgroundColor: '#1d1d23',
                color: '#fff',
                borderRadius: 8,
                padding: 12,
                marginTop: 8,
            },
        }),
        !valid
            ? createElement(
                  Text,
                  {
                      accessibilityRole: 'alert',
                      style: { color: '#ffb4ab', marginTop: 6 },
                  },
                  'Enter # followed by six hexadecimal digits. The preview keeps the last valid colour.',
              )
            : null,
        createElement(View, {
            accessibilityLabel: `Local accent preview ${draft.preview}`,
            style: {
                marginTop: 12,
                height: 64,
                borderRadius: 8,
                backgroundColor: draft.preview,
            },
        }),
        createElement(Text, { style: caption }, `Preview: ${draft.preview}`),
        createElement(
            Pressable,
            {
                accessibilityRole: 'button',
                onPress: () => session.reset(),
                style: { padding: 12, marginTop: 8 },
            },
            createElement(
                Text,
                { style: { color: '#a99cf8' } },
                'Reset local draft',
            ),
        ),
        createElement(Text, { style: caption }, draft.status),
        createElement(
            Text,
            { style: caption },
            draft.headerConnected
                ? 'Use the existing Save button above. Unsaved colour edits are discarded when you close.'
                : 'Native Save is not connected on this screen yet. No local colour can be saved here.',
        ),
    )
}

function NativeThemeAnchor({ original }: { original: ReactElement }) {
    const session = useContext(InNativeProfileForm)
    if (!session) return original
    return createElement(
        Fragment,
        null,
        original,
        createElement(NativeAccentDraft, {
            key: 'nexcord-native-accent-draft',
            session,
        }),
    )
}

function NativeProfileFormScope({ original }: { original: ReactElement }) {
    const route = useContext(RouteContext)
    const user = (original.props as { currentUser?: unknown }).currentUser
    const id =
        user && typeof user === 'object'
            ? Object.getOwnPropertyDescriptor(user, 'id')?.value
            : ''
    const userId = typeof id === 'string' ? id : ''
    // biome-ignore lint/correctness/useExhaustiveDependencies: Route changes require a fresh draft session.
    const session = useMemo(
        () => new LocalAccentSession(nativeAccentRepository, userId),
        [userId, route?.key],
    )
    useEffect(() => {
        const remove =
            route?.key && validProfileId(userId)
                ? localAccentSessions.register(route.key, session)
                : () => session.dispose()
        void session.load()
        return remove
    }, [route?.key, session, userId])
    return createElement(
        InNativeProfileForm.Provider,
        { value: session },
        original,
    )
}

type NativeSaveProps = {
    label?: unknown
    text?: unknown
    disabled?: unknown
    onPress?: unknown
}
function isNativeSaveHeader(
    props: NativeSaveProps,
): props is NativeSaveProps & {
    disabled: boolean
    onPress: (...args: unknown[]) => unknown
} {
    return (
        (props.label ?? props.text) === 'Save' &&
        typeof props.disabled === 'boolean' &&
        typeof props.onPress === 'function'
    )
}
function NativeSaveHeader({ original }: { original: ReactElement }) {
    const route = useContext(RouteContext)
    useSyncExternalStore(
        localAccentSessions.subscribe,
        localAccentSessions.revision,
    )
    const session = localAccentSessions.get(route?.key)
    const draft = useSyncExternalStore(
        session?.subscribe ?? subscribeNothing,
        session?.snapshot ?? noSession,
    )
    useEffect(() => session?.connectHeader(), [session])
    const props = original.props as NativeSaveProps
    if (!session || !draft || !isNativeSaveHeader(props)) return original
    if (!draft.dirty && !draft.saving) return original
    if (!draft.valid && !draft.saving) return original
    const nativeDirty = !props.disabled
    const onPress = props.onPress
    return cloneElement(original as ReactElement<Record<string, unknown>>, {
        disabled: draft.saving || (!nativeDirty && !draft.ready),
        onPress: function (this: unknown, ...args: unknown[]) {
            return session.save(nativeDirty, () =>
                Reflect.apply(onPress, this, args),
            )
        },
    })
}

/** Adds form scope without invoking or changing Discord's form component. */
export function withNativeProfileTestRow(
    element: ReactElement,
    name = 'UserProfileEditForm',
): ReactElement {
    if (name === 'UserProfileEditForm') {
        return createElement(NativeProfileFormScope, {
            key: element.key,
            original: element,
        })
    }
    if (name === 'HeaderTextButton') {
        const props = element.props as NativeSaveProps
        if (!isNativeSaveHeader(props)) return element
        return createElement(NativeSaveHeader, {
            key: element.key,
            original: element,
        })
    }
    if (name === 'UserProfileEditTheme') {
        return createElement(NativeThemeAnchor, {
            key: element.key,
            original: element,
        })
    }
    return element
}
