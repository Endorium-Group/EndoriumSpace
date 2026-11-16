// Endorium Workspace in the demo: the tile portal for non-technical staff, its
// role, the office access profile, per-file traceability (Journal > Files),
// the signed file evidence pack and view-only documents. The capture predates
// these features, so their answers are modelled on the product's own
// (fileshare/trace.go, fileshare/view.go, pro/fileshare_evidence.cc).

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
const isoAt = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, 'Z');

export const WORKSPACE_USER = 'm.durand';
export const WORKSPACE_PERMISSIONS = [
  'resources.read', 'sessions.read', 'sessions.create', 'sessions.terminate',
  'access_requests.read', 'access_requests.create', 'rdp.connect', 'vnc.connect',
  'web.proxy.access', 'tunnel.connect'
];

// ── Seed ─────────────────────────────────────────────────────────────────────
// Adds the accountant's world to a freshly built demo state.
export function seedWorkspace(s) {
  const now = Date.now();
  const base = s.resources.find((r) => r.protocol === 'fileshare') || s.resources[0];
  const nextResource = () => s.resources.reduce((m, r) => Math.max(m, r.id), 0) + 1;
  const resource = (fields) => {
    const r = { ...base, id: nextResource(), createdAt: isoAt(now - 20 * DAY), updatedAt: isoAt(now - 2 * DAY), ...fields };
    s.resources.push(r);
    return r;
  };
  const compta = resource({
    name: 'Compta', protocol: 'fileshare', target: 'smb://nas-cabinet/compta/Clients', port: 443,
    description: 'Dossiers clients du cabinet (serveur de fichiers existant, publié sans VPN)',
    tagsCsv: 'zone:bureautique,metier:comptabilite', accessProfile: 'office',
    workspacePublished: true, workspaceGroup: 'Fichiers', workspaceOrder: 1
  });
  const cegid = resource({
    name: 'Logiciel de compta', protocol: 'https', target: 'compta.cabinet.local', port: 443,
    description: 'Application métier, ouverte dans le navigateur isolé',
    tagsCsv: 'zone:bureautique,metier:comptabilite', accessProfile: 'office',
    workspacePublished: true, workspaceGroup: 'Applications', workspaceOrder: 1
  });
  const shared = s.resources.find((r) => r.name === 'partage-equipes');
  if (shared) Object.assign(shared, { workspacePublished: true, workspaceGroup: 'Fichiers', workspaceOrder: 2 });
  const rds = s.resources.find((r) => r.name === 'win-rds-01');
  if (rds) Object.assign(rds, { workspacePublished: true, workspaceGroup: 'Postes de travail', workspaceOrder: 1, description: 'Poste du cabinet (bureau à distance)' });

  const uid = s.users.reduce((m, u) => Math.max(m, u.id), 0) + 1;
  const template = s.users.find((u) => u.role === 'operator') || s.users[0];
  s.users.push({ ...template, id: uid, username: WORKSPACE_USER, role: 'workspace', totpEnabled: false,
    createdAt: isoAt(now - 20 * DAY), updatedAt: isoAt(now - 20 * DAY) });
  s.userResources[uid] = [compta.id, cegid.id, ...(shared ? [shared.id] : []), ...(rds ? [rds.id] : [])];
  // The operators of the cabinet see the client folders too.
  for (const [id, list] of Object.entries(s.userResources)) {
    const user = s.users.find((u) => u.id === Number(id));
    if (user && user.username === 'c.moreau' && !list.includes(compta.id)) list.push(compta.id);
  }

  // Drives: the senior accountant's client folders, shared "view only".
  const file = (size, msAgo, content = null) => ({ dir: false, size, modified: isoAt(now - msAgo), content });
  const folder = (msAgo) => ({ dir: true, size: 0, modified: isoAt(now - msAgo), content: null });
  const senior = (s.drives['c.moreau'] ||= {});
  Object.assign(senior, {
    '/Clients': folder(30 * DAY),
    '/Clients/Dupont SARL': folder(30 * DAY),
    '/Clients/Dupont SARL/bilan-2025.pdf': file(482113, 3 * DAY),
    '/Clients/Dupont SARL/liasse-fiscale-2025.pdf': file(219004, 3 * DAY),
    '/Clients/Dupont SARL/notes-entretien.txt': file(1204, 2 * DAY, 'Entretien annuel — Dupont SARL\n\nChiffre d’affaires 2025 : 1 284 000 €\nRésultat net : 96 400 €\nPoints d’attention : stock en hausse, délai client 58 jours.\n'),
    '/Clients/Martin & Fils': folder(25 * DAY),
    '/Clients/Martin & Fils/previsionnel-2026.xlsx': file(88210, 5 * DAY)
  });
  const mine = (s.drives[WORKSPACE_USER] ||= {});
  Object.assign(mine, {
    '/Courriers': folder(10 * DAY),
    '/Courriers/relance-honoraires.docx': file(32018, 1 * DAY),
    '/rapprochement-bancaire-octobre.xlsx': file(51230, 4 * HOUR)
  });
  const share = {
    id: 'a91c03be77d2f4e0d1c58a2b', owner: 'c.moreau', grantee: WORKSPACE_USER, name: 'Dupont SARL',
    path: '/Clients/Dupont SARL', isDir: true, mode: 'view', createdAt: isoAt(now - 3 * DAY), expired: false
  };
  s.shares.push(share);

  // The drive journal: a few days of the cabinet's work on those files.
  s.fileJournal = [];
  s.workspace = { compta: compta.id, cegid: cegid.id, shareId: share.id };
  const ev = (msAgo, action, user, file, extra = {}) => s.fileJournal.push({
    ts: isoAt(now - msAgo), action, user, resourceId: compta.id, sessionId: 900 + s.fileJournal.length,
    owner: 'c.moreau', file, outcome: 'ok', ip: user === 'c.moreau' ? '192.168.10.24' : '192.168.10.31', ...extra
  });
  ev(3 * DAY + 2 * HOUR, 'mkdir', 'c.moreau', '/Clients/Dupont SARL');
  ev(3 * DAY + HOUR, 'upload', 'c.moreau', '/Clients/Dupont SARL/bilan-2025-v1.pdf', { bytes: 480771 });
  ev(3 * DAY, 'rename', 'c.moreau', '/Clients/Dupont SARL/bilan-2025-v1.pdf', { fileTarget: '/Clients/Dupont SARL/bilan-2025.pdf' });
  ev(3 * DAY - HOUR, 'upload', 'c.moreau', '/Clients/Dupont SARL/liasse-fiscale-2025.pdf', { bytes: 219004 });
  ev(3 * DAY - 2 * HOUR, 'share.create', 'c.moreau', '/Clients/Dupont SARL', { target: WORKSPACE_USER, detail: 'view' });
  ev(2 * DAY, 'upload', 'c.moreau', '/Clients/Dupont SARL/notes-entretien.txt', { bytes: 1204 });
  ev(2 * DAY - 3 * HOUR, 'view', WORKSPACE_USER, '/Clients/Dupont SARL/bilan-2025.pdf', { detail: 'pdf', root: `share:${share.id}` });
  ev(DAY + 5 * HOUR, 'download', WORKSPACE_USER, '/Clients/Dupont SARL/bilan-2025.pdf', { outcome: 'denied', detail: 'view only', root: `share:${share.id}` });
  ev(DAY + 4 * HOUR, 'view', WORKSPACE_USER, '/Clients/Dupont SARL/liasse-fiscale-2025.pdf', { detail: 'pdf', root: `share:${share.id}` });
  ev(DAY, 'download', 'c.moreau', '/Clients/Dupont SARL', { detail: 'zip', bytes: 702321 });
  ev(5 * HOUR, 'view', WORKSPACE_USER, '/Clients/Dupont SARL/bilan-2025.pdf', { detail: 'pdf', root: `share:${share.id}` });
  s.views = {};
}

