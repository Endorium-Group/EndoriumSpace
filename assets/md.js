// EndoriumSpace — rendu Markdown minimal (sans dépendance).
// Couvre : titres, paragraphes, listes (- / 1.), blocs de code ```,
// code en ligne, gras/italique, liens, citations >, tableaux, hr.
(function (global) {
  "use strict";

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function inline(s) {
    // Protéger le code en ligne.
    var codes = [];
    s = s.replace(/`([^`]+)`/g, function (_, c) {
      codes.push("<code>" + esc(c) + "</code>");
      return "\u0000" + (codes.length - 1) + "\u0000";
    });
    s = esc(s);
    // Liens [texte](url)
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, t, u) {
      var ext = /^https?:/.test(u) ? ' target="_blank" rel="noopener"' : "";
      return '<a href="' + u + '"' + ext + ">" + t + "</a>";
    });
    // Gras puis italique
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
    // Restaurer le code
    s = s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return codes[+i]; });
    return s;
  }

  function render(src) {
    var lines = src.replace(/\r\n/g, "\n").split("\n");
    var out = [];
    var i = 0;

    function flushPara(buf) {
      if (buf.length) out.push("<p>" + inline(buf.join(" ")) + "</p>");
      return [];
    }

    var para = [];
    while (i < lines.length) {
      var line = lines[i];

      // Bloc de code ```
      if (/^```/.test(line)) {
        para = flushPara(para);
        i++;
        var code = [];
        while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
        i++; // ferme ```
        out.push("<pre><code>" + esc(code.join("\n")) + "</code></pre>");
        continue;
      }

      // Titres
      var h = /^(#{1,4})\s+(.*)$/.exec(line);
      if (h) { para = flushPara(para); out.push("<h" + h[1].length + ">" + inline(h[2]) + "</h" + h[1].length + ">"); i++; continue; }

      // Règle horizontale
      if (/^(-{3,}|\*{3,})\s*$/.test(line)) { para = flushPara(para); out.push("<hr>"); i++; continue; }

      // Tableau
      if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].indexOf("-") >= 0) {
        para = flushPara(para);
        var rows = [];
        var header = line;
        i += 2; // saute l'entête + séparateur
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { rows.push(lines[i]); i++; }
        var cells = function (r) { return r.trim().replace(/^\||\|$/g, "").split("|").map(function (c) { return c.trim(); }); };
        var t = '<table><thead><tr>';
        cells(header).forEach(function (c) { t += "<th>" + inline(c) + "</th>"; });
        t += "</tr></thead><tbody>";
        rows.forEach(function (r) { t += "<tr>"; cells(r).forEach(function (c) { t += "<td>" + inline(c) + "</td>"; }); t += "</tr>"; });
        t += "</tbody></table>";
        out.push(t);
        continue;
      }

      // Citation
      if (/^>\s?/.test(line)) {
        para = flushPara(para);
        var quote = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { quote.push(lines[i].replace(/^>\s?/, "")); i++; }
        out.push("<blockquote>" + render(quote.join("\n")) + "</blockquote>");
        continue;
      }

      // Listes
      if (/^\s*[-*]\s+/.test(line)) {
        para = flushPara(para);
        var ul = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { ul.push("<li>" + inline(lines[i].replace(/^\s*[-*]\s+/, "")) + "</li>"); i++; }
        out.push("<ul>" + ul.join("") + "</ul>");
        continue;
      }
      if (/^\s*\d+\.\s+/.test(line)) {
        para = flushPara(para);
        var ol = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { ol.push("<li>" + inline(lines[i].replace(/^\s*\d+\.\s+/, "")) + "</li>"); i++; }
        out.push("<ol>" + ol.join("") + "</ol>");
        continue;
      }

      // Ligne vide → fin de paragraphe
      if (/^\s*$/.test(line)) { para = flushPara(para); i++; continue; }

      // Sinon : paragraphe
      para.push(line.trim());
      i++;
    }
    flushPara(para);
    return out.join("\n");
  }

  // Ajoute les boutons « copier » aux blocs de code d'un conteneur.
  function addCopyButtons(container) {
    container.querySelectorAll("pre").forEach(function (pre) {
      if (pre.querySelector(".copy")) return;
      var b = document.createElement("button");
      b.className = "copy"; b.type = "button"; b.setAttribute("aria-label", "Copier");
      b.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
      b.addEventListener("click", function () {
        var t = pre.querySelector("code").innerText;
        navigator.clipboard && navigator.clipboard.writeText(t).then(function () {
          b.textContent = "✓"; setTimeout(function () { b.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>'; }, 1300);
        });
      });
      pre.appendChild(b);
    });
  }

  function stripMd(s) {
    return s.replace(/```[\s\S]*?```/g, " ").replace(/[#>*`_|-]/g, " ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();
  }

  global.EFMD = { render: render, inline: inline, addCopyButtons: addCopyButtons, strip: stripMd };
})(window);
