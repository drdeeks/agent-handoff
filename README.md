# Handoff — Standalone Agent State Preservation

![Status](https://img.shields.io/badge/standalone--yes-000000.svg?logo=github)
![Language](https://img.shields.io/badge/node-18%2B-green.svg?logo=node)
![License](https://img.shields.io/badge/license-MIT-000000.svg?logo=opensource)

## What Is Handoff?

**Handoff** is a standalone, adaptive agent handoff mechanism responsible for preserving the
operational state of an agent across context compaction and subsequent continuation.

It is **not** itself an agent harness, provider, model target, transport protocol, or execution
environment. It is a foundational state-preservation component that can be invoked by whatever
agent architecture is hosting it.

**Core responsibility**: Determine what the current agent must carry forward, materialize that
state into a durable handoff package, verify that the package is sufficient, and only then permit
or trigger context compaction.

The handoff therefore exists **before** compaction, not as a consequence of compaction.

## Philosophy

- **Singular source of truth**: One canonical location per concern (agent-handoff.md)
- **Self-resolving paths**: env → home → built-in; resolved fresh on every call (FOREVER-SYSTEM.md §2)
- **Layered, never rewritten**: Updates stack on top; base never changes
- **Fail-closed**: When unsure, block; fail open is no guard
- **Platform/path agnostic**: Drop on any machine, any OS, any container; finds itself
- **Verifiable without reading code**: CI badge = truth; red badge = stop
- **No external harness identity**: The handoff system must not inherit implementation assumptions

## Quick Start

```bash
# Install (npmjs — only dependency: zod)
npm install handoff

# Start the handoff mechanism
node handoff/src/plugin.js

# Or use the built version
npm run build     # Compile with TypeScript
node dist/plugin.js  # Run compiled output
```

## Commands

### `node src/plugin.js` — Main entry point

Starts the standalone handoff plugin. Provides all capabilities for pre-compaction state
preservation and continuation.

### Build

```bash
npm run build     # Compile TypeScript source to dist/
```

### Run

```bash
node dist/plugin.js   # Run compiled output
# or
node src/plugin.js    # Run source directly (Node ESM)
```

## How It Works

The handoff mechanism follows an explicit lifecycle (agent-handoff.md §2, §12):

```
ACTIVE → HANDOFF_REQUESTED → SCANNING → BUILDING → VALIDATING → SEALED
→ COMPACTION_AUTHORIZED → COMPACTING → RESUMING → RECONSTRUCTED → CONTINUE
```

### 1. Scan Live State

The scanner inspects operational state beyond conversational text (Invariant 6, §6).
Categories: FACT, DECISION, CONSTRAINT, STATE, INTENT, ASSUMPTION, HYPOTHESIS,
PENDING WORK, COMPLETED WORK, FAILURE, RECOVERY INFORMATION.

Priority scoring: P0 (mandatory for safe continuation), P1 (required for accurate
continuation), P2 (strongly useful context), P3 (optional historical context),
P4 (disposable).

### 2. Build Handoff Package

The builder materializes durable continuation state into a handoff package conforming
to the canonical contract (agent-handoff.md §21). Minimum fields: id, version, status,
created_at, source_state, objective, current_state, completed/pending arrays, decisions,
constraints, invariants, verified_facts, assumptions, unresolved, failures, recovery,
artifacts, dependencies, provenance, continuation (next_action, required_context, validation).

### 3. Validate Handoff

The validator establishes sealing criteria (agent-handoff.md §10). Only PASS → SEALED;
FAIL → repair/rescan. Validation checks: objective exists, current task exists, constraints,
decisions, pending work, artifacts referenced, recovery information, internal consistency,
persistent availability.

### 4. Seal and Authorize Compaction

Only after successful validation does the handoff become SEALED. The sealed handoff
represents the state the system is willing to trust across compaction. Only then is
compaction authorized (Invariant 2: validation before compaction authorization).

### 5. Compact

Destructive context transition occurs. The handoff package is persisted.

### 6. Reconstruct State

The receiver consumes the sealed handoff and reconstructs state in defined order
(agent-handoff.md §13):
- IDENTITY → OBJECTIVE → CURRENT STATE → CONSTRAINTS → DECISIONS → PENDING WORK →
- RECOVERY INFORMATION → RELEVANT MEMORY/ARCHIVE REFERENCES → CONTINUATION

The resumed agent should NOT have to guess from fragments (Invariant 12).

### 7. Verify Continuation

Post-reconstruction verification identifies: missing objective, missing constraints,
missing pending work, missing critical decisions, stale state, inconsistent state,
missing artifact references, invalid assumptions, incomplete recovery information
(agent-handoff.md §14).

## Customization

### Config Resolution (FOREVER-SYSTEM.md §2)

Config paths are resolved fresh on every call from three priorities:

1. **FOREVER_HANDOFF_CONFIG** env var (highest priority)
   ```bash
   export FOREVER_HANDOFF_CONFIG=/custom/path/handoff/config.json
   node src/plugin.js
   ```

2. **~/.forever-handoff/config.json** (home default)
   ```json
   {
     "inventoryDir": "/path/to/inventory",
     "recoveryEnabled": true
   }
   ```

3. **./handoff/config.json** (built-in default, relative to module)
   - Created automatically on first run if absent
   - Contains sensible defaults for immediate use

### Overriding Config

Set the `FOREVER_HANDOFF_CONFIG` environment variable to use a custom config path without
modifying the built-in default. The built-in `./handoff/config.json` remains unchanged as
the fallback — it is never modified for customization.

### State Categories

The scanner distinguishes 12 distinct categories (never collapsed into undifferentiated
summary):

| Category | Meaning |
|---|---|
| FACT | Verifiable observations |
| DECISION | Critical decisions made |
| CONSTRAINT | Active constraints |
| STATE | Current operational state |
| INTENT | What the agent intends |
| ASSUMPTION | Assumptions in effect |
| HYPOTHESIS | Working hypotheses |
| PENDING WORK | Unfinished operations |
| COMPLETED WORK | Completed operations |
| FAILURE | Known failures |
| RECOVERY INFORMATION | Recovery records |

### Lifecycle States

Explicit transitions (agent-handoff.md §12):

| State | Meaning |
|---|---|
| ACTIVE | Normal operation |
| HANDOFF_REQUESTED | Compaction requested, handoff starting |
| SCANNING | Operational state being scanned |
| BUILDING | Handoff package being materialized |
| VALIDATING | Package validation in progress |
| SEALED | Validation passed, ready for compaction |
| COMPACTION_AUTHORIZED | Compaction permission granted |
| COMPACTING | Context transition in progress |
| RESUMING | Agent resuming from handoff |
| RECONSTRUCTED | State reconstructed |
| CONTINUE | Operation continuing |

## Troubleshooting

### Common Issues

**1. "No config found — gate cannot start"**

The plugin resolved no config path. Check:

- Set `FOREVER_HANDOFF_CONFIG` env var: `export FOREVER_HANDOFF_CONFIG=/path/to/config.json`
- Create `~/.forever-handoff/config.json` (home default)
- Ensure `./handoff/config.json` exists (built-in default, auto-created on first run)

**2. "Self-test failed — invariants not registered"**

The plugin started but self-test detected missing invariants. Verify:

- All 12 invariants (agent-handoff.md §22) are enforced within the module
- No external harness has become the architectural identity (Invariant 8)
- Forever-system persistence/recovery principles apply (Invariant 9)

**3. "Sealing validation failed — missing objective"**

The handoff package passed build but failed validation. Check:

- Objective must be present in the handoff package (validator §10)
- Current task/state must exist
- Constraints must be defined (at least one)
- Critical decisions must be recorded
- Pending work must exist
- Artifacts must be referenced
- Recovery information must exist where necessary
- Package must be internally consistent
- Package must be persistently available

**4. "Continuation verification failed — missing critical decisions"**

After reconstruction, the resumed agent is missing critical decisions. Check:

- Decisions array must not be empty in the handoff package
- Sealed handoff must remain recoverable (Invariant 11)
- Resumed agent must determine what to do next without guessing (Invariant 12)

**5. "Invalid lifecycle transition"**

Attempted lifecycle transition not in the authorized order. The lifecycle state machine
 enforces: ACTIVE → HANDOFF_REQUESTED → SCANNING → BUILDING → VALIDATING → SEALED →
 COMPACTION_AUTHORIZED → COMPACTING → RESUMING → RECONSTRUCTED → CONTINUE. Transitions
must follow this order; racing compaction before handoff is sealed is a failure.

### Debug Mode

Run with extra logging:

```bash
FOREVER_HANDOFF_CONFIG=/path/to/config.js node --no-warnings src/plugin.js --debug
```

Or inspect the validation result object for detailed check output.

## Tooling Badges

> **Note**: The Red should never contain what the current state of the project is.
> Badges shown below are informational only and reflect general status categories,
> not the project's current development state.

| Badge | Description |
|---|---|
| ![standalone-yes](https://img.shields.io/badge/standalone--yes-000000.svg) | No external harness/provider/model dependencies |
| ![node-18+](https://img.shields.io/badge/node-18%2B-green.svg) | Requires Node.js >= 18 |
| ![MIT](https://img.shields.io/badge/license-MIT-000000.svg) | MIT license |
| ![verifiable](https://img.shields.io/badge/verifiable--without--code-000000.svg) | CI badge = truth, not prose self-praise (FOREVER-SYSTEM.md §7) |

**Badge usage** (markdown):

```markdown
![standalone-yes](https://img.shields.io/badge/standalone--yes-000000.svg)
![node-18+](https://img.shields.io/badge/node-18%2B-green.svg)
![MIT](https://img.shields.io/badge/license-MIT-000000.svg)
```

## Package Structure

```
handoff/
├── package.json              # Module config (name: handoff; deps: zod only)
├── tsconfig.json             # TypeScript configuration
├── src/
│   ├── plugin.js             # Main entry point
│   ├── config.js             # Self-resolving config (env → home → built-in)
│   ├── invariants.js         # 12 mandatory invariants
│   ├── lifecycle.js          # Lifecycle state machine
│   ├── scanner.js            # State scanner (12 categories, P0-P4)
│   ├── builder.js            # Handoff package builder
│   ├── validator.js          # Sealing validation
│   ├── reconstructor.js      # State reconstruction ( §13 )
│   ├── continuation.js       # Continuation verification ( §14 )
│   └── types.js              # Shared type definitions
├── agent-handoff.md          # Authoritative specification (1032 lines)
├── AGENTS.md                 # This file — investigation notes
└── README.md                 # This user-facing document
```

## NPM Publication

```bash
# Build first
npm run build

# Publish (requires npmjs account)
npm login
npm publish
```

The published package contains:
- `package.json` with only `zod: ^4.1.13` as runtime dependency
- Compiled JS in `dist/`
- `README.md`, `LICENSE`
- No `node_modules` in the tarball (only `zod` and its minimal deps)

The installed package functions fully after `npm install handoff` — no post-install
setup required for basic function. Self-resolving config handles path resolution at runtime.

## References

- `agent-handoff.md` — definitive lifecycle and contract (1032 lines)
- `FOREVER-SYSTEM.md` — foundational protocols (singular source, self-resolving paths,
  layered never-rewritten, fail-closed, platform-agnostic, verifiable without code)
- `FOREVER-GATE/AGENTS.md` — reference implementation of gate patterns (scope, invariants,
  protected files, lockdown) — complementary, independent enforcement layer
- CI badge: green = truth, red = stop (FOREVER-SYSTEM.md §7)

---

*Specification: `agent-handoff.md`. Standards: `FOREVER-SYSTEM.md`. Philosophy: handoff
exists before compaction, not as a consequence.*