// ── Drive journal ────────────────────────────────────────────────────────────
// What the file service writes for each operation (owner + real path).
export function journalFile(s, entry) {
  (s.fileJournal ||= []).push({ ts: isoAt(Date.now()), outcome: 'ok', ip: '203.0.113.10', ...entry });
}

const within = (p, q) => {
  if (!p) return '';
  if (p === q) return 'item';
  if (q === '/' || p.startsWith(q + '/')) return 'inside';
  if (p === '/' || q.startsWith(p + '/')) return 'parent';
  return '';
};
const RANK = { '': 0, parent: 1, inside: 2, item: 3 };

function trace(s, rid, params) {
  const norm = (v) => '/' + String(v || '/').split('/').filter((x) => x && x !== '.' && x !== '..').join('/');
  const path = norm(params.get('path'));
  const owner = params.get('owner') || '';
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const lines = s.fileJournal || [];
  const events = [];
  lines.forEach((e, i) => {
    if (e.resourceId !== rid) return;
    if (owner && e.owner !== owner) return;
    if (from && e.ts.slice(0, 10) < from) return;
    if (to && e.ts.slice(0, 10) > to) return;
    let scope = within(e.file, path);
    const t = within(e.fileTarget, path);
    if (RANK[t] > RANK[scope]) scope = t;
    if (!scope || (scope === 'parent' && e.action === 'list')) return;
    events.push({ ...e, line: i + 1, scope });
  });
  events.sort((a, b) => (a.ts < b.ts ? 1 : -1));
  return { events, truncated: false, scanned: lines.length, chainIntact: true, head: 'c3f1a8e4d7b2906f5e1d8a3c7b4e2f9061d5a8c3e7b1f4d2a9c6e0b8f3d7a152' };
}

