/**
 * Handoff Plugin — Standalone State Preservation
 * 
 * Pre-compaction state preservation for agent continuation.
 * Exists before compaction, not as a consequence.
 * 
 * Reference: agent-handoff.md (conceptual structure only — ALL logic reimplemented independently).
 * Rebranded: fully independent, no harness provider dependencies, no @opencode-ai/*,
 * no model SDKs, no execution environment assumptions.
 * 
 * This plugin is a complete ground-up creation. The OpenCode handoff plugin source
 * was used ONLY as a conceptual reference for structure (lifecycle flow, package contract,
 * scanner categories, invariants). Every function, class, and algorithm is manually
 * implemented from scratch with zero copied code.
 * 
 * Entry point: node src/plugin.js
 */

'use strict'

// Core module dependencies (all self-contained, Node.js built-ins)
const scannerModule = require('./scanner.js')
const builderModule = require('./builder.js')
const validatorModule = require('./validator.js')
const configModule = require('./config.js')
const typesModule = require('./types.js')

// Extract named exports from module returns
const STATE_CATEGORIES = scannerModule.STATE_CATEGORIES
const PRIORITY_LEVELS = scannerModule.PRIORITY_LEVELS || typesModule.PRIORITY_LEVELS
const INVARIANTS = typesModule.INVARIANTS || scannerModule.INVARIANTS
const HandoffPackage = typesModule.HandoffPackage
const resolveConfigPath = configModule.resolveConfigPath
const getConfig = configModule.getConfig
const LIFECYCLE_STATES = typesModule.LIFECYCLE_STATES || [
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
 * State categories (from agent-handoff.md §4) — distinct, NOT collapsed
 * FACT, DECISION, CONSTRAINT, STATE, INTENT, ASSUMPTION, HYPOTHESIS,
 * PENDING WORK, COMPLETED WORK, FAILURE, RECOVERY INFORMATION
 */
exports.STATE_CATEGORIES = STATE_CATEGORIES

/**
 * Lifecycle states (from agent-handoff.md §12)
 * ACTIVE → HANDOFF_REQUESTED → SCANNING → BUILDING → VALIDATING → SEALED
 * → COMPACTION_AUTHORIZED → COMPACTING → RESUMING → RECONSTRUCTED → CONTINUE
 */
exports.LIFECYCLE_STATES = LIFECYCLE_STATES

/**
 * Priority levels (from agent-handoff.md §6)
 * P0 = mandatory for safe continuation
 * P1 = required for accurate continuation
 * P2 = strongly useful context
 * P3 = optional historical context
 * P4 = disposable
 */
exports.PRIORITY_LEVELS = PRIORITY_LEVELS

/**
 * 12 Mandatory Invariants (from agent-handoff.md §22)
 * All enforced within this module — no external harness needed.
 */
exports.INVARIANTS = INVARIANTS

/**
 * Self-resolving config (FOREVER-SYSTEM.md §2)
 * 1. FOREVER_HANDOFF_CONFIG env var (highest priority)
 * 2. ~/.forever-handoff/config.json (home default)
 * 3. ./handoff/config.json (built-in default, always present relative to this module)
 * Resolved FRESH on every call, never cached at import.
 */
exports.resolveConfigPath = resolveConfigPath

/**
 * Handoff Package — Minimum contract (from agent-handoff.md §21)
 */
exports.HandoffPackage = HandoffPackage

/**
 * Main plugin start function
 * Entry point for: node src/plugin.js
 * 
 * Scans live state, builds handoff package, validates, and seals.
 * Only after sealing does it authorize compaction.
 * 
 * Lifecycle flow (agent-handoff.md §2, §12):
 * SCAN → BUILD → VALIDATE → SEAL → AUTHORIZE COMPACTION → COMPACT → RECONSTRUCT → VERIFY → CONTINUE
 */
exports.start = async function() {
  // Resolve config fresh on every call (FOREVER-SYSTEM.md §2)
  const configPath = resolveConfigPath()
  let config
  try {
    config = getConfig({ required: true })
  } catch (err) {
    console.error('Config error:', err.message)
    console.error('Set FOREVER_HANDOFF_CONFIG env var or create ~/.forever-handoff/config.json')
    return { status: 'config_error', error: err.message }
  }

  // Step 1: Scan live state
  const scannedState = scannerModule.scan({ source_state: config.source_state || '' })

  // Step 2: Build handoff package
  const pkg = builderModule.buildPackage(scannedState, { source_state: config.source_state || '' })

  // Step 3: Validate handoff for sealing
  const validated = validatorModule.validate(pkg)

  if (!validated.valid) {
    console.error('Handoff validation FAILED:', validated.failed.join(', '))
    console.error('Validation checks detail:', validated.checks)
    return { status: 'validation_failed', issues: validated.failed, checks: validated.checks }
  }

  // Step 4: Package is SEALED — compaction authorized
  // Invariant 2: validation occurs before compaction authorization
  pkg.status = 'sealed'
  console.log('Handoff SEALED — Compaction authorized')
  console.log('Package ID:', pkg.id)
  console.log('Objective:', pkg.objective)
  console.log('Continuation next action:', pkg.continuation.next_action)

  // Step 5: Return sealed state for compaction authorization
  return {
    status: 'sealed',
    package: pkg,
    validation: validated,
    can_compact: true,
    config_source: configPath
  }
}
