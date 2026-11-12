import fs from "node:fs";
import path from "node:path";

export const DEFAULT_CAHOOTS_FILE = "CAHOOTS.md";

/**
 * Initializes a new CAHOOTS.md ledger file.
 */
export function initLedger({
  mission = "Coordinate autonomous agents with explicit deliberation and immutable consensus.",
  policy = "autonomous",
  invariants = [
    "All unit and integration tests must pass before merging.",
    "Never commit secrets, tokens, or private credentials to git.",
    "Decisions require peer stance review or explicit human ruling."
  ],
  roster = [
    "@architect (Claude 3.7 Sonnet)",
    "@builder (Gemini 2.5 Pro)",
    "@auditor (Codex / Qwen)",
    "@human (Developer)"
  ],
  filePath = DEFAULT_CAHOOTS_FILE
} = {}) {
  const targetPath = path.resolve(process.cwd(), filePath);
  if (fs.existsSync(targetPath)) {
    return {
      created: false,
      message: `File already exists at ${targetPath}. Load or modify existing ledger.`,
      path: targetPath
    };
  }

  const initialLedger = {
    mission,
    policy,
    invariants,
    roster,
    deliberations: [],
    tasks: [],
    decisions: []
  };

  const markdown = serializeLedger(initialLedger);
  fs.writeFileSync(targetPath, markdown, "utf8");

  return {
    created: true,
    message: `Initialized Cahoots ledger at ${targetPath}`,
    path: targetPath,
    ledger: initialLedger
  };
}

/**
 * Parses an existing CAHOOTS.md markdown string into a structured ledger object.
 */
