// Native jump host desktop (EndoriumFort #86) in the demo. On the bastion, a
// jump host is a disposable desktop around a server-side Chromium whose
// traffic is confined to an allowlist; here the same WebSocket protocol is
// answered in the browser, and the "intranet" behind it is drawn on a canvas.
// Faithful on the bastion side: messages (location, blocked, tabs, files,
// drive-*, clipboard), the allowlist rules (home page always allowed, ports
// 80/443 by default) and the journal events (rbi.open, jumphost.navigate,
// jumphost.blocked, jumphost.file, rbi.clipboard).
import { findSession, handle, recordAudit, currentUsername } from './api.js';

const DAY = 24 * 3600 * 1000;
const isoAt = (t) => new Date(t).toISOString().replace(/\.\d+Z$/, 'Z');
export const JUMPHOST_NAME = 'bureau-rebond';

// ── Seed: the jump host resource ─────────────────────────────────────────────
export function seedJumphost(s) {
  const base = s.resources.find((r) => r.protocol === 'https') || s.resources[0];
  const id = s.resources.reduce((m, r) => Math.max(m, r.id), 0) + 1;
  const now = Date.now();
  s.resources.push({
    ...base,
    id,
    name: JUMPHOST_NAME,
    protocol: 'jumphost',
    target: 'https://intranet.cabinet.local/',
    port: 443,
    description: 'Machine de rebond : bureau jetable, navigateur limité aux sites autorisés',
    tagsCsv: 'zone:administration',
    jumphostAllowlist: 'wiki.cabinet.local\nsupervision.cabinet.local:3000',
    requireAccessJustification: false,
    requireDualApproval: false,
    riskLevel: 'medium',
    workspacePublished: false,
    createdAt: isoAt(now - 6 * DAY),
    updatedAt: isoAt(now - DAY)
  });
  // The operator of the demo has it.
  for (const [uid, list] of Object.entries(s.userResources)) {
    const user = s.users.find((u) => u.id === Number(uid));
    if (user && user.username === 'c.moreau' && !list.includes(id)) list.push(id);
  }
}

