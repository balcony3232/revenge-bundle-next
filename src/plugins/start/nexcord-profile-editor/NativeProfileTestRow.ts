import { createElement, Fragment } from 'react'
import { Text, View } from 'react-native'
import type { ReactElement } from 'react'

function NativeProfileTestRow() {
    return createElement(
        View,
        {
            accessibilityLabel: 'Nexcord local cosmetics connection test',
            style: {
                margin: 16,
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
            { style: { color: '#bbb', marginTop: 6 } },
            'Connection test only. Local cosmetic editing is not enabled yet.',
        ),
    )
}

/** Keeps Discord's element and props intact beside an informational row. */
export function withNativeProfileTestRow(element: ReactElement): ReactElement {
    return createElement(
        Fragment,
        { key: element.key },
        element,
        createElement(NativeProfileTestRow, {
            key: 'nexcord-native-profile-test-row',
        }),
    )
}
