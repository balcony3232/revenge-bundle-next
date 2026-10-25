export * from './profile-editor'
export * from './permission-inspector'
export * from './permission-simulator'

/** Registry metadata; runtime UI registration is a separate integration step. */
export const NEXCORD_PLUGINS = [
  { id: 'nexcord.profile-editor', name: 'Profile Editor', clientOnly: true },
  { id: 'nexcord.permission-inspector', name: 'Permission Inspector', clientOnly: true },
  { id: 'nexcord.permission-simulator', name: 'Permission Simulator', clientOnly: true, simulation: true },
] as const
