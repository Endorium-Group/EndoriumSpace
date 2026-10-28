// Toy remote shell behind the simulated SSH WebSocket. The bastion side is
// faithful (start/input/resize messages, "Command blocked by bastion guard"
// warning, audit event); the host side is a scripted Linux prompt.
import { findSession, guardRules, recordGuardBlock, saveRecording } from './api.js';
import { hostOutput } from './host.js';

const PREFIX = String.raw`(^|[;&|]\s*)(sudo\s+)?(?:[A-Za-z0-9_./-]*/)?`;
const BUILTIN = {
  wipe_root: new RegExp(PREFIX + String.raw`rm\s+-rf\s+/($|\s)`),
  fork_bomb: /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;?\s*:/,
  disk_format: new RegExp(PREFIX + String.raw`mkfs(\.[a-z0-9]+)?\b`),
  raw_disk_dd: new RegExp(PREFIX + String.raw`dd\s+if=.*\s+of=/dev/`),
  power_command: new RegExp(PREFIX + String.raw`(shutdown|poweroff|reboot)\b`)
};

function guardHit(line) {
  for (const rule of guardRules()) {
    if (rule.builtin && BUILTIN[rule.name]?.test(line)) return rule.name;
    if (!rule.builtin && rule.command) {
      try {
        if (new RegExp(rule.command).test(line)) return rule.name;
      } catch (_) {
        if (line.includes(rule.command)) return rule.name;
      }
    }
  }
  return '';
}

// Minimal WebSocket stand-in: the app only uses addEventListener, send, close,
// readyState and binaryType.
class FakeSocket extends EventTarget {
  constructor(url) {
    super();
    this.url = url;
    this.readyState = 0;
    this.binaryType = 'blob';
    setTimeout(() => {
      this.readyState = 1;
      this.emit('open');
    }, 120);
  }
  emit(type, data) {
    const event = type === 'message' ? new MessageEvent('message', { data }) : type === 'close' ? new CloseEvent('close', { code: data || 1000 }) : new Event(type);
    this.dispatchEvent(event);
    const handler = this['on' + type];
    if (typeof handler === 'function') handler.call(this, event);
  }
  sendJson(obj) {
    if (this.readyState === 1) this.emit('message', JSON.stringify(obj));
  }
  write(str) {
    if (this.readyState === 1) this.emit('message', new TextEncoder().encode(str).buffer);
  }
  close(code = 1000) {
    if (this.readyState >= 2) return;
    this.readyState = 3;
    clearInterval(this.timer);
    setTimeout(() => this.emit('close', code), 0);
  }
  send() {}
}

class SshSocket extends FakeSocket {
  // Everything shown and typed is kept as an asciinema v2 recording.
  write(str) {
    this.track('o', str);
    super.write(str);
  }
  track(kind, data) {
    if (!this.ctx || !data) return;
    this.events.push([(performance.now() - this.startedAt) / 1000, kind, data]);
  }
  close(code) {
    if (this.ctx && this.events.length && !this.saved) {
      this.saved = true;
      const header = { version: 2, width: this.ctx.cols, height: this.ctx.rows, timestamp: Math.floor(Date.now() / 1000), title: `Session #${this.ctx.sessionId} ${this.ctx.user}@${this.ctx.host}`, env: { TERM: 'xterm-256color', SHELL: '/bin/bash' }, meta: { sessionId: this.ctx.sessionId } };
      const cast = [JSON.stringify(header), ...this.events.map((e) => JSON.stringify([Number(e[0].toFixed(6)), e[1], e[2]]))].join('\n') + '\n';
      saveRecording(this.ctx.sessionId, cast, Math.round(performance.now() - this.startedAt));
    }
    super.close(code);
  }
  send(raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch (_) { return; }
    if (msg.type === 'start') return this.start(msg);
    if (msg.type === 'input' && this.ctx) {
      this.track('i', String(msg.data || ''));
      return this.input(String(msg.data || ''));
    }
  }
  start({ sessionId, cols, rows }) {
    const found = findSession(sessionId);
    if (!found || found.session.status !== 'active') {
      this.sendJson({ type: 'error', message: 'Session is not active' });
      return;
    }
    const { session, resource } = found;
    this.ctx = { sessionId: session.id, user: resource?.sshUsername || 'admin', host: resource?.name || session.target, line: '', cols: cols || 120, rows: rows || 32 };
    this.events = [];
    this.startedAt = performance.now();
    const last = new Date(Date.now() - 26 * 3600000).toUTCString().replace(' GMT', '');
    this.write(`Linux ${this.ctx.host} 6.12.48+deb13-amd64 x86_64\r\n\r\n` +
      `\x1b[2m(Hôte simulé — démo EndoriumFort. Tapez « help ».)\x1b[0m\r\n\r\n` +
      `Last login: ${last} from 10.8.0.2\r\n`);
    this.prompt();
  }
  prompt() {
    this.write(`\x1b[1;32m${this.ctx.user}@${this.ctx.host}\x1b[0m:\x1b[1;34m~\x1b[0m$ `);
  }
  input(data) {
    const ctx = this.ctx;
    // Whole pastes and snippets are judged as they arrive, like the bastion does.
    if (data.length > 1 && !data.startsWith('\x1b')) {
      const hit = guardHit(data.replace(/[\r\n]+$/, ''));
      if (hit) return this.block(hit);
    }
    for (let i = 0; i < data.length; i++) {
      const ch = data[i];
      if (ch === '\x1b') {
        // Arrow keys and other escape sequences: ignored (no history in the demo).
        while (i + 1 < data.length && !/[A-Za-z~]/.test(data[i + 1])) i++;
        i++;
        continue;
      }
      if (ch === '\r' || ch === '\n') {
        if (ch === '\n' && data[i - 1] === '\r') continue;
        const cmd = ctx.line.trim();
        const hit = cmd && guardHit(cmd);
        if (hit) {
          this.block(hit);
          continue;
        }
        ctx.line = '';
        this.write('\r\n');
        if (cmd === 'exit' || cmd === 'logout') {
          this.write('logout\r\n');
          this.sendJson({ type: 'status', message: 'SSH closed' });
          this.close(1000);
          return;
        }
        if (cmd === 'clear') {
          this.write('\x1b[H\x1b[2J');
        } else if (cmd) {
          const output = hostOutput(cmd, ctx);
          if (output) this.write(output + '\r\n');
        }
        this.prompt();
      } else if (ch === '\b' || ch === '\x7f') {
        if (ctx.line) {
          ctx.line = ctx.line.slice(0, -1);
          this.write('\b \b');
        }
      } else if (ch === '\x03') {
        ctx.line = '';
        this.write('^C\r\n');
        this.prompt();
      } else if (ch === '\x15') {
        this.write('\b \b'.repeat(ctx.line.length));
        ctx.line = '';
      } else if (ch === '\x0c') {
        this.write('\x1b[H\x1b[2J');
        this.prompt();
        this.write(ctx.line);
      } else if (ch >= ' ') {
        ctx.line += ch;
        this.write(ch);
      }
    }
  }
  block(reason) {
    recordGuardBlock(this.ctx.sessionId, reason);
    this.sendJson({ type: 'warning', message: 'Command blocked by bastion guard' });
    // The bastion clears the remote's line (^U) so the command never runs.
    this.write('\b \b'.repeat(this.ctx.line.length));
    this.ctx.line = '';
  }
}

