#!/usr/bin/env node
'use strict'

/**
 * Self-Resolving Config (FOREVER-SYSTEM.md §2)
 * 
 * Every component resolves its own paths from: env override → home default →
 * built-in default. Resolved FRESH on every call, never cached at import, never
 * hardcoded. This is what makes a thing "plug-in play" — drop it on any machine,
 * any OS, any container, and it finds itself. No installer ceremony.
 * 
 * Paths are computed at use-time, not module-load-time.
 * No absolute paths in source. No /home/drdeeks/... literals.
 * Agnostic to where it runs: bare metal, Ventoy USB, container with persistent
 * state, CI runner. Same code, different env, zero changes.
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

/**
 * Resolve config path from priority: env → home → built-in
 * @returns {{path: string, source: string}} Resolved config path and its source
 */
function resolveConfigPath() {
  // 1. FOREVER_HANDOFF_CONFIG env var (highest priority)
  if (process.env.FOREVER_HANDOFF_CONFIG) {
    // Verify file exists
    try { require('fs').accessSync(process.env.FOREVER_HANDOFF_CONFIG) } catch {
      throw new Error(`FOREVER_HANDOFF_CONFIG env var set but file not found: ${process.env.FOREVER_HANDOFF_CONFIG}`)
    }
    return { path: process.env.FOREVER_HANDOFF_CONFIG, source: 'env' }
  }

  // 2. ~/.forever-handoff/config.json (home default)
  const homeDir = os.homedir()
  const homePath = path.join(homeDir, '.forever-handoff', 'config.json')
  try { require('fs').accessSync(homePath) } catch {
    // Home config doesn't exist, continue to built-in
  }
  if (fs.existsSync(homePath)) {
    return { path: homePath, source: 'home' }
  }

  // 3. ./handoff/config.json (built-in default, always present relative to module)
  const builtInPath = path.resolve('handoff', 'config.json')
  // Note: caller must verify this exists; this function returns the path
  // and the caller is responsible for checking existence
  return { path: builtInPath, source: 'built-in' }
}

/**
 * Load config from resolved path
 * @param {string} configPath - Path from resolveConfigPath()
 * @returns {object} Loaded config object
 * @throws {Error} If config file cannot be read or parsed
 */
function loadConfig(configPath) {
  try {
    const raw = fs.readFileSync(configPath, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    throw new Error(`Failed to load config from ${configPath}: ${err.message}`)
  }
}

/**
 * Get config with self-resolving path resolution (fresh on every call)
 * @param {object} options - Options
 * @param {boolean} [options.required=false] - Throw if config not found
 * @returns {object|undefined} Config object or undefined if not found and not required
 */
function getConfig(options = {}) {
  const { required = false } = options
  const configPath = resolveConfigPath()

  // Check if built-in path exists when source is 'built-in'
  if (configPath.source === 'built-in') {
    try { require('fs').accessSync(configPath.path) } catch {
      if (required) {
        throw new Error(`Built-in config not found at ${configPath.path}. Set FOREVER_HANDOFF_CONFIG env var or create ~/.forever-handoff/config.json`)
      }
      return undefined
    }
  }

  return loadConfig(configPath.path)
}

module.exports = { resolveConfigPath, loadConfig, getConfig, INVARIANTS: {
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
