/* Data model, persistence and the full derived-calculation engine
   (a faithful re-implementation of every formula in the original spreadsheet). */
(function (global) {
  "use strict";
  const U = global.Utils;
  const STORAGE_KEY = "pianoFinanziario:v1";
  const GRUPPI = ["Necessità", "Svaghi", "Risparmio/Investimenti"];

  function defaultCategorieSpesa() {
    return [
      { nome: "Casa - Affitto/Mutuo", gruppo: "Necessità" },
      { nome: "Bollette", gruppo: "Necessità" },
      { nome: "Spesa Alimentare", gruppo: "Necessità" },
      { nome: "Trasporti", gruppo: "Necessità" },
      { nome: "Assicurazioni", gruppo: "Necessità" },
      { nome: "Salute", gruppo: "Necessità" },
      { nome: "Abbonamenti", gruppo: "Necessità" },
      { nome: "Istruzione", gruppo: "Necessità" },
      { nome: "Figli/Famiglia", gruppo: "Necessità" },
      { nome: "Ristoranti", gruppo: "Svaghi" },
      { nome: "Shopping", gruppo: "Svaghi" },
      { nome: "Intrattenimento", gruppo: "Svaghi" },
      { nome: "Viaggi", gruppo: "Svaghi" },
      { nome: "Hobby", gruppo: "Svaghi" },
      { nome: "Regali", gruppo: "Svaghi" },
      { nome: "Bellezza", gruppo: "Svaghi" },
      { nome: "Risparmio", gruppo: "Risparmio/Investimenti" },
      { nome: "Investimenti", gruppo: "Risparmio/Investimenti" },
      { nome: "Fondo Emergenza", gruppo: "Risparmio/Investimenti" },
      { nome: "Altro", gruppo: "Necessità" }
    ];
  }

  function defaultState() {
    return {
      settings: {
        redditoMensile: 2200,
        redditiExtra: 300,
        entrateOccasionali: 100,
        pctNecessita: 0.55,
        pctSvaghi: 0.25,
        pctRisparmio: 0.20,
        meseRif: "2026-07-01",
        mesiFondoTarget: 6,
        categorieSpesa: defaultCategorieSpesa(),
        categorieEntrata: ["Stipendio", "Reddito Extra / Freelance", "Entrata Occasionale", "Rimborso", "Regalo Ricevuto", "Rendita da Investimenti", "Altro"],
        metodiPagamento: ["Conto Corrente", "Contanti", "Carta di Debito", "Carta di Credito", "PayPal", "Altro"]
      },
      entrate: [
        { id: U.uid(), data: "2026-07-01", descrizione: "Stipendio mensile", categoria: "Stipendio", importo: 2200, metodo: "Conto Corrente", note: "Esempio - puoi eliminare questa riga" }
      ],
      spese: [
        { id: U.uid(), data: "2026-07-03", descrizione: "Spesa supermercato", categoria: "Spesa Alimentare", importo: 65.4, metodo: "Carta di Debito", note: "Esempio - puoi eliminare questa riga" }
      ],
      obiettivi: [
        { id: U.uid(), nome: "Fondo Vacanza Estate", importoObiettivo: 1500, importoRaggiunto: 600, risparmioMensile: 150, dataPrevista: "2026-06-01" },
        { id: U.uid(), nome: "Nuovo Laptop", importoObiettivo: 1200, importoRaggiunto: 1200, risparmioMensile: 0, dataPrevista: "2026-03-01" }
      ],
      fondoEmergenza: { liquiditaAttuale: 3000 },
      patrimonio: { contoCorrente: 2500, contanti: 150, investimenti: 4000, immobili: 0, altriBeni: 500, mutui: 0, prestiti: 0, carteCredito: 0, altriDebiti: 0 },
      abbonamenti: [
        { id: U.uid(), servizio: "Netflix", costo: 12.99, frequenza: "Mensile" },
        { id: U.uid(), servizio: "Spotify", costo: 10.99, frequenza: "Mensile" },
        { id: U.uid(), servizio: "Amazon Prime", costo: 49.9, frequenza: "Annuale" },
        { id: U.uid(), servizio: "Palestra", costo: 45, frequenza: "Mensile" },
        { id: U.uid(), servizio: "Telefono", costo: 15, frequenza: "Mensile" },
        { id: U.uid(), servizio: "Internet Casa", costo: 29.9, frequenza: "Mensile" },
        { id: U.uid(), servizio: "Software / Cloud", costo: 9.99, frequenza: "Mensile" }
      ],
      calendarioPagamenti: [
        { id: U.uid(), pagamento: "Affitto", categoria: "Casa - Affitto/Mutuo", importo: 750, prossimaScadenza: "2026-07-27" },
        { id: U.uid(), pagamento: "Bolletta Luce/Gas", categoria: "Bollette", importo: 90, prossimaScadenza: "2026-07-15" },
        { id: U.uid(), pagamento: "Assicurazione Auto", categoria: "Assicurazioni", importo: 45, prossimaScadenza: "2026-07-20" }
      ],
      affordability: {
        necessita: [
          { id: U.uid(), voce: "Affitto o Mutuo", peso: 0.6 },
          { id: U.uid(), voce: "Auto (rata/carburante/manutenzione)", peso: 0.15 },
          { id: U.uid(), voce: "Alimentazione", peso: 0.25 }
        ],
        svaghi: [
          { id: U.uid(), voce: "Ristoranti", peso: 0.2 },
          { id: U.uid(), voce: "Shopping", peso: 0.3 },
          { id: U.uid(), voce: "Viaggi", peso: 0.25 },
          { id: U.uid(), voce: "Intrattenimento", peso: 0.25 }
        ],
        risparmio: [
          { id: U.uid(), voce: "Risparmio / Investimenti", peso: 1 }
        ]
      },
      patrimonioStorico: [
        { id: U.uid(), data: "2026-07-01", valore: 7150 }
      ]
    };
  }

  function migrate(state) {
    const d = defaultState();
    const merged = Object.assign({}, d, state || {});
    merged.settings = Object.assign({}, d.settings, (state && state.settings) || {});
    ["entrate", "spese", "obiettivi", "abbonamenti", "calendarioPagamenti", "patrimonioStorico"].forEach(k => {
      if (!Array.isArray(merged[k])) merged[k] = d[k];
    });
    merged.fondoEmergenza = Object.assign({}, d.fondoEmergenza, (state && state.fondoEmergenza) || {});
    merged.patrimonio = Object.assign({}, d.patrimonio, (state && state.patrimonio) || {});
    merged.affordability = Object.assign({}, d.affordability, (state && state.affordability) || {});
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
    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    },
    reset() {
      this.state = defaultState();
      this.save();
    },
    exportJSON() {
      return JSON.stringify(this.state, null, 2);
    },
    importJSON(str) {
      const parsed = JSON.parse(str);
      this.state = migrate(parsed);
      this.save();
    },
    GRUPPI
  };

  // ---------------------------------------------------------------------
  // Derived calculations — mirrors every formula in the source workbook.
  // ---------------------------------------------------------------------
  const Calc = {
    redditoPianificato() {
      const s = Store.state.settings;
      return (Number(s.redditoMensile) || 0) + (Number(s.redditiExtra) || 0) + (Number(s.entrateOccasionali) || 0);
    },
    sommaPct() {
      const s = Store.state.settings;
      return (Number(s.pctNecessita) || 0) + (Number(s.pctSvaghi) || 0) + (Number(s.pctRisparmio) || 0);
    },
    configOk() {
      return Math.round(this.sommaPct() * 10000) / 10000 === 1;
    },
    budgetGruppo(gruppo) {
      const s = Store.state.settings;
      const r = this.redditoPianificato();
      if (gruppo === "Necessità") return r * (Number(s.pctNecessita) || 0);
      if (gruppo === "Svaghi") return r * (Number(s.pctSvaghi) || 0);
      return r * (Number(s.pctRisparmio) || 0);
    },
    gruppoDiCategoria(categoria) {
      const found = Store.state.settings.categorieSpesa.find(c => c.nome === categoria);
      return found ? found.gruppo : "";
    },
    entrateTot() {
      return U.sum(Store.state.entrate, e => e.importo);
    },
    speseTot() {
      return U.sum(Store.state.spese, e => e.importo);
    },
    entrateMeseRif() {
      const { start, end } = U.monthRange(Store.state.settings.meseRif);
      return U.sum(Store.state.entrate.filter(e => U.inRangeExclusive(e.data, start, end)), e => e.importo);
    },
    speseMeseRif() {
      const { start, end } = U.monthRange(Store.state.settings.meseRif);
      return U.sum(Store.state.spese.filter(e => U.inRangeExclusive(e.data, start, end)), e => e.importo);
    },
    speseMeseRifByGruppo(gruppo) {
      const { start, end } = U.monthRange(Store.state.settings.meseRif);
      return U.sum(Store.state.spese.filter(e => U.inRangeExclusive(e.data, start, end) && this.gruppoDiCategoria(e.categoria) === gruppo), e => e.importo);
    },
    speseMeseRifByCategoria(categoria) {
      const { start, end } = U.monthRange(Store.state.settings.meseRif);
      return U.sum(Store.state.spese.filter(e => U.inRangeExclusive(e.data, start, end) && e.categoria === categoria), e => e.importo);
    },
    speseTotByCategoria(categoria) {
      return U.sum(Store.state.spese.filter(e => e.categoria === categoria), e => e.importo);
    },

    // Dashboard -----------------------------------------------------------
    dashboard() {
      const reddito = this.redditoPianificato();
      const entrate = this.entrateMeseRif();
      const spese = this.speseMeseRif();
      const risparmio = entrate - spese;
      return {
        redditoPianificato: reddito,
        entrateMeseRif: entrate,
        speseMeseRif: spese,
        risparmioMese: risparmio,
        saldoDisponibile: risparmio,
        pctRisparmio: entrate ? risparmio / entrate : 0,
        pctSpesa: entrate ? spese / entrate : 0,
        budgetRimanente: reddito - spese,
        configMessage: this.configOk() ? "✅ Budget configurato correttamente." : "⚠️ Le percentuali devono totalizzare il 100%."
      };
    },

    // Budget ----------------------------------------------------------------
    budgetPerGruppo() {
      return GRUPPI.map(gruppo => {
        const budget = this.budgetGruppo(gruppo);
        const speso = this.speseMeseRifByGruppo(gruppo);
        const pctUsata = budget ? speso / budget : 0;
        return {
          gruppo, budget, speso,
          differenza: budget - speso,
          pctUsata,
          stato: budget === 0 ? "n/d" : (pctUsata <= 0.85 ? "OK" : "ATTENZIONE")
        };
      });
    },
    budgetTotale() {
      const rows = this.budgetPerGruppo();
      const budget = U.sum(rows, r => r.budget);
      const speso = U.sum(rows, r => r.speso);
      return { budget, speso, differenza: budget - speso, pctUsata: budget ? speso / budget : 0 };
    },
    budgetPerCategoria() {
      const totale = this.budgetTotale().speso;
      return Store.state.settings.categorieSpesa.map(c => {
        const speso = this.speseMeseRifByCategoria(c.nome);
        return { categoria: c.nome, gruppo: c.gruppo, speso, pctSulTotale: totale ? speso / totale : 0 };
      });
    },

    // Obiettivi Finanziari ----------------------------------------------------
    obiettivo(o) {
      const raggiunto = Number(o.importoRaggiunto) || 0;
      const obiettivo = Number(o.importoObiettivo) || 0;
      const mensile = Number(o.risparmioMensile) || 0;
      const pctCompletata = obiettivo ? raggiunto / obiettivo : 0;
      const completato = obiettivo > 0 && raggiunto >= obiettivo;
      let mesiStimati = "n/d";
      if (completato) mesiStimati = 0;
      else if (mensile > 0) mesiStimati = Math.ceil((obiettivo - raggiunto) / mensile);
      let dataStimata = "n/d";
      if (completato) dataStimata = "Raggiunto";
      else if (typeof mesiStimati === "number") dataStimata = U.addMonthsISO(U.todayISO(), mesiStimati);
      let stato = "";
      if (o.nome && obiettivo !== 0) {
        if (completato) stato = "Raggiunto";
        else if (o.dataPrevista && U.todayISO() > o.dataPrevista) stato = "In ritardo";
        else stato = "In corso";
      }
      return { pctCompletata, mesiStimati, dataStimata, stato };
    },

    // Fondo Emergenza ---------------------------------------------------------
    speseMensileMedia() {
      const spese = Store.state.spese;
      if (!spese.length) return this.speseMeseRif();
      const dates = spese.map(s => s.data).sort();
      const min = dates[0], max = dates[dates.length - 1];
      const maxPlusOneDay = U.toISODate(new Date(U.parseISODate(max).getTime() + 86400000));
      const months = Math.max(1, U.completeMonthsBetween(min, maxPlusOneDay));
      const media = this.speseTot() / months;
      return Number.isFinite(media) ? media : this.speseMeseRif();
    },
    fondoEmergenza() {
      const media = this.speseMensileMedia();
      const attuale = Number(Store.state.fondoEmergenza.liquiditaAttuale) || 0;
      const target = media * (Number(Store.state.settings.mesiFondoTarget) || 0);
      return {
        speseMensileMedia: media,
        attuale,
        ideale3: media * 3,
        ideale6: media * 6,
        ideale12: media * 12,
        idealeTarget: target,
        pctCopertura: target ? attuale / target : 0,
        mancano: Math.max(0, target - attuale),
        mesiCoperturaAttuale: media ? attuale / media : 0
      };
    },

    // Patrimonio Netto ---------------------------------------------------------
    patrimonio() {
      const p = Store.state.patrimonio;
      const attivita = U.sum([p.contoCorrente, p.contanti, p.investimenti, p.immobili, p.altriBeni].map(v => ({ v })), x => x.v);
      const passivita = U.sum([p.mutui, p.prestiti, p.carteCredito, p.altriDebiti].map(v => ({ v })), x => x.v);
      return { attivita, passivita, netto: attivita - passivita };
    },

    // Abbonamenti ---------------------------------------------------------------
    costoMensileEquivalente(a) {
      const c = Number(a.costo) || 0;
      switch (a.frequenza) {
        case "Mensile": return c;
        case "Annuale": return c / 12;
        case "Trimestrale": return c / 3;
        case "Settimanale": return c * 4.33;
        default: return 0;
      }
    },
    abbonamentiTotali() {
      const rows = Store.state.abbonamenti.map(a => ({ ...a, mensile: this.costoMensileEquivalente(a) }));
      const mensile = U.sum(rows, r => r.mensile);
      return { rows, mensile, annuale: mensile * 12 };
    },

    // Calendario Pagamenti ----------------------------------------------------
    calendarioPagamenti() {
      const today = U.todayISO();
      const rows = Store.state.calendarioPagamenti.map(p => {
        const giorni = U.daysBetween(today, p.prossimaScadenza);
        const avviso = giorni == null ? "" : (giorni < 0 ? "Scaduto" : (giorni <= 7 ? "In arrivo" : "OK"));
        return { ...p, giorniRimanenti: giorni, avviso };
      });
      return { rows, totale: U.sum(rows, r => r.importo) };
    },

    // Quanto Posso Permettermi --------------------------------------------------
    affordabilityGroup(key, gruppoLabel) {
      const voci = Store.state.affordability[key] || [];
      const budget = this.budgetGruppo(gruppoLabel);
      const rows = voci.map(v => ({ ...v, budgetMassimo: budget * (Number(v.peso) || 0) }));
      return { budget, rows, totalePesi: U.sum(voci, v => v.peso) };
    },

    // Analisi ---------------------------------------------------------------
    andamentoMensile() {
      const base = U.firstOfMonthISO(Store.state.settings.meseRif);
      const out = [];
      for (let i = -11; i <= 0; i++) {
        const meseISO = U.addMonthsISO(base, i);
        const { start, end } = U.monthRange(meseISO);
        const entrate = U.sum(Store.state.entrate.filter(e => U.inRangeExclusive(e.data, start, end)), e => e.importo);
        const spese = U.sum(Store.state.spese.filter(e => U.inRangeExclusive(e.data, start, end)), e => e.importo);
        out.push({ meseISO, label: U.formatMonthShort(meseISO), entrate, spese, risparmio: entrate - spese });
      }
      return out;
    },
    confrontoMesePrecedente() {
      const serie = this.andamentoMensile();
      const corrente = serie[serie.length - 1];
      const precedente = serie[serie.length - 2];
      return {
        entrateCorrente: corrente.entrate,
        entratePrecedente: precedente.entrate,
        variazioneEntrate: precedente.entrate ? corrente.entrate / precedente.entrate - 1 : 0,
        speseCorrente: corrente.spese,
        spesePrecedente: precedente.spese,
        variazioneSpese: precedente.spese ? corrente.spese / precedente.spese - 1 : 0
      };
    },
    medie() {
      const serie = this.andamentoMensile();
      const n = serie.length || 1;
      const mediaEntrate = U.sum(serie, s => s.entrate) / n;
      const mediaSpese = U.sum(serie, s => s.spese) / n;
      const mediaRisparmio = U.sum(serie, s => s.risparmio) / n;
      return { mediaEntrate, mediaSpese, mediaRisparmio, mediaAnnualeSpese: mediaSpese * 12 };
    },
    totaleSpesoPerCategoria() {
      return Store.state.settings.categorieSpesa.map(c => ({
        categoria: c.nome, gruppo: c.gruppo, totale: this.speseTotByCategoria(c.nome)
      }));
    },
    categorieEstreme() {
      const totali = this.totaleSpesoPerCategoria();
      if (!totali.length) return { max: null, min: null, gruppoMinMese: null };
      const max = totali.reduce((a, b) => (b.totale > a.totale ? b : a));
      const min = totali.reduce((a, b) => (b.totale < a.totale ? b : a));
      const gruppi = this.budgetPerGruppo();
      const gruppoMinMese = gruppi.reduce((a, b) => (b.speso < a.speso ? b : a));
      return { max, min, gruppoMinMese };
    },
    patrimonioStoricoOrdinato() {
      return [...Store.state.patrimonioStorico].sort((a, b) => a.data.localeCompare(b.data));
    }
  };

  global.Store = Store;
  global.Calc = Calc;
})(window);
