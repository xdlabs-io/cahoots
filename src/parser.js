import fs from 'node:fs';
import path from 'node:path';

/**
 * Default empty ledger model
 */
export function createEmptyLedger() {
  return {
    mission: 'Coordinate autonomous agents with explicit deliberation and immutable consensus.',
    policy: 'autonomous',
    invariants: [
      'All unit and integration tests must pass before merging.',
      'Never commit secrets, tokens, or private credentials to git.',
      'Decisions require peer stance review or explicit human ruling.'
    ],
    roster: [
      { handle: '@architect', model: 'Claude 3.7 Sonnet', role: 'System architecture & proposals', canVote: true },
      { handle: '@builder', model: 'Gemini 2.5 Pro', role: 'Implementation & execution', canVote: true },
      { handle: '@auditor', model: 'OpenAI o3-mini', role: 'Invariant guard & dissent', canVote: true },
      { handle: '@human', model: 'Lead Developer', role: 'Executive tie-breaker & rulings', canVote: true }
    ],
    deliberations: [],
    tasks: [],
    adrs: [],
    raw: ''
  };
}

/**
 * Parse CAHOOTS.md content into structured data
 */
export function parseLedger(markdown = '') {
  const ledger = createEmptyLedger();
  ledger.raw = markdown;
  if (!markdown || !markdown.trim()) return ledger;

  const lines = markdown.split(/\r?\n/);
  let currentSection = 'header';
  let currentDelib = null;
  let currentStance = null;
  let currentTask = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Header metadata lines (> Mission: ..., > Policy: ...)
    if (trimmed.startsWith('> Mission:')) {
      ledger.mission = trimmed.replace('> Mission:', '').trim();
      continue;
    }
    if (trimmed.startsWith('> Policy:')) {
      ledger.policy = trimmed.replace('> Policy:', '').trim();
      continue;
    }

    // Section headers
    if (trimmed.startsWith('## Invariants')) {
      currentSection = 'invariants';
      ledger.invariants = [];
      continue;
    }
    if (trimmed.startsWith('## Roster')) {
      currentSection = 'roster';
      ledger.roster = [];
      continue;
    }
    if (trimmed.startsWith('## Active Deliberations') || trimmed.startsWith('## Deliberations')) {
      currentSection = 'deliberations';
      continue;
    }
    if (trimmed.startsWith('## Task Board') || trimmed.startsWith('## Tasks')) {
      currentSection = 'tasks';
      continue;
    }
    if (trimmed.startsWith('## Decision Log') || trimmed.startsWith('## Decisions') || trimmed.startsWith('## ADRs')) {
      currentSection = 'adrs';
      continue;
    }

    // Parse Invariants list items
    if (currentSection === 'invariants' && trimmed.startsWith('-')) {
      const inv = trimmed.replace(/^-\s*/, '').trim();
      if (inv) ledger.invariants.push(inv);
      continue;
    }

    // Parse Roster items: - @handle (Model / Role)
    if (currentSection === 'roster' && trimmed.startsWith('-')) {
      const match = trimmed.match(/^-\s*(@\w+)\s*(?:\(([^)]+)\))?/);
      if (match) {
        ledger.roster.push({
          handle: match[1],
          model: match[2] || 'Autonomous Agent',
          role: match[1] === '@human' ? 'Lead Developer' : 'Peer Contributor',
          canVote: true
        });
      }
      continue;
    }

    // Parse Active Deliberations (### RFC-XXX or ### DELIB-XXX)
    if (currentSection === 'deliberations') {
      if (trimmed.startsWith('### ')) {
        const titleMatch = trimmed.match(/^###\s+((?:RFC|DELIB|PROP)-[^\s:]+|[^:]+)(?::\s*(.+))?/i);
        const id = titleMatch ? titleMatch[1].trim() : `RFC-${ledger.deliberations.length + 1}`;
        const title = titleMatch && titleMatch[2] ? titleMatch[2].trim() : id;

        currentDelib = {
          id,
          title,
          status: 'In Review',
          created: new Date().toISOString(),
          author: '@architect',
          summary: '',
          positions: [],
          escalation: null,
          humanRuling: null
        };
        ledger.deliberations.push(currentDelib);
        currentStance = null;
        continue;
      }

      if (currentDelib) {
        if (trimmed.startsWith('- **Status**:')) {
          currentDelib.status = trimmed.replace('- **Status**:', '').trim().replace(/^\[|\]$/g, '');
          continue;
        }
        if (trimmed.startsWith('- **Created**:') || trimmed.startsWith('- **Date**:')) {
          currentDelib.created = trimmed.replace(/- \*\*(Created|Date)\*\*:/, '').trim();
          continue;
        }
        if (trimmed.startsWith('- **Author**:')) {
          currentDelib.author = trimmed.replace('- **Author**:', '').trim();
          continue;
        }
        if (trimmed.startsWith('- **Summary**:')) {
          currentDelib.summary = trimmed.replace('- **Summary**:', '').trim();
          continue;
        }

        // Stance block header
        const stanceMatch = trimmed.match(/- \*\*STANCE\*\*\s*\[(@\w+)\s*\|\s*([^\]]+)\]:/);
        if (stanceMatch) {
          currentStance = {
            author: stanceMatch[1],
            date: stanceMatch[2].trim(),
            position: 'agree',
            rationale: ''
          };
          currentDelib.positions.push(currentStance);
          continue;
        }

        // Stance details
        if (currentStance) {
          if (trimmed.startsWith('- Position:')) {
            currentStance.position = trimmed.replace('- Position:', '').trim().toLowerCase();
            continue;
          }
          if (trimmed.startsWith('- Rationale:')) {
            currentStance.rationale = trimmed.replace('- Rationale:', '').trim();
            continue;
          }
        }

        // Escalation block header
        const escMatch = trimmed.match(/- \*\*Escalation\*\*\s*\[(@\w+)\s*\|\s*([^\]]+)\]:/i);
        if (escMatch) {
          currentDelib.escalation = {
            author: escMatch[1],
            date: escMatch[2].trim(),
            reason: '',
            options: [],
            recommendation: ''
          };
          continue;
        }

        if (currentDelib.escalation) {
          if (trimmed.startsWith('- Reason:')) {
            currentDelib.escalation.reason = trimmed.replace('- Reason:', '').trim();
            continue;
          }
          if (trimmed.startsWith('- Recommendation:')) {
            currentDelib.escalation.recommendation = trimmed.replace('- Recommendation:', '').trim();
            continue;
          }
          const optMatch = trimmed.match(/^-\s*\[([A-Z0-9])\]\s*(.+)/i);
          if (optMatch) {
            currentDelib.escalation.options.push({
              key: optMatch[1].toUpperCase(),
              label: optMatch[2].trim()
            });
            continue;
          }
        }

        // Human ruling block
        const rulingMatch = trimmed.match(/- \*\*HUMAN RULING\*\*\s*\[(@\w+)\s*\|\s*([^\]]+)\]:/i);
        if (rulingMatch) {
          currentDelib.humanRuling = {
            author: rulingMatch[1],
            date: rulingMatch[2].trim(),
            decision: ''
          };
          continue;
        }
        if (currentDelib.humanRuling && trimmed.startsWith('- Decision:')) {
          currentDelib.humanRuling.decision = trimmed.replace('- Decision:', '').trim();
          continue;
        }
      }
    }

    // Parse Task Board
    if (currentSection === 'tasks') {
      const taskMatch = trimmed.match(/^-\s*\[([ xX])\]\s*\*\*([^*]+)\*\*\s*(?:\[([^\]]+)\])?/);
      if (taskMatch) {
        const completed = taskMatch[1].toLowerCase() === 'x';
        const id = taskMatch[2].trim();
        const metaStr = taskMatch[3] || '';
        let assignee = '@human';
        let priority = 'Normal';
        let status = completed ? 'Completed' : 'Pending';

        if (metaStr) {
          const parts = metaStr.split('|').map(p => p.trim());
          for (const p of parts) {
            if (p.startsWith('@')) assignee = p;
            else if (p.toLowerCase().startsWith('priority:')) priority = p.replace(/priority:/i, '').trim();
            else if (p.toLowerCase().startsWith('status:')) status = p.replace(/status:/i, '').trim();
          }
        }

        currentTask = {
          id,
          completed,
          assignee,
          priority,
          status,
          task: '',
          criteria: ''
        };
        ledger.tasks.push(currentTask);
        continue;
      }

      if (currentTask) {
        if (trimmed.startsWith('- Task:')) {
          currentTask.task = trimmed.replace('- Task:', '').trim();
          continue;
        }
        if (trimmed.startsWith('- Acceptance Criteria:')) {
          currentTask.criteria = trimmed.replace('- Acceptance Criteria:', '').trim();
          continue;
        }
      }
    }

    // Parse Decision Log (ADRs)
    if (currentSection === 'adrs' && trimmed.startsWith('-')) {
      const adrMatch = trimmed.match(/^-\s*\*\*([^*]+)\*\*\s*(?:\(([^)]+)\))?:\s*(.+)/);
      if (adrMatch) {
        ledger.adrs.push({
          id: adrMatch[1].trim(),
          date: adrMatch[2] ? adrMatch[2].trim() : '',
          summary: adrMatch[3].trim()
        });
      }
    }
  }

  return ledger;
}