class ShadowSocket extends FakeSocket {
  constructor(url) {
    super(url);
    const id = new URL(url).searchParams.get('sessionId');
    // Deferred, so the app's own open handler writes its header first.
    this.addEventListener('open', () => setTimeout(() => {
      const found = findSession(id);
      const host = found?.resource?.name || 'hôte';
      const user = found?.resource?.sshUsername || 'deploy';
      this.sendJson({ type: 'status', message: `Shadow connected to session #${id}` });
      const prompt = `\x1b[1;32m${user}@${host}\x1b[0m:\x1b[1;34m~\x1b[0m$ `;
      const script = ['uptime', 'systemctl status nginx', 'tail /var/log/syslog', 'df -h'];
      let step = 0;
      this.write(prompt);
      this.timer = setInterval(() => {
        const cmd = script[step++ % script.length];
        this.write(cmd + '\r\n' + hostOutput(cmd, { user, host }) + '\r\n' + prompt);
      }, 3500);
    }, 50));
  }
}

// kubectl exec into a pod of the (simulated) cluster: same shell, pod as host.
class K8sSocket extends SshSocket {
  start({ sessionId, pod, container, cols, rows }) {
    const found = findSession(sessionId);
    if (!found || found.session.status !== 'active') {
      this.sendJson({ type: 'error', message: 'Session is not active' });
      return;
    }
    this.ctx = { sessionId: found.session.id, user: 'root', host: pod || 'pod', line: '', cols: cols || 120, rows: rows || 32 };
    this.events = [];
    this.startedAt = performance.now();
    this.write(`\x1b[2m(Conteneur simulé ${container || ''} — démo EndoriumFort. Tapez « help ».)\x1b[0m\r\n`);
    this.prompt();
  }
}

// Graphical protocols (isolated browser, VNC, RDP) need a real bastion.
const UNSIMULATED = { rbi: "l'isolation de navigation (RBI)", vnc: 'le bureau à distance VNC', rdp: 'le bureau à distance RDP' };
class UnsimulatedSocket extends FakeSocket {
  constructor(url, kind) {
    super(url);
    this.addEventListener('open', () => {
      this.sendJson({ type: 'error', message: `Démo : ${UNSIMULATED[kind] || 'cette connexion'} nécessite un vrai bastion — cette fonction n'est pas simulée.` });
    });
  }
}

export function installWebSocket() {
  const RealWebSocket = window.WebSocket;
  function DemoWebSocket(url, protocols) {
    const path = new URL(url, window.location.href).pathname;
    if (path === '/api/ws/ssh') return new SshSocket(url);
    if (path === '/api/ws/shadow') return new ShadowSocket(url);
    if (path === '/api/ws/k8s') return new K8sSocket(url);
    if (path.startsWith('/api/ws/')) return new UnsimulatedSocket(url, path.slice('/api/ws/'.length));
    return new RealWebSocket(url, protocols);
  }
  Object.assign(DemoWebSocket, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });
  window.WebSocket = DemoWebSocket;
}
