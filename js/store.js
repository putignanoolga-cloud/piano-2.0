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
  const CATEGORIE_USCITA = ["Casa", "Bollette", "Spesa", "Trasporti", "Salute", "Svago", "Tasse e Contributi", "Altro"];
  const CATEGORIA_FATTURA = "Fattura (Partita IVA)";
  const CATEGORIA_TASSE = "Tasse e Contributi";

  function defaultState() {
    return {
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
    CATEGORIE_ENTRATA, CATEGORIE_USCITA, CATEGORIA_FATTURA, CATEGORIA_TASSE
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
    hasPartitaIVA() { return this.entrate().some(m => m.categoria === Store.CATEGORIA_FATTURA); },
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
