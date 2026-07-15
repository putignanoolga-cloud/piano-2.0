/* Data model, persistence and calculations — kept deliberately simple:
   one unified list of movimenti (entrate/uscite), savings goals, and a
   deadlines list. The one "advanced" feature is the partita IVA tax set-aside,
   modeled as plainly as possible: a single configurable percentage applied to
   any income tagged "Fattura (Partita IVA)", tracked as a running pool that
   shrinks when an expense is checked off as a tax/contributi payment. */
(function (global) {
  "use strict";
  const U = global.Utils;
  const STORAGE_KEY = "pianoFinanziario:v2";

  const CATEGORIE_ENTRATA = ["Stipendio", "Fattura (Partita IVA)", "Rimborso", "Altro"];
  const CATEGORIE_USCITA = ["Casa", "Bollette", "Spesa", "Trasporti", "Salute", "Svago", "Risparmio/Investimenti", "Tasse e Contributi", "Altro"];
  const CATEGORIA_FATTURA = "Fattura (Partita IVA)";
  const CATEGORIA_TASSE = "Tasse e Contributi";

  const GRUPPI = ["Necessità", "Svaghi", "Risparmio"];
  const GRUPPO_PER_CATEGORIA = {
    "Casa": "Necessità", "Bollette": "Necessità", "Spesa": "Necessità", "Trasporti": "Necessità",
    "Salute": "Necessità", "Tasse e Contributi": "Necessità", "Altro": "Necessità",
    "Svago": "Svaghi",
    "Risparmio/Investimenti": "Risparmio"
  };

  const PRESET_PERCENTUALI = [
    { id: "equilibrato", label: "Equilibrato", nota: "la regola più conosciuta", necessita: 0.5, svaghi: 0.3, risparmio: 0.2 },
    { id: "essenziale", label: "Essenziale", nota: "vita quotidiana più cara", necessita: 0.7, svaghi: 0.15, risparmio: 0.15 },
    { id: "risparmiatore", label: "Risparmiatore", nota: "spendi poco, metti via tanto", necessita: 0.4, svaghi: 0.3, risparmio: 0.3 }
  ];

  function defaultState() {
    return {
      profilo: {
        nome: "",
        tipo: null, // 'dipendente' | 'partita_iva'
        redditoMensile: 0,
        pctNecessita: 0.5, pctSvaghi: 0.3, pctRisparmio: 0.2,
        completato: false
      },
      settings: {
        accantonamentoPct: 0.30
      },
      movimenti: [
        { id: U.uid(), tipo: "entrata", data: "2026-07-01", descrizione: "Stipendio", categoria: "Stipendio", importo: 1800, note: "" },
        { id: U.uid(), tipo: "entrata", data: "2026-07-05", descrizione: "Fattura cliente Rossi Srl", categoria: CATEGORIA_FATTURA, importo: 1000, note: "" },
        { id: U.uid(), tipo: "uscita", data: "2026-07-03", descrizione: "Spesa supermercato", categoria: "Spesa", importo: 64, note: "", pagamentoTasse: false },
        { id: U.uid(), tipo: "uscita", data: "2026-07-10", descrizione: "Bolletta luce", categoria: "Bollette", importo: 88, note: "", pagamentoTasse: false }
      ],
      obiettivi: [
        { id: U.uid(), nome: "Fondo emergenza", importoObiettivo: 3000, importoRaggiunto: 900, risparmioMensile: 150 }
      ],
      scadenze: [
        { id: U.uid(), descrizione: "Bolletta Luce/Gas", importo: 90, data: "2026-07-20" },
        { id: U.uid(), descrizione: "Acconto IRPEF", importo: 600, data: "2026-09-30" }
      ]
    };
  }

  function migrate(state) {
    const d = defaultState();
    const merged = Object.assign({}, d, state || {});
    merged.profilo = Object.assign({}, d.profilo, (state && state.profilo) || {});
    merged.settings = Object.assign({}, d.settings, (state && state.settings) || {});
    ["movimenti", "obiettivi", "scadenze"].forEach(k => { if (!Array.isArray(merged[k])) merged[k] = d[k]; });
    return merged;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      return migrate(JSON.parse(raw));
    } catch (e) {
      console.warn("Impossibile leggere i dati salvati, uso i valori di default.", e);
      return defaultState();
    }
  }

  const Store = {
    state: load(),
    save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); },
    reset() { this.state = defaultState(); this.save(); },
    exportJSON() { return JSON.stringify(this.state, null, 2); },
    importJSON(str) { this.state = migrate(JSON.parse(str)); this.save(); },
    CATEGORIE_ENTRATA, CATEGORIE_USCITA, CATEGORIA_FATTURA, CATEGORIA_TASSE, GRUPPI, PRESET_PERCENTUALI
  };

  const Calc = {
    entrate() { return Store.state.movimenti.filter(m => m.tipo === "entrata"); },
    uscite() { return Store.state.movimenti.filter(m => m.tipo === "uscita"); },

    inMonth(list, monthISO) {
      const { start, end } = U.monthRange(monthISO);
      return list.filter(m => U.inRangeExclusive(m.data, start, end));
    },
    entrateMese(monthISO) { return U.sum(this.inMonth(this.entrate(), monthISO), m => m.importo); },
    usciteMese(monthISO) { return U.sum(this.inMonth(this.uscite(), monthISO), m => m.importo); },

    // Partita IVA tax set-aside -------------------------------------------
    // The declared profile is the source of truth (set once during onboarding,
    // editable in Impostazioni) rather than inferring it from transaction history.
    hasPartitaIVA() { return Store.state.profilo.tipo === "partita_iva"; },
    accantonatoStorico() {
      const fatture = this.entrate().filter(m => m.categoria === Store.CATEGORIA_FATTURA);
      return U.sum(fatture, m => m.importo) * (Number(Store.state.settings.accantonamentoPct) || 0);
    },
    accantonatoUsato() {
      return U.sum(this.uscite().filter(m => m.pagamentoTasse), m => m.importo);
    },
    accantonatoResiduo() {
      return Math.max(0, this.accantonatoStorico() - this.accantonatoUsato());
    },
    saldoTotale() {
      return U.sum(this.entrate(), m => m.importo) - U.sum(this.uscite(), m => m.importo);
    },
    disponibile() {
      return this.saldoTotale() - this.accantonatoResiduo();
    },

    // Budget per gruppo (dal profilo impostato nel tour iniziale) ------------
    redditoBaseBudget() {
      const p = Store.state.profilo;
      const r = Number(p.redditoMensile) || 0;
      if (p.tipo === "partita_iva") return r * (1 - (Number(Store.state.settings.accantonamentoPct) || 0));
      return r;
    },
    budgetGruppo(gruppo) {
      const p = Store.state.profilo;
      const base = this.redditoBaseBudget();
      if (gruppo === "Necessità") return base * (Number(p.pctNecessita) || 0);
      if (gruppo === "Svaghi") return base * (Number(p.pctSvaghi) || 0);
      return base * (Number(p.pctRisparmio) || 0);
    },
    gruppoDiCategoria(categoria) { return GRUPPO_PER_CATEGORIA[categoria] || "Necessità"; },
    speseGruppoMese(gruppo, monthISO) {
      const rows = this.inMonth(this.uscite(), monthISO).filter(m => this.gruppoDiCategoria(m.categoria) === gruppo);
      return U.sum(rows, m => m.importo);
    },
    budgetPerGruppo(monthISO) {
      return GRUPPI.map(gruppo => {
        const budget = this.budgetGruppo(gruppo);
        const speso = this.speseGruppoMese(gruppo, monthISO);
        return { gruppo, budget, speso, pctUsata: budget ? speso / budget : 0 };
      });
    },

    // Obiettivi ------------------------------------------------------------
    obiettivo(o) {
      const raggiunto = Number(o.importoRaggiunto) || 0;
      const obiettivo = Number(o.importoObiettivo) || 0;
      const mensile = Number(o.risparmioMensile) || 0;
      const pctCompletata = obiettivo ? raggiunto / obiettivo : 0;
      const completato = obiettivo > 0 && raggiunto >= obiettivo;
      let mesiStimati = "n/d";
      if (completato) mesiStimati = 0;
      else if (mensile > 0) mesiStimati = Math.ceil((obiettivo - raggiunto) / mensile);
      return { pctCompletata, mesiStimati, completato };
    },

    // Scadenze ---------------------------------------------------------------
    scadenze() {
      const today = U.todayISO();
      return Store.state.scadenze.map(s => {
        const giorni = U.daysBetween(today, s.data);
        const avviso = giorni == null ? "" : (giorni < 0 ? "Scaduto" : (giorni <= 7 ? "In arrivo" : "OK"));
        return { ...s, giorniRimanenti: giorni, avviso };
      }).sort((a, b) => (a.data || "").localeCompare(b.data || ""));
    }
  };

  global.Store = Store;
  global.Calc = Calc;
})(window);
