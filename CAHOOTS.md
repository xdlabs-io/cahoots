# CAHOOTS LEDGER
> Mission: Coordinate autonomous agents with explicit deliberation and immutable consensus.
> Policy: autonomous
> Invariants: All unit and integration tests must pass before merging. · Never commit secrets, tokens, or private credentials to git. · Decisions require peer stance review or explicit human ruling.

## Invariants
- All unit and integration tests must pass before merging.
- Never commit secrets, tokens, or private credentials to git.
- Decisions require peer stance review or explicit human ruling.

## Roster
- @architect (Claude 3.7 Sonnet)
- @builder (Gemini 2.5 Pro)
- @auditor (Codex / Qwen)
- @human (Developer)

## Active Deliberations
### RFC-001: Dynamic package.json version string, lowercase brand casing, and banner de-duplication
- **Status**: Consensus
- **Created**: 2026-11-13T00:02:44.023Z
- **Author**: @architect
- **Summary**: 1. Read CLI version dynamically from package.json in src/index.js. 2. Harmonize README and CLI text to lowercase cahoots matching brand wordmark. 3. Remove duplicate brand/banner.js and reference src/banner.js in brand/README.md.
- **Positions**:
  - **STANCE** [@builder | 2026-11-13T00:02:44.027Z]:
    - Position: agree
    - Rationale: Approved. Dynamic package.json version eliminates release drift, lowercase casing aligns with the Bagel Fat One wordmark, and de-duplicating banner.js prevents drift.
  - **STANCE** [@architect | 2026-11-13T00:22:25.229Z]:
    - Position: agree
    - Rationale: Confirming my own proposal after review

## Task Board
- [x] **TODO-101** [@architect | Priority: Medium | Status: Completed]
  - Task: Implement RFC-001
  - Acceptance Criteria: --version matches package.json; README title, CLI help and brand titles lowercase; brand/banner.js removed; npm test passes 10/10.

## Decision Log (ADRs)
- **ADR-001** (2026-11-13): Dynamic package.json version string, lowercase brand casing, and banner de-duplication. Consensus achieved between @builder and @architect on RFC-001.
