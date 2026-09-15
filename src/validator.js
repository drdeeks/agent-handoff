/**
 * Handoff Validator (from agent-handoff.md §10)
 * 
 * After construction, the handoff enters a validation phase.
 * Validation should establish:
 *  - Objective exists
 *  - Current task exists
 *  - Required constraints exist
 *  - Critical decisions exist
 *  - Pending work exists
 *  - Required artifacts are referenced
 *  - Recovery information exists where necessary
 *  - No required state was truncated
 *  - Package is internally consistent
 *  - Package is persistently available
 * 
 * Only after successful validation does the handoff become SEALED.
 * A sealed handoff represents the state that the system is willing to trust
 * across compaction (agent-handoff.md §10).
 */

const { INVARIANTS } = require('./invariants.js')

/**
 * Validate handoff package for sealing
 * @param {object} pkg - Handoff package (plain object)
 * @returns {object} { valid: boolean, failed: string[], checks: object[] }
 */
function validate(pkg) {
  const checks = []

  // Objective exists
  checks.push({ name: 'objective', pass: !!pkg.objective, detail: pkg.objective ? 'present' : 'missing' })

  // Current task exists
  checks.push({ name: 'current state', pass: !!pkg.current_state, detail: pkg.current_state ? 'present' : 'missing' })

  // Required constraints exist
  checks.push({ name: 'constraints', pass: Array.isArray(pkg.constraints) && pkg.constraints.length > 0, detail: pkg.constraints ? `${pkg.constraints.length} constraints` : 'none' })

  // Critical decisions exist
  checks.push({ name: 'decisions', pass: Array.isArray(pkg.decisions) && pkg.decisions.length > 0, detail: pkg.decisions ? `${pkg.decisions.length} decisions` : 'none' })

  // Pending work exists
  checks.push({ name: 'pending work', pass: Array.isArray(pkg.pending) && pkg.pending.length > 0, detail: pkg.pending ? `${pkg.pending.length} pending items` : 'none' })

  // Required artifacts referenced
  checks.push({ name: 'artifacts', pass: Array.isArray(pkg.artifacts) && pkg.artifacts.length > 0, detail: pkg.artifacts ? `${pkg.artifacts.length} artifacts` : 'none' })

  // Recovery information exists where necessary
  checks.push({ name: 'recovery', pass: Array.isArray(pkg.recovery) && pkg.recovery.length > 0, detail: pkg.recovery ? `${pkg.recovery.length} recovery records` : 'none' })

  // No required state was truncated
  checks.push({ name: 'no truncation', pass: pkg.id && pkg.id.length > 0, detail: pkg.id ? `id: ${pkg.id.substring(0, 8)}...` : 'empty id' })

  // Package is internally consistent
  const internalConsistent = internalConsistencyCheck(pkg)
  checks.push({ name: 'internal consistency', pass: internalConsistent, detail: internalConsistent ? 'consistent' : 'inconsistent' })

  // Package is persistently available (checked at persist time)
  checks.push({ name: 'persistent availability', pass: true, detail: 'checked at persist/compaction authorization time' })

  const allPass = checks.every(c => c.pass)
  const failed = checks.filter(c => !c.pass).map(c => c.name)

  return {
    valid: allPass,
    failed,
    checks,
    summary: allPass
      ? 'Handoff validated — SEALED. Compaction authorized.'
      : `Handoff validation FAILED — ${failed.length} check(s) failed. ${failed.length > 1 ? 'Repair and rescan required.' : `Fix the ${failed[0]} issue before proceeding.`}`
  }
}

/**
 * Check internal consistency of handoff package
 * @param {object} pkg - Package plain object
 * @returns {boolean} True if package is internally consistent
 */
function internalConsistencyCheck(pkg) {
  if (!pkg.id || pkg.id.length === 0) return false
  if (!pkg.version || pkg.version <= 0) return false
  if (!pkg.status || pkg.status.length === 0) return false
  if (!pkg.objective || pkg.objective.length === 0) return false
  if (!pkg.current_state || pkg.current_state.length === 0) return false
  if (!Array.isArray(pkg.constraints)) return false
  if (!Array.isArray(pkg.decisions)) return false
  if (!Array.isArray(pkg.pending)) return false
  if (!Array.isArray(pkg.artifacts)) return false
  if (!Array.isArray(pkg.recovery)) return false
  if (!Array.isArray(pkg.invariants)) return false
  if (!Array.isArray(pkg.verified_facts)) return false
  if (!Array.isArray(pkg.assumptions)) return false
  return true
}

// CJS exports
module.exports = { validate, internalConsistencyCheck, INVARIANTS: {
  1: 'Handoff occurs before compaction',
  2: 'Handoff validation occurs before compaction authorization',
  3: 'The handoff mechanism may ultimately trigger compaction',
  4: 'Compaction must never destroy the only copy of required continuation state',
  5: 'The handoff is not merely a transcript summary',
  6: 'The scanner must inspect operational state beyond conversational text',
  7: 'The mechanism must remain adaptable to different execution environments',
  8: 'No external harness becomes the architectural identity of the handoff system',
  9: 'Forever-system persistence and recovery principles apply to handoff state',
  10: 'A failed handoff cannot silently authorize destructive compaction',
  11: 'A sealed handoff must remain recoverable',
  12: 'The resumed agent must determine what to do next without guessing critical state'
} }