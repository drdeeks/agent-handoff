/**
 * Continuation Verification (from agent-handoff.md §14)
 * 
 * After reconstruction, the system should verify that the new context has
 * successfully recovered the handoff.
 * 
 * SEALED HANDOFF → RECONSTRUCTION → STATE CHECK
 * 
 * mismatch → recovery path
 * match → CONTINUE
 * 
 * A continuation check should be capable of identifying:
 * - missing objective
 * - missing constraints
 * - missing pending work
 * - missing critical decisions
 * - stale state
 * - inconsistent state
 * - missing artifact references
 * - invalid assumptions
 * - incomplete recovery information
 */
const { INVARIANTS } = require('./invariants.js')

/**
 * Perform continuation verification after reconstruction
 * @param {object} reconstructedState - Output from reconstruct()
 * @param {object} previousState - State before compaction (for comparison)
 * @returns {object} { valid: boolean, issues: string[], recoveryPath: object }
 * 
 * Consequential flow:
 * - If all checks pass → CONTINUE (resumed agent proceeds)
 * - If critical checks fail → rescan/rebuild (Invariant 12: resumed agent must
 *   determine what to do next without guessing critical state)
 * - If non-critical checks fail → repair/recovery with available state
 */
function verify(reconstructedState, previousState) {
  const issues = []
  const criticalCategories = [
    'objective',
    'constraints',
    'pending work',
    'critical decisions'
  ]

  // Check each continuation verification category
  if (!reconstructedState.objective) {
    issues.push('missing objective')
  }

  if (
    !reconstructedState.constraints ||
    reconstructedState.constraints.length === 0
  ) {
    issues.push('missing constraints')
  }

  if (
    !reconstructedState.pendingWork ||
    reconstructedState.pendingWork.length === 0
  ) {
    issues.push('missing pending work')
  }

  if (
    !reconstructedState.decisions ||
    reconstructedState.decisions.length === 0
  ) {
    issues.push('missing critical decisions')
  }

  // Stale state comparison
  if (previousState) {
    if (reconstructedState.objective !== previousState.objective) {
      issues.push('stale state')
    }
    if (reconstructedState.currentState !== previousState.currentState) {
      issues.push('stale state')
    }
  }

  // Missing artifact references
  if (
    !reconstructedState.memoryArchiveReferences ||
    reconstructedState.memoryArchiveReferences.length === 0
  ) {
    issues.push('missing artifact references')
  }

  // Invalid assumptions
  if (reconstructedState.assumptions) {
    const invalidOnes = reconstructedState.assumptions.filter(a => !a.valid)
    if (invalidOnes.length > 0) {
      issues.push(`invalid assumptions: ${invalidOnes.length} assumption(s)`)
    }
  }

  // Incomplete recovery information
  if (
    !reconstructedState.recoveryInformation ||
    reconstructedState.recoveryInformation.length === 0
  ) {
    issues.push('incomplete recovery information')
  }

  const valid = issues.length === 0

  // Determine recovery path
  let recoveryPath
  if (valid) {
    recoveryPath = { action: 'CONTINUE', message: 'Continuation verified. Resumed agent proceeds.' }
  } else {
    const criticalMissing = issues.filter(i =>
      criticalCategories.includes(i)
    )
    if (criticalMissing.length > 0) {
      recoveryPath = {
        action: 'RESCAN/REBUILD',
        message: `Critical state missing: ${criticalMissing.join(', ')}. Must rescan and rebuild handoff. Invariant 12: resumed agent must not guess critical state.`
      }
    } else {
      recoveryPath = {
        action: 'REPAIR/RECOVERY',
        message: `Non-critical issues: ${issues.join(', ')}. Attempt recovery with available state.`
      }
    }
  }

  return {
    valid,
    issues,
    recoveryPath,
    summary: valid
      ? 'Continuation verified — all required state present and consistent. Resumed agent proceeds.'
      : `Continuation verification: ${issues.length} issue(s) identified. ` +
        `Critical: ${criticalMissing.length > 0 ? criticalMissing.join(', ') : 'none'}. ` +
        `Recovery path: ${recoveryPath.action}.`
  }
}

module.exports = { verify, INVARIANTS: {
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