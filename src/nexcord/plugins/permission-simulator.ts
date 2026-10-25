import { inspectPermissions, parseBits, type PermissionBits, type PermissionName } from './permission-inspector'

/** Preview only: never use this output for authorization or API requests. */
export interface PermissionSimulation {
  simulated: true
  label: 'SIMULATED — NOT REAL SERVER PERMISSIONS'
  actual: Record<PermissionName, boolean>
  preview: Record<PermissionName, boolean>
  differences: PermissionName[]
}
export function simulatePermissions(actualBits: PermissionBits, previewBits: PermissionBits): PermissionSimulation {
  const actual = inspectPermissions(parseBits(actualBits))
  const preview = inspectPermissions(parseBits(previewBits))
  return {
    simulated: true,
    label: 'SIMULATED — NOT REAL SERVER PERMISSIONS',
    actual, preview,
    differences: (Object.keys(actual) as PermissionName[]).filter(name => actual[name] !== preview[name]),
  }
}
export function simulateAdministrator(actualBits: PermissionBits): PermissionSimulation {
  return simulatePermissions(actualBits, 1n << 3n)
}
