import {
  initLedger,
  loadLedger,
  computeLedgerDiff,
  computeLedgerHash
} from "./core/ledger.js";
import { startMcpServer } from "./server.js";
import { CAHOOTS_MCP_TOOLS } from "./tools/schema.js";
import { executeTool } from "./tools/handlers.js";
import { playBanner } from "./banner.js";
import { readFileSync } from "node:fs";

const { version: VERSION } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
);

export {
  initLedger,
  loadLedger,
  computeLedgerDiff,
  computeLedgerHash,
  startMcpServer,
  CAHOOTS_MCP_TOOLS,
  executeTool
};

export async function runCli(args = []) {
  const cmd = args[0] || "help";

  if (cmd === "version" || cmd === "-v" || cmd === "--version") {
    console.log(`cahoots-mcp v${VERSION}`);
    return;
  }

  if (cmd === "serve" || cmd === "mcp") {
    startMcpServer();
    return;
  }

  if (cmd === "init") {
    await playBanner();
    const res = initLedger();
    console.log(res.message);
    return;
  }

  if (cmd === "status") {
    const { exists, ledger, path } = loadLedger();
    if (!exists) {
      console.log(`No CAHOOTS.md found at ${path}. Run 'npx cahoots-mcp init' to create one.`);
      return;
    }
    const openDelib = (ledger.deliberations || []).filter(d => !d.status.toLowerCase().includes("decided"));
    const escalated = (ledger.deliberations || []).filter(d => d.status.includes("ESCALATED") || (d.escalation && !d.status.toLowerCase().includes("decided")));
    const openTasks = (ledger.tasks || []).filter(t => !t.completed);
    console.log(`
--- CAHOOTS STATUS ---
File:          ${path}
Mission:       ${ledger.mission || "None"}
Policy:        ${ledger.policy || "autonomous"}
Invariants:    ${(ledger.invariants || []).length} active
Roster:        ${(ledger.roster || []).join(", ") || "None"}
Deliberations: ${openDelib.length} open (${(ledger.deliberations || []).length} total)
Escalations:   ${escalated.length > 0 ? `[!] ${escalated.length} AWAITING HUMAN RULING` : "0 pending"}
Tasks:         ${openTasks.length} pending (${(ledger.tasks || []).length} total)
Decisions:     ${(ledger.decisions || []).length} ADRs recorded
----------------------
`);
    return;
  }

  if (cmd === "read") {
    const { exists, ledger } = loadLedger();
    if (!exists) {
      console.log("No CAHOOTS.md found.");
      return;
    }
    console.log(JSON.stringify(ledger, null, 2));
    return;
  }

  if (cmd === "diff") {
    const { exists, ledger } = loadLedger();
    if (!exists) {
      console.log("No CAHOOTS.md found.");
      return;
    }
    const sinceRfc = args[1] || null;
    const diff = computeLedgerDiff(ledger, { since_rfc: sinceRfc, compact: true });
    console.log(JSON.stringify(diff, null, 2));
    return;
  }

  console.log(`
cahoots: Agents in cahoots, on the record.
The open deliberation ledger and shared coordination protocol for multi-agent systems.

Usage:
  npx cahoots-mcp init       Initialize CAHOOTS.md in the current repository
  npx cahoots-mcp serve      Start the STDIO MCP server for Claude, Cursor & Gemini
  npx cahoots-mcp status     Display high-level telemetry on active deliberations
  npx cahoots-mcp diff [rfc] Token-optimized delta diff (NCM) since a given RFC or hash
  npx cahoots-mcp read       Print the structured deliberation ledger JSON
  npx cahoots-mcp --version  Display version

MCP Configuration:
  {
    "mcpServers": {
      "cahoots": {
        "command": "npx",
        "args": ["-y", "cahoots-mcp", "serve"]
      }
    }
  }
`);
}
