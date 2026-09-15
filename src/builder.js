/**
 * Handoff Builder (from agent-handoff.md §7, §21)
 * 
 * Materializes durable continuation state into handoff package.
 * 
 * Minimum contract (from agent-handoff.md §21): id, version, status, created_at,
 * source_state, objective, current_state, completed/pending arrays, decisions,
 * constraints, invariants, verified_facts, assumptions, unresolved, failures,
 * recovery, artifacts, dependencies, provenance, continuation (next_action,
 * required_context, validation).
 */

const { INVARIANTS } = require('./invariants.js')

/**
 * Build handoff package from scanned state
 * @param {object} scannedState - Output from scannerModule.scan()
 * @param {object} options - Build options
 * @param {string} options.source_state - Source state description
 * @returns {object} Constructed handoff package (plain object)
 */
function buildPackage(scannedState, options = {}) {
  // Extract values from scanner's P0-P4 categor structure
  // Scanner returns: { P0: { facts: [...], decisions: [...], constraints: [...], state: [...], intent: [...], assumptions: [...], hypotheses: [...], pending: [...], completed: [...], failures: [...], recovery: [...] }, P1: same structure, etc. }
  
  const extractByCategory = (scanned, category) => {
    const items = []
    for (const key of ['facts', 'decisions', 'constraints', 'state', 'intent', 'assumptions', 'hypotheses', 'pending', 'completed', 'failures', 'recovery']) {
      const arr = scanned[category]?.[key] || []
      items.push(...arr)
    }
    return items
  }

  const objective = extractByCategory(scannedState, 'P0').find(s => s.category === 'objective')?.value || ''
  const current_state = extractByCategory(scannedState, 'P0').find(s => s.category === 'currentState')?.value || ''
  const completed = extractByCategory(scannedState, 'P0').filter(s => s.category === 'completedWork').map(s => s.value)
  const pending = extractByCategory(scannedState, 'P0').filter(s => s.category === 'pendingWork').map(s => s.value)
  const decisions = extractByCategory(scannedState, 'P1').filter(s => s.category === 'decision').map(s => s.value)
  const constraints = extractByCategory(scannedState, 'P0').filter(s => s.category === 'constraint').map(s => s.value)
  const verified_facts = extractByCategory(scannedState, 'P0').filter(s => s.category === 'verifiedFact').map(s => s.value)
  const assumptions = extractByCategory(scannedState, 'P1').filter(s => s.category === 'assumption').map(s => s.value)
  const unresolved = extractByCategory(scannedState, 'P2').filter(s => s.category === 'unresolvedQuestion').map(s => s.value)
  const failures = extractByCategory(scannedState, 'P1').filter(s => s.category === 'failure').map(s => s.value)
  const recovery = extractByCategory(scannedState, 'P0').filter(s => s.category === 'recoveryInformation').map(s => s.value)
  const artifacts = extractByCategory(scannedState, 'P0').filter(s => s.category === 'artifactReference').map(s => s.value)
  const dependencies = extractByCategory(scannedState, 'P0').filter(s => s.category === 'dependencyReference').map(s => s.value)
  const provenance = extractByCategory(scannedState, 'P0').filter(s => s.category === 'provenance').map(s => s.value)
  const next_action = extractByCategory(scannedState, 'P0').find(s => s.category === 'nextAction')?.value || ''

  const pkg = {
    id: `handoff-${Date.now().toString(36)}`,
    version: 1,
    status: 'building',
    source_state: options.source_state || '',
    objective: objective || '',
    current_state: current_state || '',
    completed: completed || [],
    pending: pending || [],
    decisions: decisions || [],
    constraints: constraints || [],
    invariants: Object.values(INVARIANTS),
    verified_facts: verified_facts || [],
    assumptions: assumptions || [],
    unresolved: unresolved || [],
    failures: failures || [],
    recovery: recovery || [],
    artifacts: artifacts || [],
    dependencies: dependencies || [],
    provenance: provenance || [],
    continuation: {
      next_action: next_action || '',
      required_context: [],
      validation: []
    }
  }

  return pkg
}

// CJS exports
module.exports = { buildPackage, INVARIANTS: {
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
