import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  initLedger,
  parseLedger,
  serializeLedger,
  loadLedger
} from "../src/core/ledger.js";
import { executeTool } from "../src/tools/handlers.js";

const TEST_FILE = "TEST_CAHOOTS.md";

describe("Cahoots Core Ledger", () => {
  const testPath = path.resolve(process.cwd(), TEST_FILE);

  after(() => {
    if (fs.existsSync(testPath)) {
      fs.unlinkSync(testPath);
    }
  });

  it("should initialize a new CAHOOTS.md ledger", () => {
    if (fs.existsSync(testPath)) fs.unlinkSync(testPath);
    const res = initLedger({
      mission: "Test Multi-Agent Coordination Pipeline",
      invariants: ["Must pass all 10 tests", "Zero-leak secrets"],
      roster: ["@architect (Claude)", "@builder (Gemini)"],
      filePath: TEST_FILE
    });

    assert.equal(res.created, true);
    assert.ok(fs.existsSync(testPath));

    const loaded = loadLedger(TEST_FILE);
    assert.equal(loaded.exists, true);
    assert.equal(loaded.ledger.mission, "Test Multi-Agent Coordination Pipeline");
    assert.equal(loaded.ledger.invariants.length, 2);
    assert.equal(loaded.ledger.roster.length, 2);
  });

  it("should serialize and parse markdown with round-trip fidelity", () => {
    const original = {
      mission: "Mission Beta",
      invariants: ["Invariant 1", "Invariant 2"],
      roster: ["@architect", "@builder"],
      deliberations: [
        {
          id: "RFC-001",
          title: "Setup SQS Ingest",
          status: "Deliberating",
          created: "2026-11-12T16:00:00Z",
          author: "@architect",
          summary: "Use SQS for decoupled jobs",
          options: ["Option A: Redis", "Option B: SQS"],
          stances: [
            {
              agent: "@builder",
              timestamp: "2026-11-12T16:05:00Z",
              position: "agree",
              rationale: "SQS handles retries and DLQs natively.",
              objections: "",
              counterProposal: ""
            }
          ],
          ruling: null
        }
      ],
      tasks: [
        {
          id: "TODO-101",
          completed: false,
          assignee: "@builder",
          priority: "High",
          status: "Pending",
          title: "Create SQS Queue",
          prerequisites: "None",
          acceptanceCriteria: "Queue provisioned and tested."
        }
      ],
      decisions: [
        {
          id: "ADR-001",
          date: "2026-11-12",
          summary: "SQS adopted for async batch jobs",
          status: "Approved"
        }
      ]
    };

    const markdown = serializeLedger(original);
    assert.ok(markdown.includes("# CAHOOTS LEDGER"));
    assert.ok(markdown.includes("RFC-001: Setup SQS Ingest"));
    assert.ok(markdown.includes("TODO-101"));
    assert.ok(markdown.includes("ADR-001"));

    const parsed = parseLedger(markdown);
    assert.equal(parsed.mission, original.mission);
    assert.equal(parsed.deliberations.length, 1);
    assert.equal(parsed.deliberations[0].id, "RFC-001");
    assert.equal(parsed.deliberations[0].stances.length, 1);
    assert.equal(parsed.deliberations[0].stances[0].agent, "@builder");
    assert.equal(parsed.tasks.length, 1);
    assert.equal(parsed.tasks[0].id, "TODO-101");
    assert.equal(parsed.decisions.length, 1);
    assert.equal(parsed.decisions[0].id, "ADR-001");
  });
});

