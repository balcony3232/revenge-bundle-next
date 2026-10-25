import { mInitialized } from '@revenge-mod/modules/metro/patches'
import { getInitializedModuleExports } from '@revenge-mod/modules/metro/utils'

export type DiagnosticResult = { scanned: number; totalMatches: number; matches: { id: number; hints: string[] }[] }
const relevant = /profile|customi[sz]|avatar|decoration|nameplate|banner|effect/i
const sensitive = /token|secret|password|email|phone|session|auth|cookie|message|guild|user.?id/i

/** Scans only initialized Metro module metadata. No source, values or user data. */
export function scanProfileModules(): DiagnosticResult {
  const matches: DiagnosticResult['matches'] = []
  let scanned = 0
  for (const id of mInitialized) {
    scanned++
    try {
      const exports = getInitializedModuleExports(id)
      if (!exports || (typeof exports !== 'object' && typeof exports !== 'function')) continue
      const hints = new Set<string>()
      for (const key of Object.keys(exports).slice(0, 80)) {
        if (sensitive.test(key)) continue
        if (relevant.test(key)) hints.add(key.slice(0, 90))
        const value = (exports as Record<string, unknown>)[key]
        if (typeof value === 'function') {
          const name = (value as { displayName?: string }).displayName || value.name
          if (typeof name === 'string' && relevant.test(name) && !sensitive.test(name)) hints.add(name.slice(0, 90))
        }
      }
      if (typeof exports === 'function') {
        const name = (exports as { displayName?: string }).displayName || exports.name
        if (typeof name === 'string' && relevant.test(name) && !sensitive.test(name)) hints.add(name.slice(0, 90))
      }
      if (hints.size) matches.push({ id, hints: [...hints].slice(0, 12) })
    } catch {
      // Uninspectable modules are skipped.
    }
  }
  const priority = /customi[sz]|profile.?edit|profile.?setting|userprofile|profile.?effect|avatar.?decoration/i
  matches.sort((a, b) => Number(priority.test(b.hints.join(' '))) - Number(priority.test(a.hints.join(' '))))
  return { scanned, totalMatches: matches.length, matches: matches.slice(0, 250) }
}

export function formatDiagnosticReport(result: DiagnosticResult): string {
  return [
    'Nexcord profile module diagnostics v1',
    'Metadata only; no account identifiers or message contents',
    'Initialized modules scanned: ' + result.scanned,
    'Matching modules: ' + result.totalMatches + ' (showing up to 250 prioritized)',
    ...result.matches.map(m => m.id + ': ' + m.hints.join(', ')),
  ].join('\n')
}
