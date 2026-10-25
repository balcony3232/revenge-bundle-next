import {
    createContext,
    createElement,
    Fragment,
    useContext,
    useState,
} from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import {
    initialAccentDraft,
    isAccentDraftValid,
    updateAccentDraft,
} from './accent-draft'
import type { ReactElement } from 'react'
import type { AccentDraft } from './accent-draft'

const InNativeProfileForm = createContext(false)
const caption = { color: '#bbb', marginTop: 8 } as const

export function NativeAccentDraft() {
    const [draft, setDraft] = useState<AccentDraft>(() => ({
        ...initialAccentDraft,
    }))
    const valid = isAccentDraftValid(draft)
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
        createElement(
            Text,
            { style: caption },
            'Local accent colour (preview only)',
        ),
        createElement(TextInput, {
            accessibilityLabel: 'Local accent colour in hexadecimal',
            value: draft.input,
            onChangeText: (input: string) =>
                setDraft(previous => updateAccentDraft(previous, input)),
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
                onPress: () => setDraft({ ...initialAccentDraft }),
                style: { padding: 12, marginTop: 8 },
            },
            createElement(
                Text,
                { style: { color: '#a99cf8' } },
                'Reset local preview',
            ),
        ),
        createElement(
            Text,
            { style: caption },
            'This draft stays in this editor. Discord Save does not save it yet. Closing the editor discards it. Your Discord profile is unchanged.',
        ),
    )
}

function NativeThemeAnchor({ original }: { original: ReactElement }) {
    const insideForm = useContext(InNativeProfileForm)
    if (!insideForm) return original
    return createElement(
        Fragment,
        null,
        original,
        createElement(NativeAccentDraft, {
            key: 'nexcord-native-accent-draft',
        }),
    )
}

/** Adds form scope without invoking or changing Discord's form component. */
export function withNativeProfileTestRow(
    element: ReactElement,
    name = 'UserProfileEditForm',
): ReactElement {
    if (name === 'UserProfileEditForm') {
        return createElement(
            InNativeProfileForm.Provider,
            { key: element.key, value: true },
            element,
        )
    }
    if (name === 'UserProfileEditTheme') {
        return createElement(NativeThemeAnchor, {
            key: element.key,
            original: element,
        })
    }
    return element
}
