// EndoriumSpace — interactions du site vitrine.
(function () {
  "use strict";

  // ── Thème clair/sombre (persisté) ──
  var root = document.documentElement;
  var toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("ef-theme", next); } catch (e) {}
    });
  }

  // ── Menu mobile ──
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinks.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ── Onglets de déploiement ──
  var tabs = document.querySelectorAll(".deploy-tabs [role=tab]");
  var panels = document.querySelectorAll(".deploy-panel");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.setAttribute("aria-selected", "false"); });
      tab.setAttribute("aria-selected", "true");
      var name = tab.getAttribute("data-tab");
      panels.forEach(function (p) {
        p.hidden = p.getAttribute("data-panel") !== name;
      });
    });
  });

  // ── Boutons « copier » sur les blocs de code ──
  document.querySelectorAll(".code").forEach(function (block) {
    var btn = document.createElement("button");
    btn.className = "copy";
    btn.type = "button";
    btn.setAttribute("aria-label", "Copier");
    btn.innerHTML =
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
    btn.addEventListener("click", function () {
      var text = block.innerText.replace(/\n?Copier$/, "").trim();
      navigator.clipboard && navigator.clipboard.writeText(text).then(function () {
        btn.textContent = "✓";
        setTimeout(function () {
          btn.innerHTML =
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
        }, 1400);
      });
    });
    block.appendChild(btn);
  });

  // ── Révélation au défilement ──
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  // ── Année courante ──
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