/**
 * Apply a Human Ruling into markdown atomically
 */
export function recordRulingInMarkdown(markdown, { rfcId, rulingText, optionKey, author = '@human', date = new Date().toISOString() }) {
  const lines = markdown.split(/\r?\n/);
  const targetHeader = `### ${rfcId}`;
  let startIndex = -1;
  let nextHeaderIndex = lines.length;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().toLowerCase().startsWith(targetHeader.toLowerCase())) {
      startIndex = i;
      break;
    }
  }

  if (startIndex === -1) {
    throw new Error(`Deliberation ${rfcId} not found in ledger.`);
  }

  // Find next section boundary
  for (let i = startIndex + 1; i < lines.length; i++) {
    if (lines[i].trim().startsWith('### ') || lines[i].trim().startsWith('## ')) {
      nextHeaderIndex = i;
      break;
    }
  }

  // Update Status line within this deliberation
  for (let i = startIndex; i < nextHeaderIndex; i++) {
    if (lines[i].trim().startsWith('- **Status**:')) {
      lines[i] = `- **Status**: Consensus Achieved (Ruling by ${author})`;
      break;
    }
  }

  const rulingBlock = [
    `- **HUMAN RULING** [${author} | ${date}]:`,
    `  - Decision: ${rulingText.trim()}`
  ];

  // Insert before next header
  lines.splice(nextHeaderIndex, 0, ...rulingBlock, '');

  // Also append to Decision Log (ADR)
  const adrHeaderIndex = lines.findIndex(l => l.trim().startsWith('## Decision Log') || l.trim().startsWith('## Decisions'));
  const adrDate = date.split('T')[0];
  const adrLine = `- **ADR-${String(Date.now()).slice(-3)}** (${adrDate}): ${rulingText.trim()}. Binding ruling by ${author} on ${rfcId}.`;

  if (adrHeaderIndex !== -1) {
    lines.splice(adrHeaderIndex + 1, 0, adrLine);
  } else {
    lines.push('', '## Decision Log (ADRs)', adrLine);
  }

  return lines.join('\n');
}

