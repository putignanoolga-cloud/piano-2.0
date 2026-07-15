(function (global) {
  "use strict";
  const U = global.Utils;

  const ATTIVITA_FIELDS = [["contoCorrente", "Conto corrente"], ["contanti", "Contanti"], ["investimenti", "Investimenti"], ["immobili", "Immobili"], ["altriBeni", "Altri beni"]];
  const PASSIVITA_FIELDS = [["mutui", "Mutui"], ["prestiti", "Prestiti"], ["carteCredito", "Carte di credito (saldo)"], ["altriDebiti", "Altri debiti"]];

  function patrimonioView(root) {
    const p = Store.state.patrimonio;
    const c = Calc.patrimonio();

    root.innerHTML = `
      <div class="view-head">
        <h2>Patrimonio Netto</h2>
        <p class="lede">Attività meno Passività = il tuo patrimonio netto reale, aggiornato in automatico.</p>
      </div>

      <div class="section grid grid-3">
        ${UI.statTile({ label: "Totale attività", value: U.formatCurrency(c.attivita) })}
        ${UI.statTile({ label: "Totale passività", value: U.formatCurrency(c.passivita) })}
        ${UI.statTile({ label: "Patrimonio netto", value: U.formatCurrency(c.netto), accent: true })}
      </div>

      <div class="row section">
        <div class="card" style="flex:1">
          <div class="section-title">Attività</div>
          ${ATTIVITA_FIELDS.map(([key, label]) => `<div class="field field-highlight"><label>${label}</label><input type="number" step="0.01" data-key="${key}" value="${p[key]}"></div>`).join("")}
        </div>
        <div class="card" style="flex:1">
          <div class="section-title">Passività</div>
          ${PASSIVITA_FIELDS.map(([key, label]) => `<div class="field field-highlight"><label>${label}</label><input type="number" step="0.01" data-key="${key}" value="${p[key]}"></div>`).join("")}
        </div>
      </div>

      <div class="card section">
        <div class="card-head"><h3>Attività vs Passività</h3></div>
        <div id="netWorthCompare"></div>
      </div>
    `;

    Charts.compareBars(root.querySelector("#netWorthCompare"), [
      { label: "Attività", value: c.attivita, color: "var(--status-good-text)" },
      { label: "Passività", value: c.passivita, color: "var(--status-critical-text)" }
    ]);

    root.querySelectorAll("[data-key]").forEach(input => {
      input.addEventListener("change", e => {
        p[input.dataset.key] = parseFloat(e.target.value) || 0;
        Store.save();
        patrimonioView(root);
      });
    });
  }

  const FREQUENZE = ["Mensile", "Trimestrale", "Annuale", "Settimanale"];

  function abbonamentiView(root) {
    const list = Store.state.abbonamenti;
    const tot = Calc.abbonamentiTotali();
    const sorted = [...tot.rows].sort((a, b) => b.mensile - a.mensile);

    root.innerHTML = `
      <div class="view-head">
        <h2>Abbonamenti</h2>
        <p class="lede">Tieni traccia di tutti gli abbonamenti ricorrenti e scopri quanto ti costano davvero ogni anno.</p>
      </div>

      <div class="section grid grid-2">
        ${UI.statTile({ label: "Totale mensile", value: U.formatCurrency(tot.mensile), accent: true })}
        ${UI.statTile({ label: "Totale annuale", value: U.formatCurrency(tot.annuale) })}
      </div>

      <div class="card card-flush section">
        <div class="table-wrap"><table>
          <thead><tr><th>Servizio</th><th style="width:130px">Costo per rinnovo</th><th style="width:130px">Frequenza</th><th class="num">Mensile equiv.</th><th class="num">Annuale</th><th class="col-tight"></th></tr></thead>
          <tbody>
            ${list.map(a => `
              <tr data-id="${a.id}">
                <td><input type="text" data-field="servizio" value="${U.escapeAttr(a.servizio)}"></td>
                <td class="num"><input type="number" step="0.01" data-field="costo" value="${a.costo}"></td>
                <td><select data-field="frequenza">${UI.optionsHtml(FREQUENZE, a.frequenza)}</select></td>
                <td class="num">${U.formatCurrency(Calc.costoMensileEquivalente(a))}</td>
                <td class="num">${U.formatCurrency(Calc.costoMensileEquivalente(a) * 12)}</td>
                <td class="col-tight"><button class="btn btn-icon btn-danger" data-del>${UI.icon("trash")}</button></td>
              </tr>
            `).join("")}
            <tr class="row-new">
              <td><input type="text" id="newServizio" placeholder="Nuovo servizio..."></td>
              <td class="num"><input type="number" step="0.01" id="newCosto" placeholder="0,00"></td>
              <td><select id="newFrequenza">${UI.optionsHtml(FREQUENZE, "Mensile")}</select></td>
              <td class="num muted">—</td><td class="num muted">—</td>
              <td class="col-tight"><button class="btn btn-icon btn-primary" id="addAbb">${UI.icon("plus")}</button></td>
            </tr>
          </tbody>
          <tfoot><tr><td>TOTALE</td><td></td><td></td><td class="num">${U.formatCurrency(tot.mensile)}</td><td class="num">${U.formatCurrency(tot.annuale)}</td><td></td></tr></tfoot>
        </table></div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Costo mensile per servizio</h3></div>
        <div id="abbBarList"></div>
      </div>
    `;

    Charts.barList(root.querySelector("#abbBarList"), sorted.map(a => ({ label: a.servizio, value: a.mensile })), { color: "var(--brand)" });

    root.querySelectorAll("tbody tr[data-id]").forEach(tr => {
      const item = list.find(x => x.id === tr.dataset.id);
      if (!item) return;
      tr.querySelectorAll("[data-field]").forEach(input => {
        input.addEventListener("change", e => {
          item[input.dataset.field] = input.dataset.field === "costo" ? (parseFloat(e.target.value) || 0) : e.target.value;
          Store.save();
          abbonamentiView(root);
        });
      });
      tr.querySelector("[data-del]").addEventListener("click", () => {
        const idx = list.findIndex(x => x.id === item.id);
        list.splice(idx, 1);
        Store.save();
        abbonamentiView(root);
      });
    });
    root.querySelector("#addAbb").addEventListener("click", () => {
      const servizio = root.querySelector("#newServizio").value.trim();
      if (!servizio) { UI.toast("Inserisci il nome del servizio.", "warn"); return; }
      list.push({ id: U.uid(), servizio, costo: parseFloat(root.querySelector("#newCosto").value) || 0, frequenza: root.querySelector("#newFrequenza").value });
      Store.save();
      abbonamentiView(root);
    });
  }

  function calendarioView(root) {
    const s = Store.state;
    const cal = Calc.calendarioPagamenti();
    const rows = [...cal.rows].sort((a, b) => (a.prossimaScadenza || "").localeCompare(b.prossimaScadenza || ""));
    const categorieList = s.settings.categorieSpesa.map(c => c.nome);

    root.innerHTML = `
      <div class="view-head">
        <h2>Calendario Pagamenti</h2>
        <p class="lede">Tutte le scadenze in un unico posto: affitto, bollette, assicurazioni, abbonamenti, prestiti.</p>
      </div>

      <div class="section grid grid-2">
        ${UI.statTile({ label: "Totale impegni mensili programmati", value: U.formatCurrency(cal.totale), accent: true })}
        ${UI.statTile({ label: "In arrivo o scaduti", value: String(rows.filter(r => r.avviso === "In arrivo" || r.avviso === "Scaduto").length), sub: "entro 7 giorni o già scaduti" })}
      </div>

      <datalist id="categorieDatalist">${categorieList.map(c => `<option value="${U.escapeAttr(c)}">`).join("")}</datalist>

      <div class="card card-flush">
        <div class="table-wrap"><table>
          <thead><tr><th>Pagamento</th><th style="width:170px">Categoria</th><th class="num" style="width:110px">Importo</th><th style="width:150px">Prossima scadenza</th><th class="num" style="width:110px">Giorni</th><th>Avviso</th><th class="col-tight"></th></tr></thead>
          <tbody>
            ${rows.length ? rows.map(r => `
              <tr data-id="${r.id}">
                <td><input type="text" data-field="pagamento" value="${U.escapeAttr(r.pagamento)}"></td>
                <td><input type="text" list="categorieDatalist" data-field="categoria" value="${U.escapeAttr(r.categoria || "")}"></td>
                <td class="num"><input type="number" step="0.01" data-field="importo" value="${r.importo}"></td>
                <td><input type="date" data-field="prossimaScadenza" value="${U.escapeAttr(r.prossimaScadenza || "")}"></td>
                <td class="num">${r.giorniRimanenti != null ? r.giorniRimanenti : "—"}</td>
                <td>${r.avviso ? UI.pill(r.avviso) : ""}</td>
                <td class="col-tight"><button class="btn btn-icon btn-danger" data-del>${UI.icon("trash")}</button></td>
              </tr>
            `).join("") : `<tr><td colspan="7"><div class="empty-state"><div class="title">Nessuna scadenza registrata</div></div></td></tr>`}
            <tr class="row-new">
              <td><input type="text" id="newPagamento" placeholder="Es. Affitto..."></td>
              <td><input type="text" list="categorieDatalist" id="newCategoria" placeholder="Categoria..."></td>
              <td class="num"><input type="number" step="0.01" id="newImporto" placeholder="0,00"></td>
              <td><input type="date" id="newScadenza" value="${U.todayISO()}"></td>
              <td colspan="2" class="muted">—</td>
              <td class="col-tight"><button class="btn btn-icon btn-primary" id="addPag">${UI.icon("plus")}</button></td>
            </tr>
          </tbody>
        </table></div>
      </div>
    `;

    const list = s.calendarioPagamenti;
    root.querySelectorAll("tbody tr[data-id]").forEach(tr => {
      const item = list.find(x => x.id === tr.dataset.id);
      if (!item) return;
      tr.querySelectorAll("[data-field]").forEach(input => {
        input.addEventListener("change", e => {
          item[input.dataset.field] = input.dataset.field === "importo" ? (parseFloat(e.target.value) || 0) : e.target.value;
          Store.save();
          calendarioView(root);
        });
      });
      tr.querySelector("[data-del]").addEventListener("click", () => {
        const idx = list.findIndex(x => x.id === item.id);
        list.splice(idx, 1);
        Store.save();
        calendarioView(root);
      });
    });
    root.querySelector("#addPag").addEventListener("click", () => {
      const pagamento = root.querySelector("#newPagamento").value.trim();
      if (!pagamento) { UI.toast("Inserisci il nome del pagamento.", "warn"); return; }
      list.push({
        id: U.uid(), pagamento,
        categoria: root.querySelector("#newCategoria").value.trim(),
        importo: parseFloat(root.querySelector("#newImporto").value) || 0,
        prossimaScadenza: root.querySelector("#newScadenza").value || U.todayISO()
      });
      Store.save();
      calendarioView(root);
    });
  }

  global.Views = global.Views || {};
  global.Views.patrimonio = patrimonioView;
  global.Views.abbonamenti = abbonamentiView;
  global.Views.calendario = calendarioView;
})(window);
