# Handoff Agent State Preservation

**Repository**: `/home/drdeek/Downloads/dev-helpers/handoff/`
**Purpose**: Pre-compaction agent state persistence and continuation across context boundaries.
**Specification**: `agent-handoff.md` (1032 lines — authoritative source)
**Philosophy**: Handoff occurs **before** compaction. No destructive context transition until continuation state has been materialized and validated.

---

## 1. What Is Missing

The handoff mechanism is currently a specification-only document (`agent-handoff.md`). No executable implementation exists within this directory. The following capabilities are defined but not yet implemented:

- State scanner (operational state beyond conversational text)
- Handoff package builder (canonical contract from §21)
- Validator (sealing validation from §10)
- Reconstructor (reconstruction from §13)
- Continuation verification (from §14)
- Self-resolving config (env → home → built-in from FOREVER-SYSTEM.md §2)
- 12 mandatory invariants (from agent-handoff.md §22)
- Lifecycle state machine (from §2 and §12)

---

## 2. What Is Needed

To move from specification to implementation, the following are needed:

| Category | Item | Source |
|---|---|---|
| **Implementation** | Executable handoff plugin (self-contained, zero external deps beyond Node built-ins) | This work |
| **Architecture** | Lifecycle state machine (ACTIVE→HANDOFF_REQUESTED→SCANNING→BUILDING→VALIDATING→SEALED→COMPACTING→RESUMING→RECONSTRUCTED→CONTINUE) | agent-handoff.md §2, §12 |
| **Scanner** | Operational state scanner (categories P0-P4, 12 state categories: FACT/DECISION/CONSTRAINT/STATE/INTENT/ASSUMPTION/HYPOTHESIS/PENDING WORK/COMPLETED WORK/FAILURE/RECOVERY INFORMATION) | agent-handoff.md §4, §6 |
| **Package** | Handoff package builder (minimum contract: id, version, status, created_at, source_state, objective, current_state, completed/pending, decisions, constraints, invariants, verified_facts, assumptions, unresolved, failures, recovery, artifacts, dependencies, provenance, continuation) | agent-handoff.md §21 |
| **Validator** | Sealing validation (objective, constraints, decisions, pending work, artifacts referenced, recovery info, internal consistency, persistent availability) | agent-handoff.md §10 |
| **Reconstructor** | State reconstruction (IDENTITY→OBJECTIVE→CURRENT STATE→CONSTRAINTS→DECISIONS→PENDING WORK→RECOVERY INFORMATION→MEMORY/ARCHIVE REFERENCES→CONTINUATION) | agent-handoff.md §13 |
| **Continuation** | Post-reconstruction verification (missing objective, constraints, pending work, decisions, stale state, inconsistent state, missing artifact references, invalid assumptions, incomplete recovery) | agent-handoff.md §14 |
| **Config** | Self-resolving paths (FOREVER_HANDOFF_CONFIG env var → ~/.forever-handoff/config.json → ./handoff/config.json) | FOREVER-SYSTEM.md §2 |
| **Invariants** | 12 mandatory invariants enforced within the module | agent-handoff.md §22 |

---

## 3. What Is Necessary

For a functional, standalone handoff system that:

- Preserves agent operational state before context compaction
- Exists before compaction (not as a consequence)
- Is adaptable to different execution environments
- Does not encode permanent dependency on any provider, model, or harness
- Is verifiable without reading code (CI badge pattern from FOREVER-SYSTEM.md §7)
- FollowsForever-system principles (singular source of truth, self-resolving paths, layered never-rewritten, fail-closed, tamper-EVIDENT, platform-agnostic)

The necessary components are:

1. **State scanner** — must inspect operational state beyond conversational text (Invariant 6)
2. **Package builder** — must produce canonical handoff package with all §21 minimum fields
3. **Validator** — must establish sealing criteria before compaction authorization (Invariant 2)
4. **Reconstructor** — must restore state in defined order (Invariant 12: resumed agent must not guess)
5. **Continuation verifier** — must identify gaps after reconstruction (Invariant 12)
6. **Self-resolving config** — must resolve paths fresh on every call (FOREVER-SYSTEM.md §2)
7. **12 invariants** — must all be enforced (agent-handoff.md §22)
8. **Lifecycle state machine** — must enforce ordering (Invariant 1: handoff before compaction)

---

## 4. Where We're At

| Status | Detail |
|---|---|
| **Specification** | ✅ Complete — `agent-handoff.md` (1032 lines) defines lifecycle, package contract, invariants, scanner priorities, sealing requirements, reconstruction order, continuation verification, and 12 invariants |
| **Implementation** | ❌ None — no executable handoff plugin exists within this directory |
| **Package** | ❌ None — no handoff plugin package exists |
| **Scanner** | ❌ None — state scanning not yet implemented |
| **Builder** | ❌ None — handoff package building not yet implemented |
| **Validator** | ❌ None — sealing validation not yet implemented |
| **Reconstructor** | ❌ None — state reconstruction not yet implemented |
| **Continuation Verification** | ❌ None — post-reconstruction checks not yet implemented |
| **Config Resolution** | ❌ None — self-resolving path resolution not yet implemented |
| **Invariants** | ❌ None — 12 mandatory invariants not yet enforced in code |
| **Lifecycle State Machine** | ❌ None — explicit state transitions not yet implemented |
| **NPM Package** | ❌ None — not published or ready for installation |
| **Self-Contained** | ✅ Goal — when implemented, will have zero external runtime dependencies (only Node built-ins + optional `zod` for schema validation) |
| **System-Agnostic** | ✅ Goal — will work in any Node.js environment (bare metal, container, CI, USB runtime) without hardcoded paths, providers, or models |
| **Publishable** | ⚠️ Planned — will be structured for npmjs publication with minimal deps |

---

## 5. Key Invariants (from agent-handoff.md §22)

| Invariant | Status | Statement |
|---|---|---|
| Invariant 1 | ❌ Not enforced | Handoff occurs before compaction |
| Invariant 2 | ❌ Not enforced | Handoff validation occurs before compaction authorization |
| Invariant 3 | ❌ Not enforced | The handoff mechanism may ultimately trigger compaction |
| Invariant 4 | ❌ Not enforced | Compaction must never destroy the only copy of required continuation state |
| Invariant 5 | ❌ Not enforced | The handoff is not merely a transcript summary |
| Invariant 6 | ❌ Not enforced | The scanner must inspect operational state beyond conversational text |
| Invariant 7 | ❌ Not enforced | The mechanism must remain adaptable to different execution environments |
| Invariant 8 | ❌ Not enforced | No external harness becomes the architectural identity of the handoff system |
| Invariant 9 | ❌ Not enforced | Forever-system persistence and recovery principles apply to handoff state |
| Invariant 10 | ❌ Not enforced | A failed handoff cannot silently authorize destructive compaction |
| Invariant 11 | ❌ Not enforced | A sealed handoff must remain recoverable |
| Invariant 12 | ❌ Not enforced | The resumed agent must determine what to do next without guessing critical state |

---

## 6. Commands

```
# Read the specification
cat agent-handoff.md

# TODO: Once implemented, run:
# npm run build    # Compile the handoff plugin
# node src/plugin.js  # Start the handoff mechanism
```

---

## 7. References

- `agent-handoff.md` — definitive lifecycle and contract (1032 lines)
- `FOREVER-SYSTEM.md` — foundational protocols (singular source, self-resolving paths, layered invariants, fail-closed, platform-agnostic, verifiable without code)

---
*Current state: specification complete, implementation pending. See sections above for what is missing, needed, necessary, and where we're at.*