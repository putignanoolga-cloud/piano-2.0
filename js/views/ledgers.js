/* Registro Entrate + Registro Spese: two near-identical editable ledgers sharing one renderer. */
(function (global) {
  "use strict";
  const U = global.Utils;

  const filterState = { entrate: { q: "", onlyRef: false }, spese: { q: "", onlyRef: false } };

  function ledger(root, key) {
    const s = Store.state;
    const list = s[key];
    const isSpese = key === "spese";
    const categories = isSpese ? s.settings.categorieSpesa.map(c => c.nome) : s.settings.categorieEntrata;
    const totTutti = isSpese ? Calc.speseTot() : Calc.entrateTot();
    const totMese = isSpese ? Calc.speseMeseRif() : Calc.entrateMeseRif();
    const fs = filterState[key];

    let rows = [...list].sort((a, b) => b.data.localeCompare(a.data) || b.id.localeCompare(a.id));
    if (fs.onlyRef) {
      const { start, end } = U.monthRange(s.settings.meseRif);
      rows = rows.filter(r => U.inRangeExclusive(r.data, start, end));
    }
    if (fs.q.trim()) {
      const q = fs.q.trim().toLowerCase();
      rows = rows.filter(r => (r.descrizione || "").toLowerCase().includes(q) || (r.categoria || "").toLowerCase().includes(q) || (r.note || "").toLowerCase().includes(q));
    }

    root.innerHTML = `
      <div class="view-head">
        <h2>${isSpese ? "Registro Spese" : "Registro Entrate"}</h2>
        <p class="lede">${isSpese ? "Registra qui ogni spesa. Il gruppo (Necessità/Svaghi/Risparmio) viene assegnato in automatico dalla categoria." : "Registra qui ogni entrata: stipendi, incassi, rimborsi ed extra."}</p>
      </div>

      <div class="section grid grid-2">
        ${UI.statTile({ label: "Totale (tutti i periodi)", value: U.formatCurrency(totTutti) })}
        ${UI.statTile({ label: `Totale (${U.formatMonthLabel(s.settings.meseRif)})`, value: U.formatCurrency(totMese), accent: true })}
      </div>

      <div class="card card-flush section">
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:16px 20px;border-bottom:1px solid var(--border)">
          <div style="flex:1;min-width:200px;position:relative">
            <input type="text" id="ledgerSearch" placeholder="Cerca per descrizione, categoria o nota..." value="${U.escapeAttr(fs.q)}" style="padding-left:34px">
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--ink-muted)">${UI.icon("search")}</span>
          </div>
          <label class="checkbox-row"><input type="checkbox" id="onlyRef" ${fs.onlyRef ? "checked" : ""}> Solo ${U.formatMonthLabel(s.settings.meseRif)}</label>
          <button class="btn btn-sm" id="btnCsv">${UI.icon("download")} CSV</button>
        </div>
        <div class="table-wrap"><table>
          <thead><tr>
            <th style="width:118px">Data</th><th>Descrizione</th><th style="width:170px">Categoria</th>
            <th class="num" style="width:110px">Importo</th><th style="width:140px">Metodo</th>
            ${isSpese ? `<th style="width:130px">Gruppo</th>` : ""}
            <th>Note</th><th class="col-tight"></th>
          </tr></thead>
          <tbody>
            ${rows.length ? rows.map(r => rowHtml(r, categories, s.settings.metodiPagamento, isSpese)).join("") : `<tr><td colspan="${isSpese ? 8 : 7}"><div class="empty-state"><div class="title">Nessun movimento trovato</div><p>Aggiungine uno dalla riga qui sotto.</p></div></td></tr>`}
            ${newRowHtml(categories, s.settings.metodiPagamento, isSpese)}
          </tbody>
        </table></div>
      </div>
    `;

    root.querySelector("#ledgerSearch").addEventListener("input", U.debounce(e => { fs.q = e.target.value; ledger(root, key); }, 250));
    root.querySelector("#onlyRef").addEventListener("change", e => { fs.onlyRef = e.target.checked; ledger(root, key); });
    root.querySelector("#btnCsv").addEventListener("click", () => exportCsv(list, isSpese, key));

    root.querySelectorAll("tbody tr[data-id]").forEach(tr => {
      const id = tr.dataset.id;
      const item = list.find(x => x.id === id);
      if (!item) return;
      tr.querySelectorAll("[data-field]").forEach(input => {
        input.addEventListener("change", e => {
          const field = input.dataset.field;
          item[field] = field === "importo" ? (parseFloat(e.target.value) || 0) : e.target.value;
          Store.save();
          ledger(root, key);
        });
      });
      tr.querySelector("[data-del]").addEventListener("click", () => {
        const idx = list.findIndex(x => x.id === id);
        if (idx >= 0) list.splice(idx, 1);
        Store.save();
        UI.toast("Movimento eliminato.");
        ledger(root, key);
      });
    });

    root.querySelector("#addRow").addEventListener("click", () => {
      const get = (sel) => root.querySelector(sel);
      const data = get("#newData").value || U.todayISO();
      const descrizione = get("#newDesc").value.trim();
      const importo = parseFloat(get("#newImporto").value) || 0;
      if (!descrizione || importo <= 0) { UI.toast("Inserisci descrizione e importo per aggiungere il movimento.", "warn"); return; }
      list.push({
        id: U.uid(), data, descrizione,
        categoria: get("#newCategoria").value, importo,
        metodo: get("#newMetodo").value, note: get("#newNote").value.trim()
      });
      Store.save();
      UI.toast("Movimento aggiunto.");
      ledger(root, key);
    });
  }

  function rowHtml(r, categories, metodi, isSpese) {
    const gruppo = isSpese ? Calc.gruppoDiCategoria(r.categoria) : "";
    return `<tr data-id="${r.id}">
      <td><input type="date" data-field="data" value="${U.escapeAttr(r.data)}"></td>
      <td><input type="text" data-field="descrizione" value="${U.escapeAttr(r.descrizione)}"></td>
      <td><select data-field="categoria">${UI.optionsHtml(categories, r.categoria)}</select></td>
      <td class="num"><input type="number" step="0.01" data-field="importo" value="${r.importo}"></td>
      <td><select data-field="metodo">${UI.optionsHtml(metodi, r.metodo)}</select></td>
      ${isSpese ? `<td>${gruppo ? `<span class="dot" style="background:${Charts.colorForGruppo(gruppo)};margin-right:6px"></span>${U.escapeHtml(gruppo)}` : `<span class="muted">—</span>`}</td>` : ""}
      <td><input type="text" data-field="note" value="${U.escapeAttr(r.note || "")}"></td>
      <td class="col-tight"><button class="btn btn-icon btn-danger" data-del title="Elimina">${UI.icon("trash")}</button></td>
    </tr>`;
  }

  function newRowHtml(categories, metodi, isSpese) {
    return `<tr class="row-new">
      <td><input type="date" id="newData" value="${U.todayISO()}"></td>
      <td><input type="text" id="newDesc" placeholder="Descrizione..."></td>
      <td><select id="newCategoria">${UI.optionsHtml(categories, categories[0])}</select></td>
      <td class="num"><input type="number" step="0.01" id="newImporto" placeholder="0,00"></td>
      <td><select id="newMetodo">${UI.optionsHtml(metodi, metodi[0])}</select></td>
      ${isSpese ? `<td class="muted">auto</td>` : ""}
      <td><input type="text" id="newNote" placeholder="Nota (opzionale)"></td>
      <td class="col-tight"><button class="btn btn-icon btn-primary" id="addRow" title="Aggiungi">${UI.icon("plus")}</button></td>
    </tr>`;
  }

  function exportCsv(list, isSpese, key) {
    const header = isSpese ? ["Data", "Descrizione", "Categoria", "Importo", "Metodo", "Gruppo", "Note"] : ["Data", "Descrizione", "Categoria", "Importo", "Metodo", "Note"];
    const rows = [...list].sort((a, b) => a.data.localeCompare(b.data)).map(r => isSpese
      ? [U.formatDateIt(r.data), r.descrizione, r.categoria, r.importo, r.metodo, Calc.gruppoDiCategoria(r.categoria), r.note || ""]
      : [U.formatDateIt(r.data), r.descrizione, r.categoria, r.importo, r.metodo, r.note || ""]);
    U.downloadText(`${key}.csv`, U.toCSV([header, ...rows]), "text/csv;charset=utf-8");
  }

  global.Views = global.Views || {};
  global.Views.entrate = (root) => ledger(root, "entrate");
  global.Views.spese = (root) => ledger(root, "spese");
})(window);
