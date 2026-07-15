/* Dependency-free SVG charts: donut, progress ring, multi-line trend, bar lists, compare bars.
   Palette validated with the dataviz skill's six-check validator (teal/terracotta/gold/sage,
   all pass on light surface #ffffff; the gold<->sage adjacent pair sits in the legal 6-8 CVD
   floor band, mitigated everywhere with legends + direct labels + a table-view toggle). */
(function (global) {
  "use strict";
  const U = global.Utils;
  const SVG_NS = "http://www.w3.org/2000/svg";

  const COLORS = {
    necessita: "#0088a3",
    svaghi: "#d68a1f",
    risparmio: "#4f8f52",
    spese: "#c0503a",
    entrate: "#4f8f52"
  };

  function colorForGruppo(gruppo) {
    if (gruppo === "Necessità") return COLORS.necessita;
    if (gruppo === "Svaghi") return COLORS.svaghi;
    return COLORS.risparmio;
  }

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  // ---------------------------------------------------------------- tooltip
  let tipEl = null;
  function ensureTip() {
    if (!tipEl) { tipEl = document.createElement("div"); tipEl.className = "viz-tooltip"; document.body.appendChild(tipEl); }
    return tipEl;
  }
  function showTip(html, evt) {
    const el = ensureTip();
    el.innerHTML = html;
    el.classList.add("show");
    moveTip(evt);
  }
  function moveTip(evt) {
    const el = ensureTip();
    const pad = 16;
    let x = evt.clientX + pad, y = evt.clientY + pad;
    const rect = el.getBoundingClientRect();
    if (x + rect.width > window.innerWidth - 8) x = evt.clientX - rect.width - pad;
    if (y + rect.height > window.innerHeight - 8) y = evt.clientY - rect.height - pad;
    el.style.left = x + "px";
    el.style.top = y + "px";
  }
  function hideTip() { if (tipEl) tipEl.classList.remove("show"); }

  function legendHtml(items) {
    return `<div class="chart-legend">${items.map(i =>
      `<span class="legend-item"><span class="dot" style="background:${i.color}"></span>${U.escapeHtml(i.label)}${i.value != null ? ` — <b>${i.value}</b>` : ""}</span>`
    ).join("")}</div>`;
  }

  function tableToggle(container, buildTableHtml) {
    const btn = document.createElement("button");
    btn.className = "table-toggle";
    btn.type = "button";
    btn.textContent = "Vedi come tabella";
    const box = document.createElement("div");
    box.style.display = "none";
    box.style.marginTop = "10px";
    box.innerHTML = buildTableHtml;
    btn.addEventListener("click", () => {
      const open = box.style.display !== "none";
      box.style.display = open ? "none" : "block";
      btn.textContent = open ? "Vedi come tabella" : "Nascondi tabella";
    });
    container.appendChild(btn);
    container.appendChild(box);
  }

  // ----------------------------------------------------------------- donut
  function donut(container, segments, opts) {
    opts = Object.assign({ size: 168, thickness: 24, formatValue: (v) => U.formatCurrency(v) }, opts || {});
    container.innerHTML = "";
    const total = U.sum(segments, s => s.value);
    const { size, thickness } = opts;
    const r = (size - thickness) / 2, c = 2 * Math.PI * r, cx = size / 2, cy = size / 2;

    const wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;align-items:center;gap:26px;flex-wrap:wrap";

    const ringDiv = document.createElement("div");
    ringDiv.className = "ring";
    ringDiv.style.width = size + "px";
    ringDiv.style.height = size + "px";
    const svg = svgEl("svg", { viewBox: `0 0 ${size} ${size}`, width: size, height: size });
    const g = svgEl("g", { transform: `rotate(-90 ${cx} ${cy})` });
    g.appendChild(svgEl("circle", { cx, cy, r, fill: "none", stroke: "var(--surface-alt)", "stroke-width": thickness }));

    let cumulative = 0;
    segments.forEach(seg => {
      const frac = total ? seg.value / total : 0;
      if (frac > 0) {
        const dash = frac * c;
        const gap = Math.max(0, c - dash - (segments.length > 1 ? 2 : 0));
        const circle = svgEl("circle", {
          cx, cy, r, fill: "none", stroke: seg.color, "stroke-width": thickness,
          "stroke-dasharray": `${Math.max(0, dash - (segments.length > 1 ? 2 : 0))} ${gap + 2}`,
          "stroke-dashoffset": -cumulative * c
        });
        circle.style.cursor = "pointer";
        circle.addEventListener("mouseenter", (e) => showTip(tipRow(seg.label, opts.formatValue(seg.value), frac), e));
        circle.addEventListener("mousemove", (e) => showTip(tipRow(seg.label, opts.formatValue(seg.value), frac), e));
        circle.addEventListener("mouseleave", hideTip);
        g.appendChild(circle);
      }
      cumulative += frac;
    });
    svg.appendChild(g);
    ringDiv.appendChild(svg);
    const centerLabel = document.createElement("div");
    centerLabel.className = "ring-value";
    centerLabel.innerHTML = `<div class="num">${opts.centerValue != null ? opts.centerValue : opts.formatValue(total)}</div><div class="lbl">${U.escapeHtml(opts.centerLabel || "Totale")}</div>`;
    ringDiv.appendChild(centerLabel);

    const legend = document.createElement("div");
    legend.innerHTML = segments.map(s => {
      const frac = total ? s.value / total : 0;
      return `<div class="legend-item" style="margin-bottom:8px"><span class="dot" style="background:${s.color}"></span>${U.escapeHtml(s.label)} — <b>${opts.formatValue(s.value)}</b> <span class="muted">(${U.formatPercent(frac)})</span></div>`;
    }).join("");

    wrap.appendChild(ringDiv);
    wrap.appendChild(legend);
    container.appendChild(wrap);

    tableToggle(container, `<div class="table-wrap"><table><thead><tr><th>Gruppo</th><th class="num">Importo</th><th class="num">%</th></tr></thead><tbody>${
      segments.map(s => `<tr><td>${U.escapeHtml(s.label)}</td><td class="num">${opts.formatValue(s.value)}</td><td class="num">${U.formatPercent(total ? s.value / total : 0)}</td></tr>`).join("")
    }</tbody></table></div>`);
  }

  function tipRow(label, value, frac) {
    return `<div class="t-title">${U.escapeHtml(label)}</div><div class="t-row"><span>${value}</span>${frac != null ? `<span>${U.formatPercent(frac)}</span>` : ""}</div>`;
  }

  // --------------------------------------------------------- progress ring
  function progressRing(container, pct, opts) {
    opts = Object.assign({ size: 120, thickness: 13, color: "var(--brand)" }, opts || {});
    container.innerHTML = "";
    const { size, thickness, color } = opts;
    const r = (size - thickness) / 2, c = 2 * Math.PI * r, cx = size / 2, cy = size / 2;
    const frac = U.clamp(pct || 0, 0, 1);
    const div = document.createElement("div");
    div.className = "ring";
    div.style.width = size + "px";
    div.style.height = size + "px";
    const svg = svgEl("svg", { viewBox: `0 0 ${size} ${size}`, width: size, height: size });
    const g = svgEl("g", { transform: `rotate(-90 ${cx} ${cy})` });
    g.appendChild(svgEl("circle", { cx, cy, r, fill: "none", stroke: "var(--surface-alt)", "stroke-width": thickness }));
    g.appendChild(svgEl("circle", {
      cx, cy, r, fill: "none", stroke: color, "stroke-width": thickness, "stroke-linecap": "round",
      "stroke-dasharray": `${frac * c} ${c}`
    }));
    svg.appendChild(g);
    div.appendChild(svg);
    const label = document.createElement("div");
    label.className = "ring-value";
    label.innerHTML = `<div class="num">${opts.centerValue != null ? opts.centerValue : U.formatPercent(frac)}</div><div class="lbl">${U.escapeHtml(opts.centerLabel || "")}</div>`;
    div.appendChild(label);
    container.appendChild(div);
  }

  // ---------------------------------------------------------- multi-line
  function lines(container, series, categories, opts) {
    opts = Object.assign({ height: 250, formatValue: (v) => U.formatCurrency(v, true) }, opts || {});
    container.innerHTML = "";
    const W = opts.width || 680, H = opts.height;
    const marginL = 56, marginR = 26, marginT = 14, marginB = 26;
    const plotW = W - marginL - marginR, plotH = H - marginT - marginB;
    const allValues = series.flatMap(s => s.values);
    let minV = Math.min(0, ...allValues), maxV = Math.max(0, ...allValues);
    if (minV === maxV) maxV = minV + 1;
    const range = maxV - minV;
    maxV += range * 0.1;
    if (minV < 0) minV -= range * 0.1;
    const xStep = categories.length > 1 ? plotW / (categories.length - 1) : plotW;
    const xAt = (i) => marginL + i * xStep;
    const yAt = (v) => marginT + plotH - ((v - minV) / (maxV - minV)) * plotH;

    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", height: H, preserveAspectRatio: "xMidYMid meet" });
    svg.style.display = "block";

    const ticks = 4;
    for (let t = 0; t <= ticks; t++) {
      const v = minV + (maxV - minV) * t / ticks;
      const y = yAt(v);
      const isZero = Math.abs(v) < (maxV - minV) * 0.01;
      svg.appendChild(svgEl("line", { x1: marginL, x2: W - marginR, y1: y, y2: y, stroke: isZero ? "var(--border-strong)" : "var(--border)", "stroke-width": isZero ? 1.3 : 1 }));
      const txt = svgEl("text", { x: marginL - 8, y: y + 3, "text-anchor": "end", "font-size": 10, fill: "var(--ink-muted)" });
      txt.textContent = opts.formatValue(v);
      svg.appendChild(txt);
    }
    categories.forEach((cat, i) => {
      const txt = svgEl("text", { x: xAt(i), y: H - 7, "text-anchor": "middle", "font-size": 10, fill: "var(--ink-muted)" });
      txt.textContent = cat;
      svg.appendChild(txt);
    });

    series.forEach(s => {
      let d = "";
      s.values.forEach((v, i) => { d += (i === 0 ? "M" : "L") + xAt(i).toFixed(1) + " " + yAt(v).toFixed(1) + " "; });
      svg.appendChild(svgEl("path", { d, fill: "none", stroke: s.color, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }));
    });
    series.forEach(s => {
      s.values.forEach((v, i) => {
        svg.appendChild(svgEl("circle", { cx: xAt(i), cy: yAt(v), r: 3.4, fill: s.color, stroke: "var(--surface)", "stroke-width": 1.2 }));
      });
    });

    const guides = [];
    categories.forEach((cat, i) => {
      const guide = svgEl("line", { x1: xAt(i), x2: xAt(i), y1: marginT, y2: marginT + plotH, stroke: "var(--ink-muted)", "stroke-width": 1, "stroke-dasharray": "3 3", opacity: 0 });
      svg.appendChild(guide);
      guides.push(guide);
    });
    categories.forEach((cat, i) => {
      const rect = svgEl("rect", { x: xAt(i) - xStep / 2, y: marginT, width: xStep, height: plotH, fill: "transparent" });
      rect.style.cursor = "crosshair";
      const show = (e) => {
        guides.forEach((g, gi) => g.setAttribute("opacity", gi === i ? 1 : 0));
        const rows = series.map(s => `<div class="t-row"><span>${U.escapeHtml(s.label)}</span><span>${U.formatCurrency(s.values[i])}</span></div>`).join("");
        showTip(`<div class="t-title">${U.escapeHtml(cat)}</div>${rows}`, e);
      };
      rect.addEventListener("mouseenter", show);
      rect.addEventListener("mousemove", show);
      rect.addEventListener("mouseleave", () => { guides.forEach(g => g.setAttribute("opacity", 0)); hideTip(); });
      svg.appendChild(rect);
    });

    container.appendChild(svg);
    container.appendChild(document.createRange().createContextualFragment(
      legendHtml(series.map(s => ({ color: s.color, label: s.label })))
    ));

    tableToggle(container, `<div class="table-wrap"><table><thead><tr><th>Mese</th>${series.map(s => `<th class="num">${U.escapeHtml(s.label)}</th>`).join("")}</tr></thead><tbody>${
      categories.map((cat, i) => `<tr><td>${U.escapeHtml(cat)}</td>${series.map(s => `<td class="num">${U.formatCurrency(s.values[i])}</td>`).join("")}</tr>`).join("")
    }</tbody></table></div>`);
  }

  // -------------------------------------------------------------- bar list
  function barList(container, data, opts) {
    opts = Object.assign({ color: "var(--brand)", formatValue: (v) => U.formatCurrency(v) }, opts || {});
    container.innerHTML = "";
    if (!data.length) {
      container.innerHTML = `<div class="empty-state"><div class="title">Nessun dato disponibile</div></div>`;
      return;
    }
    const max = Math.max(1, ...data.map(d => Math.abs(d.value || 0)));
    container.innerHTML = data.map(d => {
      const w = U.clamp(Math.abs(d.value || 0) / max * 100, 0, 100);
      return `<div class="bar-list-row">
        <div class="name" title="${U.escapeAttr(d.label)}">${U.escapeHtml(d.label)}</div>
        <div class="bar-list-track"><div class="bar-list-fill" style="width:${w}%;background:${opts.color}"></div></div>
        <div class="val">${opts.formatValue(d.value)}</div>
      </div>`;
    }).join("");
  }

  // ---------------------------------------------------------- compare bars
  function compareBars(container, data, opts) {
    opts = Object.assign({ formatValue: (v) => U.formatCurrency(v) }, opts || {});
    container.innerHTML = "";
    const max = Math.max(1, ...data.map(d => d.value || 0), opts.marker ? opts.marker.value || 0 : 0);
    let html = data.map(d => {
      const w = U.clamp((d.value || 0) / max * 100, 0, 100);
      const markerLeft = opts.marker ? U.clamp((opts.marker.value || 0) / max * 100, 0, 100) : null;
      return `<div class="bar-list-row">
        <div class="name">${U.escapeHtml(d.label)}</div>
        <div style="position:relative">
          <div class="bar-list-track"><div class="bar-list-fill" style="width:${w}%;background:${d.color || "var(--brand)"}"></div></div>
          ${opts.marker ? `<div style="position:absolute;left:${markerLeft}%;top:-3px;bottom:-3px;width:2px;background:var(--ink);border-radius:1px;transform:translateX(-1px)"></div>` : ""}
        </div>
        <div class="val">${opts.formatValue(d.value)}</div>
      </div>`;
    }).join("");
    container.innerHTML = html;
    if (opts.marker) {
      const note = document.createElement("div");
      note.style.cssText = "display:flex;justify-content:flex-end;margin-top:6px";
      note.innerHTML = `<span class="legend-item"><span class="dot" style="background:var(--ink)"></span>${U.escapeHtml(opts.marker.label)} — <b>${opts.formatValue(opts.marker.value)}</b></span>`;
      container.appendChild(note);
    }
  }

  global.Charts = { COLORS, colorForGruppo, donut, progressRing, lines, barList, compareBars, hideTip };
})(window);
