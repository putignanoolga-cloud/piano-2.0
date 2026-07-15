(function (global) {
  "use strict";
  const U = global.Utils;

  function render(root) {
    const mese = U.todayISO();
    const entrate = Calc.entrateMese(mese);
    const uscite = Calc.usciteMese(mese);
    const risparmiato = entrate - uscite;
    const hasPIVA = Calc.hasPartitaIVA();
    const disponibile = Calc.disponibile();
    const accantonato = Calc.accantonatoResiduo();
    const obiettivi = Store.state.obiettivi.slice(0, 3);
    const scadenze = Calc.scadenze().filter(s => s.avviso !== "").slice(0, 3);
    const primoNome = (Store.state.profilo.nome || "").trim().split(/\s+/)[0];
    const budgetGruppi = Calc.redditoBaseBudget() > 0 ? Calc.budgetPerGruppo(mese) : null;

    root.innerHTML = `
      <div class="view-head">
        <h2>Ciao${primoNome ? " " + U.escapeHtml(primoNome) : ""}! 👋</h2>
        <p class="lede">Ecco la tua situazione a colpo d'occhio — ${U.formatMonthLabel(mese)}.</p>
      </div>

      <div class="section grid grid-2">
        <button class="quicklink" style="justify-content:center;padding:18px;font-size:14px" data-go="movimenti?add=entrata">${UI.icon("arrowDown")} Registra un'entrata</button>
        <button class="quicklink" style="justify-content:center;padding:18px;font-size:14px" data-go="movimenti?add=uscita">${UI.icon("arrowUp")} Registra una spesa</button>
      </div>

      <div class="section-title">Questo mese</div>
      <div class="section grid grid-3">
        ${UI.statTile({ label: "Entrate", value: U.formatCurrency(entrate) })}
        ${UI.statTile({ label: "Uscite", value: U.formatCurrency(uscite) })}
        ${UI.statTile({ label: "Risparmiato", value: U.formatSignedCurrency(risparmiato), accent: true })}
      </div>

      <div class="section-title">La tua situazione</div>
      <div class="section grid ${hasPIVA ? "grid-2" : "grid-2"}">
        ${hasPIVA ? UI.statTile({ label: "Accantonato per tasse", value: U.formatCurrency(accantonato), sub: "da non spendere" }) : ""}
        ${UI.statTile({ label: "Disponibile", value: U.formatCurrency(disponibile), accent: true, sub: hasPIVA ? "al netto delle tasse accantonate" : null })}
      </div>

      ${budgetGruppi ? `
        <div class="section-title">Il tuo budget del mese</div>
        <div class="card section">
          ${budgetGruppi.map(g => `
            <div style="margin-bottom:14px">
              <div class="progress-label"><span>${U.escapeHtml(g.gruppo)}</span><span class="muted">${U.formatCurrency(g.speso)} / ${U.formatCurrency(g.budget)}</span></div>
              ${UI.progress(g.pctUsata, { color: g.pctUsata > 0.85 ? "var(--status-critical-text)" : Charts.colorForGruppo(g.gruppo) })}
            </div>
          `).join("")}
          <p class="help" style="margin-top:2px">Basato sul reddito mensile e sulle percentuali che hai scelto — modificabili dall'icona ⚙️.</p>
        </div>
      ` : ""}

      <div class="row section">
        <div class="card" style="flex:1">
          <div class="card-head"><h3>Entrate e uscite</h3><span class="muted">questo mese</span></div>
          <div id="homeDonut"></div>
        </div>
        <div class="card" style="flex:1">
          <div class="card-head"><h3>Obiettivi di risparmio</h3><a href="#/obiettivi" class="table-toggle">Vedi tutti</a></div>
          ${obiettivi.length ? obiettivi.map(o => {
            const c = Calc.obiettivo(o);
            return `<div style="margin-bottom:14px">
              <div class="progress-label"><span>${U.escapeHtml(o.nome)}</span><span class="muted">${U.formatPercent(c.pctCompletata)}</span></div>
              ${UI.progress(c.pctCompletata, { color: c.completato ? "var(--status-good-text)" : "var(--brand)" })}
            </div>`;
          }).join("") : `<div class="empty-state"><div class="title">Nessun obiettivo ancora</div><p><a href="#/obiettivi">Creane uno</a></p></div>`}
        </div>
      </div>

      <div class="card section">
        <div class="card-head"><h3>Prossime scadenze</h3><a href="#/scadenze" class="table-toggle">Vedi tutte</a></div>
        ${scadenze.length ? `<div class="table-wrap"><table><tbody>
          ${scadenze.map(s => `<tr><td>${U.escapeHtml(s.descrizione)}</td><td class="num">${U.formatCurrency(s.importo)}</td><td>${U.formatDateIt(s.data)}</td><td>${UI.pill(s.avviso)}</td></tr>`).join("")}
        </tbody></table></div>` : `<div class="empty-state"><div class="title">Nessuna scadenza imminente</div></div>`}
      </div>
    `;

    Charts.donut(root.querySelector("#homeDonut"), [
      { label: "Entrate", value: entrate, color: Charts.COLORS.entrate },
      { label: "Uscite", value: uscite, color: Charts.COLORS.spese }
    ], { centerLabel: "questo mese", centerValue: U.formatCurrency(entrate + uscite, true) });

    root.querySelectorAll("[data-go]").forEach(btn => {
      btn.addEventListener("click", () => { location.hash = "#/" + btn.dataset.go; });
    });
  }

  global.Views = global.Views || {};
  global.Views.home = render;
})(window);
