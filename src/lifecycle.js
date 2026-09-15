/**
 * Lifecycle State Machine (from agent-handoff.md §2, §12)
 * 
 * Enforces explicit lifecycle state transitions:
 * ACTIVE → HANDOFF_REQUESTED → SCANNING → BUILDING → VALIDATING → SEALED
 * → COMPACTION_AUTHORIZED → COMPACTING → RESUMING → RECONSTRUCTED → CONTINUE
 * 
 * Failure states are explicit rather than inferred.
 * No racing: handoff starts before compaction completes is a failure.
 */
const LIFECYCLE_STATES = [
  'active',
  'handoffRequested',
  'scanning',
  'building',
  'validating',
  'sealed',
  'compactionAuthorized',
  'compacting',
  'resuming',
  'reconstructed',
  'continue'
]

/**
 * Validate a lifecycle transition
 * @param {string} from - Current state
 * @param {string} to - Target state
 * @returns {string} Next valid state, or throws if transition is invalid
 */
function transition(from, to) {
  const fromIdx = LIFECYCLE_STATES.indexOf(from)
  const toIdx = LIFECYCLE_STATES.indexOf(to)

  if (fromIdx < 0) {
    throw new Error(`Unknown lifecycle state: ${from}`)
  }

  if (toIdx < 0) {
    throw new Error(`Unknown lifecycle state: ${to}`)
  }

  // Transitions must follow the ordered lifecycle
  // Allow staying in the same state
  if (from === to) return from

  // Must advance one step in the lifecycle
  if (toIdx === fromIdx + 1) return to

  // Cannot go backwards or skip steps
  throw new Error(
    `Invalid lifecycle transition from "${from}" to "${to}". ` +
    `Must advance from step ${fromIdx + 1} to step ${toIdx + 1} in the lifecycle. ` +
    `Valid transitions: ${LIFECYCLE_STATES.slice(fromIdx, fromIdx + 2).join(' → ')}`
  )
}

/**
 * Check if a lifecycle state is terminal (end of chain)
 * @param {string} state - Lifecycle state to check
 * @returns {boolean} True if state is terminal
 */
function isTerminalState(state) {
  return state === 'continue'
}

/**
 * Get the next state in the lifecycle
 * @param {string} current - Current lifecycle state
 * @returns {string|undefined} Next state, or undefined if at end
 */
function getNextState(current) {
  const idx = LIFECYCLE_STATES.indexOf(current)
  if (idx < 0 || idx >= LIFECYCLE_STATES.length - 1) return undefined
  return LIFECYCLE_STATES[idx + 1]
}

/**
 * Get the previous state in the lifecycle
 * @param {string} current - Current lifecycle state
 * @returns {string|undefined} Previous state, or undefined if at start
 */
function getPreviousState(current) {
  const idx = LIFECYCLE_STATES.indexOf(current)
  if (idx <= 0 || idx >= LIFECYCLE_STATES.length) return undefined
  return LIFECYCLE_STATES[idx - 1]
}

module.exports = { LIFECYCLE_STATES, transition, isTerminalState, getNextState, getPreviousState, INVARIANTS: {
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
// ESM exports
export { LIFECYCLE_STATES, transition, isTerminalState, getNextState, getPreviousState }
