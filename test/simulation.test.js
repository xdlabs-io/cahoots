import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { executeTool } from "../src/tools/handlers.js";
import { loadLedger } from "../src/core/ledger.js";

const SIM_FILE = "SIMULATION_CAHOOTS.md";

describe("E2E Multi-Agent Deliberation Simulation", () => {
  const simPath = path.resolve(process.cwd(), SIM_FILE);

  before(() => {
    if (fs.existsSync(simPath)) fs.unlinkSync(simPath);
  });

  after(() => {
    if (fs.existsSync(simPath)) fs.unlinkSync(simPath);
  });

  it("should run full autonomous multi-agent deliberation lifecycle", async () => {
    // 1. Initialize the project ledger with invariants and multi-agent roster
    const initRes = await executeTool("cahoots_init", {
      mission: "Build autonomous postbuild and distribution pipeline.",
      invariants: [
        "All tests must pass (100% green).",
        "Zero long-lived tokens in git; use OIDC or secrets manager.",
        "Serverless functions must terminate within 10 seconds."
      ],
      roster: [
        "@architect (Claude 3.7 Sonnet)",
        "@builder (Gemini 2.5 Pro)",
        "@auditor (Codex / Qwen)",
        "@bennett (Lead Human / Developer)"
      ],
      file_path: SIM_FILE
    });
    assert.ok(initRes.content[0].text.includes("Initialized Cahoots ledger"));

    // 2. @architect opens RFC-001 proposing SQLite local buffer
    const propRes = await executeTool("cahoots_propose", {
      title: "Inbound Webhook Queue via SQLite Buffer",
      author: "@architect",
      summary: "Buffer raw webhook payloads to local SQLite file before processing to survive traffic spikes.",
      options: [
        "Option A: Local SQLite file buffer",
        "Option B: Remote Redis HTTP REST stream",
        "Option C: AWS SQS direct ingest"
      ],
      file_path: SIM_FILE
    });
    assert.ok(propRes.content[0].text.includes("RFC-001"));

    // Verify initial RFC state
    let readRfc = await executeTool("cahoots_read", { rfc_id: "RFC-001", file_path: SIM_FILE });
    let rfcData = JSON.parse(readRfc.content[0].text);
    assert.equal(rfcData.id, "RFC-001");
    assert.equal(rfcData.status, "Deliberating");
    assert.equal(rfcData.stances.length, 0);

    // 3. @builder agrees with the concept
    const builderStance = await executeTool("cahoots_stance", {
      rfc_id: "RFC-001",
      agent: "@builder",
      position: "agree",
      rationale: "SQLite is lightweight, zero external network dependency, and fast.",
      file_path: SIM_FILE
    });
    assert.ok(builderStance.content[0].text.includes("STANCE recorded"));

    // 4. @auditor spots an invariant violation and DISSENTS
    const auditorStance = await executeTool("cahoots_stance", {
      rfc_id: "RFC-001",
      agent: "@auditor",
      position: "dissent",
      rationale: "Vercel and AWS Lambda run on read-only filesystems (/tmp is ephemeral and not shared across concurrent invocations). SQLite will fail under concurrent lambdas.",
      objections: "Database write lock contention and lost payloads across stateless serverless instances.",
      counter_proposal: "Use Upstash Redis REST API with atomic LPUSH/RPOP. Survives stateless serverless and terminates under 50ms.",
      file_path: SIM_FILE
    });
    assert.ok(auditorStance.content[0].text.includes("Dissent Logged"));

    // Verify ledger automatically flagged active dissent
    readRfc = await executeTool("cahoots_read", { rfc_id: "RFC-001", file_path: SIM_FILE });
    rfcData = JSON.parse(readRfc.content[0].text);
    assert.equal(rfcData.status, "Dissent Logged");
    assert.equal(rfcData.stances.length, 2);

    // 5. @auditor escalates to human lead @bennett
    const escRes = await executeTool("cahoots_escalate", {
      rfc_id: "RFC-001",
      agent: "@auditor",
      reason: "Unresolvable architectural conflict: Ephemeral SQLite buffer vs Distributed Serverless reliability.",
      options_for_human: [
        "[A] Local SQLite buffer: Zero network latency, but fails on stateless concurrent lambdas",
        "[B] Upstash Redis REST: Remote persistence, survives lambdas, guaranteed replay protection"
      ],
      recommendation: "Option B: Upstash Redis REST API",
      file_path: SIM_FILE
    });
    assert.ok(escRes.content[0].text.includes("[ESCALATED]"));

    // 6. Check status telemetry reflects open debate, dissent, and pending escalation
    const statusBeforeRuling = await executeTool("cahoots_status", { file_path: SIM_FILE });
    const stats1 = JSON.parse(statusBeforeRuling.content[0].text);
    assert.equal(stats1.deliberations.open, 1);
    assert.equal(stats1.deliberations.withDissent, 1);
    assert.equal(stats1.deliberations.escalated, 1);
    assert.equal(stats1.decisionsCount, 0);

    // 7. Lead developer @bennett steps in with binding ruling based on @auditor's dissent
    const rulingRes = await executeTool("cahoots_ruling", {
      rfc_id: "RFC-001",
      ruling_by: "@bennett",
      decision: "Ruling in favor of @auditor: Approved Upstash Redis REST. Stateless lambda architecture requires remote persistence.",
      create_adr: true,
      file_path: SIM_FILE
    });
    assert.ok(rulingRes.content[0].text.includes("Decided"));
    assert.ok(rulingRes.content[0].text.includes("ADR-001"));

    // Verify RFC status is frozen and ADR exists
    readRfc = await executeTool("cahoots_read", { rfc_id: "RFC-001", file_path: SIM_FILE });
    rfcData = JSON.parse(readRfc.content[0].text);
    assert.equal(rfcData.status, "Decided");
    assert.equal(rfcData.ruling.by, "@bennett");

    const adrRead = await executeTool("cahoots_read", { section: "decisions", file_path: SIM_FILE });
    const adrs = JSON.parse(adrRead.content[0].text);
    assert.equal(adrs.length, 1);
    assert.equal(adrs[0].id, "ADR-001");
    assert.ok(adrs[0].summary.includes("Upstash Redis REST"));

    // 7. @architect assigns implementation task to @builder
    const taskRes = await executeTool("cahoots_task", {
      action: "create",
      title: "Implement Upstash Redis client in lib/queue.js",
      assignee: "@builder",
      priority: "High",
      acceptance_criteria: "Payloads LPUSH successfully with latency < 50ms and unit tests pass.",
      prerequisites: "ADR-001",
      file_path: SIM_FILE
    });
    assert.ok(taskRes.content[0].text.includes("TODO-101"));

    // 8. @builder claims the task and starts working
    await executeTool("cahoots_task", {
      action: "update",
      task_id: "TODO-101",
      status: "In Progress",
      file_path: SIM_FILE
    });

    // 9. @builder completes the task
    const completeRes = await executeTool("cahoots_task", {
      action: "complete",
      task_id: "TODO-101",
      file_path: SIM_FILE
    });
    assert.ok(completeRes.content[0].text.includes("COMPLETED [✓]"));

    // 10. Check final status telemetry
    const finalStatusRes = await executeTool("cahoots_status", { file_path: SIM_FILE });
    const finalStats = JSON.parse(finalStatusRes.content[0].text);
    assert.equal(finalStats.deliberations.open, 0); // No open debates left
    assert.equal(finalStats.tasks.total, 1);
    assert.equal(finalStats.tasks.pending, 0);
    assert.equal(finalStats.tasks.completed, 1);
    assert.equal(finalStats.decisionsCount, 1);

    // 11. Read raw CAHOOTS.md directly from disk to verify clean markdown syntax
    const diskContent = fs.readFileSync(simPath, "utf8");
    assert.ok(diskContent.includes("# CAHOOTS LEDGER"));
    assert.ok(diskContent.includes("RFC-001: Inbound Webhook Queue via SQLite Buffer"));
    assert.ok(diskContent.includes("- **Status**: Decided"));
    assert.ok(diskContent.includes("- **STANCE** [@builder"));
    assert.ok(diskContent.includes("- **DISSENT** [@auditor"));
    assert.ok(diskContent.includes("- **Escalation** [@auditor"));
    assert.ok(diskContent.includes("- **HUMAN RULING** [@bennett"));
    assert.ok(diskContent.includes("- [x] **TODO-101** [@builder"));
    assert.ok(diskContent.includes("- **ADR-001**"));
  });
});