async function sha256Hex(textValue) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(textValue));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ── Routes ───────────────────────────────────────────────────────────────────
export function handleWorkspace(s, method, url, p, body, me, helpers) {
  const { json, text, pushAudit, save, canReadAudit } = helpers;
  let m;
  if ((m = p.match(/^\/api\/resources\/(\d+)\/assignees$/))) {
    const rid = Number(m[1]);
    const userIds = Object.entries(s.userResources).filter(([, list]) => list.includes(rid)).map(([id]) => Number(id));
    return json({ status: 'ok', resourceId: rid, userIds });
  }
  if ((m = p.match(/^\/api\/resources\/(\d+)\/fileshare\/audit$/))) {
    if (!canReadAudit(me)) return text('Forbidden', 403);
    const rid = Number(m[1]);
    const resource = s.resources.find((r) => r.id === rid);
    if (!resource || resource.protocol !== 'fileshare') return text('Resource not found', 404);
    const result = trace(s, rid, url.searchParams);
    pushAudit('fileshare.trace', me.username, { resourceId: rid, path: url.searchParams.get('path') || '', owner: url.searchParams.get('owner') || '', status: 200 });
    save();
    return json(result);
  }
  if ((m = p.match(/^\/api\/evidence-packs\/fileshare\/(\d+)$/))) {
    if (!canReadAudit(me)) return text('Forbidden', 403);
    const rid = Number(m[1]);
    const resource = s.resources.find((r) => r.id === rid);
    if (!resource) return text('Resource not found', 404);
    const result = trace(s, rid, url.searchParams);
    const sessionIds = [...new Set(result.events.map((e) => e.sessionId))];
    const payload = {
      kind: 'fileshare-trace', generatedAt: isoAt(Date.now()), generatedBy: me.username,
      resource: { id: rid, name: resource.name, target: resource.target },
      query: { path: url.searchParams.get('path') || '/', owner: url.searchParams.get('owner') || '', from: url.searchParams.get('from') || '', to: url.searchParams.get('to') || '' },
      journal: { chainIntact: result.chainIntact, head: result.head, scanned: result.scanned, truncated: false },
      events: result.events,
      sessions: sessionIds.map((id) => {
        const e = result.events.find((x) => x.sessionId === id);
        return { id, user: e.user, resourceId: rid, status: 'terminated', createdAt: e.ts, terminatedAt: e.ts };
      })
    };
    return (async () => {
      const canonical = JSON.stringify(payload);
      const digest = await sha256Hex(canonical);
      const signature = await sha256Hex('demo-evidence-key:' + canonical);
      pushAudit('evidence.fileshare.export', me.username, { resourceId: rid, path: payload.query.path, events: result.events.length, digest });
      save();
      return json({ ...payload, digest, signature, signatureMethod: 'hmac-sha256/server', signedAt: isoAt(Date.now()) });
    })();
  }
  if ((m = p.match(/^\/api\/fileshare-view\/sessions\/(\d+)\/open$/)) && method === 'POST') {
    const session = s.sessions.find((x) => x.id === Number(m[1]));
    if (!session || session.operator !== me.username) return text('Session not found', 404);
    if (session.status !== 'active') return text('Session is no longer active', 409);
    const root = String(body?.root || 'home');
    const rel = String(body?.path || '');
    let owner = me.username;
    let full = rel;
    if (root.startsWith('share:')) {
      const share = s.shares.find((x) => x.id === root.slice(6) && x.grantee === me.username);
      if (!share) return json({ error: 'Not found' }, 404);
      owner = share.owner;
      full = share.isDir ? share.path + (rel === '/' ? '' : rel) : share.path;
    }
    const entry = s.drives[owner]?.[full];
    if (!entry || entry.dir) return json({ error: 'Not found' }, 404);
    const name = full.split('/').pop();
    if (!/\.(pdf|png|jpe?g|gif|webp|txt|csv|md|docx?|xlsx?|pptx?|odt|ods)$/i.test(name)) {
      return json({ error: 'This kind of file cannot be shown in the viewer' }, 415);
    }
    const resource = s.resources.find((r) => r.id === session.resourceId);
    const token = 'view-' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
    (s.views ||= {})[token] = { user: me.username, name, file: full, owner, label: resource?.name || '', content: entry.content, size: entry.size };
    journalFile(s, { action: 'view', user: me.username, resourceId: session.resourceId, sessionId: session.id, root, path: rel, owner, file: full, detail: 'pdf' });
    pushAudit('fileshare.view', me.username, { sessionId: session.id, resourceId: session.resourceId, root, path: rel });
    save();
    return json({ viewToken: token, kind: /\.pdf$/i.test(name) ? 'pdf' : 'office', name });
  }
  return null;
}

