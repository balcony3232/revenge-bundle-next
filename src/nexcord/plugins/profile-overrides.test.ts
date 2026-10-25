import { describe, expect, it } from 'vitest'
import { ClientProfileOverrides } from './profile-overrides'

const id = '123456789012345678'
describe('client-wide profile overrides', () => {
  it('applies the same override to all supported surfaces', () => {
    const store = new ClientProfileOverrides()
    const original = { username: 'real', displayName: 'Real', id }
    store.set(id, { username: 'custom', displayName: 'Custom', badgeIds: ['local-badge'] })
    store.setEnabled(true)
    for (const surface of ['message', 'member-list', 'dm', 'search', 'mention', 'profile'] as const) {
      expect(store.resolve(id, original, surface).username).toBe('custom')
    }
    expect(original.username).toBe('real')
    expect(store.resolve('987654321098765432', original).username).toBe('real')
  })
  it('disables overrides and notifies subscribers', () => {
    const store = new ClientProfileOverrides()
    let changes = 0
    const unsubscribe = store.subscribe(() => { changes++ })
    store.set(id, { username: 'local' })
    store.setEnabled(true)
    store.setEnabled(false)
    expect(store.resolve(id, { username: 'real' }).username).toBe('real')
    unsubscribe()
    expect(changes).toBe(3)
  })
})
