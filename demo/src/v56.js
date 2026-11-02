// Features of EndoriumFort 1.0.53–1.0.56 in the demo: activity reports, SSH
// file transfer and the file share drive. Shapes follow the bastion's own code
// (reporting.cc, ssh_transfer.cc, fileshare/) and the recorded capture.

// ── History ──────────────────────────────────────────────────────────────────
// The capture covers a few hours; reports over a month, a quarter or a year
// need the months before. A fixed pseudo-random journal, so every visitor gets
// the same figures.
function rng(seed) {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5; x >>>= 0;
    return x / 4294967296;
  };
}

const stamp = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, 'Z');

// Who works the most (the contractor the least), on their own resources only.
const ACTIVITY = { 'c.moreau': 0.36, 'l.bernard': 0.3, 'n.petit': 0.22, 'prestataire.acme': 0.12 };

export function buildHistory(users, resources, userResources, before, days = 180) {
  const random = rng(20261102);
  const pick = (list) => list[Math.floor(random() * list.length)];
  const operators = users.filter((u) => u.role === 'operator').map((u) => u.username);
  const weighted = (() => {
    const roll = random();
    let acc = 0;
    for (const name of operators) {
      acc += ACTIVITY[name] ?? 1 / operators.length;
      if (roll < acc) return name;
    }
    return operators[0];
  });
  const assigned = (name) => {
    const user = users.find((u) => u.username === name);
    const ids = new Set(userResources[user?.id] || []);
    const own = resources.filter((r) => ids.has(r.id) && r.protocol !== 'fileshare');
    return own.length ? own : resources.filter((r) => r.protocol !== 'fileshare');
  };
  const events = [];
  const push = (ms, type, actor, payload) => events.push({ ms, type, actor, payload });
  const end = Date.parse(before);
  const dayMs = 86400000;
  for (let d = days; d >= 1; d -= 1) {
    const day = new Date(end - d * dayMs);
    day.setUTCHours(0, 0, 0, 0);
    const weekday = day.getUTCDay();
    const busy = weekday === 0 || weekday === 6 ? 0.15 : 1;
    const sessions = Math.round((4 + random() * 7) * busy);
    for (let i = 0; i < sessions; i += 1) {
      const actor = weighted();
      const r = pick(assigned(actor));
      const start = day.getTime() + (7 + random() * 11) * 3600000;
      const base = { resourceId: r.id, resourceName: r.name, target: r.target, user: actor, protocol: r.protocol, port: r.port };
      push(start - 120000, 'auth.login.success', actor, { username: actor, authSource: 'local' });
      if (r.requireDualApproval && random() < 0.8) {
        push(start - 3600000, 'access_request.create', actor, { resourceId: r.id, resourceName: r.name, status: 'pending' });
        const ok = random() < 0.85;
        push(start - 1800000, ok ? 'access_request.approve' : 'access_request.deny', 'admin', { resourceId: r.id, requester: actor });
        if (!ok) continue;
      }
      push(start, 'policy.decision.allow', actor, { resourceId: r.id, reason: 'granted' });
      push(start, r.requireAccessJustification || random() < 0.7 ? 'session.create' : 'session.create.unjustified', actor, { ...base, status: 'active' });
      if (random() < 0.06) push(start + 300000, 'command_guard.block', 'system', { resourceId: r.id, target: r.target, reason: pick(['wipe_root', 'power_command', 'disk_format']) });
      push(start + (10 + random() * 70) * 60000, 'session.terminate', actor, { ...base, status: 'terminated' });
    }
    if (random() < 0.35 * busy) {
      const who = pick(operators);
      const n = 1 + Math.floor(random() * 4);
      for (let k = 0; k < n; k += 1) push(day.getTime() + (6 + random() * 14) * 3600000, 'auth.login.failure', who, { username: who, reason: 'invalid_credentials' });
    }
    if (random() < 0.12 * busy) {
      const r = pick(resources);
      push(day.getTime() + (9 + random() * 8) * 3600000, 'resource.update', 'admin', { resourceId: r.id, name: r.name });
    }
    if (random() < 0.05) push(day.getTime() + 10 * 3600000, 'user.update', 'admin', { username: pick(operators) });
  }
  events.sort((a, b) => a.ms - b.ms);
  return events.map((e) => ({ type: e.type, actor: e.actor, createdAt: stamp(e.ms), payloadRaw: JSON.stringify(e.payload), payloadIsJson: true }));
}

// ── Reports (port of backend/src/reporting.cc) ───────────────────────────────
const pad2 = (n) => String(n).padStart(2, '0');
const isoDate = (c) => `${c.y}-${pad2(c.m)}-${pad2(c.d)}`;
const leap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const daysIn = (y, m) => (m === 2 && leap(y) ? 29 : [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]);
const todayUtc = () => new Date().toISOString().slice(0, 10);

