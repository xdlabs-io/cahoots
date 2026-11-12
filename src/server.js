import readline from "node:readline";
import { CAHOOTS_MCP_TOOLS, CAHOOTS_SERVER_INSTRUCTIONS } from "./tools/schema.js";
import { executeTool } from "./tools/handlers.js";

/**
 * Starts the Cahoots STDIO Model Context Protocol (MCP) server.
 */
export function startMcpServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  function sendJsonRpc(obj) {
    process.stdout.write(JSON.stringify(obj) + "\n");
  }

  rl.on("line", async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let msg;
    try {
      msg = JSON.parse(trimmed);
    } catch {
      return;
    }

    const { id, method, params } = msg;

    try {
      if (method === "initialize") {
        sendJsonRpc({
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            instructions: CAHOOTS_SERVER_INSTRUCTIONS,
            capabilities: {
              tools: {},
              prompts: {},
              resources: {}
            },
            serverInfo: {
              name: "cahoots-mcp",
              version: "0.0.6"
            }
          }
        });
        return;
      }

      if (method === "notifications/initialized") {
        return;
      }

      if (method === "ping") {
        sendJsonRpc({ jsonrpc: "2.0", id, result: {} });
        return;
      }

      if (method === "tools/list") {
        sendJsonRpc({
          jsonrpc: "2.0",
          id,
          result: {
            tools: CAHOOTS_MCP_TOOLS
          }
        });
        return;
      }

      if (method === "tools/call") {
        const { name, arguments: toolArgs } = params || {};
        try {
          const toolResult = await executeTool(name, toolArgs || {});
          sendJsonRpc({
            jsonrpc: "2.0",
            id,
            result: toolResult
          });
        } catch (toolErr) {
          sendJsonRpc({
            jsonrpc: "2.0",
            id,
            result: {
              isError: true,
              content: [
                {
                  type: "text",
                  text: `Tool execution failed: ${toolErr.message}`
                }
              ]
            }
          });
        }
        return;
      }

      // Fallback for unhandled method
      if (id !== undefined) {
        sendJsonRpc({
          jsonrpc: "2.0",
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`
          }
        });
      }
    } catch (err) {
      if (id !== undefined) {
        sendJsonRpc({
          jsonrpc: "2.0",
          id,
          error: {
            code: -32603,
            message: err.message
          }
        });
      }
    }
  });

  process.stderr.write("Cahoots MCP Server (cahoots-mcp) listening on stdio...\n");
}
