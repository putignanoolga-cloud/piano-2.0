(function (global) {
  "use strict";
  const U = global.Utils;

  const NAV = [
    { hash: "home", label: "Home", icon: "home" },
    { hash: "dashboard", label: "Dashboard", icon: "grid" },
    { hash: "impostazioni", label: "Impostazioni", icon: "sliders" },
    { group: "Registri", hash: "entrate", label: "Registro Entrate", icon: "arrowDown" },
    { group: "Registri", hash: "spese", label: "Registro Spese", icon: "arrowUp" },
    { group: "Budget", hash: "budget", label: "Budget", icon: "pie" },
    { group: "Budget", hash: "permettermi", label: "Quanto Posso Permettermi", icon: "calculator" },
    { group: "Obiettivi", hash: "obiettivi", label: "Obiettivi Finanziari", icon: "target" },
    { group: "Obiettivi", hash: "fondo-emergenza", label: "Fondo Emergenza", icon: "shield" },
    { group: "Patrimonio", hash: "patrimonio", label: "Patrimonio Netto", icon: "bank" },
    { group: "Patrimonio", hash: "abbonamenti", label: "Abbonamenti", icon: "repeat" },
    { group: "Patrimonio", hash: "calendario", label: "Calendario Pagamenti", icon: "calendar" },
    { hash: "analisi", label: "Analisi", icon: "activity" }
  ];

  const sidebar = document.getElementById("sidebar");
  const scrim = document.getElementById("scrim");
  const viewRoot = document.getElementById("viewRoot");
  const pageTitle = document.getElementById("pageTitle");
  const globalMonth = document.getElementById("globalMonth");
  let activeRender = null;

  function navHtml() {
    let html = "", lastGroup = null;
    NAV.forEach(item => {
      if (item.group && item.group !== lastGroup) { html += `<div class="nav-section-label">${item.group}</div>`; }
      lastGroup = item.group || null;
      html += `<button class="nav-item" data-hash="${item.hash}">${UI.icon(item.icon)}<span>${item.label}</span></button>`;
    });
    return html;
  }

  function currentKey() {
    const h = location.hash.replace(/^#\/?/, "");
    return NAV.some(n => n.hash === h) ? h : "home";
  }

  function mount() {
    const key = currentKey();
    const item = NAV.find(n => n.hash === key);
    pageTitle.textContent = item.label;
    document.title = item.label + " · Piano Finanziario";
    document.querySelectorAll(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.hash === key));
    globalMonth.value = U.isoToMonthInput(Store.state.settings.meseRif);
    viewRoot.innerHTML = "";
    activeRender = global.Views[key];
    if (activeRender) activeRender(viewRoot);
    sidebar.classList.remove("open");
    scrim.classList.remove("show");
    window.scrollTo({ top: 0 });
  }

  document.getElementById("sidebarNav").innerHTML = navHtml();
  document.querySelectorAll(".nav-item").forEach(el => {
    el.addEventListener("click", () => { location.hash = "#/" + el.dataset.hash; });
  });

  document.getElementById("hamburger").addEventListener("click", () => {
    sidebar.classList.toggle("open");
    scrim.classList.toggle("show");
  });
  scrim.addEventListener("click", () => { sidebar.classList.remove("open"); scrim.classList.remove("show"); });

  globalMonth.addEventListener("change", (e) => {
    if (!e.target.value) return;
    Store.state.settings.meseRif = U.monthInputToISO(e.target.value);
    Store.save();
    if (activeRender) activeRender(viewRoot);
  });

  window.addEventListener("hashchange", mount);

  global.App = {
    refreshChrome() { globalMonth.value = U.isoToMonthInput(Store.state.settings.meseRif); }
  };

  mount();
})(window);
