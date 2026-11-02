// Records demo/src/fixtures.json from a real, brand-new EndoriumFort Enterprise
// bastion: seeds fictitious data, browses the real interface as each role, and
// keeps every /api answer so the static demo replays the product's own shapes.
// See demo/capture/README.md for the prerequisites (EE sources + a license).
//
//   node demo/capture/capture.mjs <EE checkout> [bastion URL]
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { client, seed } from './seed.mjs';
import { hostOutput } from '../src/host.js';

const EE = path.resolve(process.argv[2] || '');
const API = process.argv[3] || 'http://localhost:8095';
const UI_PORT = 5176;
const FILES_PORT = 8090; // the Vite dev server proxies /files here
// Shared with the bastion, which must run with the same ENDORIUMFORT_FILESHARE_SECRET.
const FILES_SECRET = process.env.ENDORIUMFORT_FILESHARE_SECRET || '';
const UI = `http://localhost:${UI_PORT}`;
const SSH_PORT = 2299;
const OUT = new URL('../src/fixtures.json', import.meta.url);
if (!fs.existsSync(path.join(EE, 'frontend/src/pro'))) throw new Error('usage: capture.mjs <EndoriumFort EE checkout> [bastion URL]');

const frontendRequire = createRequire(path.join(EE, 'frontend/package.json'));
const ssh2 = frontendRequire('ssh2');
const { recordUi } = await import(pathToFileURL(path.join(path.dirname(new URL(import.meta.url).pathname), 'record-ui.mjs')));

// Fake SSH host answering like the demo's simulated servers.
function startFakeSsh(password) {
  const { generateKeyPairSync } = frontendRequire('node:crypto');
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048, privateKeyEncoding: { type: 'pkcs1', format: 'pem' }, publicKeyEncoding: { type: 'pkcs1', format: 'pem' } });
  const server = new ssh2.Server({ hostKeys: [privateKey] }, (conn) => {
    let user = 'deploy';
    conn.on('authentication', (ctx) => {
      user = ctx.username;
      if (ctx.method === 'password' && ctx.password === password) ctx.accept();
      else ctx.reject(['password']);
    });
    conn.on('ready', () => conn.on('session', (accept) => {
      const session = accept();
      session.on('pty', (ok) => ok && ok());
      session.on('window-change', (ok) => ok && ok());
      session.on('shell', (ok) => {
        const stream = ok();
        const host = 'hote';
        const prompt = () => stream.write(`\x1b[1;32m${user}@${host}\x1b[0m:\x1b[1;34m~\x1b[0m$ `);
        stream.write(`Linux ${host} 6.12.48+deb13-amd64 x86_64\r\n\r\n`);
        prompt();
        let line = '';
        stream.on('data', (data) => {
          for (const ch of data.toString()) {
            if (ch === '\x15') { stream.write('\b \b'.repeat(line.length)); line = ''; continue; }
            if (ch !== '\r' && ch !== '\n') { if (ch >= ' ') { line += ch; stream.write(ch); } continue; }
            const cmd = line.trim();
            line = '';
            stream.write('\r\n');
            if (cmd === 'exit') { stream.write('logout\r\n'); stream.exit(0); stream.end(); return; }
            const out = cmd ? hostOutput(cmd, { user, host }) : '';
            if (out) stream.write(out + '\r\n');
            prompt();
          }
        });
      });
    }));
    conn.on('error', () => {});
  });
  return new Promise((resolve) => server.listen(SSH_PORT, '127.0.0.1', () => resolve(server)));
}

function startUi() {
  const child = spawn('npx', ['vite', '--port', String(UI_PORT), '--strictPort'], {
    cwd: path.join(EE, 'frontend'),
    env: { ...process.env, EF_API_TARGET: API, EF_DEV_PORT: String(UI_PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true // own process group, so stopping it also stops vite under npx
  });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('vite did not start')), 60000);
    child.stdout.on('data', (d) => { if (/Local:/.test(String(d))) { clearTimeout(timer); resolve(child); } });
    child.on('exit', (code) => reject(new Error(`vite exited ${code}`)));
  });
}

const sshPassword = 'demo-ssh-' + Math.random().toString(36).slice(2, 10);
const sshServer = await startFakeSsh(sshPassword);

