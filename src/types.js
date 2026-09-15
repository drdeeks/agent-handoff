/**
 * Shared Type Definitions for Handoff Plugin
 * 
 * All types are self-contained within this module. No external type definitions
 * required beyond Node.js built-ins and zod (for schema validation only).
 * 
 * Types used across the handoff plugin modules:
 * - HandoffPackage: The canonical handoff package structure
 * - ScannedState: Output from state scanner
 * - LifecycleState: Explicit lifecycle transition states
 * - PriorityLevel: P0-P4 priority categorization
 * - StateCategory: 12 distinct state categories (not collapsed)
 * - Continuation Instructions: next_action, required_context, validation
 */
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
 * Handoff Package — Minimum contract (from agent-handoff.md §21)
 * Machine-readable structure for the durable continuation artifact.
 * 
 * Interface:
 * {
 *   id: string,                    // unique-handoff-id (e.g., handoff-00041)
 *   version: number,               // 1
 *   status: 'active' | 'sealed',   // sealed after validation success
 *   created_at: string,            // ISO-8601 timestamp
 *   source_state: string,          // description of source state
 *   objective: string,             // current objective
 *   current_state: string,         // current task/state
 *   completed: string[],           // completed work array
 *   pending: string[],             // pending work array
 *   decisions: string[],           // critical decisions array
 *   constraints: string[],         // active constraints array
 *   invariants: string[],          // enforced invariants array
 *   verified_facts: string[],      // verified facts array
 *   assumptions: string[],         // assumptions array
 *   unresolved: string[],          // unresolved questions array
 *   failures: string[],            // failures array
 *   recovery: string[],            // recovery state array
 *   artifacts: string[],           // artifact references array
 *   dependencies: string[],        // dependency references array
 *   provenance: string[],          // provenance array
 *   continuation: {               // next action & context
 *     next_action: string,        // what the resumed agent should do next
 *     required_context: string[], // required context for continuation
 *     validation: string[]        // validation records
 *   }
 * }
 */
class HandoffPackage {
  constructor(init = {}) {
    this.id = init.id || `handoff-${Date.now().toString(36)}`
    this.version = init.version !== undefined ? init.version : 1
    this.status = init.status || 'active'
    this.created_at = init.created_at || new Date().toISOString()
    this.source_state = init.source_state || ''
    this.objective = init.objective || ''
    this.current_state = init.current_state || ''
    this.completed = init.completed !== undefined ? init.completed : []
    this.pending = init.pending !== undefined ? init.pending : []
    this.decisions = init.decisions !== undefined ? init.decisions : []
    this.constraints = init.constraints !== undefined ? init.constraints : []
    this.invariants = init.invariants !== undefined ? init.invariants : []
    this.verified_facts = init.verified_facts !== undefined ? init.verified_facts : []
    this.assumptions = init.assumptions !== undefined ? init.assumptions : []
    this.unresolved = init.unresolved !== undefined ? init.unresolved : []
    this.failures = init.failures !== undefined ? init.failures : []
    this.recovery = init.recovery !== undefined ? init.recovery : []
    this.artifacts = init.artifacts !== undefined ? init.artifacts : []
    this.dependencies = init.dependencies !== undefined ? init.dependencies : []
    this.provenance = init.provenance !== undefined ? init.provenance : []
    this.continuation = init.continuation || {
      next_action: '',
      required_context: [],
      validation: []
    }
  }

  /**
   * Serialize to JSON for persistence or transmission
   * @returns {object} Plain JSON object
   */
  toJSON() {
    return {
      handoff: {
        id: this.id,
        version: this.version,
        status: this.status,
        created_at: this.created_at,
        source_state: this.source_state,
        objective: this.objective,
        current_state: this.current_state,
        completed: this.completed,
        pending: this.pending,
        decisions: this.decisions,
        constraints: this.constraints,
        invariants: this.invariants,
        verified_facts: this.verified_facts,
        assumptions: this.assumptions,
        unresolved: this.unresolved,
        failures: this.failures,
        recovery: this.recovery,
        artifacts: this.artifacts,
        dependencies: this.dependencies,
        provenance: this.provenance,
        continuation: this.continuation
      }
    }
  }

  /**
   * Validate package for sealing (from agent-handoff.md §10)
   * @returns {object} { valid: boolean, failed: string[], checks: object[] }
   */
  validate() {
    // Use the shared validator
    const { validate } = require('./validator.js')
    return validate(this)
  }

  /**
   * Check internal consistency
   * @returns {boolean} True if package is internally consistent
   */
  internalConsistencyCheck() {
    // Use the shared checker
    const { internalConsistencyCheck } = require('./validator.js')
    return internalConsistencyCheck(this)
  }
}

