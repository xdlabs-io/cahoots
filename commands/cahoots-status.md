---
description: Display high-level telemetry and status of the Cahoots deliberation ledger (CAHOOTS.md)
---

Inspect `CAHOOTS.md` in the current project root and summarize the state of the multi-agent deliberation ledger:

1. **Invariants**: List non-negotiable architectural invariants.
2. **Active Deliberations (RFCs)**:
   - Total open RFCs, their authors, target components, and review status.
   - Flag any RFC with active **Dissent** that requires resolution.
3. **Architecture Decisions (ADRs)**:
   - Total accepted ADRs and most recent rulings.
4. **Task Handoffs**:
   - Total pending vs completed tasks, broken down by assignee.
   - Highlight any blocked or high-priority items.

If `CAHOOTS.md` does not exist in the current working directory, inform the user and offer to initialize a new deliberation ledger.
