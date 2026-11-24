#!/usr/bin/env node
// EndoriumSpace — génère les pages statiques indexables, sans dépendance.
//
//   node scripts/build.mjs           écrit les pages
//   node scripts/build.mjs --check   échoue si une page générée n'est pas à jour (CI)
//
// Sources : docs/nav.js + docs/content/*.md, community/data/questions.js.
// Sorties (versionnées, le site reste servi tel quel) :
//   docs/index.html, docs/<slug>/index.html, community/<slug>/index.html,
//   la liste des questions dans community/index.html, sitemap.xml.
// Le Markdown est rendu par assets/md.js, le même moteur que dans le navigateur.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://endorium.space";
const MARK = "<!-- Généré par scripts/build.mjs : ne pas modifier à la main. -->";
const CHECK = process.argv.includes("--check");

// --- Chargement des sources (scripts navigateur exécutés dans un bac à sable) ---
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const f of ["assets/md.js", "docs/nav.js", "community/data/questions.js"]) {
  vm.runInContext(read(f), sandbox, { filename: f });
}
const { EFMD, EFDOCS, EFQA } = sandbox.window;
const DOCS = EFDOCS.flatMap((g) => g.pages.map((p) => ({ ...p, group: g.group })));
const HOME_DOC = DOCS[0].slug;

function read(f) { return fs.readFileSync(path.join(ROOT, f), "utf8"); }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

// --- URL ---
const docPath = (slug) => (slug === HOME_DOC ? "docs/" : `docs/${slug}/`);
const qPath = (q) => `community/${q.slug}/`;

// Réécrit les liens du Markdown (écrits pour l'ancienne navigation par ancre)
// vers les pages statiques, relativement à `root` (préfixe vers la racine du site).
function fixLinks(md, root) {
  return md.replace(/\]\(([^)\s]+)\)/g, (m, u) => {
    let v = u;
    if (v.startsWith("../")) v = v.slice(3);
    else if (!v.startsWith("#/")) return m;
    const doc = /^(?:docs\/)?#\/([\w-]+)$/.exec(v);
    if (doc) {
      if (!DOCS.some((p) => p.slug === doc[1])) throw new Error(`lien vers une page de doc inconnue : ${u}`);
      return `](${root}${docPath(doc[1])})`;
    }
    if (/^index\.html(#|$)/.test(v)) return `](${root}${v.slice(10)})`;
    return `](${root}${v})`;
  });
}

// Premier paragraphe en texte brut, coupé à ~155 caractères sur un mot.
function summary(md) {
  const paras = md.replace(/```[\s\S]*?```/g, "\n\n").split(/\n\s*\n/)
    .map((b) => b.trim()).filter((b) => b && !/^(#|>|\||[-*] |\d+\. )/.test(b));
  let text = "";
  for (const b of paras) { text += (text ? " " : "") + EFMD.strip(b); if (text.length >= 110) break; }
  text = text.replace(/\s+/g, " ").trim();
  if (text.length <= 158) return text;
  const cut = text.slice(0, 155);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:.—-]+$/, "") + "…";
}

function titleWith(base, suffix) {
  if ((base + suffix).length <= 62) return base + suffix;
  if ((base + " | EndoriumFort").length <= 62) return base + " | EndoriumFort";
  return base;
}

// --- Gabarits ---
const ICON_THEME = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const ICON_MENU = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
const ICON_SEARCH = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>';

function head({ root, title, description, url, type = "article", jsonld }) {
  return `<!doctype html>
${MARK}
<html lang="fr" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${SITE}/${url}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:type" content="${type}" />
  <meta property="og:url" content="${SITE}/${url}" />
  <meta property="og:image" content="${SITE}/assets/logo-full-blue.png" />
  <meta property="og:locale" content="fr_FR" />
  <meta name="twitter:card" content="summary" />
  <link rel="icon" type="image/png" href="${root}assets/logo-mark.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${root}assets/app.css" />
  <script>(function(){try{var t=localStorage.getItem("ef-theme")||(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.setAttribute("data-theme",t);}catch(e){}})();</script>${jsonld ? `
  <script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, "\\u003c")}</script>` : ""}
</head>`;
}

