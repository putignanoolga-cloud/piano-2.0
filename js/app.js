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
  const appShell = document.getElementById("appShell");
  const onboardingRoot = document.getElementById("onboardingRoot");
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

  function showOnboarding() {
    appShell.style.display = "none";
    Onboarding.run(onboardingRoot, () => {
      onboardingRoot.innerHTML = "";
      appShell.style.display = "";
      location.hash = "#/home";
      mount();
    });
  }

  function startApp() {
    if (!Store.state.profilo.completato) showOnboarding();
    else mount();
  }

  function openSettingsModal() {
    const pr = Store.state.profilo;
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `<div class="modal" style="max-width:440px;max-height:88vh;overflow-y:auto">
      <h3>Impostazioni</h3>

      <div class="section-title" style="margin-top:4px">Il tuo profilo</div>
      <div class="field"><label>Nome</label><input type="text" id="mNome" value="${U.escapeAttr(pr.nome)}"></div>
      <div class="field"><label>Situazione</label>
        <select id="mTipo">
          <option value="dipendente" ${pr.tipo === "dipendente" ? "selected" : ""}>Dipendente</option>
          <option value="partita_iva" ${pr.tipo === "partita_iva" ? "selected" : ""}>Partita IVA</option>
        </select>
      </div>
      <div class="field"><label>Reddito mensile <span class="muted">(usato per calcolare il budget)</span></label><input type="number" step="0.01" id="mReddito" value="${pr.redditoMensile}"></div>
      <div class="field-row">
        <div class="field"><label>Necessità %</label><input type="number" min="0" max="100" id="mPctN" value="${(pr.pctNecessita * 100).toFixed(0)}"></div>
        <div class="field"><label>Svaghi %</label><input type="number" min="0" max="100" id="mPctS" value="${(pr.pctSvaghi * 100).toFixed(0)}"></div>
        <div class="field"><label>Risparmio %</label><input type="number" min="0" max="100" id="mPctR" value="${(pr.pctRisparmio * 100).toFixed(0)}"></div>
      </div>
      <div id="mPctSum" class="help" style="margin-bottom:14px"></div>

      ${pr.tipo === "partita_iva" ? `
        <div class="field">
          <label>Percentuale da accantonare per le tasse</label>
          <input type="number" id="mAccantonamento" min="0" max="100" step="1" value="${(Store.state.settings.accantonamentoPct * 100).toFixed(0)}">
          <span class="help">Applicata automaticamente a ogni entrata di tipo "Fattura (Partita IVA)".</span>
        </div>
      ` : ""}

      <hr class="sep">
      <div class="field">
        <label>I tuoi dati</label>
        <span class="help">Restano solo in questo browser. Esporta un backup ogni tanto.</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px">
        <button class="btn" id="mExport">${UI.icon("download")} Esporta backup (.json)</button>
        <button class="btn" id="mImportTrigger">${UI.icon("upload")} Importa backup (.json)</button>
        <input type="file" id="mFileImport" accept="application/json" style="display:none">
        <button class="btn" id="mRedoOnboarding">${UI.icon("refresh")} Rifai il tour introduttivo</button>
        <button class="btn btn-danger" id="mReset">${UI.icon("trash")} Ripristina dati di esempio</button>
      </div>
      <div class="modal-actions"><button class="btn btn-primary" data-act="close">Chiudi</button></div>
    </div>`;
    document.body.appendChild(overlay);
    function close() { overlay.remove(); }
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('[data-act="close"]').addEventListener("click", close);

    function commitProfilo() {
      Store.save();
      if (activeRender) activeRender(viewRoot);
    }
    overlay.querySelector("#mNome").addEventListener("change", (e) => { pr.nome = e.target.value.trim(); commitProfilo(); });
    overlay.querySelector("#mTipo").addEventListener("change", (e) => { pr.tipo = e.target.value; commitProfilo(); close(); openSettingsModal(); });
    overlay.querySelector("#mReddito").addEventListener("change", (e) => { pr.redditoMensile = parseFloat(e.target.value) || 0; commitProfilo(); });

    const nInput = overlay.querySelector("#mPctN"), sInput = overlay.querySelector("#mPctS"), rInput = overlay.querySelector("#mPctR"), sumEl = overlay.querySelector("#mPctSum");
    function updatePct() {
      pr.pctNecessita = U.clamp(parseFloat(nInput.value) || 0, 0, 100) / 100;
      pr.pctSvaghi = U.clamp(parseFloat(sInput.value) || 0, 0, 100) / 100;
      pr.pctRisparmio = U.clamp(parseFloat(rInput.value) || 0, 0, 100) / 100;
      const sum = Math.round((pr.pctNecessita + pr.pctSvaghi + pr.pctRisparmio) * 100);
      sumEl.textContent = sum === 100 ? `Totale: ${sum}% ✅` : `Totale: ${sum}% — dovrebbe fare 100%`;
      sumEl.style.color = sum === 100 ? "var(--status-good-text)" : "var(--status-warn-text)";
      commitProfilo();
    }
    [nInput, sInput, rInput].forEach(i => i.addEventListener("change", updatePct));
    updatePct();

    const accInput = overlay.querySelector("#mAccantonamento");
    if (accInput) accInput.addEventListener("change", (e) => {
      Store.state.settings.accantonamentoPct = U.clamp(parseFloat(e.target.value) || 0, 0, 100) / 100;
      commitProfilo();
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
          startApp();
        } catch (err) {
          UI.toast("File non valido: impossibile importare.", "error");
        }
      };
      reader.readAsText(file);
    });
    overlay.querySelector("#mRedoOnboarding").addEventListener("click", async () => {
      const ok = await UI.confirmDialog({
        title: "Rifare il tour introduttivo?",
        text: "Ti richiediamo nome, situazione lavorativa, reddito e come dividere il budget. I tuoi movimenti registrati restano intatti.",
        confirmLabel: "Rifai il tour"
      });
      if (ok) { Store.state.profilo.completato = false; Store.save(); close(); startApp(); }
    });
    overlay.querySelector("#mReset").addEventListener("click", async () => {
      const ok = await UI.confirmDialog({
        title: "Ripristinare i dati di esempio?",
        text: "Tutti i dati che hai inserito finora verranno sostituiti con i dati dimostrativi.",
        confirmLabel: "Ripristina", danger: true
      });
      if (ok) { Store.reset(); UI.toast("Dati di esempio ripristinati."); close(); startApp(); }
    });
  }

  document.getElementById("settingsBtn").addEventListener("click", openSettingsModal);

  global.App = { openSettingsModal };

  startApp();
})(window);
