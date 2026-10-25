/** Discord permission bitfield inspector. Operates on data the account can already access. */
export const PERMISSIONS = {
  CREATE_INSTANT_INVITE: 0n, KICK_MEMBERS: 1n, BAN_MEMBERS: 2n,
  ADMINISTRATOR: 3n, MANAGE_CHANNELS: 4n, MANAGE_GUILD: 5n,
  ADD_REACTIONS: 6n, VIEW_AUDIT_LOG: 7n, VIEW_CHANNEL: 10n,
  SEND_MESSAGES: 11n, MANAGE_MESSAGES: 13n, EMBED_LINKS: 14n,
  ATTACH_FILES: 15n, READ_MESSAGE_HISTORY: 16n, MENTION_EVERYONE: 17n,
  CONNECT: 20n, SPEAK: 21n, MUTE_MEMBERS: 22n, DEAFEN_MEMBERS: 23n,
  MOVE_MEMBERS: 24n, MANAGE_NICKNAMES: 27n, MANAGE_ROLES: 28n,
  MANAGE_WEBHOOKS: 29n, MANAGE_EMOJIS_AND_STICKERS: 30n,
  MODERATE_MEMBERS: 40n, VIEW_CREATOR_MONETIZATION_ANALYTICS: 41n,
  SEND_VOICE_MESSAGES: 46n,
} as const
export type PermissionName = keyof typeof PERMISSIONS
export type PermissionBits = bigint | string | number
export function parseBits(value: PermissionBits): bigint {
  if (typeof value === 'number' && (!Number.isSafeInteger(value) || value < 0)) throw new Error('Unsafe permission number: use decimal string')
  const bits = BigInt(value)
  if (bits < 0n) throw new Error('Negative permissions')
  return bits
}
export function hasPermission(bits: PermissionBits, name: PermissionName): boolean {
  const value = parseBits(bits)
  return (value & (1n << PERMISSIONS.ADMINISTRATOR)) !== 0n || (value & (1n << PERMISSIONS[name])) !== 0n
}
export function inspectPermissions(bits: PermissionBits): Record<PermissionName, boolean> {
  return Object.fromEntries((Object.keys(PERMISSIONS) as PermissionName[]).map(name => [name, hasPermission(bits, name)])) as Record<PermissionName, boolean>
}
export function applyChannelOverwrites(base: PermissionBits, everyone: {allow: PermissionBits; deny: PermissionBits}, roles: Array<{allow: PermissionBits; deny: PermissionBits}>, member?: {allow: PermissionBits; deny: PermissionBits}): bigint {
  let result = parseBits(base)
  if (hasPermission(result, 'ADMINISTRATOR')) return result
  const apply = (allow: bigint, deny: bigint) => { result = (result & ~deny) | allow }
  apply(parseBits(everyone.allow), parseBits(everyone.deny))
  let roleAllow = 0n, roleDeny = 0n
  for (const role of roles) { roleAllow |= parseBits(role.allow); roleDeny |= parseBits(role.deny) }
  apply(roleAllow, roleDeny)
  if (member) apply(parseBits(member.allow), parseBits(member.deny))
  return result
}
