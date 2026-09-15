/**
 * State Reconstructor (from agent-handoff.md §13)
 * 
 * After compaction, the receiving context consumes the sealed handoff.
 * The reconstruction process restores state in the following order:
 * 
 * IDENTITY → OBJECTIVE → CURRENT STATE → CONSTRAINTS → DECISIONS → 
 * PENDING WORK → RECOVERY INFORMATION → RELEVANT MEMORY/ARCHIVE REFERENCES → CONTINUATION
 * 
 * The resumed agent should NOT have to reconstruct the previous state by guessing
 * from fragments. The handoff is the bridge (agent-handoff.md §13).
 * 
 * Reconstruction order is strict and deterministic. Each step depends on the
 * successful restoration of the previous step.
 */
const { INVARIANTS } = require('./invariants.js')

/**
 * Reconstruct agent state from sealed handoff package
 * @param {object} pkg - Sealed handoff package (plain object, typically from JSON.parse())
 * @returns {object} Reconstructed agent state
 * 
 * Reconstruction order (agent-handoff.md §13):
 * 1. IDENTITY — from handoff package id
 * 2. OBJECTIVE — from handoff package objective
 * 3. CURRENT STATE — from handoff package current_state
 * 4. CONSTRAINTS — from handoff package constraints array
 * 5. DECISIONS — from handoff package decisions array
 * 6. PENDING WORK — from handoff package pending array
 * 7. RECOVERY INFORMATION — from handoff package recovery array
 * 8. RELEVANT MEMORY/ARCHIVE REFERENCES — from provenance/artifacts
 * 9. CONTINUATION — from handoff package continuation (next_action, required_context, validation)
 */
function reconstruct(pkg) {
  // Initialize reconstructed state
  const state = {}

  // 1. IDENTITY — from handoff package id
  state.identity = pkg.id ? { id: pkg.id, version: pkg.version } : { id: 'unknown', version: 0 }

  // 2. OBJECTIVE — from handoff package objective
  state.objective = pkg.objective || ''

  // 3. CURRENT STATE — from handoff package current_state
  state.currentState = pkg.current_state || ''

  // 4. CONSTRAINTS — from handoff package constraints array
  state.constraints = Array.isArray(pkg.constraints) ? [...pkg.constraints] : (pkg.constraints ? [pkg.constraints] : [])

  // 5. DECISIONS — from handoff package decisions array
  state.decisions = Array.isArray(pkg.decisions) ? [...pkg.decisions] : (pkg.decisions ? [pkg.decisions] : [])

  // 6. PENDING WORK — from handoff package pending array
  state.pendingWork = Array.isArray(pkg.pending) ? [...pkg.pending] : (pkg.pending ? [pkg.pending] : [])

  // 7. RECOVERY INFORMATION — from handoff package recovery array
  state.recoveryInformation = Array.isArray(pkg.recovery) ? [...pkg.recovery] : (pkg.recovery ? [pkg.recovery] : [])

  // 8. RELEVANT MEMORY/ARCHIVE REFERENCES
  // From provenance or artifacts — whichever provides the most relevant references
  state.memoryArchiveReferences = []
  if (Array.isArray(pkg.provenance)) {
    state.memoryArchiveReferences.push(...pkg.provenance)
  }
  if (Array.isArray(pkg.artifacts)) {
    // Only add artifacts not already in provenance
    const alreadyAdded = new Set(state.memoryArchiveReferences)
    state.memoryArchiveReferences.push(
      ...pkg.artifacts.filter(a => !alreadyAdded.has(a))
    )
  }

  // 9. CONTINUATION — from handoff package continuation
  state.continuation = {
    next_action: pkg.continuation && pkg.continuation.next_action ? pkg.continuation.next_action : '',
    required_context: pkg.continuation && pkg.continuation.required_context ? [...pkg.continuation.required_context] : [],
    validation: pkg.continuation && pkg.continuation.validation ? [...pkg.continuation.validation] : []
  }

  return state
}

