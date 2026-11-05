// EndoriumSpace — calculateur de dimensionnement (section #sizing de l'accueil).
// Sans dépendance, rien n'est envoyé : tout se calcule dans le navigateur.
// Les coûts unitaires sont ceux de docs/content/dimensionnement.md : modifier
// les deux ensemble.
(function () {
  "use strict";

  var form = document.getElementById("sizingForm");
  if (!form) return;

  var PRESETS = {
    lab:   { ssh: 10,  k8s: 0,  rdp: 2,   vnc: 0,  tcp: 2,  dbc: 0,  rbi: 2,  targets: 50,   users: 20,   perday: 30,   rec: true, sshHours: 5,    sshKind: "0.5", rbiHours: 1,  rbiKind: "0.5", days: 30,  queries: 0,       ha: false, relay: false },
    small: { ssh: 50,  k8s: 5,  rdp: 10,  vnc: 2,  tcp: 5,  dbc: 5,  rbi: 5,  targets: 500,  users: 100,  perday: 300,  rec: true, sshHours: 80,   sshKind: "0.5", rbiHours: 4,  rbiKind: "0.5", days: 365, queries: 20000,   ha: false, relay: false },
    mid:   { ssh: 200, k8s: 20, rdp: 40,  vnc: 10, tcp: 20, dbc: 20, rbi: 12, targets: 2000, users: 500,  perday: 1500, rec: true, sshHours: 400,  sshKind: "0.5", rbiHours: 8,  rbiKind: "0.5", days: 365, queries: 200000,  ha: false, relay: true },
    large: { ssh: 500, k8s: 50, rdp: 100, vnc: 20, tcp: 50, dbc: 50, rbi: 24, targets: 5000, users: 1000, perday: 4000, rec: true, sshHours: 1000, sshKind: "0.5", rbiHours: 20, rbiKind: "0.5", days: 365, queries: 1000000, ha: true,  relay: true }
  };

  // Coûts unitaires (mesurés sur l'image actuelle, arrondis vers le haut).
  var MB_BASE = 1024;        // système, backend, nginx
  var MB_LIGHT = 5;          // session SSH, tunnel ou proxy de base
  var MB_K8S = 50;           // processus kubectl exec
  var MB_RBI = 400;          // un Chromium headless
  var MB_PER_ITEM = 0.0075;  // une cible ou un compte en mémoire
  var HEADROOM = 1.3;
  var MBIT = { ssh: 0.05, k8s: 0.05, rdp: 1, vnc: 3, tcp: 0.5, dbc: 0.5, rbi: 6 };
  var AUDIT_KB_PER_SESSION = 35 * 0.5;   // 20 à 50 événements d'environ 0,5 Ko
  var QUERY_KB = 0.65;

  var $ = function (id) { return document.getElementById(id); };
  var tab = "compose";

  function num(name) { return Math.max(0, Number(form.elements[name].value) || 0); }
  function gb(mb) { return mb / 1024; }
  function ceilTo(v, step) { return Math.ceil(v / step) * step; }
  function dec(v) { return String(v).replace(".", ","); }
  function size(mb) {
    if (mb < 1000) return Math.ceil(mb) + " Mo";
    var g = mb / 1024;
    if (g < 1000) return (g < 10 ? dec(g.toFixed(1)) : Math.ceil(g)) + " Go";
    return dec((g / 1024).toFixed(1)) + " To";
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function fill(p) {
    Object.keys(p).forEach(function (k) {
      var f = form.elements[k];
      if (f.type === "checkbox") f.checked = p[k]; else f.value = p[k];
    });
    compute();
  }

  function compute() {
    var s = {};
    ["ssh", "k8s", "rdp", "vnc", "tcp", "dbc", "rbi", "targets", "users", "perday",
     "sshHours", "rbiHours", "days", "queries"].forEach(function (k) { s[k] = num(k); });
    var rec = form.elements.rec.checked;
    var ha = form.elements.ha.checked;
    var relay = form.elements.relay.checked;
    var sshMBh = Number(form.elements.sshKind.value);
    var rbiGBh = Number(form.elements.rbiKind.value);
    var light = s.ssh + s.rdp + s.vnc + s.tcp + s.dbc;

    // Mémoire
    var ramParts = [
      ["Base (système, backend, nginx)", MB_BASE],
      ["Sessions SSH, tunnels, proxy de base", light * MB_LIGHT],
      ["Shells Kubernetes", s.k8s * MB_K8S],
      ["Navigateurs isolés (RBI)", s.rbi * MB_RBI],
      ["Cibles et comptes en mémoire", (s.targets + s.users) * MB_PER_ITEM]
    ];
    var ramRaw = ramParts.reduce(function (n, p) { return n + p[1]; }, 0);
    var ramMB = ramRaw * HEADROOM;
    var ramGB = Math.max(2, Math.ceil(gb(ramMB)));

    // Bande passante (Mbit/s) côté utilisateurs ; doublée si le bastion porte
    // aussi le trajet vers les cibles.
    var mbit = 0;
    Object.keys(MBIT).forEach(function (k) { mbit += s[k] * MBIT[k]; });
    var tunnelMbit = s.rdp * MBIT.rdp + s.vnc * MBIT.vnc + s.tcp * MBIT.tcp + s.dbc * MBIT.dbc;
    var total = relay ? mbit : mbit * 2;

    // CPU
    var cpuRaw = 1 + 0.5 * s.rbi + s.ssh / 300 + (relay ? tunnelMbit : 2 * tunnelMbit) / 500;
    var cpu = Math.max(2, Math.ceil(cpuRaw));

    // Disque
    var sshRecMB = rec ? s.sshHours * sshMBh * s.days * 1.2 : 0;
    var rbiRecMB = rec ? s.rbiHours * rbiGBh * 1024 * s.days * 1.2 : 0;
    var recMB = sshRecMB + rbiRecMB;
    var auditMBy = (s.perday * AUDIT_KB_PER_SESSION * 365) / 1024;
    var queriesMB = (s.queries * QUERY_KB * s.days) / 1024;
    var dbMB = 100 + queriesMB + sshRecMB * 0.2;

    // Base de données
    var others = light + s.k8s;
    var concurrent = others + s.rbi;
    var postgres = ha || concurrent > 200 || s.queries > 100000;
    var dataMB = auditMBy + (postgres ? 0 : dbMB);

    // Profil — mêmes seuils que le tableau de la documentation.
    var profile = "Lab / PoC";
    if (others > 15 || s.rbi > 2 || s.targets > 50) profile = "Petite équipe";
    if (others > 80 || s.rbi > 5 || s.targets > 500) profile = "Taille moyenne";
    if (others > 320 || s.rbi > 12 || s.targets > 2000) profile = "Grande taille";

    // Limites du conteneur
    var memLimitGB = Math.max(1, ceilTo(gb(ramMB - 512), 0.5));
    var pids = Math.max(256, ceilTo(100 + 100 * s.rbi + 2 * light + 12 * s.k8s, 100));
    var rbiCap = s.rbi > 12 ? s.rbi : null;
    var recGi = Math.max(10, Math.ceil(gb(recMB) * 1.1));
    var dataGi = Math.max(2, Math.ceil(gb(dataMB) * 1.5));

    $("szProfile").textContent = profile;
    $("szCpu").textContent = cpu;
    $("szCpuD").textContent = s.rbi ? dec((0.5 * s.rbi).toFixed(1)) + " pour le RBI" : "sans RBI";
    $("szRam").textContent = ramGB + " Go";
    $("szRamD").textContent = size(ramRaw) + " + 30 % de marge";
    $("szRec").textContent = rec ? size(recMB) : "—";
    $("szRecD").textContent = rec ? s.days + " jours · " + (rbiRecMB > sshRecMB ? "surtout le RBI" : "surtout les terminaux") : "enregistrement désactivé";
    $("szBw").textContent = total < 1 ? Math.ceil(total * 1000) + " kbit/s" : Math.ceil(total) + " Mbit/s";
    $("szBwD").textContent = relay ? "utilisateurs ↔ bastion" : "utilisateurs ↔ bastion ↔ cibles";

    var rows = ramParts.filter(function (p) { return p[1] > 0; })
      .map(function (p) { return ["RAM · " + p[0], size(p[1])]; })
      .concat([
        ["Enregistrements · terminaux", rec ? size(sshRecMB) : "—"],
        ["Enregistrements · RBI", rec ? size(rbiRecMB) : "—"],
        ["Journal d'audit, par an", size(auditMBy)],
        ["Base (journal SQL et index de recherche inclus)", size(dbMB)],
        ["Moteur de base", postgres ? "PostgreSQL" : "SQLite (par défaut)"]
      ]);
    var tbody = $("szDetails");
    tbody.textContent = "";
    rows.forEach(function (r) {
      var tr = el("tr");
      tr.appendChild(el("td", null, r[0]));
      tr.appendChild(el("td", null, r[1]));
      tbody.appendChild(tr);
    });

    var warnings = [];
    if (s.rbi > 0) warnings.push("Le RBI demande pids_limit " + pids + " ou plus : avec la valeur livrée (256), seuls deux ou trois navigateurs isolés démarrent.");
    if (rbiCap) warnings.push("Montez ENDORIUMFORT_RBI_MAX_SESSIONS à " + rbiCap + " (12 par défaut), sinon les sessions au-delà de 12 sont refusées.");
    if (rec && rbiRecMB > 4 * 1024 * 1024) warnings.push("Les enregistrements RBI dépassent 4 To : baissez ENDORIUMFORT_RBI_MAX_FPS ou ENDORIUMFORT_RBI_JPEG_QUALITY, ou raccourcissez la conservation.");
    if (ha) warnings.push("Plusieurs instances demandent PostgreSQL et la fonction cluster de l'édition Enterprise.");
    if (!relay && profile === "Grande taille") warnings.push("À cette taille, placez des relais au plus près de chaque zone réseau pour décharger le bastion du trafic des tunnels.");
    if (rec) warnings.push("Les enregistrements ne sont jamais purgés automatiquement : prévoyez le volume pour toute la durée de conservation.");
    var w = $("szWarnings");
    w.textContent = "";
    warnings.forEach(function (t) { w.appendChild(el("p", "sz-warn", t)); });

    var env = [];
    if (rbiCap) env.push("ENDORIUMFORT_RBI_MAX_SESSIONS=" + rbiCap);
    if (postgres) env.push("ENDORIUMFORT_DB_DSN=postgresql://…");
    var lines;
    if (tab === "compose") {
      lines = [
        "# docker-compose.prod.yml — service endoriumfort",
        "mem_limit: " + memLimitGB + "g",
        "cpus: " + cpu.toFixed(2),
        "pids_limit: " + pids
      ];
      if (env.length) lines = lines.concat(["", "# .env.prod"], env);
      lines = lines.concat(["", "# Hôte : " + cpu + " vCPU, " + ramGB + " Go de RAM, " + size(recMB + dataMB + 20 * 1024) + " de disque (système compris)"]);
    } else {
      lines = [
        "# values.yaml",
        "resources:",
        "  limits:",
        "    cpu: \"" + cpu + "\"",
        "    memory: " + Math.ceil(memLimitGB * 1024) + "Mi",
        "  requests:",
        "    cpu: " + Math.max(250, Math.round(cpu * 500)) + "m",
        "    memory: " + Math.max(256, Math.ceil(ramRaw - 512)) + "Mi",
        "persistence:",
        "  data:",
        "    size: " + dataGi + "Gi",
        "  recordings:",
        "    size: " + recGi + "Gi"
      ];
      if (env.length) lines = lines.concat(["", "# variables d'environnement à ajouter"], env.map(function (e) { return "#   " + e; }));
    }
    $("szSnippet").textContent = lines.join("\n");
  }

  form.addEventListener("input", compute);
  form.addEventListener("change", compute);
  document.querySelectorAll("[data-sz-preset]").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll("[data-sz-preset]").forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
      fill(PRESETS[b.getAttribute("data-sz-preset")]);
    });
  });
  document.querySelectorAll("[data-sz-tab]").forEach(function (b) {
    b.addEventListener("click", function () {
      tab = b.getAttribute("data-sz-tab");
      document.querySelectorAll("[data-sz-tab]").forEach(function (o) { o.setAttribute("aria-selected", String(o === b)); });
      compute();
    });
  });
  fill(PRESETS.small);
})();