// ── Allowlist (jumphost.cc, JumphostAllowlist) ───────────────────────────────
function parseAllowlist(text) {
  const rules = [];
  for (const raw of String(text || '').split('\n').map((l) => l.replace(/#.*/, '')).join(',').split(/[,\s]+/)) {
    let entry = raw.trim().toLowerCase();
    if (!entry) continue;
    entry = entry.replace(/^[a-z]+:\/\//, '').replace(/[/?#].*$/, '');
    let host = entry;
    let port = 0;
    const m = entry.match(/^(.*):(\d+|\*)$/);
    if (m) { host = m[1]; port = m[2] === '*' ? -1 : Number(m[2]); }
    rules.push({ wildcard: host.startsWith('*.'), host: host.replace(/^\*\./, ''), port });
  }
  return rules;
}
function allowed(rules, host, port) {
  return rules.some((r) => {
    const portOk = r.port === -1 || (r.port === 0 ? port === 80 || port === 443 : r.port === port);
    if (!portOk) return false;
    return r.wildcard ? host.endsWith('.' + r.host) : host === r.host;
  });
}
function parseUrl(raw) {
  try {
    const u = new URL(String(raw || '').trim());
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (u.username || u.password) return null;
    const port = u.port ? Number(u.port) : u.protocol === 'https:' ? 443 : 80;
    return { url: u.href, host: u.hostname.toLowerCase(), port, key: `${u.hostname.toLowerCase()}:${port}` };
  } catch (_) {
    return null;
  }
}

// ── The intranet behind the jump host, drawn ─────────────────────────────────
const C = { bg: '#f4f6fb', ink: '#1b2430', muted: '#5b6573', line: '#dfe4ec', accent: '#2b59d8', head: '#1f3a8a' };
const SITES = {
  'intranet.cabinet.local:443': { title: 'Portail intranet', draw: drawPortal },
  'wiki.cabinet.local:443': { title: 'Wiki interne', draw: drawWiki },
  'supervision.cabinet.local:3000': { title: 'Supervision', draw: drawSupervision }
};
const REPORT = 'compte;libellé;montant\n411000;Dupont SA;1 200,00\n411002;Martin & fils;3 480,50\n411007;Garage Leroy;640,00\n';

function header(g, w, title, subtitle) {
  g.fillStyle = C.head;
  g.fillRect(0, 0, w, 64);
  g.fillStyle = '#fff';
  g.font = '600 21px system-ui, sans-serif';
  g.fillText(title, 28, 40);
  g.font = '13px system-ui, sans-serif';
  g.fillStyle = 'rgba(255,255,255,.75)';
  g.fillText(subtitle, Math.max(300, w - 330), 39);
}
function link(g, regions, x, y, label, action) {
  g.font = '16px system-ui, sans-serif';
  g.fillStyle = C.accent;
  g.fillText(label, x, y);
  const width = g.measureText(label).width;
  g.fillRect(x, y + 3, width, 1);
  regions.push({ x: x - 4, y: y - 18, w: width + 8, h: 26, action });
}
function card(g, x, y, w, h) {
  g.fillStyle = '#fff';
  g.strokeStyle = C.line;
  g.lineWidth = 1;
  g.fillRect(x, y, w, h);
  g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function drawPortal(g, w, h, view) {
  const regions = [];
  header(g, w, 'Cabinet — Portail intranet', 'Réseau interne · accès par le bastion');
  const col = Math.min(560, w - 56);
  card(g, 28, 88, col, 230);
  g.fillStyle = C.ink;
  g.font = '600 17px system-ui, sans-serif';
  g.fillText('Applications internes', 48, 120);
  link(g, regions, 48, 158, 'Wiki interne — procédures', { go: 'https://wiki.cabinet.local/' });
  link(g, regions, 48, 194, 'Supervision des serveurs', { go: 'http://supervision.cabinet.local:3000/' });
  link(g, regions, 48, 230, 'Site de l’éditeur du logiciel (Internet)', { go: 'https://www.editeur-logiciel.example/' });
  g.fillStyle = C.muted;
  g.font = '13px system-ui, sans-serif';
  g.fillText('Seuls les sites de la liste blanche s’ouvrent : le dernier lien est refusé par le bastion.', 48, 270);
  g.fillText('Essayez aussi une adresse dans la barre du navigateur.', 48, 292);

  card(g, 28, 338, col, 160);
  g.fillStyle = C.ink;
  g.font = '600 17px system-ui, sans-serif';
  g.fillText('Documents', 48, 370);
  link(g, regions, 48, 406, 'Télécharger le rapport mensuel (CSV)', { download: { name: 'rapport-mensuel-novembre.csv', content: REPORT } });
  g.fillStyle = C.muted;
  g.font = '13px system-ui, sans-serif';
  g.fillText('Le fichier arrive dans le dossier de session (fenêtre Fichiers), pas sur votre poste.', 48, 440);
  g.fillText('De là : l’enregistrer sur ce poste, ou le copier dans un drive de partage.', 48, 462);

  card(g, 28, 518, col, 120);
  g.fillStyle = C.ink;
  g.font = '600 17px system-ui, sans-serif';
  g.fillText('Recherche dans l’annuaire', 48, 550);
  const box = { x: 48, y: 566, w: col - 40, h: 36 };
  g.fillStyle = view.focus ? '#fff' : '#fbfcfe';
  g.strokeStyle = view.focus ? C.accent : '#b9c2cf';
  g.lineWidth = view.focus ? 2 : 1;
  g.fillRect(box.x, box.y, box.w, box.h);
  g.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);
  g.font = '16px system-ui, sans-serif';
  const shown = view.input || (view.focus ? '' : 'Tapez un nom, puis Ctrl+A, Ctrl+C pour le copier sur votre poste');
  if (view.selected && view.input) {
    g.fillStyle = 'rgba(43,89,216,.25)';
    g.fillRect(box.x + 10, box.y + 8, g.measureText(view.input).width, 21);
  }
  g.fillStyle = view.input ? C.ink : C.muted;
  g.fillText(shown, box.x + 10, box.y + 24);
  if (view.focus) {
    const cx = box.x + 11 + g.measureText(view.input).width;
    g.fillStyle = C.ink;
    g.fillRect(cx, box.y + 8, 1.5, 21);
  }
  regions.push({ ...box, action: { input: true } });

  if (w > col + 120) {
    const x = col + 56;
    const cw = Math.min(360, w - x - 28);
    card(g, x, 88, cw, 230);
    g.fillStyle = C.ink;
    g.font = '600 17px system-ui, sans-serif';
    g.fillText('Annonces', x + 20, 120);
    g.font = '14px system-ui, sans-serif';
    g.fillStyle = C.muted;
    ['Maintenance du serveur de fichiers', 'samedi 8 h – 10 h.', '', 'Clôture mensuelle : rapports', 'disponibles dans « Documents ».'].forEach((l, i) => g.fillText(l, x + 20, 152 + i * 22));
  }
  return regions;
}

function drawWiki(g, w) {
  const regions = [];
  header(g, w, 'Wiki interne', 'wiki.cabinet.local');
  const col = Math.min(820, w - 56);
  card(g, 28, 88, col, 420);
  g.fillStyle = C.ink;
  g.font = '600 22px system-ui, sans-serif';
  g.fillText('Procédure de sauvegarde mensuelle', 52, 130);
  g.font = '15px system-ui, sans-serif';
  [
    '1. Vérifier dans la supervision que les sauvegardes de la nuit sont vertes.',
    '2. Contrôler l’espace disque du serveur de fichiers (alerte au-delà de 85 %).',
    '3. Lancer la copie hors site depuis la console de sauvegarde.',
    '4. Noter le numéro de rapport dans le ticket mensuel.',
    '',
    'Les accès d’administration passent par le bastion : aucune connexion directe.'
  ].forEach((l, i) => g.fillText(l, 52, 172 + i * 28));
  link(g, regions, 52, 370, 'Télécharger la procédure (texte)', { download: { name: 'procedure-sauvegarde.txt', content: 'Procédure de sauvegarde mensuelle — document de démonstration.\n' } });
  link(g, regions, 52, 410, '← Retour au portail', { go: 'https://intranet.cabinet.local/' });
  return regions;
}

function drawSupervision(g, w) {
  const regions = [];
  header(g, w, 'Supervision', 'supervision.cabinet.local:3000');
  const hosts = [['srv-fichiers', 82, 'ok'], ['srv-compta', 41, 'ok'], ['srv-sauvegarde', 93, 'alerte'], ['srv-messagerie', 57, 'ok']];
  const col = Math.min(720, w - 56);
  card(g, 28, 88, col, 70 + hosts.length * 56);
  g.fillStyle = C.ink;
  g.font = '600 17px system-ui, sans-serif';
  g.fillText('Espace disque', 48, 120);
  hosts.forEach(([name, pct, state], i) => {
    const y = 150 + i * 56;
    g.fillStyle = C.ink;
    g.font = '15px system-ui, sans-serif';
    g.fillText(name, 48, y + 18);
    const bx = 220;
    const bw = col - 300;
    g.fillStyle = '#e8ecf3';
    g.fillRect(bx, y + 4, bw, 18);
    g.fillStyle = state === 'ok' ? '#1a7f37' : '#cf222e';
    g.fillRect(bx, y + 4, (bw * pct) / 100, 18);
    g.fillStyle = C.muted;
    g.fillText(`${pct} %`, bx + bw + 12, y + 18);
  });
  link(g, regions, 48, 150 + hosts.length * 56 + 30, '← Retour au portail', { go: 'https://intranet.cabinet.local/' });
  return regions;
}

function drawUnreachable(g, w, h, url) {
  g.fillStyle = '#fff';
  g.fillRect(0, 0, w, h);
  g.fillStyle = C.ink;
  g.font = '600 22px system-ui, sans-serif';
  g.fillText('Ce site est inaccessible', 48, 120);
  g.font = '15px system-ui, sans-serif';
  g.fillStyle = C.muted;
  g.fillText(url, 48, 156);
  return [];
}

async function frame(view, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext('2d');
  g.fillStyle = C.bg;
  g.fillRect(0, 0, width, height);
  const page = parseUrl(view.url);
  const site = page && SITES[page.key];
  view.regions = site ? site.draw(g, width, height, view) : drawUnreachable(g, width, height, view.url);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86));
  return blob.arrayBuffer();
}

// ── Binary frames (rbi_engine.cc send_file: 5 begin, 6 chunk, 7 end) ────────
function u32(v) { return [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255]; }
function fileFrames(id, name, bytes) {
  const nameBytes = new TextEncoder().encode(name);
  const size = bytes.length;
  const begin = new Uint8Array([5, ...u32(id), 0, 0, 0, 0, ...u32(size), (nameBytes.length >> 8) & 255, nameBytes.length & 255, ...nameBytes]);
  const chunk = new Uint8Array(5 + size);
  chunk.set([6, ...u32(id)]);
  chunk.set(bytes, 5);
  return [begin.buffer, chunk.buffer, new Uint8Array([7, ...u32(id)]).buffer];
}
const enc = (s) => new TextEncoder().encode(s);

// ── The session ──────────────────────────────────────────────────────────────
// Installs the jump host behaviour on a demo socket (shell.js) whose start
// message named a jumphost session.
export function startJumphost(socket, msg, found) {
  const { session, resource } = found;
  const actor = currentUsername();
  const home = parseUrl(resource.target);
  const rules = parseAllowlist(resource.jumphostAllowlist);
  if (home) rules.push({ wildcard: false, host: home.host, port: home.port });
  const audit = (type, payload) => recordAudit(type, actor, { sessionId: session.id, resourceId: resource.id, ...payload });
  const blockedSeen = new Set();

  let width = msg.width || 1280;
  let height = msg.height || 800;
  // A page: url, history, and the search field's state. Pages the operator
  // opens with "New page" stack over the shown one (the RBI page stack).
  const newPage = (url) => ({ url, back: [], forward: [], input: '', focus: false, selected: false, regions: [] });
  const stack = [newPage(home.url)];
  const page = () => stack[stack.length - 1];
  const folder = new Map(); // session folder: name -> { bytes, mtime }
  let downloadId = 1;
  let upload = null;
  let drive = null; // { rid, name }
  let lastAudited = '';

  const render = () => frame(page(), width, height).then((buf) => {
    if (socket.readyState === 1) socket.emit('message', buf);
  });
  const location = () => socket.sendJson({ type: 'location', url: page().url });
  const tabs = () => socket.sendJson({ type: 'tabs', stacked: stack.length - 1 });
  const visit = (url, { push = true } = {}) => {
    const p = page();
    if (push && p.url !== url) {
      p.back.push(p.url);
      p.forward = [];
    }
    Object.assign(p, { url, input: '', focus: false, selected: false });
    if (url !== lastAudited) {
      lastAudited = url;
      audit('jumphost.navigate', { url });
    }
    location();
    render();
  };
  const block = (target, reason) => {
    if (!blockedSeen.has(target.key)) {
      blockedSeen.add(target.key);
      audit('jumphost.blocked', { host: target.host, port: target.port, reason });
    }
    socket.sendJson({ type: 'blocked', host: target.host, port: target.port, reason: 'not-allowlisted' });
  };
  const tryGo = (raw, reason = 'not-allowlisted') => {
    const target = parseUrl(raw);
    if (!target) {
      socket.sendJson({ type: 'notice', message: 'Only http and https addresses are allowed' });
      return;
    }
    if (!allowed(rules, target.host, target.port)) return block(target, reason);
    visit(target.url);
  };

  const filesList = () => socket.sendJson({
    type: 'files',
    items: [...folder.entries()].sort((a, b) => b[1].mtime - a[1].mtime)
      .map(([name, f]) => ({ name, size: f.bytes.length, mtime: Math.floor(f.mtime / 1000) }))
  });
  const freeName = (name) => {
    if (!folder.has(name)) return name;
    const dot = name.lastIndexOf('.');
    const stem = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : '';
    for (let i = 2; ; i += 1) if (!folder.has(`${stem} (${i})${ext}`)) return `${stem} (${i})${ext}`;
  };
  const store = (name, bytes, action, extra = {}) => {
    const stored = freeName(name);
    folder.set(stored, { bytes, mtime: Date.now() });
    audit('jumphost.file', { action, name: stored, size: bytes.length, ...extra });
    filesList();
    return stored;
  };

  const driveError = (message) => socket.sendJson({ type: 'drive-error', message });
  const driveList = async (path) => {
    const res = await handle('GET', new URL(`/files/api/r/${drive.rid}/list?path=${encodeURIComponent(path)}`, window.location.origin), null, null);
    if (!res.ok) return driveError((await res.json().catch(() => ({}))).error || 'File share service error (' + res.status + ')');
    socket.sendJson({ type: 'drive-list', listing: await res.json() });
  };

  const onMessage = async (raw) => {
    // Upload chunks (client → session folder): [0x10][u32 id][bytes].
    if (typeof raw !== 'string') {
      const bytes = raw instanceof ArrayBuffer ? new Uint8Array(raw) : new Uint8Array(raw.buffer || raw);
      if (upload && bytes[0] === 0x10) upload.parts.push(bytes.slice(5));
      return;
    }
    let m;
    try { m = JSON.parse(raw); } catch (_) { return; }
    const p = page();
    switch (m.type) {
      case 'resize':
        width = m.width || width;
        height = m.height || height;
        return render();
      case 'navigate': return tryGo(m.url, 'address-bar');
      case 'home': return visit(home.url);
      case 'reload': return render();
      case 'back':
        if (p.back.length) { p.forward.push(p.url); visit(p.back.pop(), { push: false }); }
        return undefined;
      case 'forward':
        if (p.forward.length) { p.back.push(p.url); visit(p.forward.pop(), { push: false }); }
        return undefined;
      case 'tab-new':
        if (stack.length >= 8) return socket.sendJson({ type: 'notice', message: 'Tab limit reached' });
        stack.push(newPage(home.url));
        tabs();
        location();
        return render();
      case 'close-tab':
        if (stack.length > 1) stack.pop();
        tabs();
        location();
        return render();
      case 'mouse': {
        if (m.event !== 'down') return undefined;
        const x = m.x * width;
        const y = m.y * height;
        const hit = (p.regions || []).find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
        p.focus = !!hit?.action?.input;
        p.selected = false;
        if (hit?.action?.go) return tryGo(hit.action.go);
        if (hit?.action?.download) {
          const d = hit.action.download;
          const stored = store(d.name, enc(d.content), 'browser-download');
          socket.sendJson({ type: 'file-stored', name: stored });
        }
        return render();
      }
      case 'text':
        if (!p.focus) return undefined;
        p.input = (p.selected ? '' : p.input) + String(m.text || '');
        p.selected = false;
        return render();
      case 'paste':
        if (!p.focus) return undefined;
        recordAudit('rbi.clipboard', actor, { sessionId: session.id, resourceId: resource.id, direction: 'paste', length: String(m.text || '').length, allowed: true });
        p.input = (p.selected ? '' : p.input) + String(m.text || '');
        p.selected = false;
        return render();
      case 'key': {
        if (m.event !== 'down' || !p.focus) return undefined;
        const ctrl = (m.modifiers & 2) || (m.modifiers & 4);
        const key = String(m.key || '').toLowerCase();
        if (ctrl && key === 'a') { p.selected = !!p.input; return render(); }
        if (ctrl && (key === 'c' || key === 'x') && p.input) {
          recordAudit('rbi.clipboard', actor, { sessionId: session.id, resourceId: resource.id, direction: 'copy', length: p.input.length, allowed: true });
          socket.sendJson({ type: 'clipboard', text: p.input });
          if (key === 'x') { p.input = ''; p.selected = false; render(); }
          return undefined;
        }
        if (key === 'backspace') {
          p.input = p.selected ? '' : p.input.slice(0, -1);
          p.selected = false;
          return render();
        }
        return undefined;
      }
      // ── Files window: the session folder ──
      case 'files-list': return filesList();
      case 'files-get': {
        const f = folder.get(m.name);
        if (!f) return undefined;
        audit('jumphost.file', { action: 'to-operator', name: m.name, size: f.bytes.length, allowed: true });
        for (const buf of fileFrames(downloadId++, m.name, f.bytes)) socket.emit('message', buf);
        return undefined;
      }
      case 'files-delete':
        if (folder.delete(m.name)) audit('jumphost.file', { action: 'delete', name: m.name, size: 0 });
        return filesList();
      case 'files-rename': {
        const f = folder.get(m.name);
        const to = String(m.to || '').replace(/[/\\]/g, '').trim();
        if (!f || !to) return undefined;
        if (folder.has(to)) return socket.sendJson({ type: 'notice', message: 'A file with this name already exists' });
        folder.delete(m.name);
        folder.set(to, f);
        audit('jumphost.file', { action: 'rename', name: m.name, size: 0, to });
        return filesList();
      }
      case 'upload-begin':
        upload = { id: m.id, name: String(m.name || 'fichier').replace(/[/\\]/g, ''), toFolder: !!m.toFolder, parts: [] };
        return undefined;
      case 'upload-end': {
        if (!upload || upload.id !== m.id) return undefined;
        const size = upload.parts.reduce((n, part) => n + part.length, 0);
        const bytes = new Uint8Array(size);
        let off = 0;
        for (const part of upload.parts) { bytes.set(part, off); off += part.length; }
        if (upload.toFolder) store(upload.name, bytes, 'from-operator');
        upload = null;
        return socket.sendJson({ type: 'status', message: 'upload complete' });
      }
      case 'upload-cancel':
        upload = null;
        return undefined;
      // ── Files window: the user's file share drive ──
      case 'drive-open': {
        const fs = findSession(m.sessionId);
        if (!fs || fs.session.status !== 'active' || fs.resource?.protocol !== 'fileshare') return driveError('Session not found');
        drive = { rid: fs.resource.id, name: fs.resource.name };
        audit('jumphost.file', { action: 'drive-open', name: drive.name, size: 0, driveSessionId: fs.session.id, driveResourceId: drive.rid });
        socket.sendJson({ type: 'drive-open', name: drive.name, sessionId: fs.session.id });
        return driveList('/');
      }
      case 'drive-list': return drive ? driveList(m.path || '/') : driveError('No drive is open');
      case 'drive-put': {
        if (!drive) return driveError('No drive is open');
        const f = folder.get(m.name);
        if (!f) return driveError('This file is no longer in the session folder');
        const path = m.path || '/';
        const res = await handle('PUT', new URL(`/files/api/r/${drive.rid}/upload?path=${encodeURIComponent(path)}&name=${encodeURIComponent(m.name)}`, window.location.origin), null, new Blob([f.bytes]));
        const okPut = res.ok;
        audit('jumphost.file', { action: 'to-drive', name: m.name, size: f.bytes.length, drivePath: path, driveResourceId: drive.rid, allowed: okPut });
        if (!okPut) return driveError((await res.json().catch(() => ({}))).error || 'File share service error (' + res.status + ')');
        socket.sendJson({ type: 'drive-done', action: 'put', name: m.name });
        return driveList(path);
      }
      case 'drive-get': {
        if (!drive) return driveError('No drive is open');
        const res = await handle('GET', new URL(`/files/api/r/${drive.rid}/download?path=${encodeURIComponent(m.path)}`, window.location.origin), null, null);
        if (!res.ok) return driveError((await res.json().catch(() => ({}))).error || 'File share service error (' + res.status + ')');
        const bytes = new Uint8Array(await res.arrayBuffer());
        const stored = store(String(m.path).split('/').pop(), bytes, 'from-drive', { drivePath: m.path, driveResourceId: drive.rid, allowed: true });
        socket.sendJson({ type: 'drive-done', action: 'get', name: stored });
        return undefined;
      }
      case 'drive-close':
        drive = null;
        return socket.sendJson({ type: 'drive-closed' });
      default:
        return undefined;
    }
  };

  socket.send = (raw) => { onMessage(raw); };
  audit('rbi.open', { url: home.url, engine: 'cdp', kind: 'jumphost', recording: false });
  socket.sendJson({ type: 'status', message: 'connected' });
  tabs();
  visit(home.url, { push: false });
}
