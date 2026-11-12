/**
 * Cahoots MCP Tools Schema Definitions
 * Model Context Protocol (Spec version: 2024-11-05)
 */

export const CAHOOTS_MCP_TOOLS = [
  {
    name: "cahoots_read",
    description: "Read the current multi-agent coordination state from CAHOOTS.md. Returns the active roster, non-negotiable invariants, open deliberations (RFCs), peer stances/dissents, task board, and frozen ADR decisions.",
    inputSchema: {
      type: "object",
      properties: {
        section: {
          type: "string",
          enum: ["all", "deliberations", "tasks", "decisions", "roster", "invariants"],
          default: "all",
          description: "Which section of CAHOOTS.md to retrieve."
        },
        rfc_id: {
          type: "string",
          description: "Optional RFC identifier (e.g. 'RFC-001') to read only that specific deliberation."
        },
        file_path: {
          type: "string",
          default: "CAHOOTS.md",
          description: "Custom path to CAHOOTS.md (defaults to root CAHOOTS.md)."
        }
      }
    }
  },
  {
    name: "cahoots_propose",
    description: "Submit an architectural proposal or change request (creates an RFC-xxx entry in CAHOOTS.md). Peered agents will then review and log their typed STANCES on it.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Short descriptive title of the architectural proposal (e.g. 'Adopt Upstash Redis for Webhook Ingest')."
        },
        author: {
          type: "string",
          description: "Agent or developer handle proposing the change (e.g. '@architect', '@builder', '@claude', '@gemini')."
        },
        summary: {
          type: "string",
          description: "Detailed problem statement, proposed solution, trade-offs, and implementation approach."
        },
        options: {
          type: "array",
          items: { type: "string" },
          description: "Optional list of alternatives evaluated (e.g. ['Option A: SQLite buffer', 'Option B: Redis stream'])."
        },
        file_path: {
          type: "string",
          default: "CAHOOTS.md",
          description: "Custom path to CAHOOTS.md."
        }
      },
      required: ["title", "author", "summary"]
    }
  },
  {
    name: "cahoots_stance",
    description: "Log an agent's typed position on an active deliberation (RFC). Explicitly record agreement, constructive dissent, or alternative designs with concrete rationales and failure risks.",
    inputSchema: {
      type: "object",
      properties: {
        rfc_id: {
          type: "string",
          description: "The RFC identifier being deliberated (e.g. 'RFC-001')."
        },
        agent: {
          type: "string",
          description: "Agent handle taking this stance (e.g. '@builder', '@auditor', '@gemini')."
        },
        position: {
          type: "string",
          enum: ["agree", "dissent", "alternate"],
          description: "'agree' to back the proposal; 'dissent' to object with failure modes; 'alternate' to offer a competing design."
        },
        rationale: {
          type: "string",
          description: "Direct, technical rationale explaining why you hold this stance."
        },
        objections: {
          type: "string",
          description: "Specific risks, race conditions, performance bottlenecks, or security holes identified."
        },
        counter_proposal: {
          type: "string",
          description: "Concrete alternative design if position is 'alternate' or 'dissent'."
        },
        file_path: {
          type: "string",
          default: "CAHOOTS.md",
          description: "Custom path to CAHOOTS.md."
        }
      },
      required: ["rfc_id", "agent", "position", "rationale"]
    }
  },
  {
    name: "cahoots_ruling",
    description: "Record a developer or human tie-break ruling on an open RFC, freezing the debate into binding architectural consensus and optionally generating an immutable ADR.",
    inputSchema: {
      type: "object",
      properties: {
        rfc_id: {
          type: "string",
          description: "The RFC identifier being decided (e.g. 'RFC-001')."
        },
        ruling_by: {
          type: "string",
          default: "@human",
          description: "Handle of the decision maker (e.g. '@bennett', '@human', '@tech-lead')."
        },
        decision: {
          type: "string",
          description: "The final ruling and directive for the agent fleet."
        },
        create_adr: {
          type: "boolean",
          default: true,
          description: "Whether to append a frozen ADR record into the Decision Log section."
        },
        file_path: {
          type: "string",
          default: "CAHOOTS.md",
          description: "Custom path to CAHOOTS.md."
        }
      },
      required: ["rfc_id", "decision"]
    }
  },
  {
    name: "cahoots_escalate",
    description: "Escalate an active deliberation (RFC) to the human developer. Used when peer agents hit an unresolvable impasse, invariant conflict, high financial cost, breaking security boundary, or schema risk. Freezes autonomous changes until a human ruling is issued.",
    inputSchema: {
      type: "object",
      properties: {
        rfc_id: {
          type: "string",
          description: "The RFC identifier to escalate (e.g. 'RFC-001')."
        },
        agent: {
          type: "string",
          description: "Agent handle calling the escalation (e.g. '@auditor', '@architect')."
        },
        reason: {
          type: "string",
          description: "Clear, direct technical explanation of why autonomous resolution is blocked or unsafe."
        },
        options_for_human: {
          type: "array",
          items: { type: "string" },
          description: "Concise list of alternatives formatted for executive review (e.g. ['[A] In-memory cache: Free, loses state on restart', '[B] Redis: $10/mo, persistent state'])."
        },
        recommendation: {
          type: "string",
          description: "The escalating agent's recommended decision."
        },
        file_path: {
          type: "string",
          default: "CAHOOTS.md",
          description: "Custom path to CAHOOTS.md."
        }
      },
      required: ["rfc_id", "agent", "reason"]
    }
  },
  {
    name: "cahoots_task",
    description: "Manage the Cahoots Task Board for cross-agent work distribution. Create, assign, update progress, or mark tasks completed with verifiable acceptance criteria.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["create", "update", "complete", "list"],
          description: "Task action to perform."
        },
        task_id: {
          type: "string",
          description: "Target task ID (e.g. 'TODO-101'). Required for update and complete."
        },
        title: {
          type: "string",
          description: "Description of the task to be performed."
        },
        assignee: {
          type: "string",
          description: "Agent or developer handle assigned to the task (e.g. '@builder', '@claude')."
        },
        priority: {
          type: "string",
          enum: ["High", "Medium", "Low"],
          default: "Medium",
          description: "Priority of the task."
        },
        acceptance_criteria: {
          type: "string",
          description: "Concrete conditions that must be verified before marking completed."
        },
        prerequisites: {
          type: "string",
          description: "Prerequisite tasks or conditions."
        },
        status: {
          type: "string",
          enum: ["Pending", "In Progress", "Completed", "Blocked"],
          description: "Updated status."
        },
        file_path: {
          type: "string",
          default: "CAHOOTS.md",
          description: "Custom path to CAHOOTS.md."
        }
      },
      required: ["action"]
    }
  },
  {
    name: "cahoots_decision",
    description: "Record an Architecture Decision Record (ADR) directly into the Cahoots Decision Log.",
    inputSchema: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "Summary of the architecture decision and rationale."
        },
        adr_id: {
          type: "string",
          description: "Optional custom ADR ID (e.g. 'ADR-005'). If omitted, next sequential ID is used."
        },
        file_path: {
          type: "string",
          default: "CAHOOTS.md",
          description: "Custom path to CAHOOTS.md."
        }
      },
      required: ["summary"]
    }
  },
  {
    name: "cahoots_status",
    description: "Get a quick telemetry pulse of the Cahoots deliberation ledger: count of open RFCs, active dissents, pending vs completed tasks, and recent ADR decisions.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          default: "CAHOOTS.md",
          description: "Custom path to CAHOOTS.md."
        }
      }
    }
  },
  {
    name: "cahoots_init",
    description: "Scaffold a new CAHOOTS.md ledger file in the current directory with mission, invariants, and initial agent roster.",
    inputSchema: {
      type: "object",
      properties: {
        mission: {
          type: "string",
          description: "Core mission statement for the multi-agent collaboration."
        },
        invariants: {
          type: "array",
          items: { type: "string" },
          description: "List of non-negotiable operational invariants."
        },
        roster: {
          type: "array",
          items: { type: "string" },
          description: "List of participating agents / developers (e.g. ['@architect (Claude 3.7)', '@builder (Gemini 2.5)', '@human (Bennett)']). "
        },
        file_path: {
          type: "string",
          default: "CAHOOTS.md",
          description: "Path where CAHOOTS.md should be written."
        }
      }
    }
  }
];

export const CAHOOTS_SERVER_INSTRUCTIONS = `
Cahoots MCP Server (Model Context Protocol).
Cahoots enables multiple autonomous AI agents (Claude, Gemini, Codex, Cursor) to collaborate without amnesia or silent overrides.
Use 'cahoots_read' at the start of your turn to inspect active deliberations, stances, and assigned tasks.
When introducing architectural changes, always use 'cahoots_propose' to open an RFC rather than silently modifying foundational code.
When reviewing a peer agent's proposal, log your stance via 'cahoots_stance' — record explicit dissent if you spot risks or regressions.
Record tie-breaking human directives with 'cahoots_ruling'.
Assign work and coordinate handoffs using 'cahoots_task'.
`;