/**
 * Scanned State — Output from StateScanner.scan()
 * Categorized by P0-P4 priority and the 12 state categories.
 * 
 * Interface:
 * {
 *   P0: { facts: any[], decisions: any[], constraints: any[], state: any[],
 *         intent: any[], assumptions: any[], hypotheses: any[], pending: any[],
 *         completed: any[], failures: any[], recovery: any[] },
 *   P1: same structure,
 *   P2: same structure,
 *   P3: same structure,
 *   P4: same structure
 * }
 */
class ScannedState {
  constructor(raw = {}) {
    this.P0 = { facts: [], decisions: [], constraints: [], state: [], intent: [], assumptions: [], hypotheses: [], pending: [], completed: [], failures: [], recovery: [] }
    this.P1 = { facts: [], decisions: [], constraints: [], state: [], intent: [], assumptions: [], hypotheses: [], pending: [], completed: [], failures: [], recovery: [] }
    this.P2 = { facts: [], decisions: [], constraints: [], state: [], intent: [], assumptions: [], hypotheses: [], pending: [], completed: [], failures: [], recovery: [] }
    this.P3 = { facts: [], decisions: [], constraints: [], state: [], intent: [], assumptions: [], hypotheses: [], pending: [], completed: [], failures: [], recovery: [] }
    this.P4 = { facts: [], decisions: [], constraints: [], state: [], intent: [], assumptions: [], hypotheses: [], pending: [], completed: [], failures: [], recovery: [] }

    // Populate from raw scan data if provided
    if (raw.P0) this.P0 = { ...this.P0, ...raw.P0 }
    if (raw.P1) this.P1 = { ...this.P1, ...raw.P1 }
    if (raw.P2) this.P2 = { ...this.P2, ...raw.P2 }
    if (raw.P3) this.P3 = { ...this.P3, ...raw.P3 }
    if (raw.P4) this.P4 = { ...this.P4, ...raw.P4 }
  }

  /**
   * Extract objective (P0 category)
   * @returns {string} Objective value
   */
  getObjective() {
    return this.P0.find(s => s && s.category === 'objective')?.value || ''
  }

  /**
   * Extract current state (P0 category)
   * @returns {string} Current state value
   */
  getCurrentState() {
    return this.P0.find(s => s && s.category === 'currentState')?.value || ''
  }

  /**
   * Extract completed work (P0 category)
   * @returns {string[]} Completed work values
   */
  getCompleted() {
    return (this.P0.filter(s => s && s.category === 'completedWork') || []).map(s => s.value)
  }

  /**
   * Extract pending work (P0 category)
   * @returns {string[]} Pending work values
   */
  getPending() {
    return (this.P0.filter(s => s && s.category === 'pendingWork') || []).map(s => s.value)
  }

  /**
   * Extract decisions (P1 category)
   * @returns {string[]} Decision values
   */
  getDecisions() {
    return (this.P1.filter(s => s && s.category === 'decision') || []).map(s => s.value)
  }

  /**
   * Extract constraints (P0 category)
   * @returns {string[]} Constraint values
   */
  getConstraints() {
    return (this.P0.filter(s => s && s.category === 'constraint') || []).map(s => s.value)
  }
}

/**
 * Continuation Instructions — (from agent-handoff.md §21)
 * Structure passed through the handoff package continuation field.
 * 
 * Interface:
 * {
 *   next_action: string,          // What the resumed agent should do next
 *   required_context: string[],   // Required context for continuation
 *   validation: string[]          // Validation records from previous session
 * }
 */
class ContinuationInstructions {
  constructor(init = {}) {
    this.next_action = init.next_action || ''
    this.required_context = init.required_context !== undefined ? init.required_context : []
    this.validation = init.validation !== undefined ? init.validation : []
  }

  /**
   * Check if next action is defined
   * @returns {boolean} True if next_action has content
   */
  hasNextAction() {
    return this.next_action.length > 0
  }

  /**
   * Check if required context is populated
   * @returns {boolean} True if required_context has entries
   */
  hasRequiredContext() {
    return this.required_context.length > 0
  }

  /**
   * Check if validation records exist
   * @returns {boolean} True if validation has entries
   */
  hasValidation() {
    return this.validation.length > 0
  }
}

module.exports = {
  STATE_CATEGORIES,
  PRIORITY_LEVELS,
  LIFECYCLE_STATES,
  HandoffPackage,
  ScannedState,
  ContinuationInstructions,
  INVARIANTS: {
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
  }
}
