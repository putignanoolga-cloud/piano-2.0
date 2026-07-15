/* Entrate e Uscite: one unified, editable list instead of two separate registries. */
(function (global) {
  "use strict";
  const U = global.Utils;

  let currentMonth = U.firstOfMonthISO(U.todayISO());
  let filterTipo = "tutti";
  let addTipo = "entrata";
  let initializedFromQuery = false;

  function render(root) {
    if (!initializedFromQuery) {
      initializedFromQuery = true;
      const q = (location.hash.split("?")[1] || "");
      const params = new URLSearchParams(q);
      if (params.get("add") === "uscita") addTipo = "uscita";
      if (params.get("add") === "entrata") addTipo = "entrata";
    }

    const list = Store.state.movimenti;
    const inMonth = Calc.inMonth(list, currentMonth).sort((a, b) => b.data.localeCompare(a.data));
    const rows = filterTipo === "tutti" ? inMonth : inMonth.filter(m => m.tipo === filterTipo);
    const entrateMese = Calc.entrateMese(currentMonth);
    const usciteMese = Calc.usciteMese(currentMonth);

    root.innerHTML = `
      <div class="view-head">
        <h2>Entrate e Uscite</h2>
        <p class="lede">Tutti i tuoi movimenti in un unico posto. Aggiungine uno dal modulo qui sotto.</p>
      </div>

      <div class="section" style="display:flex;align-items:center;justify-content:center;gap:14px">
        <button class="btn btn-icon" id="prevMonth" style="transform:scaleX(-1)" title="Mese precedente">${UI.icon("chevronRight")}</button>
        <div style="font-weight:700;min-width:160px;text-align:center">${U.formatMonthLabel(currentMonth)}</div>
        <button class="btn btn-icon" id="nextMonth" title="Mese successivo">${UI.icon("chevronRight")}</button>
      </div>

      <div class="section grid grid-3">
        ${UI.statTile({ label: "Entrate del mese", value: U.formatCurrency(entrateMese) })}
        ${UI.statTile({ label: "Uscite del mese", value: U.formatCurrency(usciteMese) })}
        ${UI.statTile({ label: "Saldo del mese", value: U.formatSignedCurrency(entrateMese - usciteMese), accent: true })}
      </div>

      <div class="card card-flush section">
        <div style="display:flex;gap:8px;padding:16px 20px;border-bottom:1px solid var(--border)">
          ${["tutti", "entrata", "uscita"].map(t => `<button class="btn btn-sm ${filterTipo === t ? "btn-primary" : ""}" data-filter="${t}">${t === "tutti" ? "Tutti" : (t === "entrata" ? "Entrate" : "Uscite")}</button>`).join("")}
        </div>
        <div class="table-wrap"><table>
          <thead><tr><th style="width:118px">Data</th><th>Descrizione</th><th style="width:170px">Categoria</th><th class="num" style="width:120px">Importo</th><th>Nota</th><th class="col-tight"></th></tr></thead>
          <tbody>
            ${rows.length ? rows.map(rowHtml).join("") : `<tr><td colspan="6"><div class="empty-state"><div class="title">Nessun movimento in questo mese</div></div></td></tr>`}
          </tbody>
        </table></div>
      </div>

      <div class="card section">
        <div class="card-head"><h3>Aggiungi un movimento</h3></div>
        <div class="field-row">
          <div class="field"><label>Tipo</label>
            <select id="addTipo">
              <option value="entrata" ${addTipo === "entrata" ? "selected" : ""}>Entrata</option>
              <option value="uscita" ${addTipo === "uscita" ? "selected" : ""}>Uscita</option>
            </select>
          </div>
          <div class="field"><label>Data</label><input type="date" id="addData" value="${U.todayISO()}"></div>
          <div class="field"><label>Importo</label><input type="number" step="0.01" id="addImporto" placeholder="0,00"></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Descrizione</label><input type="text" id="addDesc" placeholder="Es. Stipendio, spesa, fattura..."></div>
          <div class="field"><label>Categoria</label><select id="addCategoria">${categorieOptionsHtml(addTipo)}</select></div>
        </div>
        ${addTipo === "uscita" ? `<label class="checkbox-row" style="margin-bottom:14px"><input type="checkbox" id="addPagamentoTasse"> Questo pagamento riguarda le tasse/contributi accantonati</label>` : ""}
        <div id="pivaHint" class="help" style="margin-bottom:10px"></div>
        <div class="field"><label>Nota <span class="muted">(opzionale)</span></label><input type="text" id="addNote" placeholder="..."></div>
        <button class="btn btn-primary" id="addBtn">${UI.icon("plus")} Aggiungi movimento</button>
      </div>
    `;

    root.querySelector("#prevMonth").addEventListener("click", () => { currentMonth = U.addMonthsISO(currentMonth, -1); render(root); });
    root.querySelector("#nextMonth").addEventListener("click", () => { currentMonth = U.addMonthsISO(currentMonth, 1); render(root); });
    root.querySelectorAll("[data-filter]").forEach(btn => btn.addEventListener("click", () => { filterTipo = btn.dataset.filter; render(root); }));

    root.querySelectorAll("tbody tr[data-id]").forEach(tr => {
      tr.querySelector("[data-del]").addEventListener("click", () => {
        const idx = list.findIndex(x => x.id === tr.dataset.id);
        if (idx >= 0) list.splice(idx, 1);
        Store.save();
        UI.toast("Movimento eliminato.");
        render(root);
      });
    });

    const categoriaSel = root.querySelector("#addCategoria");
    const importoInput = root.querySelector("#addImporto");
    function updateHint() {
      const hint = root.querySelector("#pivaHint");
      if (addTipo === "entrata" && categoriaSel.value === Store.CATEGORIA_FATTURA) {
        const importo = parseFloat(importoInput.value) || 0;
        const pct = Store.state.settings.accantonamentoPct;
        hint.innerHTML = `→ Accantoneremo automaticamente il <b>${U.formatPercent(pct)}</b> per le tasse: <b>${U.formatCurrency(importo * pct)}</b>.`;
      } else {
        hint.textContent = "";
      }
    }
    updateHint();
    importoInput.addEventListener("input", updateHint);
    categoriaSel.addEventListener("change", () => {
      const tasseCheckbox = root.querySelector("#addPagamentoTasse");
      if (tasseCheckbox && categoriaSel.value === Store.CATEGORIA_TASSE) tasseCheckbox.checked = true;
      updateHint();
    });
    root.querySelector("#addTipo").addEventListener("change", (e) => { addTipo = e.target.value; render(root); });

    root.querySelector("#addBtn").addEventListener("click", () => {
      const descrizione = root.querySelector("#addDesc").value.trim();
      const importo = parseFloat(importoInput.value) || 0;
      if (!descrizione || importo <= 0) { UI.toast("Inserisci descrizione e importo.", "warn"); return; }
      const item = {
        id: U.uid(), tipo: addTipo, data: root.querySelector("#addData").value || U.todayISO(),
        descrizione, categoria: categoriaSel.value, importo, note: root.querySelector("#addNote").value.trim()
      };
      if (addTipo === "uscita") item.pagamentoTasse = !!root.querySelector("#addPagamentoTasse").checked;
      list.push(item);
      Store.save();
      UI.toast("Movimento aggiunto.");
      render(root);
    });
  }

  function categorieOptionsHtml(tipo) {
    const cats = tipo === "entrata" ? Store.CATEGORIE_ENTRATA : Store.CATEGORIE_USCITA;
    return UI.optionsHtml(cats, cats[0]);
  }

  function rowHtml(r) {
    const isEntrata = r.tipo === "entrata";
    return `<tr data-id="${r.id}">
      <td>${U.formatDateIt(r.data)}</td>
      <td>${U.escapeHtml(r.descrizione)}${r.pagamentoTasse ? ` <span class="pill pill-neutral">tasse</span>` : ""}</td>
      <td>${U.escapeHtml(r.categoria)}</td>
      <td class="num" style="color:${isEntrata ? "var(--status-good-text)" : "var(--ink)"}">${isEntrata ? "+" : "−"} ${U.formatCurrency(r.importo)}</td>
      <td class="muted">${U.escapeHtml(r.note || "")}</td>
      <td class="col-tight"><button class="btn btn-icon btn-danger" data-del title="Elimina">${UI.icon("trash")}</button></td>
    </tr>`;
  }

  global.Views = global.Views || {};
  global.Views.movimenti = render;
})(window);
