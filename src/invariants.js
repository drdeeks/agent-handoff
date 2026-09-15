/**
 * 12 Mandatory Invariants (from agent-handoff.md §22)
 * 
 * All invariants are enforced within this module. No external harness is needed.
 * Violation of any invariant stops the lifecycle chain and prevents compaction.
 * 
 * Invariant 1: Handoff occurs before compaction
 * Invariant 2: Handoff validation occurs before compaction authorization
 * Invariant 3: The handoff mechanism may ultimately trigger compaction
 * Invariant 4: Compaction must never destroy the only copy of required continuation state
 * Invariant 5: The handoff is not merely a transcript summary
 * Invariant 6: The scanner must inspect operational state beyond conversational text
 * Invariant 7: The mechanism must remain adaptable to different execution environments
 * Invariant 8: No external harness becomes the architectural identity of the handoff system
 * Invariant 9: Forever-system persistence and recovery principles apply to handoff state
 * Invariant 10: A failed handoff cannot silently authorize destructive compaction
 * Invariant 11: A sealed handoff must remain recoverable
 * Invariant 12: The resumed agent must determine what to do next without guessing critical state
 */
const INVARIANTS = {
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

module.exports = { INVARIANTS }