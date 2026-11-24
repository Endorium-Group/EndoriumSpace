// EndoriumSpace — comportements communs des pages statiques (docs, communauté) :
// thème, sommaire mobile, boutons de copie des blocs de code.
(function () {
  "use strict";
  var theme = document.getElementById("themeToggle");
  if (theme) theme.addEventListener("click", function () {
    var n = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", n);
    try { localStorage.setItem("ef-theme", n); } catch (e) {}
  });
  var menu = document.getElementById("menuBtn"), sb = document.getElementById("sidebar");
  if (menu && sb) menu.addEventListener("click", function () { sb.classList.toggle("open"); });
  if (window.EFMD) document.querySelectorAll(".md").forEach(function (el) { EFMD.addCopyButtons(el); });
})();
