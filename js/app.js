(function (global) {
  "use strict";
  const U = global.Utils;

  const NAV = [
    { hash: "home", label: "Home", icon: "home" },
    { hash: "movimenti", label: "Entrate e Uscite", icon: "wallet" },
    { hash: "scadenze", label: "Scadenze", icon: "calendar" },
    { hash: "obiettivi", label: "Obiettivi", icon: "target" }
  ];

  const sidebar = document.getElementById("sidebar");
  const scrim = document.getElementById("scrim");
  const viewRoot = document.getElementById("viewRoot");
  const pageTitle = document.getElementById("pageTitle");
  let activeRender = null;

  function navHtml() {
    return NAV.map(item => `<button class="nav-item" data-hash="${item.hash}">${UI.icon(item.icon)}<span>${item.label}</span></button>`).join("");
  }

  function currentKey() {
    const h = location.hash.replace(/^#\/?/, "").split("?")[0];
    return NAV.some(n => n.hash === h) ? h : "home";
  }

  function mount() {
    const key = currentKey();
    const item = NAV.find(n => n.hash === key);
    pageTitle.textContent = item.label;
    document.title = item.label + " · Piano Finanziario";
    document.querySelectorAll(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.hash === key));
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

  window.addEventListener("hashchange", mount);

  function openSettingsModal() {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `<div class="modal" style="max-width:440px">
      <h3>Impostazioni</h3>
      <div class="field">
        <label>Percentuale da accantonare per le tasse (Partita IVA)</label>
        <input type="number" id="mAccantonamento" min="0" max="100" step="1" value="${(Store.state.settings.accantonamentoPct * 100).toFixed(0)}">
        <span class="help">Applicata automaticamente a ogni entrata di tipo "Fattura (Partita IVA)".</span>
      </div>
      <hr class="sep">
      <div class="field">
        <label>I tuoi dati</label>
        <span class="help">Restano solo in questo browser. Esporta un backup ogni tanto.</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px">
        <button class="btn" id="mExport">${UI.icon("download")} Esporta backup (.json)</button>
        <button class="btn" id="mImportTrigger">${UI.icon("upload")} Importa backup (.json)</button>
        <input type="file" id="mFileImport" accept="application/json" style="display:none">
        <button class="btn btn-danger" id="mReset">${UI.icon("refresh")} Ripristina dati di esempio</button>
      </div>
      <div class="modal-actions"><button class="btn btn-primary" data-act="close">Chiudi</button></div>
    </div>`;
    document.body.appendChild(overlay);
    function close() { overlay.remove(); }
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('[data-act="close"]').addEventListener("click", close);
    overlay.querySelector("#mAccantonamento").addEventListener("change", (e) => {
      Store.state.settings.accantonamentoPct = U.clamp(parseFloat(e.target.value) || 0, 0, 100) / 100;
      Store.save();
      if (activeRender) activeRender(viewRoot);
    });
    overlay.querySelector("#mExport").addEventListener("click", () => {
      U.downloadText("piano-finanziario-backup.json", Store.exportJSON(), "application/json");
      UI.toast("Backup esportato.");
    });
    overlay.querySelector("#mImportTrigger").addEventListener("click", () => overlay.querySelector("#mFileImport").click());
    overlay.querySelector("#mFileImport").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          Store.importJSON(reader.result);
          UI.toast("Dati importati correttamente.");
          close();
          if (activeRender) activeRender(viewRoot);
        } catch (err) {
          UI.toast("File non valido: impossibile importare.", "error");
        }
      };
      reader.readAsText(file);
    });
    overlay.querySelector("#mReset").addEventListener("click", async () => {
      const ok = await UI.confirmDialog({
        title: "Ripristinare i dati di esempio?",
        text: "Tutti i dati che hai inserito finora verranno sostituiti con i dati dimostrativi.",
        confirmLabel: "Ripristina", danger: true
      });
      if (ok) { Store.reset(); UI.toast("Dati di esempio ripristinati."); close(); if (activeRender) activeRender(viewRoot); }
    });
  }

  document.getElementById("settingsBtn").addEventListener("click", openSettingsModal);

  global.App = { openSettingsModal };

  mount();
})(window);
