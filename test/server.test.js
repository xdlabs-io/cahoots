import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { startServer } from '../src/server.js';

test('Cahoots Companion HTTP Server API lifecycle', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cahoots-test-'));
  const serverInstance = await startServer({
    port: 3999,
    projectDir: tmpDir,
    openBrowser: false
  });

  const baseUrl = serverInstance.url;

  try {
    // 1. Verify GET /
    const uiRes = await fetch(`${baseUrl}/`);
    assert.equal(uiRes.status, 200);
    const html = await uiRes.text();
    assert.ok(html.includes('cahoots — companion interface'));

    // 2. Verify GET /api/status
    const statusRes = await fetch(`${baseUrl}/api/status`);
    assert.equal(statusRes.status, 200);
    const statusData = await statusRes.json();
    assert.ok(statusData.ledger);
    assert.ok(statusData.config);
    assert.ok(statusData.presets);
    assert.equal(statusData.user.handle, '@human');

    // 3. Propose an RFC via POST /api/propose
    const propRes = await fetch(`${baseUrl}/api/propose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Webhook Queue Strategy',
        author: '@architect',
        summary: 'Buffer inbound requests via persistent queue.'
      })
    });
    assert.equal(propRes.status, 200);
    const propData = await propRes.json();
    assert.equal(propData.success, true);
    assert.equal(propData.rfcId, 'RFC-001');

    // 4. Save custom configuration via POST /api/config
    const cfgRes = await fetch(`${baseUrl}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          framework: 'sprint',
          frameworkName: 'Spec-Driven Sprint',
          invariants: ['All tests pass 100%'],
          roster: [{ handle: '@architect', model: 'Claude 3.7 Sonnet' }]
        },
        syncLedger: true
      })
    });
    assert.equal(cfgRes.status, 200);
    const cfgData = await cfgRes.json();
    assert.equal(cfgData.success, true);

    // 5. Submit a Human Ruling via POST /api/ruling
    const rulingRes = await fetch(`${baseUrl}/api/ruling`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rfcId: 'RFC-001',
        rulingText: 'Approved Option B (Redis).',
        author: '@human'
      })
    });
    assert.equal(rulingRes.status, 200);
    const rulingData = await rulingRes.json();
    assert.equal(rulingData.success, true);
    const rfc = rulingData.ledger.deliberations.find(d => d.id === 'RFC-001');
    assert.ok(rfc.status.includes('Consensus Achieved'));
  } finally {
    serverInstance.server.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