function header({ root, active, search }) {
  const nav = [["", "Site"], ["docs/", "Docs"], ["community/", "Communauté"]]
    .map(([href, label]) => `<a href="${root}${href}"${label === active ? ' class="active"' : ""}>${label}</a>`).join("\n        ");
  return `  <header class="hdr">
    <div class="hdr-in">
${search ? `      <button class="icon-btn menu-btn" id="menuBtn" aria-label="Sommaire">${ICON_MENU}</button>\n` : ""}      <a class="brand" href="${root}"><img src="${root}assets/logo-mark.png" alt="" /><span>Endorium<b>Fort</b></span></a>
      <nav>
        ${nav}
      </nav>
      <span class="spacer"></span>
${search ? `      <div class="search">
        ${ICON_SEARCH}
        <input id="search" type="search" placeholder="Rechercher…" autocomplete="off" aria-label="Rechercher dans la documentation" />
        <div class="search-results" id="searchResults" hidden></div>
      </div>
` : ""}      <button class="icon-btn" id="themeToggle" aria-label="Thème">${ICON_THEME}</button>
    </div>
  </header>`;
}

// --- Documentation ---
function docPage(p, i) {
  const root = p.slug === HOME_DOC ? "../" : "../../";
  const src = path.join("docs/content", p.file);
  const md = fs.existsSync(path.join(ROOT, src)) ? read(src) : `# ${p.title}\n\n*Page en cours de rédaction.*`;
  const isHome = p.slug === HOME_DOC;
  const title = isHome ? "Documentation EndoriumFort — bastion PAM auto-hébergé" : titleWith(p.title, " — Documentation EndoriumFort");
  const description = p.description || (isHome
    ? "Documentation d'EndoriumFort, bastion PAM auto-hébergé : installation Docker, Debian ou Kubernetes, accès SSH, RDP et navigateur isolé, coffre, audit, exploitation."
    : summary(md.replace(/^#[^\n]*\n/, "")));
  const prev = DOCS[i - 1], next = DOCS[i + 1];
  const sidebar = EFDOCS.map((g) => `      <p class="side-group">${esc(g.group)}</p>\n` + g.pages.map((x) =>
    `      <a href="${root}${docPath(x.slug)}"${x.slug === p.slug ? ' class="active" aria-current="page"' : ""}>${esc(x.title)}</a>`).join("\n")).join("\n");
  const pager = `<nav class="pager">` +
    (prev ? `<a class="prev" href="${root}${docPath(prev.slug)}"><span>Précédent</span>${esc(prev.title)}</a>` : "<span></span>") +
    (next ? `<a class="next" href="${root}${docPath(next.slug)}"><span>Suivant</span>${esc(next.title)}</a>` : "<span></span>") + `</nav>`;
  const crumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Documentation", item: `${SITE}/docs/` },
    ...(isHome ? [] : [{ "@type": "ListItem", position: 2, name: p.title, item: `${SITE}/${docPath(p.slug)}` }]) ] };
  return `${head({ root, title, description, url: docPath(p.slug), type: isHome ? "website" : "article", jsonld: crumbs })}
<body data-root="${root}">
${header({ root, active: "Docs", search: true })}

  <div class="layout">
    <aside class="sidebar" id="sidebar">
${sidebar}
    </aside>
    <main class="content">
      <article class="content-inner md" id="content">
${EFMD.render(fixLinks(md, root))}
${pager}
      </article>
    </main>
  </div>

  <script src="${root}assets/md.js"></script>
  <script src="${root}docs/nav.js"></script>
  <script src="${root}assets/page.js"></script>
  <script src="${root}assets/docs.js"></script>
</body>
</html>
`;
}

// --- Questions de la communauté ---
function questionPage(q) {
  const root = "../../";
  const answers = (q.answers || []).slice().sort((a, b) => (a.accepted === b.accepted ? 0 : a.accepted ? -1 : 1));
  const post = (body, accepted, date, isQuestion) =>
    `<div class="post solo"><div class="md">` + (accepted ? '<span class="ans-badge">Réponse de référence</span>' : "") +
    EFMD.render(fixLinks(body, root)) +
    `<div class="whobox">${isQuestion ? "Question fréquente" : "Réponse de l'équipe EndoriumFort"} · ${esc(date)}</div></div></div>`;
  const tags = (q.tags || []).map((t) => `<a class="tag" href="../?tag=${encodeURIComponent(t)}">${esc(t)}</a>`).join(" ");
  if (!q.description) throw new Error(`question ${q.id} sans description`);
  const jsonld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [{
    "@type": "Question", name: q.title, text: EFMD.strip(q.body), dateCreated: q.date,
    acceptedAnswer: { "@type": "Answer", text: EFMD.strip(answers[0].body), dateCreated: answers[0].date,
      author: { "@type": "Organization", name: "EndoriumFort" } } }] };
  return `${head({ root, title: titleWith(q.seoTitle || q.title, " — Communauté EndoriumFort"), description: q.description, url: qPath(q), jsonld })}
<body>
${header({ root, active: "Communauté", search: false })}

  <main class="qd" id="qd">
    <p class="back"><a href="../">← Communauté</a></p>
    <h1>${esc(q.title)}</h1>
    <div class="sub">${tags}</div>
    ${post(q.body, false, q.date, true)}
    <div class="ans-head">Réponse</div>
    ${answers.map((a) => post(a.body, a.accepted, a.date, false)).join("\n    ")}
    <p class="disclaimer">Votre cas est différent, ou cette réponse vous semble inexacte ? Ouvrez une <a href="https://github.com/Endorium-Group/EndoriumFort-CE/discussions/new?category=q-a" target="_blank" rel="noopener">discussion</a> — sans secrets dans vos extraits.</p>
  </main>

  <script src="${root}assets/md.js"></script>
  <script src="${root}assets/page.js"></script>
</body>
</html>
`;
}

