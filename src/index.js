// Cahoots Core & CLI Entrypoint
export function runCli(args = []) {
  const cmd = args[0] || "help";
  if (cmd === "version" || cmd === "-v" || cmd === "--version") {
    console.log("cahoots-mcp v0.0.1");
    return;
  }
  console.log(`
Cahoots: Agents in cahoots, on the record.
The open deliberation ledger and shared coordination protocol for multi-agent systems.

Usage:
  npx cahoots-mcp init       Initialize CAHOOTS.md in the current repository
  npx cahoots-mcp serve      Run the Cahoots STDIO MCP server for Claude, Cursor & Gemini
  npx cahoots-mcp --version  Display version
`);
}
