// EndoriumSpace — documentation : recherche plein texte et anciens liens par ancre.
// Les pages elles-mêmes sont statiques (scripts/build.mjs) ; data-root sur <body>
// donne le chemin relatif vers la racine du site.
(function () {
  "use strict";
  var root = document.body.getAttribute("data-root") || "";
  var pages = [];
  (window.EFDOCS || []).forEach(function (g) { g.pages.forEach(function (p) { pages.push({ slug: p.slug, title: p.title, file: p.file, group: g.group }); }); });
  if (!pages.length) return;
  var first = pages[0].slug;
  function href(slug) { return root + (slug === first ? "docs/" : "docs/" + slug + "/"); }

  // Anciens liens docs/#/<page> → docs/<page>/
  var m = /^#\/([\w-]+)/.exec(location.hash);
  if (m && pages.some(function (p) { return p.slug === m[1]; })) { location.replace(href(m[1])); return; }

  var input = document.getElementById("search");
  var box = document.getElementById("searchResults");
  if (!input || !box) return;
  var index = null;
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function buildIndex() {
    if (index) return Promise.resolve(index);
    return Promise.all(pages.map(function (p) {
      return fetch(root + "docs/content/" + p.file).then(function (r) { return r.ok ? r.text() : ""; }).catch(function () { return ""; })
        .then(function (t) { return { slug: p.slug, title: p.title, group: p.group, text: EFMD.strip(t).toLowerCase() }; });
    })).then(function (rows) { index = rows; return rows; });
  }
  var timer;
  input.addEventListener("input", function () {
    clearTimeout(timer);
    var q = input.value.trim().toLowerCase();
    if (q.length < 2) { box.hidden = true; return; }
    timer = setTimeout(function () {
      buildIndex().then(function (rows) {
        var hits = rows.filter(function (r) { return r.title.toLowerCase().indexOf(q) >= 0 || r.text.indexOf(q) >= 0; }).slice(0, 8);
        box.innerHTML = hits.length
          ? hits.map(function (h) { return '<a href="' + href(h.slug) + '"><div class="s-title">' + esc(h.title) + '</div><div class="s-crumb">' + esc(h.group) + "</div></a>"; }).join("")
          : '<div class="empty">Aucun résultat.</div>';
        box.hidden = false;
      });
    }, 120);
  });
  document.addEventListener("click", function (e) { if (!e.target.closest(".search")) box.hidden = true; });
})();
