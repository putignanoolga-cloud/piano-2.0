# Planimetro — passaggio di consegne

Documento per riprendere il lavoro in un'altra sessione di Claude Code.
Ultimo aggiornamento: 26 novembre 2026.

## In breve

**Planimetro** è un'app web (un solo file `index.html`) che misura in scala le planimetrie catastali dell'Agenzia delle Entrate. L'utente carica il PDF (o una foto/screenshot), l'app imposta la scala da sola e l'utente tocca gli angoli delle pareti: ottiene le lunghezze, il perimetro e la superficie in m².

- **Utente:** agente immobiliare, parla italiano, non tecnica. Usa l'app da Mac (Chrome) e telefono. Rispondere in italiano, in modo semplice.
- **Repository:** `putignanoolga-cloud/piano-2.0`, branch `claude/bold-ride-ujwmvz`
- **Codice:** tutto in `index.html` (HTML + CSS + JS, nessuna build). Unica dipendenza: pdf.js 3.11.174 da cdnjs.
- **Versione pubblicata (privata):** https://claude.ai/artifact/L9p5gTFpXGRYbwXZc41tC5
  (pubblicata da una copia del file; per aggiornarla, ripubblicare con lo stesso `url`).
- L'utente spesso scarica `index.html` e lo apre con doppio clic per vederlo a tutto schermo.

## Flusso attuale (deciso con l'utente)

Il flusso principale è **manuale**: l'utente ha detto che il rilevamento automatico non è abbastanza affidabile.

1. **🔄 Nuova planimetria**: carica PDF o immagine. Al caricamento **non** parte il rilevamento automatico.
2. La **scala si imposta da sola** (vedi sotto).
3. **✂️ Solo una zona**: l'utente disegna un riquadro e la vista **zooma** su quella parte.
4. L'utente **tocca gli angoli** delle pareti: ogni tratto mostra i metri; con 3 o più punti la forma si chiude e compare la **superficie in m²** (etichetta verde al centro).
5. In basso c'è una barra blu fissa: **Superficie totale (m²)** e **Perimetro (m)**.

Altri controlli:
- **✍️ Misura a mano**: inizia una nuova zona separata. **↶ Annulla punto**, **🗑 Pulisci**.
- Trascinare sposta la planimetria; pizzico o rotella per lo zoom. Toccare un muro lo seleziona.
- **🔍 Automaticamente**: rilevamento automatico delle pareti, **opzionale e sperimentale**.
- L'utente ha chiesto di **togliere i pulsanti "Sposta" e "Calibra"**: non rimetterli. La calibrazione è dentro la sezione SCALA.

## La scala: come funziona

Unica fonte di verità: `mmPerPixel` = millimetri **reali** per pixel dell'immagine renderizzata (`base`).

Ordine di priorità:

1. **Tacche blu dell'Agenzia** (`detectBlueTicks` + `applyBlueTickScale`). È la fonte migliore ed è un'intuizione dell'utente.
   - Ogni PDF ha una cornice blu con tacche che sporgono di circa 3 pt. **La distanza tra due tacche è sempre "10 metri" reali** (la scritta "10 metri" è nel testo del PDF e viene letta per sicurezza).
   - Sulle planimetrie normali A4 1:200 le tacche distano 141,7 pt = 5 cm.
   - Sulle planimetrie **"fuori standard"** (vecchie scansioni 250×360 rimpicciolite in A4) le tacche si rimpiccioliscono insieme al disegno: su Via Dolomiti distano 94,5 pt = 3,3 cm, cioè il disegno è a **2/3**. Usare le tacche compensa questo automaticamente.
   - Algoritmo: maschera dei pixel blu → righe/colonne lunghe = cornice → campiona la riga/colonna appena **fuori** dalla cornice → i cluster di blu sono le tacche → mediana degli intervalli, accettata solo se almeno 3 intervalli coincidono entro il 3%.
   - Funziona anche su screenshot; su foto storte di solito fallisce e si passa al punto 2 o 3.
