// Fills a brand-new EndoriumFort Enterprise bastion with the demo's fictitious
// data through its API. Run by capture.mjs; see demo/capture/README.md.
import crypto from 'node:crypto';

export function totp(secret, offset = 0) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const ch of secret.replace(/=+$/, '')) bits += alphabet.indexOf(ch).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + offset));
  const h = crypto.createHmac('sha1', key).update(counter).digest();
  return String((h.readUInt32BE(h[19] & 15) & 0x7fffffff) % 1e6).padStart(6, '0');
}

export function client(API) {
  const call = async (token, route, { method = 'GET', body } = {}) => {
    const response = await fetch(`${API}${route}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await response.text();
    let json = null;
    try { json = JSON.parse(text); } catch (_) {}
    if (!response.ok) throw new Error(`${method} ${route} → ${response.status} ${text.slice(0, 200)}`);
    return json ?? text;
  };
  const login = (user, password, totpCode) => call('', '/api/auth/login', { method: 'POST', body: { user, password, ...(totpCode ? { totpCode } : {}) } });
  return { call, login };
}

// Opens an SSH shell through the bastion (real WebSocket, real recording) and
// types `commands` into it.
export async function sshThroughBastion(API, token, sessionId, password, commands) {
  const url = API.replace(/^http/, 'ws') + '/api/ws/ssh';
  const ws = new WebSocket(url, { headers: { Authorization: `Bearer ${token}` } });
  ws.binaryType = 'arraybuffer';
  let output = '';
  ws.onmessage = (e) => { output += typeof e.data === 'string' ? e.data : new TextDecoder().decode(e.data); };
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = () => reject(new Error('ws error')); });
  ws.send(JSON.stringify({ type: 'start', sessionId, password, cols: 120, rows: 32 }));
  await new Promise((r) => setTimeout(r, 1500));
  for (const command of commands) {
    for (const ch of command + '\r') {
      ws.send(JSON.stringify({ type: 'input', data: ch }));
      await new Promise((r) => setTimeout(r, 35));
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  ws.close();
  await new Promise((r) => setTimeout(r, 500));
  return output;
}

export async function seed(API, { sshHost, sshPort, sshPassword }) {
  const { call, login } = client(API);
  const log = (...a) => console.log('[seed]', ...a);
  const soft = async (label, fn) => { try { return await fn(); } catch (e) { log('skip', label, '—', e.message); return null; } };

  // Factory admin: first login, new password, TOTP.
  const first = await login('admin', 'Admin123');
  const adminPassword = `Demo-${crypto.randomBytes(9).toString('base64url')}9a`;
  await call(first.token, '/api/auth/change-password', { method: 'POST', body: { currentPassword: 'Admin123', newPassword: adminPassword, keepCurrentSession: true } });
  const setup = await call(first.token, '/api/auth/setup-2fa', { method: 'POST' });
  await call(first.token, '/api/auth/verify-2fa', { method: 'POST', body: { code: totp(setup.secret) } });
  let admin;
  for (const offset of [1, 2]) {
    admin = await soft('admin login', () => login('admin', adminPassword, totp(setup.secret, offset)));
    if (admin) break;
    await new Promise((r) => setTimeout(r, 31000));
  }
  const T = admin.token;
  const post = (route, body, method = 'POST') => soft(`${method} ${route}`, () => call(T, route, { method, body }));

  const license = await call(T, '/api/license/status');
  log('license', license.state, license.edition, license.tier);
  if (license.state !== 'valid') throw new Error('the bastion has no valid Enterprise license');

  const userPassword = `Demo-${crypto.randomBytes(9).toString('base64url')}9a`;
  const users = {};
  for (const [username, role] of [['c.moreau', 'operator'], ['l.bernard', 'operator'], ['n.petit', 'operator'], ['s.lefevre', 'auditor'], ['prestataire.acme', 'operator']]) {
    users[username] = await post('/api/users', { username, password: userPassword, role, forcePasswordRotation: false });
  }

  // Resources. SSH ones point at the local fake SSH host so sessions and
  // recordings are real; capture.mjs rewrites their addresses afterwards.
  const res = {};
  const ssh = (f) => ({ protocol: 'ssh', target: sshHost, port: sshPort, sshUsername: 'deploy', sshPassword, ...f });
  const defs = [
    ssh({ name: 'srv-web-prod-01', tagsCsv: 'zone:prod,app:portail', description: 'Frontal web nginx — production', riskLevel: 'high', requireAccessJustification: true, enableCommandGuard: true }),
    ssh({ name: 'srv-web-prod-02', tagsCsv: 'zone:prod,app:portail', description: 'Frontal web nginx — production', riskLevel: 'high', requireAccessJustification: true, enableCommandGuard: true }),
    ssh({ name: 'db-pg-prod', sshUsername: 'postgres', tagsCsv: 'zone:prod,app:donnees', description: 'PostgreSQL 16 primaire', riskLevel: 'critical', requireAccessJustification: true, requireDualApproval: true, enableCommandGuard: true }),
    ssh({ name: 'srv-app-recette', tagsCsv: 'zone:recette,app:portail', description: 'Serveur applicatif de recette' }),
    ssh({ name: 'ci-runner-01', sshUsername: 'runner', tagsCsv: 'zone:outillage', description: 'Runner CI GitLab' }),
    { name: 'ad-dc01', target: '10.10.0.10', port: 3389, protocol: 'rdp', tagsCsv: 'zone:infra,app:annuaire', description: 'Contrôleur de domaine Active Directory', riskLevel: 'critical', requireAccessJustification: true, requireDualApproval: true },
    { name: 'win-rds-01', target: '10.10.0.21', port: 3389, protocol: 'rdp', tagsCsv: 'zone:infra', description: 'Serveur de bureaux distants' },
    { name: 'hyperviseur-pve', target: '10.10.0.2', port: 8006, protocol: 'https', tagsCsv: 'zone:infra', description: 'Console Proxmox VE', riskLevel: 'high' },
    { name: 'grafana', target: 'grafana.interne.local', port: 443, protocol: 'https', tagsCsv: 'zone:outillage,app:supervision', description: 'Tableaux de bord de supervision' },
    { name: 'automate-ligne-3', target: '192.168.50.30', port: 5900, protocol: 'vnc', tagsCsv: 'zone:ot', description: 'IHM automate atelier — ligne 3', riskLevel: 'high' },
    ssh({ name: 'switch-coeur', sshUsername: 'netadmin', tagsCsv: 'zone:reseau', description: 'Commutateur cœur de réseau', riskLevel: 'high' }),
    { name: 'k8s-prod', target: 'k8s-api.interne.local', port: 6443, protocol: 'k8s', tagsCsv: 'zone:prod,app:plateforme', description: 'Cluster Kubernetes de production', riskLevel: 'high' }
  ];
  for (const f of defs) res[f.name] = await post('/api/resources', { riskLevel: 'low', ...f });
  const id = (name) => res[name]?.id;

  const assign = {
    'c.moreau': ['srv-web-prod-01', 'srv-web-prod-02', 'srv-app-recette', 'ci-runner-01', 'grafana', 'db-pg-prod', 'k8s-prod'],
    'l.bernard': ['ad-dc01', 'win-rds-01', 'hyperviseur-pve', 'switch-coeur'],
    'n.petit': ['srv-app-recette', 'grafana', 'automate-ligne-3'],
    'prestataire.acme': ['srv-app-recette']
  };
  for (const [u, list] of Object.entries(assign)) for (const r of list) if (id(r)) await post(`/api/users/${users[u].id}/resources/${id(r)}`, {});

  // JIT governance.
  const policy = (p) => post('/api/access-policies', {
    description: '', enabled: true, identityPattern: '*', role: '', groupName: '', riskLevel: 'any', requireJustification: true,
    ticketRequired: false, approvalMode: 'none', mfaRequirement: 'any', timeWindow: 'any', routingConstraint: 'any', maxDurationSeconds: 3600, ...p
  });
  const pProd = await policy({ name: 'prod-jit', description: 'Production : motif + ticket, approbation, 1 h max', resourceTagsCsv: 'zone:prod', ticketRequired: true, approvalMode: 'required', maxDurationSeconds: 3600 });
  await policy({ name: 'infra-critique', description: 'Annuaire et hyperviseur : double contrôle, clé de sécurité', resourceTagsCsv: 'zone:infra', approvalMode: 'required', mfaRequirement: 'webauthn', maxDurationSeconds: 1800 });
  await policy({ name: 'prestataires-heures-ouvrees', description: 'Prestataires : accès en heures ouvrées uniquement', identityPattern: 'prestataire.*', resourceTagsCsv: 'zone:recette', timeWindow: '08:00-19:00', maxDurationSeconds: 7200 });
  await policy({ name: 'ot-atelier', description: 'IHM atelier : motif obligatoire, 30 min', resourceTagsCsv: 'zone:ot', maxDurationSeconds: 1800 });
  const profile = (p) => post('/api/access-profiles', { description: '', resourceTagsCsv: '', resourceIdsCsv: '', policyId: 0, ...p });
  const prof1 = await profile({ name: 'Équipe web', description: 'Frontaux et recette du portail', resourceTagsCsv: 'app:portail', policyId: pProd?.id || 0 });
  await profile({ name: 'Astreinte infra', description: 'Accès d’astreinte annuaire / hyperviseur', resourceTagsCsv: 'zone:infra' });
  if (prof1) await post(`/api/users/${users['c.moreau'].id}/access-profiles/${prof1.id}`, {});

  // Integrations, SSO, directory, vault, ITDR, k8s: configured with fictitious values.
  const integrations = await soft('integrations', () => call(T, '/api/settings/integrations'));
  log('integration keys', (integrations?.items || []).map((i) => i.key || i.name).slice(0, 40).join(','));

  const op = await login('c.moreau', userPassword);
  const lb = await login('l.bernard', userPassword);
  const opPost = (tok, route, body) => soft(`${route}`, () => call(tok, route, { method: 'POST', body }));

  // Access requests: two approved (then used), one denied, one pending.
  const r1 = await opPost(op.token, '/api/access-requests', { resourceId: id('db-pg-prod'), justification: 'Analyse lenteurs requêtes', ticketId: 'INC-7731', purpose: 'Diagnostic performances' });
  const r2 = await opPost(lb.token, '/api/access-requests', { resourceId: id('ad-dc01'), justification: 'Création comptes nouveaux arrivants', ticketId: 'REQ-5521' });
  const r3 = await opPost(op.token, '/api/access-requests', { resourceId: id('srv-web-prod-01'), justification: 'Déploiement release 4.11', ticketId: 'CHG-20391' });
  const r4 = await opPost(op.token, '/api/access-requests', { resourceId: id('srv-web-prod-02'), justification: 'Déploiement release 4.12', ticketId: 'CHG-20418' });
  for (const r of [r1, r3]) if (r?.id) await post(`/api/access-requests/${r.id}/approve`, {});
  if (r2?.id) await post(`/api/access-requests/${r2.id}/deny`, { reason: 'Ticket non validé par le RSSI' });
  log('requests', r1?.id, r2?.id, r3?.id, r4?.id);

  // Real SSH sessions with recordings.
  const sessions = [];
  const open = async (tok, user, name, meta, commands) => {
    const r = res[name];
    const s = await opPost(tok, '/api/sessions', { resourceId: r.id, target: r.target, user, protocol: r.protocol, port: r.port, ...meta });
    if (!s) return null;
    sessions.push(s);
    if (commands) await soft(`ssh ${name}`, () => sshThroughBastion(API, tok, s.id, sshPassword, commands));
    return s;
  };
  await open(T, 'admin', 'srv-app-recette', { justification: 'Vérification service après redémarrage', ticketId: 'INT-3309', purpose: 'Contrôle' }, ['uptime', 'systemctl status nginx', 'df -h', 'exit']);
  await open(op.token, 'c.moreau', 'srv-web-prod-01', { justification: 'Déploiement release 4.11', ticketId: 'CHG-20391', purpose: 'Déploiement', accessRequestId: r3?.id }, ['cd /srv/portail', 'git log -1', 'rm -rf /', 'exit']);
  await open(op.token, 'c.moreau', 'db-pg-prod', { justification: 'Analyse lenteurs requêtes', ticketId: 'INC-7731', purpose: 'Diagnostic performances', accessRequestId: r1?.id }, ['uptime', 'free -h', 'ps', 'exit']);
  await open(op.token, 'c.moreau', 'ci-runner-01', {}, ['who', 'later', 'exit']);
  const np = await login('n.petit', userPassword);
  const acme = await login('prestataire.acme', userPassword);
  await open(np.token, 'n.petit', 'srv-app-recette', { justification: 'Contrôle après mise à jour', ticketId: 'INT-3312', purpose: 'Recette' }, ['hostname', 'tail /var/log/syslog', 'exit']);
  await open(acme.token, 'prestataire.acme', 'srv-app-recette', { justification: 'Intervention contrat de maintenance', ticketId: 'ACME-0457', purpose: 'Maintenance applicative' }, ['ls -la', 'sudo reboot', 'rm -rf /', 'whoami', 'exit']);
  await open(T, 'admin', 'grafana', { justification: 'Revue des tableaux de bord', purpose: 'Supervision' }, null);
  // Policies requiring approval: request, admin approves, the session uses it.
  const approved = async (tok, resource, justification, ticketId) => {
    const r = await opPost(tok, '/api/access-requests', { resourceId: id(resource), justification, ticketId });
    if (r?.id) await post(`/api/access-requests/${r.id}/approve`, {});
    return r?.id;
  };
  const r5 = await approved(lb.token, 'hyperviseur-pve', 'Extension disque VM gitlab', 'CHG-20421');
  await open(lb.token, 'l.bernard', 'hyperviseur-pve', { justification: 'Extension disque VM gitlab', ticketId: 'CHG-20421', purpose: 'Capacité', accessRequestId: r5 }, null);
  const r6 = await approved(op.token, 'srv-app-recette', 'Validation correctif cache', 'CHG-20418');
  const keep = [];
  keep.push(await open(op.token, 'c.moreau', 'srv-app-recette', { justification: 'Validation correctif cache', ticketId: 'CHG-20418', purpose: 'Recette', accessRequestId: r6 }, null));
  keep.push(await open(lb.token, 'l.bernard', 'switch-coeur', { justification: 'Ajout VLAN 240', ticketId: 'CHG-20402', purpose: 'Configuration réseau' }, null));
  for (const s of sessions.filter((x) => !keep.includes(x))) await post(`/api/sessions/${s.id}/terminate`, {});

  // Security events: failed logins for the security center / ITDR.
  for (let i = 0; i < 6; i++) await soft('bad login', () => login('n.petit', 'wrong-password'));
  await soft('bad login', () => login('ancien.admin', 'Password1'));

  // Vault: password rotation on the SSH hosts, an ephemeral account on the database.
  for (const [name, enabled, intervalSeconds] of [['srv-web-prod-01', true, 604800], ['srv-web-prod-02', true, 604800], ['db-pg-prod', true, 86400], ['switch-coeur', true, 2592000], ['srv-app-recette', false, 604800]]) {
    if (id(name)) await post(`/api/vault/rotation/${id(name)}`, { enabled, intervalSeconds }, 'PUT');
  }
  if (id('db-pg-prod')) await post(`/api/vault/dynamic/${id('db-pg-prod')}`, { enabled: true, adminUsername: 'postgres', adminSecret: 'x-demo-secret', grantSudo: false, ttlSeconds: 3600, loginShell: '/bin/bash' }, 'PUT');
  // Kubernetes: the resource is configured; there is no cluster behind it.
  if (id('k8s-prod')) await post(`/api/k8s/resources/${id('k8s-prod')}`, { namespace: 'portail', kubeconfig: 'apiVersion: v1\nkind: Config\nclusters: []\n' }, 'PUT');
  // Background jobs, so detections and sweeps show results.
  for (const job of ['itdr-scan', 'vault-rotation-sweep']) await post(`/api/automation/jobs/${job}/run`, {});

  return { admin, adminPassword, totpSecret: setup.secret, userPassword, users, res, sessions, requests: { r1, r2, r3, r4 } };
}
