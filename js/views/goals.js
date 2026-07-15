(function (global) {
  "use strict";
  const U = global.Utils;

  function obiettiviView(root) {
    const list = Store.state.obiettivi;

    root.innerHTML = `
      <div class="view-head">
        <h2>Obiettivi Finanziari</h2>
        <p class="lede">Crea e monitora i tuoi obiettivi di risparmio: casa, auto, viaggio, fondo di emergenza...</p>
      </div>
      <div class="section" style="display:flex;justify-content:flex-end">
        <button class="btn btn-primary" id="addGoal">${UI.icon("plus")} Nuovo obiettivo</button>
      </div>
      <div class="goal-grid">
        ${list.length ? list.map(goalCardHtml).join("") : `<div class="empty-state" style="grid-column:1/-1"><div class="title">Nessun obiettivo ancora</div><p>Aggiungine uno per iniziare a monitorare i tuoi risparmi.</p></div>`}
      </div>
    `;

    root.querySelector("#addGoal").addEventListener("click", () => {
      list.push({ id: U.uid(), nome: "Nuovo obiettivo", importoObiettivo: 1000, importoRaggiunto: 0, risparmioMensile: 0, dataPrevista: "" });
      Store.save();
      obiettiviView(root);
    });

    list.forEach(o => {
      const card = root.querySelector(`[data-id="${o.id}"]`);
      if (!card) return;
      function commit() { Store.save(); obiettiviView(root); }
      card.querySelector('[data-field="nome"]').addEventListener("change", e => { o.nome = e.target.value.trim() || o.nome; commit(); });
      card.querySelector('[data-field="importoObiettivo"]').addEventListener("change", e => { o.importoObiettivo = parseFloat(e.target.value) || 0; commit(); });
      card.querySelector('[data-field="importoRaggiunto"]').addEventListener("change", e => { o.importoRaggiunto = parseFloat(e.target.value) || 0; commit(); });
      card.querySelector('[data-field="risparmioMensile"]').addEventListener("change", e => { o.risparmioMensile = Math.max(0, parseFloat(e.target.value) || 0); commit(); });
      card.querySelector('[data-field="dataPrevista"]').addEventListener("change", e => { o.dataPrevista = e.target.value; commit(); });
      card.querySelector("[data-del]").addEventListener("click", async () => {
        const ok = await UI.confirmDialog({ title: "Eliminare obiettivo?", text: `"${o.nome}" verrà eliminato definitivamente.`, confirmLabel: "Elimina", danger: true });
        if (ok) { const idx = list.findIndex(x => x.id === o.id); list.splice(idx, 1); commit(); }
      });
    });
  }

  function goalCardHtml(o) {
    const c = Calc.obiettivo(o);
    const color = c.stato === "In ritardo" ? "var(--status-critical-text)" : (c.stato === "Raggiunto" ? "var(--status-good-text)" : "var(--brand)");
    return `<div class="goal-card" data-id="${o.id}">
      <div class="goal-card-head">
        <input type="text" class="goal-name" data-field="nome" value="${U.escapeAttr(o.nome)}">
        <button class="btn btn-icon btn-danger" data-del title="Elimina">${UI.icon("trash")}</button>
      </div>
      <div>
        <div class="progress-label"><span>${U.formatPercent(c.pctCompletata)} completato</span><span class="muted">${U.formatCurrency(o.importoRaggiunto)} / ${U.formatCurrency(o.importoObiettivo)}</span></div>
        ${UI.progress(c.pctCompletata, { color })}
      </div>
      <div class="field-row">
        <div class="field"><label>Importo obiettivo</label><input type="number" step="0.01" data-field="importoObiettivo" value="${o.importoObiettivo}"></div>
        <div class="field"><label>Importo raggiunto</label><input type="number" step="0.01" data-field="importoRaggiunto" value="${o.importoRaggiunto}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Risparmio mensile dedicato</label><input type="number" step="0.01" data-field="risparmioMensile" value="${o.risparmioMensile}"></div>
        <div class="field"><label>Data prevista</label><input type="date" data-field="dataPrevista" value="${U.escapeAttr(o.dataPrevista || "")}"></div>
      </div>
      <div class="goal-meta">
        <span>Mesi stimati rimanenti: <b class="tabular">${c.mesiStimati === "n/d" ? "n/d" : c.mesiStimati}</b></span>
        ${UI.pill(c.stato || "In corso")}
      </div>
      <div class="muted" style="font-size:11.5px">Completamento stimato: ${c.dataStimata === "Raggiunto" || c.dataStimata === "n/d" ? c.dataStimata : U.formatDateIt(c.dataStimata)}</div>
    </div>`;
  }

  function fondoView(root) {
    const s = Store.state.fondoEmergenza;
    const f = Calc.fondoEmergenza();

    root.innerHTML = `
      <div class="view-head">
        <h2>Fondo Emergenza</h2>
        <p class="lede">Quanto dovresti avere da parte per affrontare un imprevisto senza stress. La spesa mensile media viene calcolata automaticamente dal Registro Spese.</p>
      </div>

      <div class="row section">
        <div class="card" style="flex:1">
          <div class="section-title">Il tuo fondo oggi</div>
          <div class="field field-highlight"><label>Liquidità accantonata nel fondo emergenza</label><input type="number" step="0.01" id="fLiquidita" value="${s.liquiditaAttuale}"></div>
          <div class="grid grid-2" style="margin-top:6px">
            ${UI.statTile({ label: "Spesa mensile media", value: U.formatCurrency(f.speseMensileMedia) })}
            ${UI.statTile({ label: "Mesi di copertura attuale", value: U.formatNumber(f.mesiCoperturaAttuale) + " mesi" })}
          </div>
          <p class="help" style="margin-top:10px">Spesa mensile media calcolata come spesa totale registrata divisa per il numero di mesi di dati disponibili.</p>
        </div>

        <div class="card" style="flex:1;display:flex;gap:20px;align-items:center;flex-wrap:wrap">
          <div id="fondoRing"></div>
          <div style="flex:1;min-width:180px">
            <div class="section-title">Verso l'obiettivo personalizzato</div>
            <p class="soft" style="font-size:13px">Obiettivo: <b>${s0(f.idealeTarget)}</b> (${Store.state.settings.mesiFondoTarget} mesi di spese)</p>
            <p class="soft" style="font-size:13px">${f.mancano > 0 ? `Mancano <b>${U.formatCurrency(f.mancano)}</b> per raggiungere l'obiettivo.` : `Obiettivo raggiunto! 🎉`}</p>
          </div>
        </div>
      </div>

      <div class="card section">
        <div class="card-head"><h3>Fondo ideale</h3><span class="muted">confronto con la liquidità attuale</span></div>
        <div id="fondoCompare"></div>
      </div>
    `;

    function s0(v) { return U.formatCurrency(v); }

    Charts.progressRing(root.querySelector("#fondoRing"), f.pctCopertura, { centerLabel: "coperto", color: f.pctCopertura >= 1 ? "var(--status-good-text)" : "var(--brand)" });
    Charts.compareBars(root.querySelector("#fondoCompare"), [
      { label: "3 mesi", value: f.ideale3, color: Charts.COLORS.necessita },
      { label: "6 mesi", value: f.ideale6, color: Charts.COLORS.necessita },
      { label: "12 mesi", value: f.ideale12, color: Charts.COLORS.necessita },
      { label: `Obiettivo (${Store.state.settings.mesiFondoTarget} mesi)`, value: f.idealeTarget, color: "var(--accent-sage)" }
    ], { marker: { value: f.attuale, label: "Liquidità attuale" } });

    root.querySelector("#fLiquidita").addEventListener("change", e => {
      s.liquiditaAttuale = parseFloat(e.target.value) || 0;
      Store.save();
      fondoView(root);
    });
  }

  global.Views = global.Views || {};
  global.Views.obiettivi = obiettiviView;
  global.Views["fondo-emergenza"] = fondoView;
})(window);
