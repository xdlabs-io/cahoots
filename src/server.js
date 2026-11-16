import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec, execSync } from 'node:child_process';
import { parseLedger, recordRulingInMarkdown, saveConfig, loadConfig } from './parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UI_DIR = path.join(__dirname, 'ui');

// Framework Presets Catalog
export const PRESETS = {
  rfc: {
    id: 'rfc',
    name: 'RFC & ADR (Standard)',
    description: 'Formal architectural deliberation, typed peer stances, strict dissent halts, and frozen ADR records.',
    tag: 'Architectural Core',
    stages: [
      { id: 'proposal', name: 'PROPOSAL (RFC)', type: 'pitch' },
      { id: 'stance', name: 'STANCE REVIEW', type: 'review' },
      { id: 'dissent', name: 'DISSENT / ESCALATION', type: 'guard' },
      { id: 'ruling', name: 'HUMAN RULING', type: 'tie-breaker' },
      { id: 'adr', name: 'ADR FREEZE', type: 'record' }
    ]
  },
  sprint: {
    id: 'sprint',
    name: 'Spec-Driven Sprint',
    description: 'Fast feature delivery: Feature Spec → Plan → Task Board → Acceptance Sign-off without heavy RFC ceremony.',
    tag: 'Product / UI Teams',
    stages: [
      { id: 'spec', name: 'FEATURE SPEC', type: 'pitch' },
      { id: 'plan', name: 'IMPLEMENTATION PLAN', type: 'review' },
      { id: 'tasks', name: 'TASK BOARD EXECUTION', type: 'execution' },
      { id: 'signoff', name: 'ACCEPTANCE VERIFICATION', type: 'record' }
    ]
  },
  security: {
    id: 'security',
    name: 'Red-Team / Security Gate',
    description: 'Adversarial verification: Threat Model → Exploit Probes → OCC Invariant Guard → Final Sign-off.',
    tag: 'Security / FinTech',
    stages: [
      { id: 'threat', name: 'THREAT MODELING', type: 'pitch' },
      { id: 'probe', name: 'ADVERSARIAL EXPLOIT PROBE', type: 'guard' },
      { id: 'occ', name: 'OCC INVARIANT GUARD', type: 'review' },
      { id: 'signoff', name: 'SECURITY SIGN-OFF', type: 'record' }
    ]
  },
  solo: {
    id: 'solo',
    name: 'Solo Fast-Track',
    description: 'Lightweight guardrails for solo developers: Intent → Invariant Check → Execution Checklist → Direct Handoff.',
    tag: 'Solo Builders',
    stages: [
      { id: 'intent', name: 'BUILDER INTENT', type: 'pitch' },
      { id: 'invariants', name: 'INVARIANTS CHECK', type: 'guard' },
      { id: 'checklist', name: 'TASK CHECKLIST', type: 'execution' },
      { id: 'handoff', name: 'DIRECT HANDOFF', type: 'record' }
    ]
  }
};

/**
 * Dynamically query the local git author name without hardcoding personal strings
 */