function parseAnchor(text) {
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(text || '');
  if (!m) return null;
  const c = { y: +m[1], m: m[2] ? +m[2] : 1, d: m[3] ? +m[3] : 1 };
  if (c.y < 1970 || c.y > 9999 || c.m < 1 || c.m > 12 || c.d < 1 || c.d > daysIn(c.y, c.m)) return null;
  return c;
}
function previousDay(c) {
  if (c.d > 1) return { ...c, d: c.d - 1 };
  const m = c.m > 1 ? c.m - 1 : 12;
  const y = c.m > 1 ? c.y : c.y - 1;
  return { y, m, d: daysIn(y, m) };
}
function nextDay(c) {
  if (c.d < daysIn(c.y, c.m)) return { ...c, d: c.d + 1 };
  return c.m < 12 ? { y: c.y, m: c.m + 1, d: 1 } : { y: c.y + 1, m: 1, d: 1 };
}
function windowOf(period, anchor) {
  const first = { ...anchor };
  const last = { ...anchor };
  let label;
  if (period === 'day') label = isoDate(anchor);
  else if (period === 'month') { first.d = 1; last.d = daysIn(last.y, last.m); label = `${anchor.y}-${pad2(anchor.m)}`; }
  else if (period === 'quarter') {
    const q = Math.floor((anchor.m - 1) / 3);
    first.m = q * 3 + 1; first.d = 1; last.m = q * 3 + 3; last.d = daysIn(last.y, last.m);
    label = `${anchor.y}-Q${q + 1}`;
  } else { first.m = 1; first.d = 1; last.m = 12; last.d = 31; label = String(anchor.y); }
  return { label, from: `${isoDate(first)}T00:00:00Z`, to: `${isoDate(last)}T23:59:59Z`, anchor: isoDate(first) };
}
function bucketLabels(period, w) {
  if (period === 'day') return Array.from({ length: 24 }, (_, h) => `${pad2(h)}:00`);
  if (period === 'year') return Array.from({ length: 12 }, (_, i) => `${w.from.slice(0, 4)}-${pad2(i + 1)}`);
  const labels = [];
  let day = parseAnchor(w.anchor);
  const last = w.to.slice(0, 10);
  for (let date = isoDate(day); date <= last; date = isoDate(day)) { labels.push(date); day = nextDay(day); }
  return labels;
}
const bucketKey = (period, at) => (at.length < 13 ? '' : period === 'day' ? `${at.slice(11, 13)}:00` : period === 'year' ? at.slice(0, 7) : at.slice(0, 10));

const isFailure = (t) => /fail|denied|deny|block|reject|rate_limited|error|unjustified|anomaly|incident|detection|containment/.test(t);
const isAdmin = (t) => /^(resource|user|access_policy|access_profile|relay|license|integration|cluster|itdr\.rule|automation)\.|^access_request\.(approve|deny)$|^credential\.rotat/.test(t);
const SIGN_IN = new Set(['auth.login.success', 'auth.login.ldap.success', 'auth.login.sso.success']);
const SIGN_IN_FAIL = new Set(['auth.login.failure', 'auth.login.2fa_failure', 'auth.login.ldap.failure', 'auth.login.sso.failure', 'auth.login.rate_limited']);
const CLOSE = new Set(['session.close', 'session.terminate', 'session.expire']);
const isBlocked = (t) => t === 'session.create.blocked.containment' || t === 'session.create.unjustified' || t.startsWith('access.denied.');

