(function (global) {
  "use strict";
  const U = global.Utils;

  function render(root) {
    const s = Store.state;
    const d = Calc.dashboard();
    const gruppi = Calc.budgetPerGruppo();
    const configOk = Calc.configOk();

    root.innerHTML = `
      <div class="view-head">
        <h2>Dashboard</h2>
        <p class="lede">La tua situazione finanziaria del mese, a colpo d'occhio — mese di riferimento: <b>${U.formatMonthLabel(s.settings.meseRif)}</b>.</p>
      </div>

      <div class="section grid grid-4">
        ${UI.statTile({ label: "Reddito mensile pianificato", value: U.formatCurrency(d.redditoPianificato), accent: true })}
        ${UI.statTile({ label: "Entrate totali (mese)", value: U.formatCurrency(d.entrateMeseRif) })}
        ${UI.statTile({ label: "Spese totali (mese)", value: U.formatCurrency(d.speseMeseRif) })}
        ${UI.statTile({ label: "Risparmio (mese)", value: U.formatCurrency(d.risparmioMese), sub: d.risparmioMese >= 0 ? "In positivo" : "In negativo", subClass: d.risparmioMese >= 0 ? "good" : "bad" })}
      </div>

      <div class="section grid grid-4">
        ${UI.statTile({ label: "Saldo disponibile (mese)", value: U.formatCurrency(d.saldoDisponibile) })}
        ${UI.statTile({ label: "% di risparmio", value: U.formatPercent(d.pctRisparmio) })}
        ${UI.statTile({ label: "% di spesa", value: U.formatPercent(d.pctSpesa) })}
        ${UI.statTile({ label: "Budget rimanente (pianificato)", value: U.formatCurrency(d.budgetRimanente), sub: d.budgetRimanente >= 0 ? "Sotto budget" : "Sopra budget", subClass: d.budgetRimanente >= 0 ? "good" : "bad" })}
      </div>

      <div class="card section" style="background:${configOk ? "var(--status-good-bg)" : "var(--status-warn-bg)"};border-color:transparent">
        <strong style="color:${configOk ? "var(--status-good-text)" : "var(--status-warn-text)"}">${d.configMessage}</strong>
        ${!configOk ? `<p class="soft" style="margin-top:4px">Vai su Impostazioni e correggi le percentuali di Necessità, Svaghi e Risparmio.</p>` : ""}
      </div>

      <div class="row section">
        <div class="card" style="flex:1.3">
          <div class="card-head"><h3>Avanzamento budget per gruppo</h3><span class="muted">mese di riferimento</span></div>
          <div class="table-wrap"><table>
            <thead><tr><th>Gruppo</th><th class="num">Budget</th><th class="num">Speso</th><th style="width:32%">% utilizzata</th><th>Stato</th></tr></thead>
            <tbody>
              ${gruppi.map(g => `
                <tr>
                  <td><span class="dot" style="background:${Charts.colorForGruppo(g.gruppo)};margin-right:8px"></span>${U.escapeHtml(g.gruppo)}</td>
                  <td class="num">${U.formatCurrency(g.budget)}</td>
                  <td class="num">${U.formatCurrency(g.speso)}</td>
                  <td>${UI.progress(g.pctUsata, { color: g.pctUsata > 0.85 ? "var(--status-critical-text)" : Charts.colorForGruppo(g.gruppo) })}<div class="muted" style="font-size:11px;margin-top:3px">${U.formatPercent(g.pctUsata)}</div></td>
                  <td>${UI.pill(g.stato)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table></div>
        </div>
        <div class="card" id="dashDonut" style="flex:1">
          <div class="card-head"><h3>Spesa per gruppo</h3><span class="muted">mese di riferimento</span></div>
          <div id="dashDonutChart"></div>
        </div>
      </div>
    `;

    Charts.donut(root.querySelector("#dashDonutChart"), gruppi.map(g => ({ label: g.gruppo, value: g.speso, color: Charts.colorForGruppo(g.gruppo) })), {
      centerLabel: "Speso nel mese",
      centerValue: U.formatCurrency(U.sum(gruppi, g => g.speso), true)
    });
  }

  global.Views = global.Views || {};
  global.Views.dashboard = render;
})(window);