export function parseLedger(content) {
  const ledger = {
    mission: "",
    policy: "autonomous",
    invariants: [],
    roster: [],
    deliberations: [],
    tasks: [],
    decisions: []
  };

  if (!content || typeof content !== "string") {
    return ledger;
  }

  const lines = content.split(/\r?\n/);
  let currentSection = "";
  let currentRfc = null;
  let currentStance = null;
  let currentTask = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Mission, Policy & Top-level quotes
    if (rawLine.startsWith("> Mission:")) {
      ledger.mission = rawLine.replace("> Mission:", "").trim();
      continue;
    }
    if (rawLine.startsWith("> Policy:")) {
      ledger.policy = rawLine.replace("> Policy:", "").trim();
      continue;
    }
    if (rawLine.startsWith("> Invariants:")) {
      const invText = rawLine.replace("> Invariants:", "").trim();
      if (invText && ledger.invariants.length === 0) {
        const parts = invText.split("·").map(s => s.trim()).filter(Boolean);
        ledger.invariants.push(...parts);
      }
      continue;
    }

    // Top-level Section Headings
    if (line.startsWith("## ")) {
      const heading = line.replace("## ", "").trim().toLowerCase();
      if (heading.includes("invariants")) {
        currentSection = "invariants";
        ledger.invariants = []; // Explicit section takes precedence
      } else if (heading.includes("roster")) {
        currentSection = "roster";
      } else if (heading.includes("deliberation")) {
        currentSection = "deliberations";
      } else if (heading.includes("task")) {
        currentSection = "tasks";
      } else if (heading.includes("decision")) {
        currentSection = "decisions";
      } else {
        currentSection = heading;
      }
      continue;
    }

    // Invariants list items
    if (currentSection === "invariants") {
      if (line.startsWith("- ") || line.startsWith("* ")) {
        ledger.invariants.push(line.slice(2).trim());
      }
      continue;
    }

    // Roster list items
    if (currentSection === "roster") {
      if (line.startsWith("- ") || line.startsWith("* ")) {
        ledger.roster.push(line.slice(2).trim());
      }
      continue;
    }

    // Deliberations Section
    if (currentSection === "deliberations") {
      if (line.startsWith("### ")) {
        // e.g. "### RFC-001: Inbound Webhook Processing Strategy"
        const header = line.replace("### ", "").trim();
        const colonIdx = header.indexOf(":");
        const id = colonIdx !== -1 ? header.slice(0, colonIdx).trim() : header;
        const title = colonIdx !== -1 ? header.slice(colonIdx + 1).trim() : header;

        currentRfc = {
          id,
          title,
          status: "Deliberating",
          created: new Date().toISOString(),
          author: "@unknown",
          summary: "",
          options: [],
          stances: [],
          ruling: null
        };
        ledger.deliberations.push(currentRfc);
        currentStance = null;
        continue;
      }

      if (currentRfc) {
        if (line.startsWith("- **Status**:")) {
          currentRfc.status = line.replace("- **Status**:", "").trim();
          continue;
        }
        if (line.startsWith("- **Created**:")) {
          currentRfc.created = line.replace("- **Created**:", "").trim();
          continue;
        }
        if (line.startsWith("- **Author**:")) {
          currentRfc.author = line.replace("- **Author**:", "").trim();
          continue;
        }
        if (line.startsWith("- **Proposal**") || line.startsWith("- **Summary**:")) {
          const match = line.match(/- \*\*(?:Proposal|Summary)\*\*.*?:?(.*)/i);
          currentRfc.summary = match && match[1] ? match[1].trim() : "";
          continue;
        }
        if (line.startsWith("- **STANCE**") || line.startsWith("- **Stance**")) {
          // e.g. "- **STANCE** [@builder | 2026-11-12T16:04:00Z]:"
          const match = line.match(/\[(.*?)\]/);
          let agent = "@peer";
          let timestamp = new Date().toISOString();
          if (match && match[1]) {
            const parts = match[1].split("|").map(s => s.trim());
            agent = parts[0] || agent;
            timestamp = parts[1] || timestamp;
          }
          currentStance = {
            agent,
            timestamp,
            position: "agree",
            rationale: "",
            objections: "",
            counterProposal: ""
          };
          currentRfc.stances.push(currentStance);
          continue;
        }
        if (currentStance) {
          if (line.startsWith("- Position:") || line.startsWith("* Position:")) {
            currentStance.position = line.split(":")[1].trim().toLowerCase();
            continue;
          }
          if (line.startsWith("- Rationale:") || line.startsWith("* Rationale:")) {
            currentStance.rationale = line.split(":")[1].trim();
            continue;
          }
          if (line.startsWith("- Objections:") || line.startsWith("* Objections:")) {
            currentStance.objections = line.split(":")[1].trim();
            continue;
          }
          if (line.startsWith("- Counter-proposal:") || line.startsWith("* Counter-proposal:")) {
            currentStance.counterProposal = line.split(":")[1].trim();
            continue;
          }
          // Multiline text continuation for rationale
          if (line && !line.startsWith("-") && !line.startsWith("*") && !line.startsWith("#")) {
            if (currentStance.rationale) {
              currentStance.rationale += " " + line;
            } else {
              currentStance.rationale = line;
            }
          }
        }
        if (line.startsWith("- **Escalation**") || line.startsWith("- **ESCALATION**")) {
          const match = line.match(/\[(.*?)\]/);
          let by = "@agent";
          let timestamp = new Date().toISOString();
          if (match && match[1]) {
            const parts = match[1].split("|").map(s => s.trim());
            by = parts[0] || by;
            timestamp = parts[1] || timestamp;
          }
          currentRfc.escalation = {
            by,
            timestamp,
            reason: "",
            options: [],
            recommendation: ""
          };
          currentStance = null;
          continue;
        }
        if (currentRfc.escalation) {
          if (line.startsWith("- Reason:") || line.startsWith("* Reason:")) {
            currentRfc.escalation.reason = line.split(":")[1].trim();
            continue;
          }
          if (line.startsWith("- Recommendation:") || line.startsWith("* Recommendation:")) {
            currentRfc.escalation.recommendation = line.split(":")[1].trim();
            continue;
          }
          if (line.startsWith("- [") || line.startsWith("- 1.") || line.startsWith("- 2.")) {
            currentRfc.escalation.options.push(line.slice(2).trim());
            continue;
          }
        }
        if (line.startsWith("- **HUMAN RULING**") || line.startsWith("- **Ruling**:")) {
          const match = line.match(/\[(.*?)\]/);
          let by = "@human";
          let timestamp = new Date().toISOString();
          if (match && match[1]) {
            const parts = match[1].split("|").map(s => s.trim());
            by = parts[0] || by;
            timestamp = parts[1] || timestamp;
          }
          currentRfc.ruling = {
            by,
            timestamp,
            decision: ""
          };
          continue;
        }
        if (currentRfc.ruling && (line.startsWith("- Decision:") || line.startsWith("* Decision:"))) {
          currentRfc.ruling.decision = line.split(":")[1].trim();
          continue;
        }
      }
    }

    // Task Board Section
    if (currentSection === "tasks") {
      if (line.startsWith("- [ ]") || line.startsWith("- [x]") || line.startsWith("- [X]")) {
        const completed = line.startsWith("- [x]") || line.startsWith("- [X]");
        const rest = line.slice(5).trim();
        // e.g. "**TODO-101** [@builder | Priority: High | Status: Pending]"
        const idMatch = rest.match(/\*\*(TODO-\d+)\*\*/i);
        const id = idMatch ? idMatch[1].toUpperCase() : `TODO-${ledger.tasks.length + 101}`;

        let assignee = "@unassigned";
        let priority = "Medium";
        let status = completed ? "Completed" : "Pending";

        const metaMatch = rest.match(/\[(.*?)\]/);
        if (metaMatch && metaMatch[1]) {
          const parts = metaMatch[1].split("|").map(s => s.trim());
          for (const p of parts) {
            if (p.startsWith("@")) assignee = p;
            else if (p.toLowerCase().includes("priority:")) priority = p.split(":")[1].trim();
            else if (p.toLowerCase().includes("status:")) status = p.split(":")[1].trim();
          }
        }

        currentTask = {
          id,
          completed,
          assignee,
          priority,
          status,
          title: "",
          prerequisites: "None",
          acceptanceCriteria: ""
        };
        ledger.tasks.push(currentTask);
        continue;
      }

      if (currentTask) {
        if (line.startsWith("- Task:") || line.startsWith("* Task:")) {
          currentTask.title = line.split(":")[1].trim();
          continue;
        }
        if (line.startsWith("- Prerequisites:") || line.startsWith("* Prerequisites:")) {
          currentTask.prerequisites = line.split(":")[1].trim();
          continue;
        }
        if (line.startsWith("- Acceptance Criteria:") || line.startsWith("* Acceptance Criteria:")) {
          currentTask.acceptanceCriteria = line.split(":")[1].trim();
          continue;
        }
      }
    }

    // Decisions Log Section
    if (currentSection === "decisions") {
      if (line.startsWith("- **ADR-") || line.startsWith("- **DECISION-")) {
        // e.g. "- **ADR-001** (2026-11-12): Upstash Redis selected for webhook ingest. Quorum reached."
        const match = line.match(/- \*\*(ADR-\d+|DECISION-\d+)\*\*(?:\s*\((.*?)\))?:\s*(.*)/i);
        if (match) {
          ledger.decisions.push({
            id: match[1].toUpperCase(),
            date: match[2] || new Date().toISOString().slice(0, 10),
            summary: match[3] ? match[3].trim() : "",
            status: "Approved"
          });
        }
      }
    }
  }

  return ledger;
}

