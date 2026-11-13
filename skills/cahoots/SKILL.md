---
name: cahoots
description: Deliberate, coordinate, and log architectural consensus in CAHOOTS.md with other agents and developers. Use this skill whenever proposing non-trivial architectural changes, evaluating peer proposals, logging explicit dissent with failure modes, breaking deadlocks with human rulings, or tracking multi-agent task handoffs.
---

# Cahoots Multi-Agent Deliberation & Ledger Coordination

Cahoots provides an open deliberation ledger (`CAHOOTS.md`) and coordination protocol for multi-agent systems and human developers. It replaces silent file overwrites and uncoordinated agent collisions with typed proposals, explicit peer dissent, human tie-breaking, and immutable Architecture Decision Records (ADRs).

---

## 1. Operating Rules & Workflow

1. **Check State Before Acting**:
   - At the beginning of a complex task, check for an existing `CAHOOTS.md` in the project root.
   - Read the ledger to inspect open RFCs, active dissents, accepted ADRs, and pending tasks.
   - Respect all non-negotiable **Invariants** in the ledger header.

2. **Initialize If Missing**:
   - If `CAHOOTS.md` does not exist and you are beginning multi-agent or architectural work, create it using the template below.

3. **Propose, Don't Silently Overwrite**:
   - For any non-trivial structural, database, protocol, or design change, log a new RFC in `CAHOOTS.md` before executing.
   - Detail the problem, proposed solution, evaluated alternatives, and trade-offs.

4. **Take Concrete Stances & Log Explicit Dissent**:
   - When reviewing another agent or developer's proposal, log an explicit stance: `Agree`, `Dissent`, or `Alternate`.
   - If you spot concrete failure modes (race conditions, memory leaks, security flaws, performance regressions, breaking API changes), write a clear dissent block with technical reasoning and a counter-proposal.
   - **Rule**: Any active dissent freezes autonomous consensus until resolved or ruled upon by the human lead.

5. **Escalate Deadlocks to Human Lead**:
   - When agents disagree or an executive trade-off is required, create an escalation note with clear numbered options and a recommendation.
   - Wait for or prompt the human user for a ruling.

6. **Freeze Consensus into Immutable ADRs**:
   - Once consensus is reached or a human ruling is provided, record the decision in the **Architecture Decision Records (ADRs)** section.
   - Update the RFC status to `Accepted` or `Rejected`.

7. **Track Accountable Handoffs**:
   - Break implementation work into concrete tasks under **Task Handoffs** with assignees (`@agent-name`, `@human`), priorities, and acceptance criteria.
   - Mark tasks completed (`[x]`) as implementation progresses.

---

## 2. Standard `CAHOOTS.md` Ledger Template

```markdown
# CAHOOTS Deliberation Ledger

## Project Invariants
- Invariant 1: [e.g. Zero data loss during migrations]
- Invariant 2: [e.g. All API endpoints must enforce authentication]

## Active Deliberations (RFCs)

### RFC-001: [Proposal Title]
- **Status**: In Review | Accepted | Rejected | Superseded
- **Author**: [@agent or @human]
- **Date**: YYYY-MM-DD
- **Target Component**: [file or subsystem path]

#### Context & Problem
[Describe what problem this proposal solves and why current behavior is insufficient.]

#### Proposed Solution
[Specific technical design, interfaces, data models, or workflows.]

#### Evaluated Alternatives
- **Option A**: [Alternative evaluated and why it was rejected]
- **Option B**: [Alternative evaluated and why it was rejected]

#### Stances & Dissents
- **@agent-reviewer** (YYYY-MM-DD): **Agree** | Rationale: Verified backwards compatibility.
- **@agent-auditor** (YYYY-MM-DD): **Dissent** | Failure Mode: Potential N+1 query under heavy load. Counter-proposal: Batch requests with DataLoader.

---

## Architecture Decision Records (ADRs)

### ADR-001: [Decision Title]
- **Date**: YYYY-MM-DD
- **Status**: Accepted
- **Driver**: RFC-001 / [Human Ruling by @user]

#### Decision
[Clear statement of what was decided and will be implemented.]

#### Consequences
- **Positive**: [Benefits achieved]
- **Negative / Trade-offs**: [Accepted liabilities or limitations]

---

## Task Handoffs

- [ ] **TASK-001**: [Task description] | **Assignee**: @developer | **Priority**: High | **Acceptance**: [Concrete test or verification condition]
- [x] **TASK-002**: [Completed task description] | **Assignee**: @builder | **Completed**: YYYY-MM-DD
```

---

## 3. Formatting & Mutation Guidelines

- **Atomic Markdown Edits**: Always read the existing `CAHOOTS.md` before modifying. Use surgical edits to append or update specific sections without losing previous RFCs or ADRs.
- **Sequential Numbering**: Increment RFC IDs (`RFC-001`, `RFC-002`), ADR IDs (`ADR-001`, `ADR-002`), and Task IDs (`TASK-001`, `TASK-002`) sequentially.
- **Timestamping**: Always use ISO dates (`YYYY-MM-DD`).
