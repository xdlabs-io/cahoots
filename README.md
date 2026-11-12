# Cahoots (`cahoots-mcp`)
> **Agents in cahoots, on the record.**  
> The open deliberation ledger and shared coordination protocol for multi-agent systems.

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![npm version](https://img.shields.io/badge/npm-v0.0.1-blue.svg)](https://www.npmjs.com/package/cahoots-mcp)

---

## What is Cahoots?

When multiple autonomous agents (Claude Code, OpenAI Codex, Google Gemini, Cursor) work on the same codebase, they usually fail in one of two ways:
1. **Context Loss & Amnesia**: Decisions made in one model session die the moment the turn ends.
2. **Silent Disagreements & Rewrites**: Agent A writes an architecture; Agent B wipes it out 10 minutes later without explaining why.

**Cahoots** fixes this by giving agents a structured, append-only markdown ledger: `CAHOOTS.md`.

Instead of conversational fluff, agents post typed **STANCES**, log explicit **DISSENT**, assign accountable **TODOS**, and await **HUMAN RULINGS** when deadlocked.

---

## Core Primitives: The Cahoots Protocol

Cahoots operates on 5 typed records in `CAHOOTS.md`:

| Primitive | Purpose | Example |
| :--- | :--- | :--- |
| `PROPOSAL` | An agent pitches an architectural change with rationale & trade-offs. | `RFC-001: Adopt SQS for async ingest` |
| `STANCE` | A peer agent logs its position: agreement, critique, or constructive alternative. | `Gemini supports; Claude dissents on timeout risk` |
| `HUMAN RULING` | The developer breaks ties and sets ground rules right in the file. | `HUMAN RULING: Go with Option B.` |
| `TODO` | Accountable task handoffs with `@assignee`, prerequisites, and acceptance criteria. | `- [ ] TODO-104 [@coder-agent]` |
| `DECISION` | Frozen Architecture Decision Record (ADR). Immutable consensus. | `ADR-001: Locked schema` |

---

## Quickstart

### 1. Initialize `CAHOOTS.md` in Your Project
```bash
npx cahoots-mcp init
```

### 2. Connect to Your AI Coding Agents (MCP)

Add Cahoots to your Claude Code, Cursor, or Antigravity MCP configuration:

```json
{
  "mcpServers": {
    "cahoots": {
      "command": "npx",
      "args": ["-y", "cahoots-mcp", "serve"]
    }
  }
}
```

---

## The `CAHOOTS.md` Format

```markdown
# CAHOOTS LEDGER
> Mission: Scale Postbuild launch distribution pipeline.
> Invariants: All tests must pass (71/71). Keep secrets out of repo.

## Roster
- @architect (Claude 3.7 Sonnet)
- @builder (Gemini 2.5 Pro)
- @auditor (Codex)

## Active Deliberations

### RFC-002: Inbound Webhook Processing Strategy
- **Status**: Deliberating
- **Proposal** [@architect | 2026-11-12T16:00:00Z]:
  Dump raw payloads to SQLite buffer and process asynchronously to prevent 10s serverless function timeouts.
- **STANCE** [@builder | 2026-11-12T16:04:00Z]:
  Agree on timeout risk, but propose ephemeral Redis buffer instead of SQLite on Vercel read-only filesystem.
- **HUMAN RULING** [@bennett | 2026-11-12T16:15:00Z]:
  Approved @builder's Redis approach. Keep timeout at 15s.

## Task Board
- [ ] **TODO-101** [@builder | Priority: High]
  - Task: Implement Upstash Redis webhook receiver in `api/inbound.js`.
  - Acceptance Criteria: Unit tests pass with 200 OK under 100ms.

## Decision Log
- **ADR-001** (2026-11-12): Upstash Redis selected for webhook ingest. Quorum reached.
```

---

## License

MIT © [XD Labs](https://github.com/xdlabs-io)
