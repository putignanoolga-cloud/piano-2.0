(function (global) {
  "use strict";
  const U = global.Utils;

  const PRESETS = [
    { label: "50 / 30 / 20", n: 0.5, s: 0.3, r: 0.2 },
    { label: "55 / 25 / 20", n: 0.55, s: 0.25, r: 0.2 },
    { label: "70 / 20 / 10", n: 0.7, s: 0.2, r: 0.1 }
  ];

  function render(root) {
    const s = Store.state.settings;
    const reddito = Calc.redditoPianificato();
    const somma = Calc.sommaPct();
    const ok = Calc.configOk();

    root.innerHTML = `
      <div class="view-head">
        <h2>Impostazioni</h2>
        <p class="lede">Inserisci qui i tuoi dati: tutto il resto dell'app si aggiorna da solo.</p>
      </div>

      <div class="row section">
        <div class="card" style="flex:1">
          <div class="section-title">1. Il tuo reddito mensile</div>
          <div class="field field-highlight"><label>Reddito mensile netto (fisso)</label><input type="number" step="0.01" id="fRedditoMensile" value="${s.redditoMensile}"></div>
          <div class="field field-highlight"><label>Redditi extra ricorrenti (freelance, rendite...)</label><input type="number" step="0.01" id="fRedditiExtra" value="${s.redditiExtra}"></div>
          <div class="field field-highlight"><label>Entrate occasionali previste (media mensile)</label><input type="number" step="0.01" id="fEntrateOccasionali" value="${s.entrateOccasionali}"></div>
          <hr class="sep">
          ${UI.statTile({ label: "Reddito mensile pianificato totale", value: U.formatCurrency(reddito), accent: true })}
          <p class="help" style="margin-top:10px">È il reddito "pianificato" usato per calcolare i budget consigliati. Le entrate realmente incassate si registrano in Registro Entrate.</p>
        </div>

        <div class="card" style="flex:1">
          <div class="section-title">3. Mese di riferimento &amp; fondo emergenza</div>
          <div class="field"><label>Mese analizzato in Dashboard / Budget / Analisi</label><input type="month" id="fMeseRif" value="${U.isoToMonthInput(s.meseRif)}"></div>
          <p class="help">Cambialo in ogni momento per rivedere un mese passato: dashboard, budget e analisi si aggiornano da soli.</p>
          <hr class="sep">
          <div class="field"><label>Mesi di copertura desiderati (fondo emergenza)</label><input type="number" min="1" step="1" id="fMesiFondo" value="${s.mesiFondoTarget}"></div>
          <p class="help">Valore consigliato: tra 3 e 6 mesi di spese essenziali. Puoi impostare qualsiasi valore.</p>
        </div>
      </div>

      <div class="card section">
        <div class="section-title">2. Come vuoi dividere il tuo reddito?</div>
        <p class="help" style="margin-bottom:14px">Non esiste una regola universale (es. 50/30/20): decidi tu le percentuali in base al costo della vita nella tua città. L'importante è che la somma faccia 100%.</p>
        <div class="field-row">
          <div class="field"><label>Necessità <span class="muted">(casa, bollette, spesa...)</span></label><input type="number" step="0.1" min="0" max="100" id="fPctNecessita" value="${(s.pctNecessita * 100).toFixed(1)}"></div>
          <div class="field"><label>Svaghi <span class="muted">(ristoranti, shopping, viaggi...)</span></label><input type="number" step="0.1" min="0" max="100" id="fPctSvaghi" value="${(s.pctSvaghi * 100).toFixed(1)}"></div>
          <div class="field"><label>Risparmio e Investimenti</label><input type="number" step="0.1" min="0" max="100" id="fPctRisparmio" value="${(s.pctRisparmio * 100).toFixed(1)}"></div>
        </div>
        <div class="progress-track" style="height:14px;display:flex;overflow:hidden">
          <div style="width:${U.clamp(s.pctNecessita * 100, 0, 100)}%;background:${Charts.colorForGruppo("Necessità")}"></div>
          <div style="width:${U.clamp(s.pctSvaghi * 100, 0, 100)}%;background:${Charts.colorForGruppo("Svaghi")}"></div>
          <div style="width:${U.clamp(s.pctRisparmio * 100, 0, 100)}%;background:${Charts.colorForGruppo("Risparmio/Investimenti")}"></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;flex-wrap:wrap;gap:10px">
          <strong style="color:${ok ? "var(--status-good-text)" : "var(--status-warn-text)"}">${ok ? "✅ Budget configurato correttamente." : `⚠️ Le percentuali totalizzano ${U.formatPercent(somma)}, devono fare 100%.`}</strong>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${PRESETS.map(p => `<button class="btn btn-sm" data-preset='${p.n},${p.s},${p.r}'>${p.label}</button>`).join("")}
          </div>
        </div>
      </div>

      <div class="row section">
        <div class="card" style="flex:1.4">
          <div class="card-head"><h3>Categorie di spesa e gruppo</h3></div>
          <p class="help" style="margin-bottom:10px">Rinomina le categorie o aggiungine di nuove. Ogni categoria è assegnata a un gruppo e verrà usata nei menu a tendina del Registro Spese. Rinominare una categoria non aggiorna i movimenti già registrati con il nome precedente.</p>
          <div class="table-wrap"><table>
            <thead><tr><th>Categoria</th><th style="width:220px">Gruppo</th><th class="col-tight"></th></tr></thead>
            <tbody>
              ${s.categorieSpesa.map((c, i) => `
                <tr data-idx="${i}">
                  <td><input type="text" data-field="nome" value="${U.escapeAttr(c.nome)}"></td>
                  <td><select data-field="gruppo">${UI.optionsHtml(Store.GRUPPI, c.gruppo)}</select></td>
                  <td class="col-tight"><button class="btn btn-icon btn-danger" data-del title="Elimina">${UI.icon("trash")}</button></td>
                </tr>
              `).join("")}
              <tr class="row-new">
                <td><input type="text" id="newCatNome" placeholder="Nuova categoria..."></td>
                <td><select id="newCatGruppo">${UI.optionsHtml(Store.GRUPPI, "Necessità")}</select></td>
                <td class="col-tight"><button class="btn btn-icon btn-primary" id="addCat" title="Aggiungi">${UI.icon("plus")}</button></td>
              </tr>
            </tbody>
          </table></div>
        </div>

        <div class="card" style="flex:1">
          <div class="card-head"><h3>Categorie di entrata</h3></div>
          ${simpleListHtml(s.categorieEntrata, "catEntrata")}
        </div>
      </div>

      <div class="row section">
        <div class="card" style="flex:1">
          <div class="card-head"><h3>Metodi di pagamento</h3></div>
          ${simpleListHtml(s.metodiPagamento, "metodo")}
        </div>
        <div class="card" style="flex:1">
          <div class="card-head"><h3>Dati dell'app</h3></div>
          <p class="help" style="margin-bottom:12px">Tutti i dati restano solo nel tuo browser (localStorage). Esporta un backup ogni tanto o spostalo su un altro dispositivo.</p>
          <div style="display:flex;flex-direction:column;gap:10px">
            <button class="btn" id="btnExport">${UI.icon("download")} Esporta backup (.json)</button>
            <button class="btn" id="btnImportTrigger">${UI.icon("upload")} Importa backup (.json)</button>
            <input type="file" id="fileImport" accept="application/json" style="display:none">
            <button class="btn btn-danger" id="btnReset">${UI.icon("refresh")} Ripristina dati di esempio</button>
          </div>
        </div>
      </div>
    `;

    function commit() { Store.save(); if (global.App) global.App.refreshChrome(); render(root); }

    root.querySelector("#fRedditoMensile").addEventListener("change", e => { s.redditoMensile = parseFloat(e.target.value) || 0; commit(); });
    root.querySelector("#fRedditiExtra").addEventListener("change", e => { s.redditiExtra = parseFloat(e.target.value) || 0; commit(); });
    root.querySelector("#fEntrateOccasionali").addEventListener("change", e => { s.entrateOccasionali = parseFloat(e.target.value) || 0; commit(); });
    root.querySelector("#fMeseRif").addEventListener("change", e => { if (e.target.value) { s.meseRif = U.monthInputToISO(e.target.value); commit(); } });
    root.querySelector("#fMesiFondo").addEventListener("change", e => { s.mesiFondoTarget = Math.max(1, parseInt(e.target.value, 10) || 1); commit(); });
    root.querySelector("#fPctNecessita").addEventListener("change", e => { s.pctNecessita = U.clamp(parseFloat(e.target.value) || 0, 0, 100) / 100; commit(); });
    root.querySelector("#fPctSvaghi").addEventListener("change", e => { s.pctSvaghi = U.clamp(parseFloat(e.target.value) || 0, 0, 100) / 100; commit(); });
    root.querySelector("#fPctRisparmio").addEventListener("change", e => { s.pctRisparmio = U.clamp(parseFloat(e.target.value) || 0, 0, 100) / 100; commit(); });
    root.querySelectorAll("[data-preset]").forEach(btn => {
      btn.addEventListener("click", () => {
        const [n, sv, r] = btn.dataset.preset.split(",").map(Number);
        s.pctNecessita = n; s.pctSvaghi = sv; s.pctRisparmio = r; commit();
      });
    });

    root.querySelectorAll("tbody tr[data-idx]").forEach(tr => {
      const i = Number(tr.dataset.idx);
      tr.querySelector('[data-field="nome"]').addEventListener("change", e => { s.categorieSpesa[i].nome = e.target.value.trim() || s.categorieSpesa[i].nome; commit(); });
      tr.querySelector('[data-field="gruppo"]').addEventListener("change", e => { s.categorieSpesa[i].gruppo = e.target.value; commit(); });
      tr.querySelector("[data-del]").addEventListener("click", async () => {
        const nome = s.categorieSpesa[i].nome;
        const inUse = Store.state.spese.some(sp => sp.categoria === nome);
        const ok2 = await UI.confirmDialog({
          title: "Eliminare categoria?",
          text: inUse ? `"${nome}" è usata in almeno una spesa registrata. I movimenti esistenti manterranno il nome ma non saranno più raggruppati automaticamente.` : `Eliminare "${nome}"?`,
          confirmLabel: "Elimina", danger: true
        });
        if (ok2) { s.categorieSpesa.splice(i, 1); commit(); }
      });
    });
    root.querySelector("#addCat").addEventListener("click", () => {
      const nome = root.querySelector("#newCatNome").value.trim();
      if (!nome) return;
      s.categorieSpesa.push({ nome, gruppo: root.querySelector("#newCatGruppo").value });
      commit();
    });

    wireSimpleList(root, s.categorieEntrata, "catEntrata", commit);
    wireSimpleList(root, s.metodiPagamento, "metodo", commit);

    root.querySelector("#btnExport").addEventListener("click", () => {
      U.downloadText("piano-finanziario-backup.json", Store.exportJSON(), "application/json");
      UI.toast("Backup esportato.");
    });
    root.querySelector("#btnImportTrigger").addEventListener("click", () => root.querySelector("#fileImport").click());
    root.querySelector("#fileImport").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          Store.importJSON(reader.result);
          UI.toast("Dati importati correttamente.");
          if (global.App) global.App.refreshChrome();
          render(root);
        } catch (err) {
          UI.toast("File non valido: impossibile importare.", "error");
        }
      };
      reader.readAsText(file);
    });
    root.querySelector("#btnReset").addEventListener("click", async () => {
      const ok2 = await UI.confirmDialog({
        title: "Ripristinare i dati di esempio?",
        text: "Tutti i dati che hai inserito finora (entrate, spese, obiettivi, ecc.) verranno sostituiti con i dati dimostrativi.",
        confirmLabel: "Ripristina", danger: true
      });
      if (ok2) { Store.reset(); UI.toast("Dati di esempio ripristinati."); if (global.App) global.App.refreshChrome(); render(root); }
    });
  }

  function simpleListHtml(list, prefix) {
    return `<div id="list-${prefix}">
      ${list.map((v, i) => `
        <div class="field-row" style="margin-bottom:8px" data-idx="${i}">
          <input type="text" value="${U.escapeAttr(v)}" data-field>
          <button class="btn btn-icon btn-danger" data-del>${UI.icon("x")}</button>
        </div>`).join("")}
      <div class="field-row">
        <input type="text" id="new-${prefix}" placeholder="Aggiungi voce...">
        <button class="btn btn-icon btn-primary" id="add-${prefix}">${UI.icon("plus")}</button>
      </div>
    </div>`;
  }

  function wireSimpleList(root, list, prefix, commit) {
    const box = root.querySelector(`#list-${prefix}`);
    box.querySelectorAll("[data-idx]").forEach(row => {
      const i = Number(row.dataset.idx);
      row.querySelector("[data-field]").addEventListener("change", e => {
        const v = e.target.value.trim();
        if (v) list[i] = v; else e.target.value = list[i];
        commit();
      });
      row.querySelector("[data-del]").addEventListener("click", () => { list.splice(i, 1); commit(); });
    });
    box.querySelector(`#add-${prefix}`).addEventListener("click", () => {
      const input = box.querySelector(`#new-${prefix}`);
      const v = input.value.trim();
      if (!v) return;
      list.push(v);
      commit();
    });
  }

  global.Views = global.Views || {};
  global.Views.impostazioni = render;
})(window);
