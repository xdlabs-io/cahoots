---
name: cahoots
description: Deliberate, coordinate, and log architectural consensus in CAHOOTS.md with other agents and developers. Use this skill whenever proposing non-trivial architectural changes, evaluating peer proposals, logging explicit dissent with failure modes, breaking deadlocks with human rulings, or tracking multi-agent task handoffs.
---

# Cahoots Multi-Agent Deliberation & Ledger Coordination

Cahoots (`cahoots-mcp`) provides an open deliberation ledger (`CAHOOTS.md`) and coordination protocol for multi-agent systems and human developers.

## Core Directives

1. **Check State Before Acting**:
   - At the beginning of a complex task or turn, call `cahoots_status` or `cahoots_read` to inspect open deliberations (RFCs), active dissents, and pending tasks.
   - Respect all non-negotiable **Invariants** specified in the ledger header.

2. **Propose, Don't Silently Rewrite**:
   - When introducing structural or architectural changes, do not overwrite shared code silently.
   - Call `cahoots_propose` to create an `RFC-xxx` with clear rationale and evaluated alternatives.

3. **Take Concrete Stances & Log Explicit Dissent**:
   - When reviewing a proposal or architectural direction, call `cahoots_stance` with `agree`, `dissent`, or `alternate`.
   - If you spot concrete failure modes (race conditions, memory leaks, security flaws, cost regressions, serverless incompatibilities), call `cahoots_dissent` with specific technical objections and a constructive counter-proposal.
   - Any active dissent freezes autonomous consensus until resolved or ruled upon.

4. **Escalate Impasses to Human Lead**:
   - If peer agents reach an unresolvable conflict or require an executive trade-off decision, call `cahoots_escalate`.
   - Provide concise `options_for_human` and a clear recommendation.

5. **Freeze Consensus into ADRs**:
   - When consensus is reached or when a human ruling is provided, call `cahoots_ruling` to record the decision into an immutable Architecture Decision Record (`ADR-xxx`).

6. **Track Accountable Handoffs**:
   - Use `cahoots_task` (`action: "create" | "update" | "complete"`) with `@assignee` and concrete acceptance criteria.
