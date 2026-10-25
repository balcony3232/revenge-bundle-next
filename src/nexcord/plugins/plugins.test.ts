import { describe, expect, it } from 'vitest'
import { applyLocalAppearance, validateAppearance } from './profile-editor'
import { applyChannelOverwrites, hasPermission } from './permission-inspector'
import { simulateAdministrator } from './permission-simulator'

describe('Nexcord plugin foundations', () => {
  it('applies local profile overrides without mutating source', () => {
    const original = { username: 'real', id: '123' }
    const edited = applyLocalAppearance(original, { username: 'local' })
    expect(edited.username).toBe('local')
    expect(original.username).toBe('real')
    expect(validateAppearance({ username: 'x'.repeat(33) })).toBe(false)
  })
  it('preserves 64-bit permissions and channel override precedence', () => {
    const view = 1n << 10n
    const role = 1n << 28n
    expect(hasPermission(role.toString(), 'MANAGE_ROLES')).toBe(true)
    expect(applyChannelOverwrites(view, { allow: 0n, deny: view }, [{ allow: view, deny: 0n }], { allow: 0n, deny: view }) & view).toBe(0n)
  })
  it('never changes real permissions during simulation', () => {
    const result = simulateAdministrator('0')
    expect(result.simulated).toBe(true)
    expect(result.actual.ADMINISTRATOR).toBe(false)
    expect(result.preview.ADMINISTRATOR).toBe(true)
  })
})
