(function (global) {
  "use strict";
  const U = global.Utils;

  function render(root) {
    const serie = Calc.andamentoMensile();
    const confronto = Calc.confrontoMesePrecedente();
    const medie = Calc.medie();
    const categorie = [...Calc.totaleSpesoPerCategoria()].sort((a, b) => b.totale - a.totale);
    const estreme = Calc.categorieEstreme();
    const storico = Calc.patrimonioStoricoOrdinato();

    root.innerHTML = `
      <div class="view-head">
        <h2>Analisi</h2>
        <p class="lede">Andamento nel tempo, confronti e statistiche automatiche sulle tue finanze.</p>
      </div>

      <div class="row section">
        <div class="card" style="flex:1.6">
          <div class="card-head"><h3>Andamento mensile</h3><span class="muted">ultimi 12 mesi dal mese di riferimento</span></div>
          <div id="trendChart"></div>
        </div>
        <div class="card" style="flex:1">
          <div class="section-title">Confronto con il mese precedente</div>
          <div class="stack" style="gap:10px">
            ${UI.statTile({ label: "Entrate mese corrente", value: U.formatCurrency(confronto.entrateCorrente) })}
            ${UI.statTile({ label: "Variazione entrate", value: U.formatPercent(confronto.variazioneEntrate), sub: `vs ${U.formatCurrency(confronto.entratePrecedente)} mese prec.`, subClass: confronto.variazioneEntrate >= 0 ? "good" : "bad" })}
            ${UI.statTile({ label: "Spese mese corrente", value: U.formatCurrency(confronto.speseCorrente) })}
            ${UI.statTile({ label: "Variazione spese", value: U.formatPercent(confronto.variazioneSpese), sub: `vs ${U.formatCurrency(confronto.spesePrecedente)} mese prec.`, subClass: confronto.variazioneSpese <= 0 ? "good" : "bad" })}
          </div>
        </div>
      </div>

      <div class="section grid grid-4">
        ${UI.statTile({ label: "Media mensile entrate (12 mesi)", value: U.formatCurrency(medie.mediaEntrate) })}
        ${UI.statTile({ label: "Media mensile spese (12 mesi)", value: U.formatCurrency(medie.mediaSpese) })}
        ${UI.statTile({ label: "Media mensile risparmio (12 mesi)", value: U.formatCurrency(medie.mediaRisparmio) })}
        ${UI.statTile({ label: "Media annuale spese (stimata)", value: U.formatCurrency(medie.mediaAnnualeSpese) })}
      </div>

      <div class="row section">
        <div class="card" style="flex:1.4">
          <div class="card-head"><h3>Totale speso per categoria</h3><span class="muted">storico completo</span></div>
          <div id="catBarList"></div>
        </div>
        <div class="card" style="flex:1">
          <div class="section-title">Categorie estreme <span class="muted" style="text-transform:none;font-weight:400">(storico completo)</span></div>
          ${estreme.max ? `
            <div class="stack" style="gap:10px">
              ${UI.statTile({ label: "Categoria con maggiore spesa", value: estreme.max.categoria, sub: U.formatCurrency(estreme.max.totale) })}
              ${UI.statTile({ label: "Categoria con minore spesa", value: estreme.min.categoria, sub: U.formatCurrency(estreme.min.totale) })}
              ${UI.statTile({ label: "Gruppo con minor spesa nel mese", value: estreme.gruppoMinMese.gruppo, sub: U.formatCurrency(estreme.gruppoMinMese.speso) })}
            </div>
            <p class="help" style="margin-top:12px">Il margine di risparmio più interessante si trova spesso nel gruppo con la spesa complessiva più alta, non nel più basso: confronta sempre con il Budget.</p>
          ` : `<div class="empty-state"><div class="title">Nessun dato disponibile</div></div>`}
        </div>
      </div>

      <div class="row section">
        <div class="card" style="flex:1">
          <div class="card-head"><h3>Storico patrimonio netto</h3><span class="muted">aggiornalo manualmente ogni mese</span></div>
          <div id="networthChart"></div>
        </div>
        <div class="card card-flush" style="flex:1">
          <div style="padding:16px 20px 0"><button class="btn btn-primary btn-block" id="logNetWorth">${UI.icon("plus")} Registra patrimonio netto attuale (${U.formatCurrency(Calc.patrimonio().netto)})</button></div>
          <div class="table-wrap" style="margin-top:14px"><table>
            <thead><tr><th>Data</th><th class="num">Patrimonio netto</th><th class="col-tight"></th></tr></thead>
            <tbody>
              ${storico.length ? storico.map(r => `
                <tr data-id="${r.id}">
                  <td><input type="date" data-field="data" value="${U.escapeAttr(r.data)}"></td>
                  <td class="num"><input type="number" step="0.01" data-field="valore" value="${r.valore}"></td>
                  <td class="col-tight"><button class="btn btn-icon btn-danger" data-del>${UI.icon("trash")}</button></td>
                </tr>
              `).join("") : `<tr><td colspan="3"><div class="empty-state"><div class="title">Nessuno storico ancora</div></div></td></tr>`}
            </tbody>
          </table></div>
        </div>
      </div>
    `;

    Charts.lines(root.querySelector("#trendChart"), [
      { label: "Entrate", color: Charts.COLORS.entrate, values: serie.map(s => s.entrate) },
      { label: "Spese", color: Charts.COLORS.spese, values: serie.map(s => s.spese) },
      { label: "Risparmio", color: Charts.COLORS.necessita, values: serie.map(s => s.risparmio) }
    ], serie.map(s => s.label));

    Charts.barList(root.querySelector("#catBarList"), categorie.map(c => ({ label: c.categoria, value: c.totale })), { color: "var(--accent-sage)" });

    if (storico.length) {
      Charts.lines(root.querySelector("#networthChart"), [
        { label: "Patrimonio netto", color: Charts.COLORS.necessita, values: storico.map(r => r.valore) }
      ], storico.map(r => U.formatDateIt(r.data).slice(0, 5)));
    } else {
      root.querySelector("#networthChart").innerHTML = `<div class="empty-state"><div class="title">Registra il tuo patrimonio netto per vedere il grafico</div></div>`;
    }

    const list = Store.state.patrimonioStorico;
    root.querySelectorAll("tbody tr[data-id]").forEach(tr => {
      const item = list.find(x => x.id === tr.dataset.id);
      if (!item) return;
      tr.querySelectorAll("[data-field]").forEach(input => {
        input.addEventListener("change", e => {
          item[input.dataset.field] = input.dataset.field === "valore" ? (parseFloat(e.target.value) || 0) : e.target.value;
          Store.save();
          render(root);
        });
      });
      tr.querySelector("[data-del]").addEventListener("click", () => {
        const idx = list.findIndex(x => x.id === item.id);
        list.splice(idx, 1);
        Store.save();
        render(root);
      });
    });
    root.querySelector("#logNetWorth").addEventListener("click", () => {
      list.push({ id: U.uid(), data: U.todayISO(), valore: Calc.patrimonio().netto });
      Store.save();
      UI.toast("Patrimonio netto registrato.");
      render(root);
    });
  }

  global.Views = global.Views || {};
  global.Views.analisi = render;
})(window);
