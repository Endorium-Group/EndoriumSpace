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
const realFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? String(input) : input.url, window.location.origin);
  if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) return realFetch(input, init);
  const method = String(init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
  let body = null;
  if (typeof init.body === 'string') {
    try { body = JSON.parse(init.body); } catch (_) { body = init.body; }
  }
  await new Promise((resolve) => setTimeout(resolve, 60 + Math.random() * 140));
  return handle(method, url, body);
};
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