2. **Rapporto 1:N** (di default 1:200, letto dal testo "Scala 1:N" quando è testo selezionabile, spesso non lo è) + dimensione della pagina PDF: `mmPerPixel = scaleRatio / (renderScale·72/25,4)`.
3. **Correzione manuale** nella sezione SCALA:
   - **📏 Con una lunghezza nota**: due punti + distanza reale.
   - **Superficie reale**: selezionare una zona tracciata, inserire i m² veri (es. dall'APE); la scala viene moltiplicata per `sqrt(reale/misurata)`.

Se il PDF contiene "fuori standard" e le tacche **non** vengono trovate, compare un avviso arancione.

Verifiche fatte sulle planimetrie di prova:

| PDF | Intervallo tacche | Effetto |
|---|---|---|
| Verona, via Paganella (A4 standard) | 141,5 pt | come 1:200 (+0,3% in area per precisione dei pixel) |
| Chieti / Via Pastrengo (A4 standard) | 141,5 pt | come 1:200 |
| Via Dolomiti (fuori standard 250×360) | 94,3 pt | lunghezze ×1,5, aree ×2,25 rispetto a 1:200 |

## Rilevamento automatico (opzionale)

`detectWalls()`: soglia scuro → cancella le linee lunghe della cornice → trova la regione del disegno (componente con estensione maggiore, salta la fascia del cartiglio in alto, o usa il riquadro "Solo una zona") → **perimetro** come poligono (contorno + Douglas-Peucker, prende anche le pareti oblique) + **muri interni** orizzontali/verticali (run-length, clustering, unione delle doppie linee, taglio agli incroci).

Limiti noti: sulle planimetrie vecchie e affollate (più disegni, timbri, tratteggi) dà risultati confusi; alcuni muri interni sottili mancano; le scale tratteggiate generano muri falsi. Per questo l'utente preferisce il manuale.

## Cose da sapere per non ripetere errori

- La "superficie utile riscaldabile" dell'**APE** è netta (dentro i muri) e somma tutti i locali riscaldati. Un contorno tracciato sulle linee dei muri esce più grande: per avvicinarsi, tracciare sul filo interno.
- L'utente ha confrontato 16,44 m² misurati con 30 m² dell'APE: il problema principale era la scala delle planimetrie fuori standard, ora risolta con le tacche blu.
- I PDF di prova contengono dati personali (codici fiscali, nomi): non copiarli in commit o messaggi.

## Cosa resta da fare

- **"La parte sulla destra"**: fin dal primo messaggio l'utente ha detto che, dopo la planimetria in scala, vuole costruire una seconda parte "sulla destra". **Non l'ha ancora descritta**: chiederle cosa intende prima di progettarla.
- L'utente aveva accennato a "aprire una seconda finestra con la stessa planimetria" per calcolare stanze diverse: da chiarire se è la stessa cosa.
- Possibili miglioramenti, da proporre e non fare senza conferma:
  - nomi alle zone (Cucina, Camera…) e riepilogo per stanza;
  - esportazione o stampa del riepilogo misure (PDF);
  - salvataggio delle misure fatte;
  - precisione sub-pixel delle tacche blu.

## Come testare

Nell'ambiente cloud c'è Playwright. Esempio minimo:

```js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1300, height: 850 } });
  await p.goto('file:///percorso/index.html');
  await p.setInputFiles('#fileInput', '/percorso/planimetria.pdf');
  await p.waitForTimeout(3500);
  console.log(await p.evaluate(() => document.getElementById('scaleBadge').innerText));
  await b.close();
})();
```

ID utili: `#fileInput`, `#stage` (area del disegno), `#scaleBadge`, `#totalArea`, `#grandTotal`, `#results`, `#toolCrop`, `#autoDetect`, `#fixLen`, `#realArea` + `#applyArea`, `#fsWarn`.
Per misurare: clic sul canvas dentro `#stage` (un clic senza trascinare aggiunge un punto).
