#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer, ensureLedgerFile, getLocalAuthorName } from '../src/server.js';
import { parseLedger } from '../src/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read version dynamically from package.json
let version = '0.2.0';
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  version = pkg.version || version;
} catch {}

const args = process.argv.slice(2);
const command = args[0] || 'help';

function printHelp() {
  console.log(`
  \x1b[1mcahoots\x1b[0m v${version}
  Agents in cahoots, on the record.

  \x1b[1mUSAGE:\x1b[0m
    cahoots <command> [options]

  \x1b[1mCOMMANDS:\x1b[0m
    ui, companion, gui    Launch the Cahoots Companion web interface
    status                Display high-level telemetry of the CAHOOTS.md ledger
    propose <title>       Scaffold an architectural RFC/deliberation proposal
    init                  Initialize CAHOOTS.md in the current directory
    help                  Show this help message

  \x1b[1mOPTIONS (ui):\x1b[0m
    --port <number>       Local port to bind HTTP server (default: 3210)
    --no-open             Do not automatically open the browser
    --dir <path>          Project root directory (default: current working dir)

  \x1b[1mEXAMPLES:\x1b[0m
    $ npx cahoots ui
    $ npx cahoots ui --port 4000
    $ npx cahoots status
    $ npx cahoots propose "Adopt SQS for async webhook ingest"
`);
}

async function main() {
  if (command === '--version' || command === '-v') {
    console.log(version);
    return;
  }

  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  const projectDir = process.cwd();

  // COMMAND: ui / companion / gui
  if (command === 'ui' || command === 'companion' || command === 'gui') {
    let port = 3210;
    const portIdx = args.indexOf('--port');
    if (portIdx !== -1 && args[portIdx + 1]) {
      port = parseInt(args[portIdx + 1], 10) || 3210;
    }
    const openBrowser = !args.includes('--no-open');

    await startServer({ port, projectDir, openBrowser });
    return;
  }

  // COMMAND: status
  if (command === 'status') {
    const ledgerPath = path.join(projectDir, 'CAHOOTS.md');
    if (!fs.existsSync(ledgerPath)) {
      console.log(`\n  \x1b[33mNo CAHOOTS.md found in ${projectDir}\x1b[0m`);
      console.log(`  Run \x1b[1mcahoots init\x1b[0m or \x1b[1mcahoots ui\x1b[0m to create one.\n`);
      return;
    }

    const raw = fs.readFileSync(ledgerPath, 'utf8');
    const ledger = parseLedger(raw);

    console.log(`\n  \x1b[1mCAHOOTS Deliberation Ledger Telemetry\x1b[0m`);
    console.log(`  Mission:    ${ledger.mission}`);
    console.log(`  Policy:     ${ledger.policy}`);
    console.log(`  Invariants: ${ledger.invariants.length} active constraints`);
    console.log(`  Roster:     ${ledger.roster.map(r => r.handle).join(', ')}`);
    console.log(`  Delibs:     ${ledger.deliberations.length} active RFCs`);

    const escalated = ledger.deliberations.filter(d => d.status && d.status.toLowerCase().includes('escalat'));
    if (escalated.length > 0) {
      console.log(`  \x1b[31mStatus:     ${escalated.length} ESCALATION(S) PENDING HUMAN RULING\x1b[0m`);
    } else {
      console.log(`  \x1b[32mStatus:     Consensus clear (0 active escalations)\x1b[0m`);
    }

    console.log(`  Tasks:      ${ledger.tasks.filter(t => !t.completed).length} pending / ${ledger.tasks.length} total`);
    console.log(`  ADRs:       ${ledger.adrs.length} frozen decision records\n`);
    return;
  }

  // COMMAND: init
  if (command === 'init') {
    const filePath = ensureLedgerFile(projectDir);
    console.log(`\n  \x1b[32m✓ Initialized CAHOOTS ledger at ${filePath}\x1b[0m\n`);
    return;
  }

  // COMMAND: propose
  if (command === 'propose') {
    const title = args.slice(1).join(' ') || 'Untitled Proposal';
    const filePath = ensureLedgerFile(projectDir);
    let raw = fs.readFileSync(filePath, 'utf8');
    const ledger = parseLedger(raw);
    const nextNum = ledger.deliberations.length + 1;
    const rfcId = `RFC-${String(nextNum).padStart(3, '0')}`;
    const author = '@human';

    const proposalBlock = `
### ${rfcId}: ${title}
- **Status**: In Review
- **Created**: ${new Date().toISOString()}
- **Author**: ${author}
- **Summary**: Proposed change authored via Cahoots CLI.
- **Positions**:
  - **STANCE** [${author} | ${new Date().toISOString()}]:
    - Position: agree
    - Rationale: Initial author stance.
`;
    const delibIdx = raw.indexOf('## Active Deliberations');
    if (delibIdx !== -1) {
      const insertAt = delibIdx + '## Active Deliberations'.length;
      raw = raw.slice(0, insertAt) + '\n' + proposalBlock + raw.slice(insertAt);
    } else {
      raw += `\n## Active Deliberations\n${proposalBlock}`;
    }

    fs.writeFileSync(filePath, raw, 'utf8');
    console.log(`\n  \x1b[32m✓ Created ${rfcId}: "${title}" in CAHOOTS.md\x1b[0m\n`);
    return;
  }

  console.log(`\n  \x1b[31mUnknown command: ${command}\x1b[0m`);
  printHelp();
}

main().catch(err => {
  console.error('\n  Fatal error:', err.message);
  process.exit(1);
});