describe("Cahoots MCP Tool Handlers", () => {
  const testPath = path.resolve(process.cwd(), TEST_FILE);

  before(() => {
    if (fs.existsSync(testPath)) fs.unlinkSync(testPath);
    initLedger({ filePath: TEST_FILE });
  });

  after(() => {
    if (fs.existsSync(testPath)) fs.unlinkSync(testPath);
  });

  it("cahoots_propose should create RFC-001", async () => {
    const res = await executeTool("cahoots_propose", {
      title: "Evaluate In-Memory Cache",
      author: "@architect",
      summary: "Add LRU cache for 10x read performance.",
      options: ["In-memory LRU", "External Redis"],
      file_path: TEST_FILE
    });

    assert.ok(res.content[0].text.includes("RFC-001"));

    const read = await executeTool("cahoots_read", {
      section: "deliberations",
      file_path: TEST_FILE
    });
    const delibs = JSON.parse(read.content[0].text);
    assert.equal(delibs.length, 1);
    assert.equal(delibs[0].id, "RFC-001");
    assert.equal(delibs[0].status, "Deliberating");
  });

  it("cahoots_stance should record peer stance and dissent", async () => {
    // 1. Peer agrees
    await executeTool("cahoots_stance", {
      rfc_id: "RFC-001",
      agent: "@builder",
      position: "agree",
      rationale: "LRU is sufficient for single-instance traffic.",
      file_path: TEST_FILE
    });

    // 2. Auditor dissents with concrete failure modes
    const dissentRes = await executeTool("cahoots_stance", {
      rfc_id: "RFC-001",
      agent: "@auditor",
      position: "dissent",
      rationale: "Serverless lambda instances don't share memory, causing high cache misses.",
      objections: "Cold starts invalidate memory state.",
      counter_proposal: "Use Upstash Redis HTTP API.",
      file_path: TEST_FILE
    });

    assert.ok(dissentRes.content[0].text.includes("DISSENT"));
    assert.ok(dissentRes.content[0].text.includes("Dissent Logged"));

    const rfcRead = await executeTool("cahoots_read", {
      rfc_id: "RFC-001",
      file_path: TEST_FILE
    });
    const rfc = JSON.parse(rfcRead.content[0].text);
    assert.equal(rfc.stances.length, 2);
    assert.equal(rfc.status, "Dissent Logged");
  });

  it("cahoots_ruling should resolve deliberation and create ADR", async () => {
    const rulingRes = await executeTool("cahoots_ruling", {
      rfc_id: "RFC-001",
      ruling_by: "@bennett",
      decision: "Adopt Upstash Redis HTTP API as proposed by @auditor to survive serverless execution.",
      create_adr: true,
      file_path: TEST_FILE
    });

    assert.ok(rulingRes.content[0].text.includes("Decided"));
    assert.ok(rulingRes.content[0].text.includes("ADR-001"));

    const rfcRead = await executeTool("cahoots_read", {
      rfc_id: "RFC-001",
      file_path: TEST_FILE
    });
    const rfc = JSON.parse(rfcRead.content[0].text);
    assert.equal(rfc.status, "Decided");
    assert.equal(rfc.ruling.by, "@bennett");

    const decisionsRead = await executeTool("cahoots_read", {
      section: "decisions",
      file_path: TEST_FILE
    });
    const adrs = JSON.parse(decisionsRead.content[0].text);
    assert.equal(adrs.length, 1);
    assert.equal(adrs[0].id, "ADR-001");
  });

  it("cahoots_task should create, update, and complete tasks", async () => {
    // 1. Create task
    const createRes = await executeTool("cahoots_task", {
      action: "create",
      title: "Integrate Upstash client in api/cache.js",
      assignee: "@builder",
      priority: "High",
      acceptance_criteria: "Cache hit latency < 15ms in benchmark.",
      file_path: TEST_FILE
    });
    assert.ok(createRes.content[0].text.includes("TODO-101"));

    // 2. Update task
    const updateRes = await executeTool("cahoots_task", {
      action: "update",
      task_id: "TODO-101",
      status: "In Progress",
      file_path: TEST_FILE
    });
    assert.ok(updateRes.content[0].text.includes("In Progress"));

    // 3. Complete task
    const completeRes = await executeTool("cahoots_task", {
      action: "complete",
      task_id: "TODO-101",
      file_path: TEST_FILE
    });
    assert.ok(completeRes.content[0].text.includes("COMPLETED"));

    const tasksRead = await executeTool("cahoots_task", {
      action: "list",
      file_path: TEST_FILE
    });
    const tasks = JSON.parse(tasksRead.content[0].text);
    assert.equal(tasks.length, 1);
    assert.equal(tasks[0].completed, true);
    assert.equal(tasks[0].status, "Completed");
  });

  it("cahoots_status should return accurate telemetry metrics", async () => {
    const statusRes = await executeTool("cahoots_status", {
      file_path: TEST_FILE
    });
    const status = JSON.parse(statusRes.content[0].text);
    assert.equal(status.deliberations.total, 1);
    assert.equal(status.deliberations.open, 0); // RFC-001 is Decided
    assert.equal(status.tasks.completed, 1);
    assert.equal(status.tasks.pending, 0);
    assert.equal(status.decisionsCount, 1);
  });
});
