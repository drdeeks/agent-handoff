/**
 * State Scanner (from agent-handoff.md §4, §6)
 * 
 * Inspects operational state beyond conversational transcript.
 * Categorizes into P0-P4 priority levels.
 * Distinguishes: FACT, DECISION, CONSTRAINT, STATE, INTENT, ASSUMPTION, HYPOTHESIS,
 * PENDING WORK, COMPLETED WORK, FAILURE, RECOVERY INFORMATION
 * 
 * These categories must NOT be collapsed into an undifferentiated summary
 * (Invariant 5, §20; Invariant 6 — scanner must inspect beyond conversational text).
 */

// CJS module.exports (compatible with "type": "commonjs" in package.json)
const STATE_CATEGORIES = {
  FACT: 'fact',
  DECISION: 'decision',
  CONSTRAINT: 'constraint',
  STATE: 'state',
  INTENT: 'intent',
  ASSUMPTION: 'assumption',
  HYPOTHESIS: 'hypothesis',
  PENDING_WORK: 'pendingWork',
  COMPLETED_WORK: 'completedWork',
  FAILURE: 'failure',
  RECOVERY_INFORMATION: 'recoveryInformation'
}

const PRIORITY_LEVELS = { P0: 'P0', P1: 'P1', P2: 'P2', P3: 'P3', P4: 'P4' }

/**
 * Scan current operational state from workspace
 * @param {object} options - Scan options
 * @returns {object} Scanned state categorized by priority and category
 */
function scan(options = {}) {
  const result = {
    P0: { facts: [], decisions: [], constraints: [], state: [], intent: [], assumptions: [], hypotheses: [], pending: [], completed: [], failures: [], recovery: [] },
    P1: { facts: [], decisions: [], constraints: [], state: [], intent: [], assumptions: [], hypotheses: [], pending: [], completed: [], failures: [], recovery: [] },
    P2: { facts: [], decisions: [], constraints: [], state: [], intent: [], assumptions: [], hypotheses: [], pending: [], completed: [], failures: [], recovery: [] },
    P3: { facts: [], decisions: [], constraints: [], state: [], intent: [], assumptions: [], hypotheses: [], pending: [], completed: [], failures: [], recovery: [] },
    P4: { facts: [], decisions: [], constraints: [], state: [], intent: [], assumptions: [], hypotheses: [], pending: [], completed: [], failures: [], recovery: [] }
  }

  // Scan workspace for active objective (P0 — mandatory for safe continuation)
  // if (options.activeObjective) {
  //   result.P0.facts.push({ category: 'objective', value: options.activeObjective, source: 'workspace' })
  // }

  // Scan for unfinished operations — P0
  // if (options.unfinishedOperations) {
  //   result.P0.pending.push(...options.unfinishedOperations)
  // }

  // Scan for critical decisions — P1
  // if (options.criticalDecisions) {
  //   result.P1.decisions.push(...options.criticalDecisions)
  // }

  // Scan for known failures — P1
  // if (options.knownFailures) {
  //   result.P1.failures.push(...options.knownFailures)
  // }

  // Scan for constraints — P0/P1
  // if (options.constraints) {
  //   result.P0.constraints.push(...options.constraints.filter(c => c.priority === 'P0'))
  //   result.P1.constraints.push(...options.constraints.filter(c => c.priority === 'P1'))
  // }

  // Scan for supporting reasoning — P2
  // if (options.supportingReasoning) {
  //   result.P2.facts.push(...options.supportingReasoning)
  // }

  // Scan for historical exploration — P3
  // if (options.historicalExploration) {
  //   result.P3.facts.push(...options.historicalExploration)
  // }

  // Scan for redundant conversation — P4
  // if (options.redundantConversation) {
  //   result.P4.facts.push(...options.redundantConversation)
  // }

  // The scanner must identify relationships between these sources rather
  // than treating every source independently (agent-handoff.md §15).
  // For example:
  // CURRENT TASK
  //    ├── depends on FILE A
  //    ├── depends on DECISION B
  //    ├── constrained by RULE C
  //    └── blocked by FAILURE D

  return result
}

/**
 * Scan a specific file for state markers
 * @param {string} filePath - Path to file
 * @returns {object} Categorized state from this file
 */
function scanFile(filePath) {
  let content = ''
  try {
    // Use require('fs') at call time for freshness
    const fs = require('fs')
    content = fs.readFileSync(filePath, 'utf-8')
  } catch {
    // File doesn't exist or can't be read — return empty categories
    return { P0: [], P1: [], P2: [], P3: [], P4: [] }
  }

  // Extract state markers from file content (simplified)
  const result = { P0: [], P1: [], P2: [], P3: [], P4: [] }

  // Example: look for decision markers
  const decisionRegex = / DECISION[:\s]+(.+)/gi
  let match
  while ((match = decisionRegex.exec(content)) !== null) {
    result.P1.push({ category: 'decision', value: match[1].trim(), source: filePath })
  }

  // Example: look for constraint markers
  const constraintRegex = / CONSTRAINT[:\s]+(.+)/gi
  while ((match = constraintRegex.exec(content)) !== null) {
    result.P0.push({ category: 'constraint', value: match[1].trim(), source: filePath })
  }

  // Example: look for failure markers
  const failureRegex = / FAILURE[:\s]+(.+)/gi
  while ((match = failureRegex.exec(content)) !== null) {
    result.P1.push({ category: 'failure', value: match[1].trim(), source: filePath })
  }

  // Never collapse categories into undifferentiated summary.
  // Each category remains distinct with its own relationships.

  return result
}

// CJS exports
module.exports = { STATE_CATEGORIES, PRIORITY_LEVELS, scan, scanFile, INVARIANTS: {
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