export function getLocalAuthorName() {
  try {
    const name = execSync('git config user.name', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    if (name) return name;
  } catch {
    // ignore
  }
  return 'Lead Developer';
}

/**
 * Ensure CAHOOTS.md exists, creating scaffold if missing
 */
export function ensureLedgerFile(projectDir) {
  const ledgerPath = path.join(projectDir, 'CAHOOTS.md');
  if (!fs.existsSync(ledgerPath)) {
    const author = getLocalAuthorName();
    const scaffold = `# CAHOOTS LEDGER
> Mission: Coordinate autonomous agents with explicit deliberation and immutable consensus.
> Policy: autonomous
> Invariants: All unit and integration tests must pass before merging. · Never commit secrets, tokens, or private credentials to git. · Decisions require peer stance review or explicit human ruling.

## Invariants
- All unit and integration tests must pass before merging.
- Never commit secrets, tokens, or private credentials to git.
- Decisions require peer stance review or explicit human ruling.

## Roster
- @architect (Claude 3.7 Sonnet)
- @builder (Gemini 2.5 Pro)
- @auditor (OpenAI o3-mini)
- @human (${author})

## Active Deliberations

## Task Board

## Decision Log (ADRs)
`;
    fs.writeFileSync(ledgerPath, scaffold, 'utf8');
  }
  return ledgerPath;
}

/**
 * Start the Cahoots Companion HTTP Server
 */
export function startServer({ port = 3210, projectDir = process.cwd(), openBrowser = true } = {}) {
  const ledgerPath = ensureLedgerFile(projectDir);
  const sseClients = new Set();

  // Watch for disk updates to broadcast via SSE
  let watchTimeout = null;
  let watcher = null;
  try {
    watcher = fs.watch(ledgerPath, (eventType) => {
      if (watchTimeout) clearTimeout(watchTimeout);
      watchTimeout = setTimeout(() => {
        try {
          if (!fs.existsSync(ledgerPath)) return;
          const raw = fs.readFileSync(ledgerPath, 'utf8');
          const ledger = parseLedger(raw);
          const payload = JSON.stringify({ type: 'sync', ledger });
          for (const client of sseClients) {
            client.write(`data: ${payload}\n\n`);
          }
        } catch {
          // ignore transient reads during rapid file write
        }
      }, 100);
    });
  } catch (err) {
    console.error('Warning: Could not start file watcher on CAHOOTS.md:', err.message);
  }

  function broadcastLedgerUpdate(ledger) {
    const payload = JSON.stringify({ type: 'sync', ledger });
    for (const client of sseClients) {
      client.write(`data: ${payload}\n\n`);
    }
  }

  const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // CORS for local development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // API: GET /api/status
    if (req.method === 'GET' && pathname === '/api/status') {
      try {
        const raw = fs.readFileSync(ledgerPath, 'utf8');
        const ledger = parseLedger(raw);
        const config = loadConfig(projectDir);
        const author = getLocalAuthorName();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ledger,
          config,
          presets: PRESETS,
          user: {
            name: author,
            handle: '@human'
          },
          projectDir,
          ledgerPath
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // API: GET /api/events (SSE)
    if (req.method === 'GET' && pathname === '/api/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      res.write(': connected\n\n');
      sseClients.add(res);

      req.on('close', () => {
        sseClients.delete(res);
      });
      return;
    }

    // API: POST /api/ruling
    if (req.method === 'POST' && pathname === '/api/ruling') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          if (!data.rfcId || !data.rulingText) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'rfcId and rulingText are required.' }));
            return;
          }

          const raw = fs.readFileSync(ledgerPath, 'utf8');
          const author = data.author || '@human';
          const updatedRaw = recordRulingInMarkdown(raw, {
            rfcId: data.rfcId,
            rulingText: data.rulingText,
            optionKey: data.optionKey,
            author,
            date: new Date().toISOString()
          });

          fs.writeFileSync(ledgerPath, updatedRaw, 'utf8');
          const updatedLedger = parseLedger(updatedRaw);
          broadcastLedgerUpdate(updatedLedger);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, ledger: updatedLedger }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // API: POST /api/config
    if (req.method === 'POST' && pathname === '/api/config') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          if (!data.config) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'config object is required.' }));
            return;
          }

          const savedPath = saveConfig(projectDir, data.config);

          // Update invariants and roster in CAHOOTS.md if sync requested
          if (data.syncLedger) {
            let raw = fs.readFileSync(ledgerPath, 'utf8');
            if (Array.isArray(data.config.invariants) && data.config.invariants.length > 0) {
              const invLines = data.config.invariants.map(inv => `- ${inv}`).join('\n');
              raw = raw.replace(/## Invariants\s*[\s\S]*?(?=## Roster|## Active Deliberations|## Task Board|## Decision Log|$)/, `## Invariants\n${invLines}\n\n`);
            }
            if (Array.isArray(data.config.roster) && data.config.roster.length > 0) {
              const rosterLines = data.config.roster.map(r => `- ${r.handle} (${r.model})`).join('\n');
              raw = raw.replace(/## Roster\s*[\s\S]*?(?=## Active Deliberations|## Task Board|## Decision Log|$)/, `## Roster\n${rosterLines}\n\n`);
            }
            fs.writeFileSync(ledgerPath, raw, 'utf8');
            broadcastLedgerUpdate(parseLedger(raw));
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, savedPath }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // API: POST /api/propose
    if (req.method === 'POST' && pathname === '/api/propose') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          const title = data.title || 'Untitled Proposal';
          const author = data.author || '@human';
          const summary = data.summary || 'Proposal drafted from Cahoots Companion.';

          let raw = fs.readFileSync(ledgerPath, 'utf8');
          const current = parseLedger(raw);
          const nextNum = current.deliberations.length + 1;
          const rfcId = `RFC-${String(nextNum).padStart(3, '0')}`;

          const proposalBlock = `
### ${rfcId}: ${title}
- **Status**: In Review
- **Created**: ${new Date().toISOString()}
- **Author**: ${author}
- **Summary**: ${summary}
- **Positions**:
  - **STANCE** [${author} | ${new Date().toISOString()}]:
    - Position: agree
    - Rationale: Initial proposal authored via Cahoots Companion.
`;
          const delibIndex = raw.indexOf('## Active Deliberations');
          if (delibIndex !== -1) {
            const afterHeader = delibIndex + '## Active Deliberations'.length;
            raw = raw.slice(0, afterHeader) + '\n' + proposalBlock + raw.slice(afterHeader);
          } else {
            raw += `\n## Active Deliberations\n${proposalBlock}`;
          }

          fs.writeFileSync(ledgerPath, raw, 'utf8');
          const updated = parseLedger(raw);
          broadcastLedgerUpdate(updated);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, rfcId, ledger: updated }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // STATIC FILE SERVING (src/ui/)
    let filePath = path.join(UI_DIR, pathname === '/' ? 'index.html' : pathname);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(UI_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json',
      '.png': 'image/png',
      '.svg': 'image/svg+xml'
    };

    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(content);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  return new Promise((resolve, reject) => {
    function tryListen(p) {
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          tryListen(p + 1);
        } else {
          reject(err);
        }
      });

      server.listen(p, () => {
        const url = `http://localhost:${p}`;
        console.log(`\n  ┌────────────────────────────────────────────────────────┐`);
        console.log(`  │  cahoots companion listening on ${url.padEnd(23)} │`);
        console.log(`  │  Ledger: ${path.basename(ledgerPath).padEnd(46)} │`);
        console.log(`  └────────────────────────────────────────────────────────┘\n`);

        if (openBrowser) {
          openInBrowser(url);
        }
        resolve({ server, port: p, url });
      });
    }

    tryListen(port);

    server.on('close', () => {
      if (watchTimeout) clearTimeout(watchTimeout);
      if (watcher) {
        try { watcher.close(); } catch {}
      }
      for (const client of sseClients) {
        try { client.end(); } catch {}
      }
      sseClients.clear();
    });
  });
}

/**
 * Cross-platform open browser command
 */
function openInBrowser(url) {
  const platform = process.platform;
  let cmd = '';
  if (platform === 'win32') {
    cmd = `start "" "${url}"`;
  } else if (platform === 'darwin') {
    cmd = `open "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }
  exec(cmd, () => {});
}