const emptyTotals = () => ({
  events: 0, failures: 0, adminActions: 0, signIns: 0, signInFailures: 0, sessionsOpened: 0, sessionsClosed: 0,
  sessionsBlocked: 0, accessRequests: 0, accessApproved: 0, accessDenied: 0, commandBlocks: 0, incidents: 0, uniqueActors: 0, uniqueTargets: 0
});
function count(t, type) {
  t.events += 1;
  if (isFailure(type)) t.failures += 1;
  if (isAdmin(type)) t.adminActions += 1;
  if (SIGN_IN.has(type)) t.signIns += 1;
  if (SIGN_IN_FAIL.has(type)) t.signInFailures += 1;
  if (type === 'session.create') t.sessionsOpened += 1;
  if (CLOSE.has(type)) t.sessionsClosed += 1;
  if (isBlocked(type)) t.sessionsBlocked += 1;
  if (type === 'access_request.create') t.accessRequests += 1;
  if (type === 'access_request.approve') t.accessApproved += 1;
  if (type === 'access_request.deny') t.accessDenied += 1;
  if (type === 'command_guard.block') t.commandBlocks += 1;
  if (type === 'security.incident.opened') t.incidents += 1;
}
function targetOf(raw) {
  let json;
  try { json = JSON.parse(raw); } catch (_) { return ''; }
  if (!json || typeof json !== 'object' || Array.isArray(json)) return '';
  for (const key of ['resourceName', 'target', 'subject', 'username', 'requester']) {
    if (typeof json[key] === 'string' && json[key]) return json[key];
  }
  return typeof json.resourceId === 'number' ? `resource #${json.resourceId}` : '';
}
function topOf(tally, top) {
  const list = [...tally.entries()].map(([name, n]) => ({ name, count: n }));
  list.sort((a, b) => (a.count !== b.count ? b.count - a.count : a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return top > 0 ? list.slice(0, top) : list;
}

const PERIODS = { day: 'day', daily: 'day', month: 'month', monthly: 'month', quarter: 'quarter', quarterly: 'quarter', year: 'year', yearly: 'year', annual: 'year', annually: 'year' };

// Returns { error } or { report }.
export function buildReport(audit, params) {
  const period = PERIODS[params.get('period') || 'day'];
  if (!period) return { error: 'period must be day, month, quarter or year' };
  const anchor = parseAnchor(params.get('date') || todayUtc());
  if (!anchor) return { error: 'date must look like 2026-10-13, 2026-10 or 2026' };
  let top = 10;
  if (params.get('top')) {
    top = Number(params.get('top'));
    if (!Number.isInteger(top) || top < 1 || top > 50) return { error: 'top must be between 1 and 50' };
  }
  const window = windowOf(period, anchor);
  const previous = windowOf(period, previousDay(parseAnchor(window.anchor)));
  const buckets = bucketLabels(period, window).map((label) => ({ label, events: 0, sessions: 0, failures: 0 }));
  const index = new Map(buckets.map((b, i) => [b.label, i]));
  const totals = emptyTotals();
  const previousTotals = emptyTotals();
  const actors = new Map(), targets = new Map(), types = new Map(), families = new Map();
  const prevActors = new Set(), prevTargets = new Set();
  const bump = (map, key) => map.set(key, (map.get(key) || 0) + 1);
  let firstEventAt = '', lastEventAt = '', scanned = 0;
  for (const row of audit) {
    scanned += 1;
    if (row.createdAt < previous.from || row.createdAt > window.to) continue;
    const target = row.payloadIsJson ? targetOf(row.payloadRaw) : '';
    if (row.createdAt < window.from) {
      count(previousTotals, row.type);
      if (row.actor) prevActors.add(row.actor);
      if (target) prevTargets.add(target);
      continue;
    }
    count(totals, row.type);
    if (!firstEventAt || row.createdAt < firstEventAt) firstEventAt = row.createdAt;
    if (row.createdAt > lastEventAt) lastEventAt = row.createdAt;
    if (row.actor) bump(actors, row.actor);
    if (row.type) { bump(types, row.type); bump(families, row.type.split('.')[0]); }
    if (target) bump(targets, target);
    const i = index.get(bucketKey(period, row.createdAt));
    if (i !== undefined) {
      buckets[i].events += 1;
      if (row.type === 'session.create') buckets[i].sessions += 1;
      if (isFailure(row.type)) buckets[i].failures += 1;
    }
  }
  totals.uniqueActors = actors.size;
  totals.uniqueTargets = targets.size;
  previousTotals.uniqueActors = prevActors.size;
  previousTotals.uniqueTargets = prevTargets.size;
  return {
    report: {
      status: 'ok', period, generatedAt: stamp(Date.now()), window, previous, totals, previousTotals,
      bucketUnit: period === 'day' ? 'hour' : period === 'year' ? 'month' : 'day', buckets,
      topActors: topOf(actors, top), topTargets: topOf(targets, top), topEvents: topOf(types, top), families: topOf(families, 0),
      firstEventAt, lastEventAt, scannedLines: scanned, scannedFiles: 1, truncated: false
    }
  };
}

const csvCell = (value) => {
  let raw = String(value);
  if (raw && '=+-@\t\r'.includes(raw[0])) raw = `'${raw}`;
  return `"${raw.replace(/"/g, '""')}"`;
};
export function reportCsv(r) {
  const rows = [['period', 'label', r.window.label], ['period', 'from', r.window.from], ['period', 'to', r.window.to], ['period', 'previous', r.previous.label],
    ['period', 'firstEventAt', r.firstEventAt], ['period', 'lastEventAt', r.lastEventAt], ['period', 'truncated', r.truncated ? 'true' : 'false']];
  for (const [section, t] of [['total', r.totals], ['previousTotal', r.previousTotals]]) for (const [k, v] of Object.entries(t)) rows.push([section, k, String(v)]);
  for (const b of r.buckets) {
    rows.push([r.bucketUnit, b.label, String(b.events)], [`${r.bucketUnit}.sessions`, b.label, String(b.sessions)], [`${r.bucketUnit}.failures`, b.label, String(b.failures)]);
  }
  for (const [section, list] of [['topActor', r.topActors], ['topTarget', r.topTargets], ['topEvent', r.topEvents], ['family', r.families]]) {
    for (const item of list) rows.push([section, item.name, String(item.count)]);
  }
  return '﻿section,label,value\r\n' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

// ── SSH file transfer (ssh_transfer.cc) ──────────────────────────────────────
// What a simulated host holds; uploads made in the demo are added to it.
export function hostTree(user) {
  const now = Math.floor(Date.now() / 1000);
  const f = (size, ago) => ({ type: 'file', size, mtime: now - ago, content: null });
  const d = (ago) => ({ type: 'dir', size: 4096, mtime: now - ago });
  return {
    '/': d(9e6), '/etc': d(4e5), '/home': d(9e6), [`/home/${user}`]: d(3600), '/var': d(9e6), '/var/log': d(60),
    '/srv': d(2e5), '/srv/portail': d(7200), '/srv/portail/releases': d(7200),
    [`/home/${user}/.bashrc`]: f(3771, 3e7), [`/home/${user}/deploy.sh`]: f(1204, 2.6e6), [`/home/${user}/notes.txt`]: f(512, 86400),
    '/etc/os-release': f(267, 9e6), '/etc/hostname': f(16, 9e6), '/etc/nginx': d(4e5), '/etc/nginx/nginx.conf': f(1482, 4e5),
    '/var/log/syslog': f(482133, 60), '/var/log/auth.log': f(96412, 300), '/var/log/nginx': d(60), '/var/log/nginx/access.log': f(2316544, 30),
    '/srv/portail/current': d(7200), '/srv/portail/releases/4.11.3.tar.gz': f(18432113, 1.2e6), '/srv/portail/releases/4.12.0.tar.gz': f(18501877, 7200)
  };
}
const parentOf = (p) => (p === '/' ? '/' : p.replace(/\/[^/]+$/, '') || '/');
export function listHost(tree, home, asked) {
  let path = !asked || asked === '.' ? home : asked.startsWith('/') ? asked : `${home}/${asked}`;
  path = path.replace(/\/+$/, '') || '/';
  if (!tree[path]) return { status: 404, text: `${path}: no such file or directory` };
  if (tree[path].type !== 'dir') return { status: 400, text: 'Not a directory' };
  const prefix = path === '/' ? '/' : `${path}/`;
  const entries = Object.entries(tree)
    .filter(([p]) => p !== path && p.startsWith(prefix) && !p.slice(prefix.length).includes('/'))
    .map(([p, e]) => ({ name: p.slice(prefix.length), type: e.type, size: e.size, mtime: e.mtime }))
    .sort((a, b) => (a.type === 'dir') !== (b.type === 'dir') ? (a.type === 'dir' ? -1 : 1) : a.name.localeCompare(b.name));
  return { status: 200, body: { status: 'ok', sftp: true, path, parent: parentOf(path), truncated: false, entries } };
}
export function hostFileContent(tree, path, ctx) {
  const entry = tree[path];
  if (entry?.content) return entry.content;
  return `# ${path} — fichier simulé (démo EndoriumFort)\n# Hôte : ${ctx.host}\n`;
}

// ── File share drive (fileshare/ service) ────────────────────────────────────
// A drive: path → { dir, size, modified, content } per owner; shares by id.
export function driveFromCapture(capture) {
  const drives = {};
  const add = (owner, dir, listing) => {
    for (const e of listing?.entries || []) {
      const path = (dir === '/' ? '' : dir) + '/' + e.name;
      drives[owner] ||= {};
      drives[owner][path] = { dir: e.dir, size: e.size, modified: e.modified, content: null };
    }
  };
  for (const [user, d] of Object.entries(capture || {})) {
    if (!d || typeof d !== 'object' || !d.home) continue;
    drives[user] ||= {};
    add(user, '/', d.home);
    for (const [key, listing] of Object.entries(d)) if (key.startsWith('home:')) add(user, key.slice(5), listing);
  }
  const shares = [];
  for (const d of Object.values(capture || {})) for (const s of d?.shares?.outgoing || []) shares.push(s);
  return { drives, shares };
}

export function listDrive(drive, path, meta) {
  const dir = path === '/' ? '' : path;
  if (dir && !drive[dir]?.dir) return null;
  const entries = Object.entries(drive)
    .filter(([p]) => p.startsWith(dir + '/') && !p.slice(dir.length + 1).includes('/'))
    .map(([p, e]) => ({ name: p.slice(dir.length + 1), dir: e.dir, size: e.dir ? 0 : e.size, modified: e.modified }))
    .sort((a, b) => (a.dir !== b.dir ? (a.dir ? -1 : 1) : a.name.toLowerCase().localeCompare(b.name.toLowerCase())));
  return { ...meta, path: path || '/', entries };
}