// The file share service, on a throwaway data directory.
let filesService = null;
if (FILES_SECRET) {
  const dataDir = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || '/tmp'), 'ef-files-'));
  filesService = spawn(path.join(EE, 'fileshare/endoriumfort-files'), [], {
    env: { ...process.env, ENDORIUMFORT_FILESHARE_SECRET: FILES_SECRET, EF_FS_LISTEN: `127.0.0.1:${FILES_PORT}`, EF_FS_DATA_DIR: dataDir, EF_FS_COOKIE_SECURE: 'false' },
    stdio: 'ignore'
  });
  await new Promise((r) => setTimeout(r, 800));
} else {
  console.log('[capture] ENDORIUMFORT_FILESHARE_SECRET not set: no file share drives');
}
const seeded = await seed(API, { sshHost: '127.0.0.1', sshPort: SSH_PORT, sshPassword, filesUrl: FILES_SECRET ? `http://127.0.0.1:${FILES_PORT}` : '' });
const { call, login } = client(API);
const T = seeded.admin.token;

// Direct reads of detail endpoints the page tour does not open.
const direct = [];
const read = async (route, token = T, method = 'GET', body) => {
  const response = await fetch(`${API}${route}`, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const u = new URL(route, API);
  direct.push({ role: 'admin', method, path: u.pathname, query: u.search, requestBody: body ? JSON.stringify(body) : null, status: response.status, licenseRequired: response.headers.get('x-endoriumfort-license-required') === '1', contentType: response.headers.get('content-type') || '', body: await response.text() });
};
for (const s of seeded.sessions) {
  await read(`/api/sessions/${s.id}/dna`);
  await read(`/api/evidence-packs/sessions/${s.id}`);
  await read(`/api/recordings?sessionId=${s.id}`);
}
// Reports (the demo recomputes them; these pin the shape) and the CSV export.
for (const period of ['day', 'month', 'quarter', 'year']) await read(`/api/reports?period=${period}`);
await read('/api/reports/export?period=month');

// The drives as each user sees them, straight from the file service.
const drives = {};
if (seeded.drives) {
  const { rid, share } = seeded.drives;
  for (const [user, d] of Object.entries(seeded.drives.drives)) {
    drives[user] = {
      session: d.opened,
      me: await d.send('GET', 'me'),
      home: await d.send('GET', 'list?root=home&path=/'),
      shares: await d.send('GET', 'shares')
    };
    for (const entry of drives[user].home.entries || []) {
      if (entry.dir) drives[user][`home:/${entry.name}`] = await d.send('GET', `list?root=home&path=${encodeURIComponent('/' + entry.name)}`);
    }
  }
  if (share?.id) drives['l.bernard'][`share:${share.id}`] = await seeded.drives.drives['l.bernard'].send('GET', `list?root=share:${encodeURIComponent(share.id)}&path=/`);
  drives.resourceId = rid;
  drives.ticket = { ...seeded.drives.drives['c.moreau'].ticket, ticket: 'demo-ticket' };
}

const recordings = await call(T, '/api/recordings').catch(() => ({ items: [] }));
for (const r of recordings.items || recordings || []) if (r?.id) await read(`/api/recordings/${r.id}/cast`);
for (const r of Object.values(seeded.res)) if (r) await read(`/api/relays/resolve/${r.id}`);
if (seeded.res['k8s-prod']) await read(`/api/k8s/resources/${seeded.res['k8s-prod'].id}/pods`);
await read('/api/sessions/risk-preview', T, 'POST', { resourceId: seeded.res['db-pg-prod']?.id, justification: 'Analyse', ticketId: 'INC-7731' });
for (const p of ['/api/security/alerts?sinceId=0', '/api/itdr/detections', '/api/itdr/rules', '/api/automation/jobs', '/api/vnc/capabilities', '/api/scim/v2/Users', '/api/scim/v2/Groups', '/api/scim/v2/ServiceProviderConfig']) await read(p);

const op = await login('c.moreau', seeded.userPassword);
const auditor = await login('s.lefevre', seeded.userPassword);
const lease = await call(op.token, `/api/resources/${seeded.res['srv-app-recette'].id}/ephemeral-credentials`, { method: 'POST' });
await read(`/api/ephemeral-credentials/${lease.leaseId}/consume`, op.token, 'POST');

const ui = await startUi();
let exchanges = [];
try {
  exchanges = await recordUi(UI, { admin: seeded.admin, operator: op, auditor }, frontendRequire('@playwright/test').chromium);
} finally {
  try { process.kill(-ui.pid); } catch (_) {}
  sshServer.close();
  if (filesService) filesService.kill();
}

// ── Assemble ─────────────────────────────────────────────────────────────────
const get = (route, token = T) => call(token, route);
const userResources = {};
for (const u of Object.values(seeded.users)) userResources[u.id] = (await get(`/api/users/${u.id}/resources`)).resourceIds;
const anonymized = (l) => ({ ...l, token: 'demo-token' });

const recorded = {};
for (const x of [...exchanges, ...direct]) {
  if (x.method === 'GET' && x.status >= 500) continue;
  const key = `${x.method} ${x.path}${x.method === 'GET' ? x.query : ''}`;
  let body = x.body;
  try { body = JSON.parse(x.body); } catch (_) {}
  // Keep the admin's view when several roles read the same route.
  if (recorded[key] && x.role !== 'admin') continue;
  recorded[key] = { status: x.status, body, ...(x.licenseRequired ? { licenseRequired: true } : {}), ...(typeof body === 'string' ? { contentType: x.contentType } : {}) };
}

const sessionsNow = await get('/api/sessions');
const fixtures = {
  edition: 'enterprise',
  // The demo shifts every recorded time by (now - capturedAt).
  capturedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
  drives,
  health: await get('/api/health'),
  bootstrap: await get('/api/auth/bootstrap-status'),
  twoFa: await get('/api/auth/2fa-status'),
  license: await get('/api/license/status'),
  resources: (await get('/api/resources')).items,
  users: (await get('/api/users')).items,
  userResources,
  stats: await get('/api/stats'),
  guardRules: (await get('/api/ssh-guard/rules')).items,
  integrations: (await get('/api/settings/integrations')).items,
  ssoLoginOptions: await get('/api/auth/sso/login-options'),
  rbiCapabilities: await get('/api/rbi/capabilities'),
  login: { admin: anonymized(seeded.admin), operator: anonymized(op), auditor: anonymized(auditor) },
  lease,
  sessionTemplate: sessionsNow.items[0],
  capturedSessions: sessionsNow.items,
  capturedAudit: (await get('/api/audit?limit=500')).items,
  resourceCredentials: { hasCredentials: true, sshPassword: '', sshUsername: '', resourceId: 0, status: 'ok' },
  recorded
};

// The capture machine's addresses and secrets are not the demo's.
const TARGETS = {
  'srv-web-prod-01': ['10.20.1.11', 22], 'srv-web-prod-02': ['10.20.1.12', 22], 'db-pg-prod': ['10.20.2.20', 22],
  'srv-app-recette': ['10.30.1.15', 22], 'ci-runner-01': ['10.40.0.5', 22], 'switch-coeur': ['10.0.0.1', 22]
};
let out = JSON.stringify(fixtures);
const byId = Object.fromEntries(fixtures.resources.map((r) => [r.id, r.name]));
// Operators' workstations, as the bastion would see them.
const WORKSTATIONS = { admin: '10.8.0.10', 'c.moreau': '10.8.0.21', 'l.bernard': '10.8.0.22', 'n.petit': '10.8.0.27', 's.lefevre': '10.8.0.31', 'prestataire.acme': '198.51.100.40' };
const fixTarget = (obj) => {
  if (Array.isArray(obj)) return obj.forEach(fixTarget);
  if (!obj || typeof obj !== 'object') return;
  if (typeof obj.payloadRaw === 'string' && obj.payloadRaw.includes('127.0.0.1')) {
    try {
      const payload = JSON.parse(obj.payloadRaw);
      fixTarget(payload);
      obj.payloadRaw = JSON.stringify(payload);
    } catch (_) {}
  }
  if (obj.ip === '127.0.0.1') obj.ip = WORKSTATIONS[obj.username || obj.actor || obj.user] || '10.8.0.50';
  const name = obj.name && TARGETS[obj.name] ? obj.name : byId[obj.resourceId];
  if (name && TARGETS[name]) {
    for (const key of ['target', 'resourceTarget']) {
      if (obj[key] === '127.0.0.1') obj[key] = TARGETS[name][0];
    }
    for (const key of ['port', 'resourcePort']) if (obj[key] === SSH_PORT) obj[key] = TARGETS[name][1];
  }
  Object.values(obj).forEach(fixTarget);
};
const parsed = JSON.parse(out);
fixTarget(parsed);
out = JSON.stringify(parsed, null, 1)
  .replaceAll(`127.0.0.1:${SSH_PORT}`, '10.30.1.15:22')
  .replaceAll('@127.0.0.1', '@10.30.1.15')
  .replaceAll(`127.0.0.1:${new URL(API).port}`, 'bastion-01.interne.local:8443')
  // Last resort (aggregates such as report targets): the recette host.
  .replaceAll('127.0.0.1', '10.30.1.15')
  .replaceAll(`localhost:${UI_PORT}`, 'demo.endorium.local')
  .replaceAll(API.replace(/^https?:\/\//, ''), 'demo.endorium.local');
for (const secret of [FILES_SECRET, sshPassword, seeded.adminPassword, seeded.userPassword, seeded.totpSecret, T, op.token, auditor.token]) {
  if (secret && out.includes(secret)) out = out.replaceAll(secret, 'demo-redacted');
}
fs.writeFileSync(OUT, out + '\n');
console.log(`Wrote ${OUT.pathname}: ${Object.keys(recorded).length} recorded routes, ${out.length} bytes`);
