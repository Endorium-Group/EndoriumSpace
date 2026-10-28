// Simulated EndoriumFort Enterprise API, served in the browser for the demo.
// Everything comes from a tour of a real EE v1.0.52 bastion (fixtures.json,
// see demo/capture/): the core flows are kept as state in this tab, every
// other route replays the answer the product gave.
import raw from './fixtures.json';

const STATE_KEY = 'ef_demo_state_v2';
const HEX = '9d3f1c7a52e8b046';
const MIN = 60 * 1000;
// The capture lasted a couple of minutes; spread it over the last few hours.
const SCALE = 120;

export const iso = (msAgo = 0) => new Date(Date.now() - msAgo).toISOString().replace(/\.\d+Z$/, 'Z');
const clone = (v) => JSON.parse(JSON.stringify(v));

// Recorded times, moved to "now": past ones stretched by SCALE, future ones
// (expiries) kept at the same distance.
function retime(source) {
  const captured = Date.parse(source.capturedAt);
  const now = Date.now();
  const move = (t) => (t <= captured ? now - (captured - t) * SCALE : now + (t - captured));
  const text = JSON.stringify(source)
    .replace(/"(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)(?:\.\d+)?Z"/g, (m, s) => `"${new Date(move(Date.parse(s + 'Z'))).toISOString().replace(/\.\d+Z$/, 'Z')}"`)
    .replace(/("[A-Za-z]*(?:Epoch|At)":)(1[6-9]\d{8})(?=[,}])/g, (m, k, s) => {
      const t = Number(s) * 1000;
      return Math.abs(t - captured) < 30 * 86400000 ? k + Math.round(move(t) / 1000) : m;
    });
  return JSON.parse(text);
}
const fx = retime(raw);
const RECORDED = fx.recorded;
// The capture ran on a 7-day labs license; the demo shows a yearly one.
const DAY = 24 * 60 * MIN;
fx.license = { ...fx.license, kind: 'annual', daysRemaining: 300, expiresAt: new Date(Date.now() + 300 * DAY).toISOString().replace(/\.\d+Z$/, 'Z') };
RECORDED['GET /api/license/status'] = { status: 200, body: fx.license };

// ── Initial state ────────────────────────────────────────────────────────────
const items = (key) => clone(RECORDED[key]?.body?.items || []);
const maxId = (list) => list.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0);

function buildState() {
  const casts = {};
  for (const [key, value] of Object.entries(RECORDED)) {
    const m = key.match(/^GET \/api\/recordings\/(\d+)\/cast$/);
    if (m && typeof value.body === 'string') casts[m[1]] = value.body;
  }
  const rotation = clone(RECORDED['GET /api/vault/rotation']?.body || { items: [] });
  // The capture's fake hosts refuse chpasswd; show the sweep as it runs on real hosts.
  for (const [i, r] of rotation.items.entries()) {
    if (!r.enabled) continue;
    Object.assign(r, { lastStatus: 'ok', lastDetail: '', rotationCount: 3 + i, lastRotatedEpoch: Math.round((Date.now() - (i + 1) * 26 * 3600000) / 1000) });
  }
  const s = {
    users: clone(fx.users),
    resources: clone(fx.resources),
    userResources: clone(fx.userResources),
    guardRules: clone(fx.guardRules),
    integrations: clone(fx.integrations),
    sessions: clone(fx.capturedSessions).sort((a, b) => a.id - b.id),
    audit: clone(fx.capturedAudit).sort((a, b) => a.id - b.id),
    requests: items('GET /api/access-requests').sort((a, b) => a.id - b.id),
    policies: items('GET /api/access-policies'),
    profiles: items('GET /api/access-profiles'),
    userProfiles: {},
    grants: items('GET /api/access-grants').sort((a, b) => a.id - b.id),
    recordings: items('GET /api/recordings').sort((a, b) => a.id - b.id),
    casts,
    rotation,
    nextId: {}
  };
  for (const [key, value] of Object.entries(RECORDED)) {
    const m = key.match(/^GET \/api\/users\/(\d+)\/access-profiles$/);
    if (m) s.userProfiles[m[1]] = clone(value.body.profileIds || []);
  }
  s.nextId = {
    user: maxId(s.users) + 1, resource: maxId(s.resources) + 1, session: maxId(s.sessions) + 1, audit: maxId(s.audit) + 1,
    request: maxId(s.requests) + 1, policy: maxId(s.policies) + 1, profile: maxId(s.profiles) + 1, grant: maxId(s.grants) + 1,
    recording: maxId(s.recordings) + 1, lease: 100
  };
  return s;
}