/**
 * Serializes a structured ledger object back into standard markdown for CAHOOTS.md.
 */
export function serializeLedger(ledger) {
  const parts = [];

  parts.push("# CAHOOTS LEDGER");
  if (ledger.mission) {
    parts.push(`> Mission: ${ledger.mission}`);
  }
  if (ledger.policy) {
    parts.push(`> Policy: ${ledger.policy}`);
  }
  if (ledger.invariants && ledger.invariants.length > 0) {
    parts.push(`> Invariants: ${ledger.invariants.join(" · ")}`);
  }
  parts.push("");

  // Invariants Section (Explicit)
  parts.push("## Invariants");
  if (ledger.invariants && ledger.invariants.length > 0) {
    for (const inv of ledger.invariants) {
      parts.push(`- ${inv}`);
    }
  } else {
    parts.push("- None recorded.");
  }
  parts.push("");

  // Roster Section
  parts.push("## Roster");
  if (ledger.roster && ledger.roster.length > 0) {
    for (const member of ledger.roster) {
      parts.push(`- ${member}`);
    }
  } else {
    parts.push("- @human (Developer)");
  }
  parts.push("");

  // Deliberations Section
  parts.push("## Active Deliberations");
  if (ledger.deliberations && ledger.deliberations.length > 0) {
    for (const rfc of ledger.deliberations) {
      parts.push(`### ${rfc.id}: ${rfc.title}`);
      parts.push(`- **Status**: ${rfc.status}`);
      parts.push(`- **Created**: ${rfc.created}`);
      parts.push(`- **Author**: ${rfc.author}`);
      if (rfc.summary) {
        parts.push(`- **Summary**: ${rfc.summary}`);
      }
      if (rfc.options && rfc.options.length > 0) {
        parts.push(`- **Options Considered**:`);
        for (const opt of rfc.options) {
          parts.push(`  - ${opt}`);
        }
      }

      if (rfc.stances && rfc.stances.length > 0) {
        parts.push(`- **Positions**:`);
        for (const st of rfc.stances) {
          parts.push(`  - **STANCE** [${st.agent} | ${st.timestamp}]:`);
          parts.push(`    - Position: ${st.position}`);
          if (st.rationale) parts.push(`    - Rationale: ${st.rationale}`);
          if (st.objections) parts.push(`    - Objections: ${st.objections}`);
          if (st.counterProposal) parts.push(`    - Counter-proposal: ${st.counterProposal}`);
        }
      }

      if (rfc.escalation) {
        parts.push(`  - **Escalation** [${rfc.escalation.by} | ${rfc.escalation.timestamp}]:`);
        if (rfc.escalation.reason) parts.push(`    - Reason: ${rfc.escalation.reason}`);
        if (rfc.escalation.options && rfc.escalation.options.length > 0) {
          parts.push(`    - Options:`);
          for (const opt of rfc.escalation.options) {
            parts.push(`      - ${opt}`);
          }
        }
        if (rfc.escalation.recommendation) parts.push(`    - Recommendation: ${rfc.escalation.recommendation}`);
      }

      if (rfc.ruling) {
        parts.push(`  - **HUMAN RULING** [${rfc.ruling.by} | ${rfc.ruling.timestamp}]:`);
        parts.push(`    - Decision: ${rfc.ruling.decision}`);
      }
      parts.push("");
    }
  } else {
    parts.push("_No active deliberations. Use `cahoots_propose` to initiate an RFC._");
    parts.push("");
  }

  // Task Board Section
  parts.push("## Task Board");
  if (ledger.tasks && ledger.tasks.length > 0) {
    for (const t of ledger.tasks) {
      const checkbox = t.completed ? "[x]" : "[ ]";
      parts.push(`- ${checkbox} **${t.id}** [${t.assignee} | Priority: ${t.priority || "Medium"} | Status: ${t.status || "Pending"}]`);
      if (t.title) parts.push(`  - Task: ${t.title}`);
      if (t.prerequisites && t.prerequisites !== "None") parts.push(`  - Prerequisites: ${t.prerequisites}`);
      if (t.acceptanceCriteria) parts.push(`  - Acceptance Criteria: ${t.acceptanceCriteria}`);
    }
  } else {
    parts.push("_No active tasks. Use `cahoots_task` to assign work items._");
  }
  parts.push("");

  // Decision Log Section
  parts.push("## Decision Log (ADRs)");
  if (ledger.decisions && ledger.decisions.length > 0) {
    for (const d of ledger.decisions) {
      parts.push(`- **${d.id}** (${d.date}): ${d.summary}`);
    }
  } else {
    parts.push("_No decisions frozen yet._");
  }
  parts.push("");

  return parts.join("\n");
}

/**
 * Reads CAHOOTS.md from disk and returns parsed ledger.
 */
export function loadLedger(filePath = DEFAULT_CAHOOTS_FILE) {
  const targetPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(targetPath)) {
    return {
      exists: false,
      path: targetPath,
      ledger: null
    };
  }
  const content = fs.readFileSync(targetPath, "utf8");
  return {
    exists: true,
    path: targetPath,
    ledger: parseLedger(content)
  };
}

/**
 * Saves a ledger object back to disk atomically.
 */
export function saveLedger(ledger, filePath = DEFAULT_CAHOOTS_FILE) {
  const targetPath = path.resolve(process.cwd(), filePath);
  const markdown = serializeLedger(ledger);
  fs.writeFileSync(targetPath, markdown, "utf8");
  return {
    saved: true,
    path: targetPath
  };
}
