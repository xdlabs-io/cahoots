# cahoots
> **Agents in cahoots, on the record.**  
> The open deliberation ledger and shared coordination protocol for multi-agent systems and developers.

[![License: MIT](https://img.shields.io/badge/license-MIT-1F1A17.svg)](LICENSE)

---

## What is Cahoots?

When multiple autonomous agents (Claude Code, OpenAI Codex, Google Gemini, Cursor) work on the same codebase, they usually fail in one of two ways:
1. **Context Loss & Amnesia**: Decisions made in one model session die the moment the turn ends.
2. **Silent Disagreements & Rewrites**: Agent A writes an architecture; Agent B wipes it out 10 minutes later without explaining why.

**Cahoots** fixes this by giving agents a structured, append-only markdown ledger: `CAHOOTS.md`.

Instead of conversational fluff, agents post typed **STANCES**, log explicit **DISSENT**, escalate deadlocks to the developer with **ESCALATION**, assign accountable **TASKS**, and await **HUMAN RULINGS** when consensus cannot be reached autonomously.

---

## Core Primitives: The Cahoots Protocol

Cahoots operates on 7 typed records in `CAHOOTS.md`:

| Primitive | Purpose | Example |
| :--- | :--- | :--- |
| `PROPOSAL` | An agent pitches an architectural change with rationale & trade-offs. | `RFC-001: Adopt SQS for async ingest` |
| `STANCE` | A peer agent logs its position: agreement, critique, or constructive alternative. | `Gemini supports; Claude requests review` |
| `DISSENT` | An agent formally objects with mandatory failure modes & counter-proposal. | `[DISSENT] Codex objects: Lambda concurrency wipes SQLite` |
| `ESCALATION` | An agent halts debate and summons the developer with structured options. | `[ESCALATED] Ephemeral SQLite vs Redis cost` |
| `HUMAN RULING` | The developer breaks ties and sets binding ground rules right in the file. | `HUMAN RULING: Go with Option B.` |
| `TASK` | Accountable task handoffs with `@assignee`, prerequisites, and acceptance criteria. | `- [ ] TASK-104 [@coder-agent]` |
| `DECISION` | Frozen Architecture Decision Record (ADR). Immutable consensus. | `ADR-001: Upstash Redis selected` |

---

## Human-in-the-Loop (HITL) Governance Policies

Set right in the ledger header (`> Policy: autonomous | strict | consensus`):

| Policy | Behavior |
| :--- | :--- |
| `autonomous` (Default) | Agents auto-resolve when 2+ agree and 0 dissent. Any active dissent freezes code and escalates to the human developer. |
| `strict` | Agents deliberate and log stances, but all decisions require explicit human ruling before tasks can be assigned. |
| `consensus` | Majority stance rules, but ties or invariant violations escalate to the human developer. |

---

## Slash Commands in Claude Code

When installed as a Claude plugin, Cahoots provides built-in commands:

| Command | Description |
| :--- | :--- |
| `/cahoots-status` | Display high-level telemetry, active RFCs, unaddressed dissents, and task handoffs. |
| `/cahoots-propose <title>` | Scaffold a structured architectural RFC in `CAHOOTS.md`. |

---

## The `CAHOOTS.md` Format

```markdown
# CAHOOTS Deliberation Ledger
> Mission: Scale Postbuild launch distribution pipeline.
> Policy: autonomous
> Invariants: All tests must pass (100% green). · Keep secrets out of repo.

## Invariants
- All tests must pass (100% green).
- Keep secrets out of repo.

## Roster
- @architect (Claude 3.7 Sonnet)
- @builder (Gemini 2.5 Pro)
- @auditor (Codex)
- @human (Developer / Lead Human)

## Active Deliberations

### RFC-002: Inbound Webhook Processing Strategy
- **Status**: [ESCALATED: Awaiting Human Ruling]
- **Created**: 2026-11-12T16:00:00Z
- **Author**: @architect
- **Summary**: Buffer raw webhook payloads to survive serverless timeouts.
- **Positions**:
  - **STANCE** [@builder | 2026-11-12T16:04:00Z]:
    - Position: agree
    - Rationale: SQLite buffer is zero external dependency.
  - **STANCE** [@auditor | 2026-11-12T16:08:00Z]:
    - Position: dissent
    - Rationale: Read-only serverless filesystem wipes local SQLite files across concurrent lambdas.
- **Escalation** [@auditor | 2026-11-12T16:10:00Z]:
  - Reason: Conflict between serverless execution constraints and local persistence.
  - Options:
    - [A] Local SQLite buffer: Free, but fails on stateless concurrent lambdas.
    - [B] Upstash Redis REST API: $10/mo, persistent queue, survives serverless.
  - Recommendation: Option B for production reliability.
- **HUMAN RULING** [@human | 2026-11-12T16:15:00Z]:
  - Decision: Approved Option B (Upstash Redis). Remote persistence required.

## Task Board
- [ ] **TASK-101** [@builder | Priority: High | Status: Pending]
  - Task: Implement Upstash Redis webhook receiver in `api/inbound.js`.
  - Prerequisites: ADR-001
  - Acceptance Criteria: Unit tests pass with 200 OK under 50ms.

## Decision Log (ADRs)
- **ADR-001** (2026-11-12): Upstash Redis selected for webhook ingest. Ruling by @human.
```

---

## License

MIT © [Bennett Moore](https://www.xdlabs.io)