let state;
function load() {
  if (state) return state;
  try {
    const saved = sessionStorage.getItem(STATE_KEY);
    if (saved) state = JSON.parse(saved);
  } catch (_) {}
  if (!state) state = buildState();
  return state;
}
function save() {
  try { sessionStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (_) {}
}

function pushAudit(type, actor, payload) {
  const id = state.nextId.audit++;
  const role = actor === 'system' ? 'system' : state.users.find((u) => u.username === actor)?.role || 'operator';
  state.audit.push({ id, key: `${HEX}:${id}`, type, actor, role, createdAt: iso(), payloadRaw: JSON.stringify(payload), payloadIsJson: true });
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function currentUser() {
  try {
    const auth = JSON.parse(localStorage.getItem('endoriumfort_auth') || '{}');
    if (auth.user) return state.users.find((u) => u.username === auth.user) || null;
  } catch (_) {}
  return null;
}

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
const text = (body, status, type = 'text/plain') => new Response(body, { status, headers: { 'Content-Type': type } });
const ok = (extra = {}) => json({ status: 'ok', ...extra });

// Recorded answer for a route: exact match, then without the query, then any
// recording of the same shape (/api/sessions/7/dna answers /api/sessions/42/dna).
const shapeOf = (key) => key.replace(/\/\d+(?=\/|$)/g, '/#');
const BY_SHAPE = {};
for (const key of Object.keys(RECORDED)) {
  const shape = shapeOf(key.split('?')[0]);
  if (!BY_SHAPE[shape]) BY_SHAPE[shape] = key;
}
function replay(method, url, patch) {
  const exact = `${method} ${url.pathname}${method === 'GET' ? url.search : ''}`;
  const bare = `${method} ${url.pathname}`;
  const key = RECORDED[exact] ? exact : RECORDED[bare] ? bare : BY_SHAPE[shapeOf(bare)];
  if (!key) return null;
  const r = RECORDED[key];
  const headers = r.licenseRequired ? { 'X-EndoriumFort-License-Required': '1' } : {};
  if (typeof r.body === 'string') return text(r.body, r.status, r.contentType || 'text/plain');
  return json(patch ? patch(clone(r.body)) : r.body, r.status, headers);
}

const csv = (v) => String(v || '').split(',').map((x) => x.trim()).filter(Boolean);
const globMatch = (pattern, value) => new RegExp('^' + String(pattern || '*').split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$').test(value);

function visibleResources(user) {
  if (!user || user.role !== 'operator') return state.resources;
  const ids = new Set(state.userResources[user.id] || []);
  return state.resources.filter((r) => ids.has(r.id));
}

// Policies that apply to `user` on `resource`: by tags and identity, and through
// the user's access profiles.
function matchingPolicies(user, resource) {
  const tags = csv(resource.tagsCsv);
  const viaProfiles = new Set();
  for (const pid of state.userProfiles[user.id] || []) {
    const profile = state.profiles.find((p) => p.id === pid);
    if (!profile?.policyId) continue;
    const inProfile = csv(profile.resourceIdsCsv).map(Number).includes(resource.id) || csv(profile.resourceTagsCsv).some((t) => tags.includes(t));
    if (inProfile) viaProfiles.add(profile.policyId);
  }
  return state.policies.filter((p) => p.enabled && (viaProfiles.has(p.id) || (
    csv(p.resourceTagsCsv).some((t) => tags.includes(t)) && globMatch(p.identityPattern, user.username) && (!p.role || p.role === user.role)
  )));
}

const RISK_SCORE = { low: 20, medium: 45, high: 70, critical: 100 };
function riskPreview(user, resource, body = {}) {
  const policies = matchingPolicies(user, resource);
  const level = resource.riskLevel || 'low';
  const factors = [`base:${level}`];
  let score = RISK_SCORE[level] ?? 20;
  const purposeRequired = level === 'high' || level === 'critical';
  if (purposeRequired && !String(body.purpose || '').trim()) { factors.push('missing_purpose_bound:+15'); score += 15; }
  const mfa = policies.find((p) => p.mfaRequirement && p.mfaRequirement !== 'any')?.mfaRequirement || 'any';
  return {
    status: 'ok',
    score: Math.min(100, score),
    factors,
    matchedPolicyIds: policies.map((p) => p.id),
    resourceRiskLevel: level,
    effectiveRiskLevel: level,
    approvalRequired: !!resource.requireDualApproval || policies.some((p) => p.approvalMode === 'required'),
    ticketRequired: policies.some((p) => p.ticketRequired),
    justificationRequired: !!resource.requireAccessJustification || policies.some((p) => p.requireJustification),
    purposeRequired,
    mfaRequirement: mfa,
    routingConstraint: 'any',
    timeWindowDenied: false,
    adaptivePolicyEnabled: !!resource.adaptiveAccessPolicy,
    maxDurationSeconds: Math.min(3600, ...policies.map((p) => p.maxDurationSeconds || 3600))
  };
}

function stats() {
  const by = (p) => state.resources.filter((r) => r.protocol === p).length;
  const active = state.sessions.filter((s) => s.status === 'active').length;
  const admins = state.users.filter((u) => u.role === 'admin');
  return {
    ...clone(fx.stats),
    audit: { total: state.audit.length },
    recordings: { total: state.recordings.length },
    users: { total: state.users.length, admins: admins.length, adminsWithoutMfa: admins.filter((u) => !u.totpEnabled && !u.webauthnEnabled).length, adminsPendingBootstrap: 0 },
    resources: { ...fx.stats.resources, total: state.resources.length, ssh: by('ssh'), rdp: by('rdp'), vnc: by('vnc'), http: by('http') + by('https') },
    sessions: { total: state.sessions.length, active, terminated: state.sessions.length - active }
  };
}

function auditPage(params) {
  let list = [...state.audit].reverse();
  const actor = params.get('actor');
  const family = params.get('family');
  const category = params.get('category');
  const q = (params.get('q') || '').toLowerCase();
  const session = params.get('session');
  const from = params.get('from');
  const to = params.get('to');
  if (actor) list = list.filter((i) => i.actor === actor);
  if (family) list = list.filter((i) => i.type.split('.')[0] === family);
  if (category === 'failure') list = list.filter((i) => /fail|denied|deny|block|unjustified|anomaly/.test(i.type));
  if (category === 'admin') list = list.filter((i) => /^(user|resource|license|settings|ssh_guard|access_policy|access_profile|vault|k8s|automation)\./.test(i.type));
  if (q) list = list.filter((i) => (i.type + i.actor + i.payloadRaw).toLowerCase().includes(q));
  if (session) list = list.filter((i) => { try { return JSON.parse(i.payloadRaw).sessionId === Number(session); } catch (_) { return false; } });
  if (from) list = list.filter((i) => i.createdAt.slice(0, 10) >= from);
  if (to) list = list.filter((i) => i.createdAt.slice(0, 10) <= to);
  const cursor = params.get('cursor');
  if (cursor) {
    const id = Number(cursor.split(':')[1]);
    list = list.filter((i) => i.id < id);
  }
  const limit = Number(params.get('limit')) || 200;
  const page = list.slice(0, limit);
  const body = { status: 'ok', items: page, next: list.length > limit ? page[page.length - 1].key : '' };
  if (params.get('facets')) {
    body.facets = {
      families: [...new Set(state.audit.map((i) => i.type.split('.')[0]))].sort(),
      actors: [...new Set(state.audit.map((i) => i.actor))].sort()
    };
  }
  return body;
}

function loginResponse(user) {
  const role = user.role === 'admin' ? 'admin' : user.role === 'auditor' ? 'auditor' : 'operator';
  const now = Date.now();
  return {
    ...clone(fx.login[role]),
    user: user.username,
    role: user.role,
    totpEnabled: !!user.totpEnabled,
    issuedAt: new Date(now).toISOString().replace(/\.\d+Z$/, 'Z'),
    expiresAt: new Date(now + 8 * 60 * MIN).toISOString().replace(/\.\d+Z$/, 'Z'),
    token: 'demo-token'
  };
}

const RESOURCE_DEFAULTS = {
  tunnelTicketRateLimitMaxAttempts: 0, credentialSource: 'vaulted', enableCommandGuard: false, adaptiveAccessPolicy: false,
  agentProtocol: '', httpUsername: '', sshUsername: '', imageUrl: '', imageData: '', requireDualApproval: false,
  hasCredentials: false, description: '', tagsCsv: '', requireAccessJustification: false, riskLevel: 'low'
};
const SECRET_FIELDS = ['sshPassword', 'httpPassword', 'kubeconfig', 'adminSecret'];

function createSession(resource, user, body) {
  const id = state.nextId.session++;
  const grantId = state.nextId.grant++;
  const missionRef = String(body.purpose || '').trim();
  const policies = matchingPolicies(user, resource);
  const maxDurationSeconds = Math.min(3600, ...policies.map((p) => p.maxDurationSeconds || 3600));
  const session = {
    id, resourceId: resource.id, accessGrantId: grantId, port: resource.port, target: resource.target,
    user: user.username, operator: user.username, protocol: resource.protocol, status: 'active',
    missionRef, credentialSource: resource.credentialSource || 'vaulted', maxDurationSeconds, createdAt: iso()
  };
  state.sessions.push(session);
  const grant = {
    id: grantId, sessionId: id, resourceId: resource.id, resourceScope: resource.name, subject: user.username,
    status: 'issued', grantedAt: iso(), expiresAt: new Date(Date.now() + maxDurationSeconds * 1000).toISOString().replace(/\.\d+Z$/, 'Z'),
    usedAt: '', justification: String(body.justification || ''), ticketId: String(body.ticketId || ''), purpose: missionRef, missionRef,
    policyId: policies[0]?.id || 0, profileId: 0, approvalRef: Number(body.accessRequestId) || 0, mfaRequirement: 'any',
    routingConstraint: 'any', credentialSource: session.credentialSource, elevationScope: ''
  };
  state.grants.push(grant);
  const base = { sessionId: id, resourceId: resource.id, accessGrantId: grantId, target: resource.target, user: user.username, protocol: resource.protocol, port: resource.port };
  pushAudit('policy.decision.allow', user.username, { resourceId: resource.id, reason: 'granted' });
  pushAudit('access.grant.issued', user.username, { resourceId: resource.id, sessionId: id, justification: grant.justification, ticketId: grant.ticketId, purpose: missionRef, status: 'issued' });
  pushAudit(grant.justification ? 'session.create' : 'session.create.unjustified', user.username, grant.justification ? { ...base, status: 'active' } : { sessionId: id });
  if (missionRef) pushAudit('session.purpose.bound', user.username, { sessionId: id, purpose: missionRef });
  return session;
}

function closeSession(session, actor) {
  if (session.status !== 'active') return;
  session.status = 'terminated';
  session.terminatedAt = iso();
  const grant = state.grants.find((g) => g.id === session.accessGrantId);
  if (grant) grant.status = 'expired';
  pushAudit('session.terminate', actor, { sessionId: session.id, resourceId: session.resourceId, target: session.target, user: session.user, protocol: session.protocol, status: 'terminated' });
}

// ── Session DNA ──────────────────────────────────────────────────────────────
// As the bastion: chainHash = sha256(prevHash|eventType|sha256(payload)|createdAt).
const DNA_TYPES = new Set(['session.create', 'session.create.unjustified', 'session.purpose.bound', 'session.terminate', 'session.close']);
const sha256Hex = async (value) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map((b) => b.toString(16).padStart(2, '0')).join('');
const payloadOf = (event) => { try { return JSON.parse(event.payloadRaw); } catch (_) { return {}; } };

async function sessionDna(sessionId) {
  const entries = [];
  let prevHash = 'GENESIS';
  for (const event of state.audit) {
    if (!DNA_TYPES.has(event.type) || payloadOf(event).sessionId !== sessionId) continue;
    const payloadHash = await sha256Hex(event.payloadRaw);
    const chainHash = await sha256Hex(`${prevHash}|${event.type}|${payloadHash}|${event.createdAt}`);
    entries.push({ id: entries.length + 1, auditEventId: event.id, eventType: event.type, createdAt: event.createdAt, prevHash, payloadHash, chainHash });
    prevHash = chainHash;
  }
  return entries;
}

async function evidencePack(sessionId) {
  const session = state.sessions.find((x) => x.id === sessionId);
  if (!session) return text('Session not found', 404);
  const template = clone(RECORDED[BY_SHAPE['GET /api/evidence-packs/sessions/#']]?.body || {});
  const auditTrail = state.audit.filter((e) => { const pl = payloadOf(e); return pl.sessionId === sessionId || (session.accessGrantId && pl.accessGrantId === session.accessGrantId); });
  const sessionDnaEntries = await sessionDna(sessionId);
  const body = {
    ...template,
    session,
    resource: state.resources.find((r) => r.id === session.resourceId) || template.resource,
    accessGrant: state.grants.find((g) => g.id === session.accessGrantId) || template.accessGrant,
    auditTrail,
    sessionDna: sessionDnaEntries,
    signedAt: iso()
  };
  body.digest = await sha256Hex(JSON.stringify({ session: body.session, auditTrail, sessionDna: sessionDnaEntries }));
  // The real pack is HMAC-signed with a key that never leaves the server.
  body.signature = await sha256Hex('demo-signing|' + body.digest);
  return json(body);
}

// ── Router ───────────────────────────────────────────────────────────────────
export function handle(method, url, body) {
  load();
  const p = url.pathname.replace(/\/+$/, '');
  const me = currentUser();
  const actor = me?.username || 'anonymous';
  let m;

  // Public routes
  if (p === '/api/health') return json(fx.health);
  if (p === '/api/auth/bootstrap-status') return json(fx.bootstrap);
  if (p === '/api/auth/sso/login-options') return json(fx.ssoLoginOptions);
  if (p === '/api/branding' && method === 'GET') return replay(method, url);
  if (p === '/api/license/status' && method === 'GET') return json(fx.license);
  if (p === '/api/auth/login' && method === 'POST') {
    const user = state.users.find((u) => u.username === String(body?.user || '').trim());
    if (!user || !body?.password) {
      pushAudit('auth.login.failure', String(body?.user || 'unknown'), { username: body?.user || '', reason: 'invalid_credentials' });
      save();
      return text('Invalid credentials', 401);
    }
    pushAudit('auth.login.success', user.username, { userId: user.id, username: user.username, ip: '203.0.113.10', authSource: 'local' });
    save();
    return json(loginResponse(user));
  }

  if (!me) return text('Unauthorized', 401);

  if (p === '/api/auth/logout') {
    pushAudit('auth.logout', actor, { username: actor });
    save();
    return json({ message: 'Logged out', status: 'ok' });
  }
  if (p === '/api/auth/2fa-status') return json({ ...fx.twoFa, totpEnabled: !!me.totpEnabled });
  if (p === '/api/rbi/capabilities') return json(fx.rbiCapabilities);
  if (p === '/api/stats') return json(stats());

  // Resources
  if (p === '/api/resources' && method === 'GET') return ok({ items: visibleResources(me) });
  if (p === '/api/resources' && method === 'POST') {
    if (!body?.name || !body?.target || !body?.protocol) return text('Missing name, target, or protocol', 400);
    const r = { ...RESOURCE_DEFAULTS, port: 22, ...body, id: state.nextId.resource++, createdAt: iso(), updatedAt: iso() };
    r.hasCredentials = !!(body.sshPassword || body.httpPassword);
    SECRET_FIELDS.forEach((f) => delete r[f]);
    state.resources.push(r);
    pushAudit('resource.create', actor, { resourceId: r.id, name: r.name, target: r.target, protocol: r.protocol, port: r.port });
    save();
    return json(r);
  }
  if ((m = p.match(/^\/api\/resources\/(\d+)$/))) {
    const r = state.resources.find((x) => x.id === Number(m[1]));
    if (!r) return text('Resource not found', 404);
    if (method === 'PUT') {
      Object.assign(r, body, { id: r.id, updatedAt: iso() });
      if (body?.sshPassword || body?.httpPassword) r.hasCredentials = true;
      SECRET_FIELDS.forEach((f) => delete r[f]);
      pushAudit('resource.update', actor, { resourceId: r.id, name: r.name });
      save();
      return json(r);
    }
    if (method === 'DELETE') {
      state.resources = state.resources.filter((x) => x !== r);
      pushAudit('resource.delete', actor, { resourceId: r.id, name: r.name });
      save();
      return ok();
    }
    return json(r);
  }
  if ((m = p.match(/^\/api\/resources\/(\d+)\/credentials$/))) {
    const r = state.resources.find((x) => x.id === Number(m[1]));
    return json({ ...fx.resourceCredentials, resourceId: Number(m[1]), sshUsername: r?.sshUsername || '', hasCredentials: !!r?.hasCredentials });
  }
  if ((m = p.match(/^\/api\/resources\/(\d+)\/ephemeral-credentials$/))) {
    const r = state.resources.find((x) => x.id === Number(m[1]));
    const leaseId = state.nextId.lease++;
    pushAudit('credential.ephemeral.issue', actor, { leaseId, resourceId: Number(m[1]) });
    save();
    return json({ ...fx.lease, leaseId, resourceId: Number(m[1]), username: r?.sshUsername || '', expiresAt: new Date(Date.now() + 2 * MIN).toISOString().replace(/\.\d+Z$/, 'Z') });
  }
  // The vault hands the account's password to the bastion's terminal (never shown).
  if ((m = p.match(/^\/api\/ephemeral-credentials\/(\d+)\/consume$/))) {
    pushAudit('credential.ephemeral.consume', actor, { leaseId: Number(m[1]) });
    save();
    return replay('POST', url, (b) => ({ ...b, sshPassword: 'demo-vaulted-secret' }));
  }

  // Sessions
  if (p === '/api/sessions' && method === 'GET') {
    const list = [...state.sessions].reverse().filter((s) => me.role !== 'operator' || s.operator === me.username);
    return ok({ count: list.length, total: list.length, items: list });
  }
  if (p === '/api/sessions/risk-preview') {
    const r = state.resources.find((x) => x.id === Number(body?.resourceId));
    return r ? json(riskPreview(me, r, body)) : text('Resource not found', 404);
  }
  if (p === '/api/sessions' && method === 'POST') {
    const r = state.resources.find((x) => x.id === Number(body?.resourceId));
    if (!r) return text('Resource not found', 404);
    // Same checks, order and messages as the bastion (routes.cc, session open).
    const preview = riskPreview(me, r, body || {});
    if (preview.justificationRequired && !String(body?.justification || '').trim()) {
      return text('This resource requires an access justification before connect', 400);
    }
    if (preview.approvalRequired) {
      if (!body?.accessRequestId) return text('This resource requires dual approval: provide an approved accessRequestId', 400);
      const request = state.requests.find((x) => x.id === Number(body.accessRequestId));
      if (!request) return text('Access request not found', 404);
      if (request.status !== 'approved') return text('Access request is not approved', 403);
      if (request.requester !== actor || request.resourceId !== r.id) return text('Access request does not match requester/resource', 403);
    }
    if (preview.ticketRequired && !String(body?.ticketId || '').trim()) return text('This access path requires a ticketId under JIT policy', 400);
    if (preview.purposeRequired && !String(body?.purpose || '').trim()) return text('High-risk resources require a purpose (purpose-bound session)', 400);
    const strongEnough = preview.mfaRequirement === 'webauthn' ? me.webauthnEnabled : me.totpEnabled || me.webauthnEnabled;
    if (preview.mfaRequirement !== 'any' && !strongEnough) {
      pushAudit('policy.decision.deny', actor, { resourceId: r.id, reason: 'mfa_requirement_unmet', policyIds: preview.matchedPolicyIds });
      save();
      return text('Additional MFA posture is required for this access', 403);
    }
    const s = createSession(r, me, body || {});
    save();
    return json(s);
  }
  if ((m = p.match(/^\/api\/sessions\/(\d+)\/terminate$/))) {
    const s = state.sessions.find((x) => x.id === Number(m[1]));
    if (!s) return text('Session not found', 404);
    closeSession(s, actor);
    save();
    return json(s);
  }
  if ((m = p.match(/^\/api\/sessions\/(\d+)$/))) {
    const s = state.sessions.find((x) => x.id === Number(m[1]));
    return s ? json(s) : text('Session not found', 404);
  }
  // Session DNA and evidence packs, rebuilt from this tab's journal so the chain
  // the page re-verifies stays intact (times were moved, sessions may be new).
  if ((m = p.match(/^\/api\/sessions\/(\d+)\/dna$/))) {
    const id = Number(m[1]);
    return sessionDna(id).then((entries) => ok({ sessionId: id, verified: true, entries }));
  }
  if ((m = p.match(/^\/api\/evidence-packs\/sessions\/(\d+)$/))) return evidencePack(Number(m[1]));

  // Access requests (dual approval)
  if (p === '/api/access-requests' && method === 'GET') {
    const list = [...state.requests].reverse().filter((x) => me.role !== 'operator' || x.requester === me.username);
    return ok({ items: list });
  }
  if (p === '/api/access-requests' && method === 'POST') {
    const r = state.resources.find((x) => x.id === Number(body?.resourceId));
    if (!r) return text('Missing resourceId', 400);
    if (!String(body?.justification || '').trim()) return text('justification is required for access requests', 400);
    const request = {
      id: state.nextId.request++, resourceId: r.id, resourceName: r.name, requester: actor, requesterRole: me.role,
      justification: String(body.justification).trim(), ticketId: String(body.ticketId || ''), status: 'pending',
      createdAt: iso(), reviewedAt: '', reviewedBy: ''
    };
    state.requests.push(request);
    pushAudit('access_request.create', actor, { id: request.id, resourceId: r.id, status: 'pending' });
    save();
    return json(request);
  }
  if ((m = p.match(/^\/api\/access-requests\/(\d+)\/(approve|deny)$/))) {
    const request = state.requests.find((x) => x.id === Number(m[1]));
    if (!request) return text('Access request not found', 404);
    if (request.status !== 'pending') return text('Access request already decided', 409);
    request.status = m[2] === 'approve' ? 'approved' : 'denied';
    request.reviewedBy = actor;
    request.reviewedAt = iso();
    pushAudit(`access_request.${m[2]}`, actor, { id: request.id, resourceId: request.resourceId, requester: request.requester, signed: false });
    save();
    return json(request);
  }
  if (p === '/api/access-grants') return ok({ items: [...state.grants].reverse() });

  // Policies and profiles
  for (const [route, list, prefix] of [['access-policies', 'policies', 'access_policy'], ['access-profiles', 'profiles', 'access_profile']]) {
    if (p === `/api/${route}` && method === 'GET') return ok({ items: state[list] });
    if (p === `/api/${route}` && method === 'POST') {
      if (!String(body?.name || '').trim()) return text('Missing name', 400);
      const id = state.nextId[list === 'policies' ? 'policy' : 'profile']++;
      const item = { ...body, id, createdAt: iso(), updatedAt: iso() };
      state[list].push(item);
      pushAudit(`${prefix}.create`, actor, item);
      save();
      return json(item);
    }
    if ((m = p.match(new RegExp(`^/api/${route}/(\\d+)$`)))) {
      const item = state[list].find((x) => x.id === Number(m[1]));
      if (!item) return text('Not found', 404);
      if (method === 'PUT') {
        Object.assign(item, body, { id: item.id, updatedAt: iso() });
        pushAudit(`${prefix}.update`, actor, item);
        save();
        return json(item);
      }
      if (method === 'DELETE') {
        state[list] = state[list].filter((x) => x !== item);
        pushAudit(`${prefix}.delete`, actor, { id: item.id, name: item.name });
        save();
        return ok();
      }
      return json(item);
    }
  }

  // Recordings
  if (p === '/api/recordings') {
    const sessionId = Number(url.searchParams.get('sessionId')) || 0;
    return ok({ items: [...state.recordings].reverse().filter((r) => !sessionId || r.sessionId === sessionId) });
  }
  if ((m = p.match(/^\/api\/recordings\/(\d+)\/cast$/))) {
    const cast = state.casts[m[1]];
    if (!cast) return text('Recording not found', 404);
    const rec = state.recordings.find((r) => r.id === Number(m[1]));
    const session = state.sessions.find((s) => s.id === rec?.sessionId);
    const host = state.resources.find((r) => r.id === session?.resourceId)?.name;
    return text(host ? cast.replaceAll('@hote', '@' + host).replaceAll('Linux hote ', `Linux ${host} `) : cast, 200, 'application/x-asciicast');
  }

  // Users
  if (p === '/api/users' && method === 'GET') return ok({ items: state.users });
  if (p === '/api/users' && method === 'POST') {
    if (!body?.username) return text('Missing username', 400);
    if (state.users.some((u) => u.username === body.username)) return text('User already exists', 409);
    const u = { ...clone(fx.users[1]), id: state.nextId.user++, username: body.username, role: body.role || 'operator', totpEnabled: false, createdAt: iso(), updatedAt: iso() };
    state.users.push(u);
    pushAudit('user.create', actor, { userId: u.id, username: u.username, role: u.role });
    save();
    return json(u);
  }
  if ((m = p.match(/^\/api\/users\/(\d+)$/))) {
    const u = state.users.find((x) => x.id === Number(m[1]));
    if (!u) return text('User not found', 404);
    if (method === 'PUT') {
      if (body?.role) u.role = body.role;
      u.updatedAt = iso();
      pushAudit('user.update', actor, { userId: u.id, username: u.username, role: u.role });
      save();
      return json(u);
    }
    if (method === 'DELETE') {
      if (u.username === me.username) return text('Cannot delete yourself', 400);
      state.users = state.users.filter((x) => x !== u);
      pushAudit('user.delete', actor, { userId: u.id, username: u.username });
      save();
      return ok();
    }
    return json(u);
  }
  if ((m = p.match(/^\/api\/users\/(\d+)\/(resources|access-profiles)(?:\/(\d+))?$/))) {
    const userId = Number(m[1]);
    const store = m[2] === 'resources' ? state.userResources : state.userProfiles;
    const list = (store[userId] ||= []);
    const target = Number(m[3]);
    if (target && method === 'POST' && !list.includes(target)) list.push(target);
    if (target && method === 'DELETE') store[userId] = list.filter((id) => id !== target);
    if (target) save();
    return ok({ userId, [m[2] === 'resources' ? 'resourceIds' : 'profileIds']: store[userId] || [] });
  }

  // Audit
  if (p === '/api/audit') return json(auditPage(url.searchParams));
  if (p === '/api/audit/verify') return ok({ intact: true, keyed: false, lines: state.audit.length, legacyLines: 0, firstBrokenLine: 0 });

  // Security center: the recorded alerts, then nothing new.
  if (p === '/api/security/alerts') {
    const since = Number(url.searchParams.get('sinceId')) || 0;
    const recorded = RECORDED['GET /api/security/alerts?sinceId=0']?.body || { items: [], maxEventId: 0 };
    return ok({ ...recorded, items: since ? recorded.items.filter((a) => a.id > since) : recorded.items, sinceId: since });
  }

  // SSH command guard
  if (p === '/api/ssh-guard/rules' && method === 'GET') return json({ items: state.guardRules });
  if ((m = p.match(/^\/api\/ssh-guard\/rules\/([^/]+)$/))) {
    const name = decodeURIComponent(m[1]);
    const existing = state.guardRules.find((r) => r.name === name);
    if (method === 'PUT') {
      const rule = { name, command: '', enabled: true, builtin: false, ...existing, ...body, updatedAt: Math.floor(Date.now() / 1000) };
      state.guardRules = [...state.guardRules.filter((r) => r.name !== name), rule];
      pushAudit('ssh_guard.rule.configured', actor, { name });
      save();
      return json(rule);
    }
    if (method === 'DELETE') {
      state.guardRules = state.guardRules.filter((r) => r.name !== name || r.builtin);
      pushAudit('ssh_guard.rule.removed', actor, { name });
      save();
      return ok();
    }
  }

  // Vault rotation: the sweep's last results.
  if (p === '/api/vault/rotation' && method === 'GET') return json(state.rotation);
  if ((m = p.match(/^\/api\/vault\/rotation\/(\d+)\/rotate$/))) {
    const r = state.rotation.items.find((x) => x.resourceId === Number(m[1]));
    if (r) Object.assign(r, { lastStatus: 'ok', lastDetail: '', lastRotatedEpoch: Math.round(Date.now() / 1000), rotationCount: (r.rotationCount || 0) + 1 });
    pushAudit('vault.rotation.rotated', actor, { resourceId: Number(m[1]), status: 'ok' });
    save();
    return ok();
  }
  if ((m = p.match(/^\/api\/vault\/rotation\/(\d+)$/)) && method === 'PUT') {
    const resourceId = Number(m[1]);
    const resource = state.resources.find((x) => x.id === resourceId);
    let r = state.rotation.items.find((x) => x.resourceId === resourceId);
    if (!r) {
      r = { resourceId, resourceName: resource?.name || '', rotationCount: 0, lastStatus: '', lastDetail: '', lastRotatedEpoch: 0 };
      state.rotation.items.push(r);
    }
    Object.assign(r, { enabled: !!body?.enabled, intervalSeconds: Math.max(3600, Number(body?.intervalSeconds) || 604800) });
    state.rotation.total = state.rotation.items.length;
    pushAudit('vault.rotation.configured', actor, { resourceId, enabled: r.enabled, intervalSeconds: r.intervalSeconds });
    save();
    return ok();
  }

  // Kubernetes: no cluster behind the demo, so the pod list is a fixed one.
  if ((m = p.match(/^\/api\/k8s\/resources\/(\d+)\/pods$/))) {
    const pods = [
      ['portail-web-7c9f8d6b5-2xkqp', 'Running', ['nginx', 'app']],
      ['portail-web-7c9f8d6b5-9mzrt', 'Running', ['nginx', 'app']],
      ['portail-worker-5d8c7b9f4-lq6vh', 'Running', ['worker']],
      ['portail-migrate-29384-hx2kd', 'Succeeded', ['migrate']]
    ].map(([name, phase, containers]) => ({ name, phase, containers }));
    return ok({ namespace: 'portail', items: pods, total: pods.length });
  }

  // Settings (stored only in this tab)
  if (p === '/api/settings/integrations') return method === 'GET' ? json({ items: state.integrations }) : ok({ items: state.integrations });

  // Everything else: what the real bastion answered.
  const recorded = replay(method, url);
  if (recorded) return recorded;
  if (method === 'GET') return text('404 Not Found', 404);
  // Writes the tour never made (password, 2FA, branding…) are accepted and change nothing.
  return ok();
}

// ── Terminal hooks (shell.js) ────────────────────────────────────────────────
export function recordGuardBlock(sessionId, reason) {
  load();
  pushAudit('command_guard.block', 'system', { sessionId, reason });
  save();
}

// A terminal session typed in the demo becomes a recording, like on the bastion.
export function saveRecording(sessionId, cast, durationMs) {
  load();
  const id = state.nextId.recording++;
  state.recordings.push({ id, sessionId, kind: 'terminal', createdAt: iso(durationMs), closedAt: iso(), durationMs, fileSize: cast.length });
  state.casts[id] = cast;
  pushAudit('recording.watermark', 'system', { sessionId, recordingId: id, watermark: `wm-${id}-${durationMs}-${cast.length}` });
  save();
}

export function findSession(id) {
  load();
  const s = state.sessions.find((x) => x.id === Number(id));
  return s ? { session: s, resource: state.resources.find((r) => r.id === s.resourceId) } : null;
}

export function guardRules() {
  load();
  return state.guardRules.filter((r) => r.enabled);
}
