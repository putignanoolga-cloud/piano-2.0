(function (global) {
  "use strict";
  const U = global.Utils;
  let showAllCategories = false;

  function budgetView(root) {
    const s = Store.state;
    const gruppi = Calc.budgetPerGruppo();
    const totale = Calc.budgetTotale();
    let categorie = Calc.budgetPerCategoria();
    categorie = [...categorie].sort((a, b) => b.speso - a.speso);
    const visibili = showAllCategories ? categorie : categorie.filter(c => c.speso > 0);

    root.innerHTML = `
      <div class="view-head">
        <h2>Budget</h2>
        <p class="lede">Confronto tra budget pianificato e spesa reale — mese di riferimento: <b>${U.formatMonthLabel(s.settings.meseRif)}</b>.</p>
      </div>

      <div class="card section">
        <div class="section-title">Riepilogo per gruppo</div>
        <div class="table-wrap"><table>
          <thead><tr><th>Gruppo</th><th class="num">Budget disponibile</th><th class="num">Totale speso</th><th class="num">Differenza</th><th style="width:26%">% utilizzata</th><th>Stato</th></tr></thead>
          <tbody>
            ${gruppi.map(g => `
              <tr>
                <td><span class="dot" style="background:${Charts.colorForGruppo(g.gruppo)};margin-right:8px"></span>${U.escapeHtml(g.gruppo)}</td>
                <td class="num">${U.formatCurrency(g.budget)}</td>
                <td class="num">${U.formatCurrency(g.speso)}</td>
                <td class="num" style="color:${g.differenza < 0 ? "var(--status-critical-text)" : "inherit"}">${U.formatSignedCurrency(g.differenza)}</td>
                <td>${UI.progress(g.pctUsata, { color: g.pctUsata > 0.85 ? "var(--status-critical-text)" : Charts.colorForGruppo(g.gruppo) })}<div class="muted" style="font-size:11px;margin-top:3px">${U.formatPercent(g.pctUsata)}</div></td>
                <td>${UI.pill(g.stato)}</td>
              </tr>
            `).join("")}
          </tbody>
          <tfoot><tr>
            <td>TOTALE</td><td class="num">${U.formatCurrency(totale.budget)}</td><td class="num">${U.formatCurrency(totale.speso)}</td>
            <td class="num">${U.formatSignedCurrency(totale.differenza)}</td><td colspan="2">${U.formatPercent(totale.pctUsata)}</td>
          </tr></tfoot>
        </table></div>
      </div>

      <div class="card section">
        <div class="card-head">
          <h3>Dettaglio per categoria <span class="muted">(mese di riferimento)</span></h3>
          <label class="checkbox-row"><input type="checkbox" id="toggleAll" ${showAllCategories ? "checked" : ""}> Mostra anche le categorie senza spese</label>
        </div>
        <div class="table-wrap"><table>
          <thead><tr><th>Categoria</th><th>Gruppo</th><th class="num">Speso nel mese</th><th style="width:22%">% sul totale speso</th></tr></thead>
          <tbody>
            ${visibili.length ? visibili.map(c => `
              <tr>
                <td>${U.escapeHtml(c.categoria)}</td>
                <td><span class="dot" style="background:${Charts.colorForGruppo(c.gruppo)};margin-right:6px"></span>${U.escapeHtml(c.gruppo)}</td>
                <td class="num">${U.formatCurrency(c.speso)}</td>
                <td>${UI.progress(c.pctSulTotale, { color: "var(--accent-sage)" })}<div class="muted" style="font-size:11px;margin-top:3px">${U.formatPercent(c.pctSulTotale)}</div></td>
              </tr>
            `).join("") : `<tr><td colspan="4"><div class="empty-state"><div class="title">Nessuna spesa nel mese di riferimento</div></div></td></tr>`}
          </tbody>
        </table></div>
      </div>
    `;

    root.querySelector("#toggleAll").addEventListener("change", e => { showAllCategories = e.target.checked; budgetView(root); });
  }

  const GROUP_META = [
    { key: "necessita", label: "Necessità", gruppo: "Necessità" },
    { key: "svaghi", label: "Svaghi", gruppo: "Svaghi" },
    { key: "risparmio", label: "Risparmio e Investimenti", gruppo: "Risparmio/Investimenti" }
  ];

  function affordabilityView(root) {
    const s = Store.state;
    const reddito = Calc.redditoPianificato();

    root.innerHTML = `
      <div class="view-head">
        <h2>Quanto posso permettermi?</h2>
        <p class="lede">Il budget massimo consigliato per ogni area di spesa, calcolato dal tuo reddito e dalle tue percentuali. Questi sono tetti consigliati, non obblighi.</p>
      </div>

      <div class="section grid grid-4">
        ${UI.statTile({ label: "Reddito mensile pianificato", value: U.formatCurrency(reddito), accent: true })}
      </div>

      <div class="stack">
        ${GROUP_META.map(meta => affordabilityGroupHtml(meta)).join("")}
      </div>
    `;

    GROUP_META.forEach(meta => wireGroup(root, meta));
  }

  function affordabilityGroupHtml(meta) {
    const g = Calc.affordabilityGroup(meta.key, meta.gruppo);
    const pesoOk = Math.round(g.totalePesi * 1000) / 1000 === 1;
    return `<div class="card" data-group="${meta.key}">
      <div class="card-head"><h3>${U.escapeHtml(meta.label.toUpperCase())}</h3><span class="muted">Budget di gruppo: <b class="tabular">${U.formatCurrency(g.budget)}</b></span></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Voce</th><th style="width:160px">Peso sul gruppo</th><th class="num">Budget massimo consigliato</th><th class="col-tight"></th></tr></thead>
        <tbody>
          ${g.rows.map((v, i) => `
            <tr data-idx="${i}">
              <td><input type="text" data-field="voce" value="${U.escapeAttr(v.voce)}"></td>
              <td><input type="number" step="0.1" min="0" max="100" data-field="peso" value="${(v.peso * 100).toFixed(1)}"> %</td>
              <td class="num">${U.formatCurrency(v.budgetMassimo)}</td>
              <td class="col-tight"><button class="btn btn-icon btn-danger" data-del>${UI.icon("trash")}</button></td>
            </tr>
          `).join("")}
          <tr class="row-new">
            <td><input type="text" data-new="voce" placeholder="Nuova voce..."></td>
            <td><input type="number" step="0.1" min="0" max="100" data-new="peso" placeholder="0"> %</td>
            <td class="num muted">—</td>
            <td class="col-tight"><button class="btn btn-icon btn-primary" data-add>${UI.icon("plus")}</button></td>
          </tr>
        </tbody>
        <tfoot><tr><td>Totale pesi</td><td colspan="3" style="color:${pesoOk ? "var(--status-good-text)" : "var(--status-warn-text)"}">${U.formatPercent(g.totalePesi)} ${pesoOk ? "✅" : "⚠️ dovrebbe fare 100%"}</td></tr></tfoot>
      </table></div>
    </div>`;
  }

  function wireGroup(root, meta) {
    const card = root.querySelector(`[data-group="${meta.key}"]`);
    const arr = Store.state.affordability[meta.key];
    function commit() { Store.save(); root.innerHTML = ""; affordabilityView(root); }
    card.querySelectorAll("tbody tr[data-idx]").forEach(tr => {
      const i = Number(tr.dataset.idx);
      tr.querySelector('[data-field="voce"]').addEventListener("change", e => { arr[i].voce = e.target.value.trim() || arr[i].voce; commit(); });
      tr.querySelector('[data-field="peso"]').addEventListener("change", e => { arr[i].peso = U.clamp(parseFloat(e.target.value) || 0, 0, 100) / 100; commit(); });
      tr.querySelector("[data-del]").addEventListener("click", () => { arr.splice(i, 1); commit(); });
    });
    card.querySelector("[data-add]").addEventListener("click", () => {
      const voceInput = card.querySelector('[data-new="voce"]');
      const pesoInput = card.querySelector('[data-new="peso"]');
      const voce = voceInput.value.trim();
      if (!voce) return;
      arr.push({ id: U.uid(), voce, peso: U.clamp(parseFloat(pesoInput.value) || 0, 0, 100) / 100 });
      commit();
    });
  }

  global.Views = global.Views || {};
  global.Views.budget = budgetView;
  global.Views.permettermi = affordabilityView;
})(window);