function questionList() {
  const excerpt = (md) => { const t = EFMD.strip(md); return t.length > 170 ? t.slice(0, 170) + "…" : t; };
  return EFQA.map((q) => `      <div class="qrow" data-slug="${esc(q.slug)}">
        <div>
          <h3><a href="${esc(q.slug)}/">${esc(q.title)}</a></h3>
          <p class="excerpt">${esc(excerpt(q.body))}</p>
          <div class="meta">${(q.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join(" ")}<span class="who">Équipe EndoriumFort · ${esc(q.date)}</span></div>
        </div>
      </div>`).join("\n");
}

// --- Assemblage ---
const out = new Map();
DOCS.forEach((p, i) => out.set(path.join(docPath(p.slug), "index.html"), docPage(p, i)));
for (const q of EFQA) out.set(path.join(qPath(q), "index.html"), questionPage(q));

const ci = read("community/index.html");
const START = "<!-- qlist:start -->", END = "<!-- qlist:end -->";
const a = ci.indexOf(START), b = ci.indexOf(END);
if (a < 0 || b < a) throw new Error("community/index.html : marqueurs qlist absents");
out.set("community/index.html", ci.slice(0, a + START.length) + "\n" + questionList() + "\n      " + ci.slice(b));

const lastmod = (q) => [q.date, ...(q.answers || []).map((x) => x.date)].sort().pop();
const urls = [
  { loc: "", pri: "1.0" }, { loc: "docs/", pri: "0.8" },
  ...DOCS.filter((p) => p.slug !== HOME_DOC).map((p) => ({ loc: docPath(p.slug), pri: "0.7" })),
  { loc: "community/", pri: "0.6" },
  ...EFQA.map((q) => ({ loc: qPath(q), pri: "0.6", lastmod: lastmod(q) })),
  { loc: "legal/", pri: "0.2" },
];
out.set("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<!-- Généré par scripts/build.mjs : ne pas modifier à la main. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}/${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}<priority>${u.pri}</priority></url>`).join("\n")}
</urlset>
`);

// Pages générées qui n'ont plus de source (page renommée ou retirée).
const stale = [];
for (const dir of ["docs", "community"]) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const f = path.join(dir, e.name, "index.html");
    if (e.isDirectory() && !out.has(f) && fs.existsSync(path.join(ROOT, f)) && read(f).includes(MARK)) stale.push(path.join(dir, e.name));
  }
}

let bad = 0;
for (const [f, body] of out) {
  const abs = path.join(ROOT, f);
  const cur = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
  if (cur === body) continue;
  if (CHECK) { console.error(`pas à jour : ${f}`); bad++; continue; }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, body);
  console.log(`écrit : ${f}`);
}
for (const d of stale) {
  if (CHECK) { console.error(`page orpheline : ${d}/`); bad++; continue; }
  fs.rmSync(path.join(ROOT, d), { recursive: true });
  console.log(`supprimé : ${d}/`);
}
if (CHECK && bad) { console.error(`\n${bad} fichier(s) à régénérer : node scripts/build.mjs`); process.exit(1); }
if (CHECK) console.log(`ok : ${out.size} fichiers générés à jour`);
