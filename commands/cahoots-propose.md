---
description: Propose an architectural RFC in the Cahoots deliberation ledger (CAHOOTS.md)
---

Propose an architectural change in `CAHOOTS.md`:

1. Read `CAHOOTS.md` in the current project root (initialize if it does not exist).
2. Determine the next sequential RFC ID (e.g. `RFC-001`, `RFC-002`).
3. Scaffold a new RFC section with:
   - **Title**: User-provided or inferred from task context
   - **Status**: `In Review`
   - **Author**: Current agent or `@human`
   - **Date**: Today's ISO date (`YYYY-MM-DD`)
   - **Context & Problem Statement**
   - **Proposed Solution**
   - **Evaluated Alternatives**
   - **Initial Stances & Dissents** placeholder
4. Append or surgically insert the new RFC into `CAHOOTS.md` without overwriting existing entries.
5. Present the created proposal to the user and prompt for peer agent or human feedback.
