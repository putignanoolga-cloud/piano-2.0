(function (global) {
  "use strict";
  const U = global.Utils;

  function render(root) {
    const list = Store.state.obiettivi;

    root.innerHTML = `
      <div class="view-head">
        <h2>Obiettivi di risparmio</h2>
        <p class="lede">Crea e monitora i tuoi obiettivi: fondo emergenza, vacanza, un acquisto importante...</p>
      </div>
      <div class="section" style="display:flex;justify-content:flex-end">
        <button class="btn btn-primary" id="addGoal">${UI.icon("plus")} Nuovo obiettivo</button>
      </div>
      <div class="goal-grid">
        ${list.length ? list.map(goalCardHtml).join("") : `<div class="empty-state" style="grid-column:1/-1"><div class="title">Nessun obiettivo ancora</div><p>Aggiungine uno per iniziare a mettere via qualcosa ogni mese.</p></div>`}
      </div>
    `;

    root.querySelector("#addGoal").addEventListener("click", () => {
      list.push({ id: U.uid(), nome: "Nuovo obiettivo", importoObiettivo: 1000, importoRaggiunto: 0, risparmioMensile: 0 });
      Store.save();
      render(root);
    });

    list.forEach(o => {
      const card = root.querySelector(`[data-id="${o.id}"]`);
      if (!card) return;
      function commit() { Store.save(); render(root); }
      card.querySelector('[data-field="nome"]').addEventListener("change", e => { o.nome = e.target.value.trim() || o.nome; commit(); });
      card.querySelector('[data-field="importoObiettivo"]').addEventListener("change", e => { o.importoObiettivo = parseFloat(e.target.value) || 0; commit(); });
      card.querySelector('[data-field="importoRaggiunto"]').addEventListener("change", e => { o.importoRaggiunto = parseFloat(e.target.value) || 0; commit(); });
      card.querySelector('[data-field="risparmioMensile"]').addEventListener("change", e => { o.risparmioMensile = Math.max(0, parseFloat(e.target.value) || 0); commit(); });
      card.querySelector("[data-del]").addEventListener("click", async () => {
        const ok = await UI.confirmDialog({ title: "Eliminare obiettivo?", text: `"${o.nome}" verrà eliminato definitivamente.`, confirmLabel: "Elimina", danger: true });
        if (ok) { const idx = list.findIndex(x => x.id === o.id); list.splice(idx, 1); commit(); }
      });
    });
  }

  function goalCardHtml(o) {
    const c = Calc.obiettivo(o);
    const color = c.completato ? "var(--status-good-text)" : "var(--brand)";
    return `<div class="goal-card" data-id="${o.id}">
      <div class="goal-card-head">
        <input type="text" class="goal-name" data-field="nome" value="${U.escapeAttr(o.nome)}">
        <button class="btn btn-icon btn-danger" data-del title="Elimina">${UI.icon("trash")}</button>
      </div>
      <div>
        <div class="progress-label"><span>${U.formatPercent(c.pctCompletata)} completato ${c.completato ? "🎉" : ""}</span><span class="muted">${U.formatCurrency(o.importoRaggiunto)} / ${U.formatCurrency(o.importoObiettivo)}</span></div>
        ${UI.progress(c.pctCompletata, { color })}
      </div>
      <div class="field-row">
        <div class="field"><label>Obiettivo</label><input type="number" step="0.01" data-field="importoObiettivo" value="${o.importoObiettivo}"></div>
        <div class="field"><label>Raggiunto finora</label><input type="number" step="0.01" data-field="importoRaggiunto" value="${o.importoRaggiunto}"></div>
      </div>
      <div class="field"><label>Quanto risparmi al mese per questo</label><input type="number" step="0.01" data-field="risparmioMensile" value="${o.risparmioMensile}"></div>
      ${!c.completato && typeof c.mesiStimati === "number" ? `<div class="muted" style="font-size:12.5px">Ce la fai tra circa <b>${c.mesiStimati}</b> mesi, continuando così.</div>` : ""}
    </div>`;
  }

  global.Views = global.Views || {};
  global.Views.obiettivi = render;
})(window);
