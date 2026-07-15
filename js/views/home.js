(function (global) {
  "use strict";
  const U = global.Utils;

  const QUICKLINKS = [
    ["dashboard", "grid", "Dashboard"],
    ["impostazioni", "sliders", "Impostazioni"],
    ["entrate", "arrowDown", "Registro Entrate"],
    ["spese", "arrowUp", "Registro Spese"],
    ["budget", "pie", "Budget"],
    ["obiettivi", "target", "Obiettivi Finanziari"],
    ["fondo-emergenza", "shield", "Fondo Emergenza"],
    ["patrimonio", "bank", "Patrimonio Netto"],
    ["abbonamenti", "repeat", "Abbonamenti"],
    ["calendario", "calendar", "Calendario Pagamenti"],
    ["permettermi", "calculator", "Quanto Posso Permettermi"],
    ["analisi", "activity", "Analisi"]
  ];

  function render(root) {
    const d = Calc.dashboard();
    root.innerHTML = `
      <div class="hero">
        <h1>Bentornata nel tuo piano finanziario ✨</h1>
        <p>Il tuo centro di controllo personale — semplice, elegante, completamente automatico. Reddito pianificato di questo mese: <b>${U.formatCurrency(d.redditoPianificato)}</b>.</p>
        <div class="steps">
          <div class="step-card"><div class="step-num">1</div><h4>Vai su Impostazioni</h4><p>Inserisci il tuo reddito mensile e scegli le percentuali per Necessità, Svaghi e Risparmio.</p></div>
          <div class="step-card"><div class="step-num">2</div><h4>Registra le transazioni</h4><p>Aggiungi le voci in Registro Entrate e Registro Spese man mano che arrivano.</p></div>
          <div class="step-card"><div class="step-num">3</div><h4>Controlla la Dashboard</h4><p>Tutto si aggiorna automaticamente: grafici, barre di avanzamento e indicatori colorati.</p></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Navigazione rapida</div>
        <div class="quicklinks">
          ${QUICKLINKS.map(([hash, icon, label]) => `
            <button class="quicklink" data-go="${hash}">${UI.icon(icon)}<span>${U.escapeHtml(label)}</span></button>
          `).join("")}
        </div>
      </div>

      <div class="card" style="background:var(--accent-cream);border-color:var(--accent-cream-strong)">
        <strong>Suggerimento</strong>
        <p class="soft" style="margin-top:6px">I campi con sfondo color crema sono quelli in cui inserisci i tuoi dati. Tutto il resto — dashboard, grafici, barre di avanzamento — si calcola da solo e si aggiorna in automatico ogni volta che registri un movimento o cambi il mese di riferimento in Impostazioni.</p>
      </div>
    `;

    root.querySelectorAll("[data-go]").forEach(btn => {
      btn.addEventListener("click", () => { location.hash = "#/" + btn.dataset.go; });
    });
  }

  global.Views = global.Views || {};
  global.Views.home = render;
})(window);
