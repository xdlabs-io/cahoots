import {
  initLedger,
  loadLedger,
  saveLedger,
  DEFAULT_CAHOOTS_FILE
} from "../core/ledger.js";

/**
 * Ensures a ledger exists; if not, returns an error or creates an empty one.
 */
function getOrEnsureLedger(filePath = DEFAULT_CAHOOTS_FILE, autoCreate = true) {
  let loaded = loadLedger(filePath);
  if (!loaded.exists) {
    if (autoCreate) {
      initLedger({ filePath });
      loaded = loadLedger(filePath);
    } else {
      throw new Error(
        `CAHOOTS ledger not found at ${filePath}. Run 'cahoots_init' or 'npx cahoots-mcp init' to create it.`
      );
    }
  }
  return loaded;
}

export async function executeTool(name, args = {}) {
  const filePath = args.file_path || DEFAULT_CAHOOTS_FILE;

  switch (name) {
    case "cahoots_init": {
      const result = initLedger({
        mission: args.mission,
        invariants: args.invariants,
        roster: args.roster,
        filePath
      });
      return {
        content: [
          {
            type: "text",
            text: result.message
          }
        ]
      };
    }

    case "cahoots_read": {
      const { exists, ledger, path: resolvedPath } = loadLedger(filePath);
      if (!exists) {
        return {
          content: [
            {
              type: "text",
              text: `No CAHOOTS.md found at ${resolvedPath}. Call 'cahoots_init' to initialize a multi-agent deliberation ledger.`
            }
          ]
        };
      }

      if (args.rfc_id) {
        const rfc = (ledger.deliberations || []).find(
          d => d.id.toUpperCase() === args.rfc_id.toUpperCase()
        );
        if (!rfc) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `Deliberation '${args.rfc_id}' not found in CAHOOTS.md. Available: ${ledger.deliberations.map(d => d.id).join(", ") || "None"}`
              }
            ]
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(rfc, null, 2)
            }
          ]
        };
      }

      const section = args.section || "all";
      let payload;
      if (section === "all") payload = ledger;
      else if (section === "deliberations") payload = ledger.deliberations;
      else if (section === "tasks") payload = ledger.tasks;
      else if (section === "decisions") payload = ledger.decisions;
      else if (section === "roster") payload = ledger.roster;
      else if (section === "invariants") payload = ledger.invariants;
      else payload = ledger;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(payload, null, 2)
          }
        ]
      };
    }

    case "cahoots_propose": {
      const { ledger } = getOrEnsureLedger(filePath, true);

      // Calculate next RFC ID
      const existingIds = (ledger.deliberations || []).map(d => {
        const m = d.id.match(/RFC-(\d+)/i);
        return m ? parseInt(m[1], 10) : 0;
      });
      const nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
      const rfcId = `RFC-${String(nextNum).padStart(3, "0")}`;

      const newRfc = {
        id: rfcId,
        title: args.title,
        status: "Deliberating",
        created: new Date().toISOString(),
        author: args.author || "@agent",
        summary: args.summary,
        options: args.options || [],
        stances: [],
        ruling: null
      };

      ledger.deliberations.push(newRfc);
      saveLedger(ledger, filePath);

      return {
        content: [
          {
            type: "text",
            text: `Proposal logged successfully as ${rfcId}: "${args.title}". Peered agents can now log stances via 'cahoots_stance'.`
          }
        ]
      };
    }

    case "cahoots_stance": {
      const { ledger } = getOrEnsureLedger(filePath, false);
      const rfc = (ledger.deliberations || []).find(
        d => d.id.toUpperCase() === args.rfc_id.toUpperCase()
      );

      if (!rfc) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Deliberation '${args.rfc_id}' not found. Cannot log stance.`
            }
          ]
        };
      }

      // Check if this agent already took a stance; if so, replace/update it
      const existingIdx = rfc.stances.findIndex(s => s.agent.toLowerCase() === args.agent.toLowerCase());
      const stanceRecord = {
        agent: args.agent,
        timestamp: new Date().toISOString(),
        position: args.position,
        rationale: args.rationale,
        objections: args.objections || "",
        counterProposal: args.counter_proposal || ""
      };

      if (existingIdx >= 0) {
        rfc.stances[existingIdx] = stanceRecord;
      } else {
        rfc.stances.push(stanceRecord);
      }

      // Automatically update RFC status based on stances
      const hasDissent = rfc.stances.some(s => s.position === "dissent");
      const allAgree = rfc.stances.length >= 2 && rfc.stances.every(s => s.position === "agree");

      if (hasDissent && rfc.status !== "Decided") {
        rfc.status = "Dissent Logged";
      } else if (allAgree && rfc.status !== "Decided") {
        rfc.status = "Consensus";
      }

      saveLedger(ledger, filePath);

      return {
        content: [
          {
            type: "text",
            text: `STANCE recorded for ${args.agent} on ${rfc.id} [${args.position.toUpperCase()}]. RFC status: ${rfc.status}.`
          }
        ]
      };
    }

    case "cahoots_ruling": {
      const { ledger } = getOrEnsureLedger(filePath, false);
      const rfc = (ledger.deliberations || []).find(
        d => d.id.toUpperCase() === args.rfc_id.toUpperCase()
      );

      if (!rfc) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Deliberation '${args.rfc_id}' not found. Cannot record ruling.`
            }
          ]
        };
      }

      const rulingBy = args.ruling_by || "@human";
      const timestamp = new Date().toISOString();

      rfc.ruling = {
        by: rulingBy,
        timestamp,
        decision: args.decision
      };
      rfc.status = "Decided";

      let adrId = null;
      if (args.create_adr !== false) {
        const existingAdrs = (ledger.decisions || []).map(d => {
          const m = d.id.match(/ADR-(\d+)/i);
          return m ? parseInt(m[1], 10) : 0;
        });
        const nextAdrNum = existingAdrs.length > 0 ? Math.max(...existingAdrs) + 1 : 1;
        adrId = `ADR-${String(nextAdrNum).padStart(3, "0")}`;

        ledger.decisions.push({
          id: adrId,
          date: timestamp.slice(0, 10),
          summary: `${rfc.title}: ${args.decision} (Ruling by ${rulingBy})`,
          status: "Approved"
        });
      }

      saveLedger(ledger, filePath);

      return {
        content: [
          {
            type: "text",
            text: `HUMAN RULING recorded on ${rfc.id} by ${rulingBy}. Deliberation marked 'Decided'.${adrId ? ` Frozen into ${adrId}.` : ""}`
          }
        ]
      };
    }

    case "cahoots_escalate": {
      const { ledger } = getOrEnsureLedger(filePath, false);
      const rfc = (ledger.deliberations || []).find(
        d => d.id.toUpperCase() === args.rfc_id.toUpperCase()
      );

      if (!rfc) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Deliberation '${args.rfc_id}' not found. Cannot escalate.`
            }
          ]
        };
      }

      const timestamp = new Date().toISOString();
      rfc.status = "[ESCALATED: Awaiting Human Ruling]";
      rfc.escalation = {
        by: args.agent,
        timestamp,
        reason: args.reason,
        options: args.options_for_human || [],
        recommendation: args.recommendation || ""
      };

      saveLedger(ledger, filePath);

      return {
        content: [
          {
            type: "text",
            text: `[ESCALATED] Deliberation ${rfc.id} escalated to human by ${args.agent}. Status: [ESCALATED: Awaiting Human Ruling]. Autonomous modifications frozen until cahoots_ruling is issued.`
          }
        ]
      };
    }

    case "cahoots_task": {
      const { ledger } = getOrEnsureLedger(filePath, true);
      const action = (args.action || "list").toLowerCase();

      if (action === "create") {
        const existingIds = (ledger.tasks || []).map(t => {
          const m = t.id.match(/TODO-(\d+)/i);
          return m ? parseInt(m[1], 10) : 0;
        });
        const nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 101;
        const taskId = `TODO-${nextNum}`;

        const newTask = {
          id: taskId,
          completed: false,
          assignee: args.assignee || "@unassigned",
          priority: args.priority || "Medium",
          status: args.status || "Pending",
          title: args.title || "Unspecified task",
          prerequisites: args.prerequisites || "None",
          acceptanceCriteria: args.acceptance_criteria || ""
        };

        ledger.tasks.push(newTask);
        saveLedger(ledger, filePath);

        return {
          content: [
            {
              type: "text",
              text: `Created task ${taskId} assigned to ${newTask.assignee} [Priority: ${newTask.priority}].`
            }
          ]
        };
      }

      if (action === "complete") {
        if (!args.task_id) {
          return {
            isError: true,
            content: [{ type: "text", text: "task_id is required to complete a task." }]
          };
        }
        const task = (ledger.tasks || []).find(
          t => t.id.toUpperCase() === args.task_id.toUpperCase()
        );
        if (!task) {
          return {
            isError: true,
            content: [{ type: "text", text: `Task ${args.task_id} not found.` }]
          };
        }
        task.completed = true;
        task.status = "Completed";
        saveLedger(ledger, filePath);

        return {
          content: [
            {
              type: "text",
              text: `Task ${task.id} marked COMPLETED [✓].`
            }
          ]
        };
      }

      if (action === "update") {
        if (!args.task_id) {
          return {
            isError: true,
            content: [{ type: "text", text: "task_id is required to update a task." }]
          };
        }
        const task = (ledger.tasks || []).find(
          t => t.id.toUpperCase() === args.task_id.toUpperCase()
        );
        if (!task) {
          return {
            isError: true,
            content: [{ type: "text", text: `Task ${args.task_id} not found.` }]
          };
        }
        if (args.title) task.title = args.title;
        if (args.assignee) task.assignee = args.assignee;
        if (args.priority) task.priority = args.priority;
        if (args.status) {
          task.status = args.status;
          if (args.status === "Completed") task.completed = true;
        }
        if (args.acceptance_criteria) task.acceptanceCriteria = args.acceptance_criteria;
        if (args.prerequisites) task.prerequisites = args.prerequisites;

        saveLedger(ledger, filePath);

        return {
          content: [
            {
              type: "text",
              text: `Updated task ${task.id}: status=${task.status}, assignee=${task.assignee}.`
            }
          ]
        };
      }

      // Default: action === 'list'
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(ledger.tasks || [], null, 2)
          }
        ]
      };
    }

    case "cahoots_decision": {
      const { ledger } = getOrEnsureLedger(filePath, true);

      let adrId = args.adr_id;
      if (!adrId) {
        const existingAdrs = (ledger.decisions || []).map(d => {
          const m = d.id.match(/ADR-(\d+)/i);
          return m ? parseInt(m[1], 10) : 0;
        });
        const nextNum = existingAdrs.length > 0 ? Math.max(...existingAdrs) + 1 : 1;
        adrId = `ADR-${String(nextNum).padStart(3, "0")}`;
      }

      const decisionRecord = {
        id: adrId,
        date: new Date().toISOString().slice(0, 10),
        summary: args.summary,
        status: "Approved"
      };

      ledger.decisions.push(decisionRecord);
      saveLedger(ledger, filePath);

      return {
        content: [
          {
            type: "text",
            text: `Frozen decision into ${adrId}: "${args.summary}".`
          }
        ]
      };
    }

    case "cahoots_status": {
      const { exists, ledger, path: resolvedPath } = loadLedger(filePath);
      if (!exists) {
        return {
          content: [
            {
              type: "text",
              text: `No CAHOOTS.md found at ${resolvedPath}. Status: Uninitialized.`
            }
          ]
        };
      }

      const openDeliberations = (ledger.deliberations || []).filter(
        d => !d.status.toLowerCase().includes("decided")
      );
      const escalations = (ledger.deliberations || []).filter(
        d => d.status.includes("ESCALATED") || (d.escalation && !d.status.toLowerCase().includes("decided"))
      );
      const activeDissents = (ledger.deliberations || []).filter(d =>
        (d.stances || []).some(s => s.position === "dissent")
      );
      const pendingTasks = (ledger.tasks || []).filter(t => !t.completed);
      const completedTasks = (ledger.tasks || []).filter(t => t.completed);

      const statusCard = {
        file: resolvedPath,
        mission: ledger.mission || "None",
        policy: ledger.policy || "autonomous",
        rosterCount: (ledger.roster || []).length,
        invariantsCount: (ledger.invariants || []).length,
        deliberations: {
          total: (ledger.deliberations || []).length,
          open: openDeliberations.length,
          escalated: escalations.length,
          withDissent: activeDissents.length,
          openIds: openDeliberations.map(d => `${d.id} (${d.status})`)
        },
        tasks: {
          total: (ledger.tasks || []).length,
          pending: pendingTasks.length,
          completed: completedTasks.length
        },
        decisionsCount: (ledger.decisions || []).length,
        latestDecision: ledger.decisions && ledger.decisions.length > 0 ? ledger.decisions[ledger.decisions.length - 1] : null
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(statusCard, null, 2)
          }
        ]
      };
    }

    default:
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Unknown tool: ${name}`
          }
        ]
      };
  }
}
