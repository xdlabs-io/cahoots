import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLedger, recordRulingInMarkdown } from '../src/parser.js';

const SAMPLE_MD = `# CAHOOTS Deliberation Ledger
> Mission: Scale launch distribution pipeline.
> Policy: autonomous
> Invariants: All tests must pass (100% green). · Keep secrets out of repo.

## Invariants
- All tests must pass (100% green).
- Keep secrets out of repo.

## Roster
- @architect (Claude 3.7 Sonnet)
- @builder (Gemini 2.5 Pro)
- @auditor (Codex)
- @human (Developer)

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

## Task Board
- [ ] **TASK-101** [@builder | Priority: High | Status: Pending]
  - Task: Implement Upstash Redis webhook receiver in \`api/inbound.js\`.
  - Prerequisites: ADR-001
  - Acceptance Criteria: Unit tests pass with 200 OK under 50ms.

## Decision Log (ADRs)
- **ADR-001** (2026-11-12): Upstash Redis selected for webhook ingest. Ruling by @human.
`;

test('parseLedger parses full Cahoots protocol accurately', () => {
  const ledger = parseLedger(SAMPLE_MD);

  assert.equal(ledger.mission, 'Scale launch distribution pipeline.');
  assert.equal(ledger.policy, 'autonomous');
  assert.equal(ledger.invariants.length, 2);
  assert.equal(ledger.roster.length, 4);

  assert.equal(ledger.deliberations.length, 1);
  const rfc = ledger.deliberations[0];
  assert.equal(rfc.id, 'RFC-002');
  assert.equal(rfc.title, 'Inbound Webhook Processing Strategy');
  assert.equal(rfc.author, '@architect');
  assert.equal(rfc.positions.length, 2);
  assert.equal(rfc.positions[0].position, 'agree');
  assert.equal(rfc.positions[1].position, 'dissent');

  assert.ok(rfc.escalation);
  assert.equal(rfc.escalation.options.length, 2);
  assert.equal(rfc.escalation.options[0].key, 'A');
  assert.equal(rfc.escalation.options[1].key, 'B');

  assert.equal(ledger.tasks.length, 1);
  assert.equal(ledger.tasks[0].id, 'TASK-101');
  assert.equal(ledger.tasks[0].assignee, '@builder');

  assert.equal(ledger.adrs.length, 1);
  assert.equal(ledger.adrs[0].id, 'ADR-001');
});

test('recordRulingInMarkdown records human ruling and consensus', () => {
  const updated = recordRulingInMarkdown(SAMPLE_MD, {
    rfcId: 'RFC-002',
    rulingText: 'Approved Option B (Upstash Redis). Remote persistence required.',
    author: '@human',
    date: '2026-11-15T17:00:00Z'
  });

  const ledger = parseLedger(updated);
  const rfc = ledger.deliberations.find(d => d.id === 'RFC-002');
  assert.ok(rfc);
  assert.ok(rfc.status.includes('Consensus Achieved'));
  assert.ok(rfc.humanRuling);
  assert.ok(rfc.humanRuling.decision.includes('Option B'));
  assert.equal(ledger.adrs.length, 2);
});
