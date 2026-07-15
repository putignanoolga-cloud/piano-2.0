(function (global) {
  "use strict";
  const U = global.Utils;

  function render(root) {
    const list = Store.state.scadenze;
    const rows = Calc.scadenze();
    const hasPIVA = Calc.hasPartitaIVA();
    const pct = Store.state.settings.accantonamentoPct;

    root.innerHTML = `
      <div class="view-head">
        <h2>Scadenze</h2>
        <p class="lede">Le prossime scadenze da non dimenticare: bollette, tasse, contributi.</p>
      </div>

      ${hasPIVA ? `
        <div class="card section">
          <div class="section-title">Accantonamento per le tasse</div>
          <p class="help" style="margin-bottom:14px">Ogni volta che registri un'entrata come "Fattura (Partita IVA)", mettiamo da parte automaticamente una percentuale per te, così non la spendi per sbaglio. Quando paghi tasse o contributi, spunta "riguarda le tasse accantonate" in quella spesa per scalarla da qui.</p>
          <div class="grid grid-3">
            ${UI.statTile({ label: "Percentuale accantonata", value: U.formatPercent(pct) })}
            ${UI.statTile({ label: "Accantonato finora", value: U.formatCurrency(Calc.accantonatoStorico()) })}
            ${UI.statTile({ label: "Ancora disponibile per le tasse", value: U.formatCurrency(Calc.accantonatoResiduo()), accent: true })}
          </div>
          <p class="help" style="margin-top:12px">Puoi cambiare la percentuale dall'icona ⚙️ in alto.</p>
        </div>
      ` : ""}

      <div class="card card-flush section">
        <div class="table-wrap"><table>
          <thead><tr><th>Descrizione</th><th class="num" style="width:110px">Importo</th><th style="width:150px">Data scadenza</th><th class="num" style="width:90px">Giorni</th><th>Avviso</th><th class="col-tight"></th></tr></thead>
          <tbody>
            ${rows.length ? rows.map(r => `
              <tr data-id="${r.id}">
                <td><input type="text" data-field="descrizione" value="${U.escapeAttr(r.descrizione)}"></td>
                <td class="num"><input type="number" step="0.01" data-field="importo" value="${r.importo}"></td>
                <td><input type="date" data-field="data" value="${U.escapeAttr(r.data)}"></td>
                <td class="num">${r.giorniRimanenti != null ? r.giorniRimanenti : "—"}</td>
                <td>${r.avviso ? UI.pill(r.avviso) : ""}</td>
                <td class="col-tight"><button class="btn btn-icon btn-danger" data-del>${UI.icon("trash")}</button></td>
              </tr>
            `).join("") : `<tr><td colspan="6"><div class="empty-state"><div class="title">Nessuna scadenza registrata</div></div></td></tr>`}
            <tr class="row-new">
              <td><input type="text" id="newDesc" placeholder="Es. Bolletta, F24..."></td>
              <td class="num"><input type="number" step="0.01" id="newImporto" placeholder="0,00"></td>
              <td><input type="date" id="newData" value="${U.todayISO()}"></td>
              <td colspan="2" class="muted">—</td>
              <td class="col-tight"><button class="btn btn-icon btn-primary" id="addScadenza">${UI.icon("plus")}</button></td>
            </tr>
          </tbody>
        </table></div>
      </div>
    `;

    root.querySelectorAll("tbody tr[data-id]").forEach(tr => {
      const item = list.find(x => x.id === tr.dataset.id);
      if (!item) return;
      tr.querySelectorAll("[data-field]").forEach(input => {
        input.addEventListener("change", e => {
          item[input.dataset.field] = input.dataset.field === "importo" ? (parseFloat(e.target.value) || 0) : e.target.value;
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

    root.querySelector("#addScadenza").addEventListener("click", () => {
      const descrizione = root.querySelector("#newDesc").value.trim();
      if (!descrizione) { UI.toast("Inserisci una descrizione.", "warn"); return; }
      list.push({ id: U.uid(), descrizione, importo: parseFloat(root.querySelector("#newImporto").value) || 0, data: root.querySelector("#newData").value || U.todayISO() });
      Store.save();
      render(root);
    });
  }

  global.Views = global.Views || {};
  global.Views.scadenze = render;
})(window);
