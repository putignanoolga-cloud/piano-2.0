/* First-run wizard: name -> employee/partita IVA -> quick explainer -> percentage
   split -> monthly income. Writes straight into Store.state.profilo and hands
   control back to app.js via onComplete. */
(function (global) {
  "use strict";
  const U = global.Utils;
  const STEPS = 5;

  function run(root, onComplete) {
    const p = Store.state.profilo;
    const draft = {
      nome: p.nome || "",
      tipo: p.tipo || null,
      presetId: "equilibrato",
      pctNecessita: p.pctNecessita || 0.5,
      pctSvaghi: p.pctSvaghi || 0.3,
      pctRisparmio: p.pctRisparmio || 0.2,
      custom: false,
      redditoMensile: p.redditoMensile || "",
      accantonamentoPct: (Store.state.settings.accantonamentoPct || 0.3) * 100
    };
    let step = 0;

    function primoNome() { return (draft.nome.trim().split(/\s+/)[0]) || "amica o amico"; }

    function canAdvance() {
      if (step === 0) return draft.nome.trim().length > 0;
      if (step === 1) return !!draft.tipo;
      if (step === 3) return draft.custom ? Math.round((draft.pctNecessita + draft.pctSvaghi + draft.pctRisparmio) * 100) === 100 : true;
      if (step === 4) return Number(draft.redditoMensile) > 0;
      return true;
    }

    function content() {
      if (step === 0) return `
        <div class="onboarding-title">Come ti chiami?</div>
        <div class="onboarding-sub">Così possiamo darti il benvenuto come si deve.</div>
        <input type="text" id="obNome" placeholder="Nome e Cognome" value="${U.escapeAttr(draft.nome)}" style="font-size:16px;text-align:center;padding:14px;margin-bottom:8px" autofocus>
      `;
      if (step === 1) return `
        <div class="onboarding-title">Ciao ${U.escapeHtml(primoNome())}! 👋</div>
        <div class="onboarding-sub">Sei dipendente o hai la partita IVA?</div>
        <div class="choice-grid">
          <div class="choice-card ${draft.tipo === "dipendente" ? "selected" : ""}" data-tipo="dipendente">
            <div class="icon-big">💼</div><h4>Dipendente</h4><p class="muted" style="font-size:12px">Stipendio fisso ogni mese</p>
          </div>
          <div class="choice-card ${draft.tipo === "partita_iva" ? "selected" : ""}" data-tipo="partita_iva">
            <div class="icon-big">🧾</div><h4>Partita IVA</h4><p class="muted" style="font-size:12px">Fatturi e gestisci le tasse da solo</p>
          </div>
        </div>
      `;
      if (step === 2) return `
        <div class="onboarding-title">Un metodo semplice</div>
        <div class="onboarding-sub">Ogni mese dividiamo quello che guadagni in 3 parti.</div>
        <div style="display:flex;flex-direction:column;gap:14px;text-align:left">
          <div style="display:flex;gap:12px;align-items:flex-start"><span class="dot" style="background:${Charts.COLORS.necessita};margin-top:5px"></span><div><b>Necessità</b><p class="muted" style="font-size:12.5px;margin-top:2px">Casa, bollette, spesa, trasporti, salute.</p></div></div>
          <div style="display:flex;gap:12px;align-items:flex-start"><span class="dot" style="background:${Charts.COLORS.svaghi};margin-top:5px"></span><div><b>Svaghi</b><p class="muted" style="font-size:12.5px;margin-top:2px">Uscite, shopping, tempo libero.</p></div></div>
          <div style="display:flex;gap:12px;align-items:flex-start"><span class="dot" style="background:${Charts.COLORS.risparmio};margin-top:5px"></span><div><b>Risparmio</b><p class="muted" style="font-size:12.5px;margin-top:2px">Quello che metti da parte per il futuro.</p></div></div>
        </div>
        ${draft.tipo === "partita_iva" ? `<p class="help" style="margin-top:18px">Nel tuo caso mettiamo prima via una percentuale per le tasse, poi dividiamo il resto in queste 3 parti.</p>` : ""}
      `;
      if (step === 3) return `
        <div class="onboarding-title">Come vuoi dividerlo?</div>
        <div class="onboarding-sub">Scegli lo stile che ti rappresenta di più. Potrai cambiarlo quando vuoi.</div>
        <div class="stack" style="gap:10px;margin-bottom:6px">
          ${Store.PRESET_PERCENTUALI.map(pr => `
            <div class="choice-card preset-card ${!draft.custom && draft.presetId === pr.id ? "selected" : ""}" data-preset="${pr.id}" style="text-align:left">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div><h4 style="display:inline">${pr.label}</h4> <span class="muted" style="font-size:12px">— ${pr.nota}</span></div>
                <div class="tabular" style="font-size:13px;font-weight:700">${Math.round(pr.necessita * 100)} / ${Math.round(pr.svaghi * 100)} / ${Math.round(pr.risparmio * 100)}</div>
              </div>
              <div class="progress-track" style="height:8px;display:flex;overflow:hidden;margin-top:8px">
                <div style="width:${pr.necessita * 100}%;background:${Charts.COLORS.necessita}"></div>
                <div style="width:${pr.svaghi * 100}%;background:${Charts.COLORS.svaghi}"></div>
                <div style="width:${pr.risparmio * 100}%;background:${Charts.COLORS.risparmio}"></div>
              </div>
            </div>
          `).join("")}
          <div class="choice-card ${draft.custom ? "selected" : ""}" data-preset="custom" style="text-align:left">
            <h4>Personalizza</h4>
            ${draft.custom ? `
              <div class="field-row" style="margin-top:10px">
                <div class="field"><label>Necessità %</label><input type="number" id="obPctN" min="0" max="100" value="${Math.round(draft.pctNecessita * 100)}"></div>
                <div class="field"><label>Svaghi %</label><input type="number" id="obPctS" min="0" max="100" value="${Math.round(draft.pctSvaghi * 100)}"></div>
                <div class="field"><label>Risparmio %</label><input type="number" id="obPctR" min="0" max="100" value="${Math.round(draft.pctRisparmio * 100)}"></div>
              </div>
              <div class="muted" id="obPctSum" style="font-size:12px"></div>
            ` : `<p class="muted" style="font-size:12px;margin-top:4px">Scegli tu le tre percentuali (devono sommare a 100%).</p>`}
          </div>
        </div>
      `;
      if (step === 4) return `
        <div class="onboarding-title">Qual è il tuo reddito mensile?</div>
        <div class="onboarding-sub">${draft.tipo === "dipendente" ? "Il tuo stipendio netto medio." : "Il tuo fatturato medio mensile, tasse comprese."}</div>
        <input type="number" id="obReddito" placeholder="Es. 1800" value="${draft.redditoMensile}" style="font-size:16px;text-align:center;padding:14px;margin-bottom:14px">
        ${draft.tipo === "partita_iva" ? `
          <div class="field">
            <label>Percentuale da accantonare per le tasse</label>
            <input type="number" id="obAccantonamento" min="0" max="100" value="${draft.accantonamentoPct}">
            <span class="help">La mettiamo da parte in automatico ogni volta che registri una fattura, così non la spendi per sbaglio.</span>
          </div>
        ` : ""}
      `;
      return "";
    }

    function render() {
      root.innerHTML = `
        <div class="onboarding-overlay">
          <div class="onboarding-card">
            <div class="onboarding-steps">${Array.from({ length: STEPS }).map((_, i) => `<div class="onboarding-dot ${i === step ? "active" : ""}"></div>`).join("")}</div>
            ${content()}
            <div class="onboarding-actions">
              <button class="btn" id="obBack" ${step === 0 ? "style=visibility:hidden" : ""}>Indietro</button>
              <button class="btn btn-primary" id="obNext">${step === STEPS - 1 ? "Inizia" : "Avanti"}</button>
            </div>
          </div>
        </div>
      `;
      wire();
    }

    function wire() {
      const nextBtn = root.querySelector("#obNext");
      nextBtn.disabled = !canAdvance();

      if (step === 0) {
        const input = root.querySelector("#obNome");
        input.focus();
        input.addEventListener("input", (e) => { draft.nome = e.target.value; nextBtn.disabled = !canAdvance(); });
      }
      if (step === 1) {
        root.querySelectorAll("[data-tipo]").forEach(card => card.addEventListener("click", () => { draft.tipo = card.dataset.tipo; render(); }));
      }
      if (step === 3) {
        root.querySelectorAll("[data-preset]").forEach(card => card.addEventListener("click", () => {
          const id = card.dataset.preset;
          if (id === "custom") { draft.custom = true; }
          else {
            draft.custom = false;
            draft.presetId = id;
            const pr = Store.PRESET_PERCENTUALI.find(x => x.id === id);
            draft.pctNecessita = pr.necessita; draft.pctSvaghi = pr.svaghi; draft.pctRisparmio = pr.risparmio;
          }
          render();
        }));
        if (draft.custom) {
          const nInput = root.querySelector("#obPctN"), sInput = root.querySelector("#obPctS"), rInput = root.querySelector("#obPctR");
          const sumEl = root.querySelector("#obPctSum");
          function updateSum() {
            draft.pctNecessita = (parseFloat(nInput.value) || 0) / 100;
            draft.pctSvaghi = (parseFloat(sInput.value) || 0) / 100;
            draft.pctRisparmio = (parseFloat(rInput.value) || 0) / 100;
            const sum = Math.round((draft.pctNecessita + draft.pctSvaghi + draft.pctRisparmio) * 100);
            sumEl.textContent = sum === 100 ? `Totale: ${sum}% ✅` : `Totale: ${sum}% — deve fare 100%`;
            sumEl.style.color = sum === 100 ? "var(--status-good-text)" : "var(--status-warn-text)";
            nextBtn.disabled = !canAdvance();
          }
          [nInput, sInput, rInput].forEach(i => i.addEventListener("input", updateSum));
          updateSum();
        }
      }
      if (step === 4) {
        const redditoInput = root.querySelector("#obReddito");
        redditoInput.addEventListener("input", (e) => { draft.redditoMensile = e.target.value; nextBtn.disabled = !canAdvance(); });
        const accInput = root.querySelector("#obAccantonamento");
        if (accInput) accInput.addEventListener("input", (e) => { draft.accantonamentoPct = e.target.value; });
      }

      const backBtn = root.querySelector("#obBack");
      if (backBtn) backBtn.addEventListener("click", () => { step = Math.max(0, step - 1); render(); });
      nextBtn.addEventListener("click", () => {
        if (!canAdvance()) return;
        if (step === STEPS - 1) { finish(); return; }
        step++;
        render();
      });
    }

    function finish() {
      const isFirstRun = !Store.state.profilo.nome && !Store.state.profilo.tipo;
      const importo = Number(draft.redditoMensile) || 0;

      Object.assign(Store.state.profilo, {
        nome: draft.nome.trim(),
        tipo: draft.tipo,
        redditoMensile: importo,
        pctNecessita: draft.pctNecessita,
        pctSvaghi: draft.pctSvaghi,
        pctRisparmio: draft.pctRisparmio,
        completato: true
      });
      if (draft.tipo === "partita_iva") {
        Store.state.settings.accantonamentoPct = U.clamp(parseFloat(draft.accantonamentoPct) || 0, 0, 100) / 100;
      }

      // The income entered here must show up immediately as a real transaction -
      // otherwise the Home totals (accantonato, disponibile) stay disconnected
      // from what was just declared. On first setup, swap the demo movimenti for
      // one real entrata matching the answers just given.
      if (isFirstRun && importo > 0) {
        Store.state.movimenti = [{
          id: U.uid(),
          tipo: "entrata",
          data: U.firstOfMonthISO(U.todayISO()),
          descrizione: draft.tipo === "partita_iva" ? "Fattura" : "Stipendio",
          categoria: draft.tipo === "partita_iva" ? Store.CATEGORIA_FATTURA : "Stipendio",
          importo,
          note: "Aggiunta automaticamente dalla configurazione iniziale"
        }];
      }

      Store.save();
      onComplete();
    }

    render();
  }

  global.Onboarding = { run };
})(window);
