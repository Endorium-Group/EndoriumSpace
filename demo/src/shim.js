// Demo entry, imported before the EndoriumFort app: answers /api/* in the
// browser, serves the app under a sub-path, and shows the demo banner.
import { handle } from './api.js';
import { installWebSocket } from './shell.js';
import './banner.css';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

// ── Sub-path routing ─────────────────────────────────────────────────────────
// The app routes on location.pathname from "/"; the build rewrites its reads to
// __efDemoPath(), and history writes get the base prefixed here.
window.__efDemoPath = () => {
  const path = window.location.pathname;
  return (path.startsWith(BASE) ? path.slice(BASE.length) : path) || '/';
};
for (const method of ['pushState', 'replaceState']) {
  const original = window.history[method].bind(window.history);
  window.history[method] = (data, title, url) => {
    if (typeof url === 'string' && url.startsWith('/') && url !== BASE && !url.startsWith(BASE + '/')) url = BASE + url;
    return original(data, title, url);
  };
}
// 404.html sends deep links back here as ?p=/route.
const deepLink = new URLSearchParams(window.location.search).get('p');
if (deepLink && deepLink.startsWith('/')) window.history.replaceState(null, '', deepLink);

// ── API ──────────────────────────────────────────────────────────────────────
// /api/* is the bastion; /files/api/* the file share service next to it.
const simulated = (url) => url.origin === window.location.origin && (url.pathname.startsWith('/api/') || url.pathname.startsWith('/files/api/'));
const realFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? String(input) : input.url, window.location.origin);
  if (!simulated(url)) return realFetch(input, init);
  const method = String(init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
  let body = null;
  if (typeof init.body === 'string') {
    try { body = JSON.parse(init.body); } catch (_) { body = init.body; }
  }
  await new Promise((resolve) => setTimeout(resolve, 60 + Math.random() * 140));
  return handle(method, url, body, init.body);
};

// The drive uploads with XMLHttpRequest (for its progress bar).
const RealXHR = window.XMLHttpRequest;
class DemoXHR extends RealXHR {
  open(method, href, ...rest) {
    const url = new URL(href, window.location.origin);
    this.demo = simulated(url) ? { method: String(method).toUpperCase(), url, status: 0, text: '' } : null;
    if (!this.demo) super.open(method, href, ...rest);
  }
  setRequestHeader(name, value) {
    if (!this.demo) super.setRequestHeader(name, value);
  }
  get status() { return this.demo ? this.demo.status : super.status; }
  get responseText() { return this.demo ? this.demo.text : super.responseText; }
  get readyState() { return this.demo ? (this.demo.status ? 4 : 1) : super.readyState; }
  abort() {
    if (!this.demo) return super.abort();
    this.demo.aborted = true;
    this.onabort?.();
  }
  async send(data) {
    if (!this.demo) return super.send(data);
    const total = data?.size || 1;
    for (const step of [0.35, 0.7, 1]) {
      await new Promise((r) => setTimeout(r, 150));
      if (this.demo.aborted) return;
      this.upload.onprogress?.({ lengthComputable: true, loaded: total * step, total });
    }
    const response = await handle(this.demo.method, this.demo.url, null, data);
    this.demo.text = await response.text();
    this.demo.status = response.status;
    this.onload?.();
  }
}
window.XMLHttpRequest = DemoXHR;

// Download links (drive files, SSH transfer) point at simulated routes: fetch
// them here and hand the browser the file.
const isDownload = (href) => {
  try {
    const url = new URL(href, window.location.origin);
    return simulated(url) && /\/download$/.test(url.pathname) ? url : null;
  } catch (_) { return null; }
};
async function saveDownload(url) {
  const response = await handle('GET', url, null, null);
  if (!response.ok) return;
  const name = (response.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/)?.[1] || 'fichier';
  const link = document.createElement('a');
  link.href = URL.createObjectURL(await response.blob());
  link.download = name;
  realClick.call(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
}
const realClick = HTMLAnchorElement.prototype.click;
HTMLAnchorElement.prototype.click = function click() {
  const url = isDownload(this.href);
  if (url) return void saveDownload(url);
  return realClick.call(this);
};
document.addEventListener('click', (event) => {
  const link = event.target?.closest?.('a[href]');
  const url = link && isDownload(link.href);
  if (!url) return;
  event.preventDefault();
  saveDownload(url);
}, true);
installWebSocket();

// ── Banner ───────────────────────────────────────────────────────────────────
function mountBanner() {
  const bar = document.createElement('aside');
  bar.className = 'efdemo';
  bar.setAttribute('aria-label', 'Démo');
  bar.innerHTML = `
    <button type="button" class="efdemo__tag" aria-expanded="true">Démo</button>
    <div class="efdemo__body">
      <p>Édition Enterprise, données fictives : rien ne quitte votre navigateur.</p>
      <p>Connexion avec n'importe quel mot de passe : <code>admin</code>, <code>c.moreau</code> (opérateur) ou <code>s.lefevre</code> (auditeur).</p>
      <p><button type="button" class="efdemo__reset">Réinitialiser</button> · <a href="${BASE.replace(/\/demo$/, '')}/">← Retour au site</a></p>
    </div>`;
  bar.querySelector('.efdemo__reset').addEventListener('click', () => {
    try {
      sessionStorage.clear();
      localStorage.removeItem('endoriumfort_auth');
    } catch (_) {}
    window.location.href = BASE + '/';
  });
  const tag = bar.querySelector('.efdemo__tag');
  const setOpen = (open) => {
    bar.classList.toggle('efdemo--closed', !open);
    tag.setAttribute('aria-expanded', String(open));
  };
  const remember = (open) => {
    try { sessionStorage.setItem('ef_demo_banner', open ? '1' : '0'); } catch (_) {}
  };
  tag.addEventListener('click', () => {
    const open = bar.classList.contains('efdemo--closed');
    setOpen(open);
    remember(open);
  });
  // Open on the sign-in page (it carries the demo accounts), folded once signed in.
  let open = true;
  try {
    const saved = sessionStorage.getItem('ef_demo_banner');
    open = saved ? saved === '1' : !localStorage.getItem('endoriumfort_auth');
  } catch (_) {}
  setOpen(open);
  // Signing in happens in this tab (no storage event): fold when the token appears.
  const watch = setInterval(() => {
    let signedIn = false;
    let saved = null;
    try {
      signedIn = !!localStorage.getItem('endoriumfort_auth');
      saved = sessionStorage.getItem('ef_demo_banner');
    } catch (_) {}
    if (!signedIn) return;
    clearInterval(watch);
    if (!saved) setOpen(false);
  }, 1000);
  document.body.appendChild(bar);
}
if (document.body) mountBanner();
else document.addEventListener('DOMContentLoaded', mountBanner);
