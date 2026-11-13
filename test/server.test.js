import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { executeTool } from "../src/tools/handlers.js";
import { CAHOOTS_MCP_TOOLS } from "../src/tools/schema.js";

describe("Cahoots MCP Server Tools & Schemas", () => {
  it("should expose all 11 documented MCP tools", () => {
    const toolNames = CAHOOTS_MCP_TOOLS.map(t => t.name);
    assert.deepEqual(toolNames.sort(), [
      "cahoots_decision",
      "cahoots_diff",
      "cahoots_dissent",
      "cahoots_escalate",
      "cahoots_init",
      "cahoots_propose",
      "cahoots_read",
      "cahoots_ruling",
      "cahoots_stance",
      "cahoots_status",
      "cahoots_task"
    ].sort());

    for (const tool of CAHOOTS_MCP_TOOLS) {
      assert.ok(tool.description);
      assert.ok(tool.inputSchema);
      assert.equal(tool.inputSchema.type, "object");
    }
  });

  it("should return clean error on unknown tool call", async () => {
    const res = await executeTool("non_existent_tool", {});
    assert.equal(res.isError, true);
    assert.ok(res.content[0].text.includes("Unknown tool"));
  });
});