/**
 * Save configuration to .cahoots/cahoots.config.json
 */
export function saveConfig(projectDir, config) {
  const configDir = path.join(projectDir, '.cahoots');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  const configPath = path.join(configDir, 'cahoots.config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  return configPath;
}

/**
 * Load configuration from .cahoots/cahoots.config.json
 */
export function loadConfig(projectDir) {
  const configPath = path.join(projectDir, '.cahoots', 'cahoots.config.json');
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
      // return default
    }
  }
  return {
    framework: 'rfc',
    frameworkName: 'RFC & ADR (Standard)',
    stages: [
      { id: 'proposal', name: 'PROPOSAL (RFC)', type: 'pitch' },
      { id: 'stance', name: 'STANCE REVIEW', type: 'review' },
      { id: 'dissent', name: 'DISSENT / ESCALATION', type: 'guard' },
      { id: 'ruling', name: 'HUMAN RULING', type: 'tie-breaker' },
      { id: 'adr', name: 'ADR FREEZE', type: 'record' }
    ],
    roster: [
      { handle: '@architect', model: 'Claude 3.7 Sonnet', role: 'System architecture & proposals' },
      { handle: '@builder', model: 'Gemini 2.5 Pro', role: 'Code implementation & tasks' },
      { handle: '@auditor', model: 'OpenAI o3-mini', role: 'Failure mode probe & dissent' },
      { handle: '@human', model: 'Lead Developer', role: 'Binding tie-breaker & rulings' }
    ],
    invariants: [
      'All unit and integration tests must pass (100% green) before merging.',
      'Never commit secrets, tokens, or private credentials to git.',
      'Decisions require peer stance review or explicit human ruling.'
    ]
  };
}