/**
 * Verify continuation after reconstruction (from agent-handoff.md §14)
 * After reconstruction, the system should verify that the new context has
 * successfully recovered the handoff.
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
 * 
 * @param {object} reconstructedState - Output from reconstruct()
 * @param {object} previousState - State before compaction (for comparison)
 * @returns {object} { valid: boolean, issues: string[] }
 */
function verifyContinuation(reconstructedState, previousState) {
  const issues = []

  // Missing objective
  if (!reconstructedState.objective || reconstructedState.objective.length === 0) {
    issues.push('missing objective')
  }

  // Missing constraints
  if (!reconstructedState.constraints || reconstructedState.constraints.length === 0) {
    issues.push('missing constraints')
  }

  // Missing pending work
  if (!reconstructedState.pendingWork || reconstructedState.pendingWork.length === 0) {
    issues.push('missing pending work')
  }

  // Missing critical decisions
  if (!reconstructedState.decisions || reconstructedState.decisions.length === 0) {
    issues.push('missing critical decisions')
  }

  // Stale state — compare with previous state
  if (previousState) {
    if (reconstructedState.objective !== previousState.objective) {
      issues.push('stale state — objective differs from pre-compaction state')
    }
    if (reconstructedState.currentState !== previousState.currentState) {
      issues.push('stale state — current state differs from pre-compaction state')
    }
  }

  // Inconsistent state — structural inconsistencies
  if (reconstructedState.constraints && reconstructedState.decisions) {
    if (reconstructedState.constraints.length > 0 && reconstructedState.decisions.length === 0) {
      issues.push('inconsistent state — constraints present but no decisions recorded')
    }
    if (reconstructedState.decisions.length > 0 && reconstructedState.constraints.length === 0) {
      issues.push('inconsistent state — decisions present but no constraints recorded')
    }
  }

  // Missing artifact references
  if (!reconstructedState.memoryArchiveReferences || reconstructedState.memoryArchiveReferences.length === 0) {
    issues.push('missing artifact references')
  }

  // Invalid assumptions
  if (reconstructedState.assumptions) {
    const invalidAssumptions = reconstructedState.assumptions.filter(a => !a.valid)
    if (invalidAssumptions.length > 0) {
      issues.push(`invalid assumptions: ${invalidAssumptions.length} assumption(s) marked as invalid`)
    }
  }

  // Incomplete recovery information
  if (!reconstructedState.recoveryInformation || reconstructedState.recoveryInformation.length === 0) {
    issues.push('incomplete recovery information')
  }

  return {
    valid: issues.length === 0,
    issues,
    summary: issues.length === 0
      ? 'Continuation verified — all required state present and consistent.'
      : `Continuation verification FAILED — ${issues.length} issue(s): ${issues.join(', ')}. ` +
        `Resumed agent must follow recovery path without guessing critical state (Invariant 12, agent-handoff.md §22).`
  }
}

/**
 * Determine recovery path after continuation verification failure
 * @param {object} verificationResult - Output from verifyContinuation()
 * @returns {object} Recovery path recommendation
 */
function determineRecoveryPath(verificationResult) {
  if (verificationResult.valid) {
    return { path: 'continue', reason: 'Continuation verified. Resumed agent may proceed.' }
  }

  const { issues } = verificationResult
  const criticalMissing = issues.filter(i =>
    ['missing objective', 'missing constraints', 'missing pending work', 'missing critical decisions'].includes(i)
  )

  if (criticalMissing.length > 0) {
    return {
      path: 'rescan/rebuild',
      reason: `Critical state missing: ${criticalMissing.join(', ')}. Must rescan and rebuild handoff before reconstruction.`
    }
  }

  return {
    path: 'repair/recovery',
    reason: `Non-critical issues: ${issues.join(', ')}. Attempt recovery with available state, or rescan if gaps are significant.`
  }
}

module.exports = { reconstruct, verifyContinuation, determineRecoveryPath, INVARIANTS: {
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