export function takeView(s, token, user) {
  const view = s.views?.[token];
  if (!view || view.user !== user) return null;
  delete s.views[token];
  return view;
}

// ── Document picture (what the isolated browser would stream) ────────────────
// Draws the page of a view-only document with its watermark, as one JPEG.
export async function documentFrame(view, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext('2d');
  g.fillStyle = '#525659';
  g.fillRect(0, 0, width, height);
  const pageW = Math.min(width - 80, 820);
  const x0 = (width - pageW) / 2;
  g.fillStyle = '#ffffff';
  g.shadowColor = 'rgba(0,0,0,.45)';
  g.shadowBlur = 14;
  g.fillRect(x0, 24, pageW, height + 400);
  g.shadowBlur = 0;
  g.fillStyle = '#1b2430';
  g.font = '600 26px system-ui, sans-serif';
  const title = view.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]/g, ' ');
  g.fillText(title.charAt(0).toUpperCase() + title.slice(1), x0 + 56, 96);
  g.font = '14px system-ui, sans-serif';
  g.fillStyle = '#5b6573';
  g.fillText(`${view.label} · ${view.file}`, x0 + 56, 124);
  g.fillStyle = '#1b2430';
  const lines = view.content
    ? String(view.content).split('\n')
    : [
        'Bilan au 31 décembre 2025', '',
        'ACTIF                                   2025           2024',
        'Immobilisations corporelles        412 300 €      398 150 €',
        'Stocks et en-cours                 286 940 €      231 020 €',
        'Créances clients                   205 610 €      188 470 €',
        'Disponibilités                     143 280 €      121 905 €',
        '', 'PASSIF',
        'Capitaux propres                   622 410 €      526 010 €',
        'Dettes fournisseurs                214 870 €      203 440 €',
        'Dettes fiscales et sociales         98 120 €       94 335 €',
        '', 'Résultat de l’exercice              96 400 €       81 260 €'
      ];
  g.font = '15px ui-monospace, Menlo, monospace';
  lines.forEach((line, i) => g.fillText(line, x0 + 56, 176 + i * 26));
  // Watermark: the person, the drive and the time, across the whole picture.
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${view.user} · ${view.label} · ${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
  g.save();
  g.translate(width / 2, height / 2);
  g.rotate(-28 * Math.PI / 180);
  g.font = '600 17px system-ui, sans-serif';
  g.fillStyle = 'rgba(190,30,30,.24)';
  const step = g.measureText(stamp).width + 130;
  for (let y = -height * 1.2; y < height * 1.2; y += 90) {
    for (let x = -width * 1.2; x < width * 1.2; x += step) g.fillText(stamp, x + ((y / 90) % 2 ? step / 2 : 0), y);
  }
  g.restore();
  g.fillStyle = 'rgba(20,20,20,.72)';
  g.fillRect(0, height - 24, width, 24);
  g.fillStyle = '#ffffff';
  g.font = '12px system-ui, sans-serif';
  g.fillText(`${view.name} — lecture seule · view only — ${stamp}`, 10, height - 8);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  return blob.arrayBuffer();
}
