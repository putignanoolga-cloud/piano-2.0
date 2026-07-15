/* Icons and shared UI building blocks: pills, progress bars, toasts, modal, stat tiles. */
(function (global) {
  "use strict";
  const U = global.Utils;

  const ICONS = {
    home: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9h12v-9"/><path d="M10 19v-6h4v6"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    sliders: '<line x1="5" y1="5" x2="5" y2="19"/><line x1="12" y1="5" x2="12" y2="19"/><line x1="19" y1="5" x2="19" y2="19"/><circle cx="5" cy="9" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="2" fill="currentColor" stroke="none"/><circle cx="19" cy="7" r="2" fill="currentColor" stroke="none"/>',
    arrowDown: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M8 13l4 4 4-4"/>',
    arrowUp: '<circle cx="12" cy="12" r="9"/><path d="M12 17V7M8 11l4-4 4 4"/>',
    pie: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M14 3.5A9 9 0 0 1 20.5 10H14z"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    shield: '<path d="M12 3.5 19 6v6c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6z"/>',
    bank: '<path d="M4 10 12 4l8 6"/><path d="M4 10h16v1.5H4z" /><path d="M6 12v6M10.5 12v6M13.5 12v6M18 12v6"/><path d="M3.5 20h17"/>',
    repeat: '<path d="M4 7h12l-3-3M20 17H8l3 3"/><path d="M4 7v4M20 17v-4"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><line x1="3.5" y1="9.5" x2="20.5" y2="9.5"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>',
    calculator: '<rect x="5" y="3" width="14" height="18" rx="2"/><line x1="7.5" y1="7" x2="16.5" y2="7"/><line x1="7.5" y1="11" x2="9.5" y2="11"/><line x1="11.5" y1="11" x2="13.5" y2="11"/><line x1="15.5" y1="11" x2="17.5" y2="11"/><line x1="7.5" y1="14.5" x2="9.5" y2="14.5"/><line x1="11.5" y1="14.5" x2="13.5" y2="14.5"/><line x1="15.5" y1="14.5" x2="17.5" y2="14.5"/><line x1="7.5" y1="18" x2="9.5" y2="18"/><line x1="11.5" y1="18" x2="13.5" y2="18"/>',
    activity: '<path d="M3 12h4l2 7 4-14 2 7h6"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>',
    pencil: '<path d="M4 20l1-4.2L16.2 4.6a1.5 1.5 0 0 1 2.1 0l1.1 1.1a1.5 1.5 0 0 1 0 2.1L8.2 19 4 20z"/><path d="M14.5 6.5l3 3"/>',
    x: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
    download: '<path d="M12 3v12M7.5 10.5 12 15l4.5-4.5"/><path d="M4.5 17.5v2a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-2"/>',
    upload: '<path d="M12 15V3M7.5 7.5 12 3l4.5 4.5"/><path d="M4.5 17.5v2a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-2"/>',
    chevronRight: '<path d="M9 5l7 7-7 7"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><line x1="19" y1="19" x2="15.2" y2="15.2"/>',
    check: '<path d="M4.5 12.5l5 5 10-11"/>',
    alert: '<path d="M12 3.5 21.5 20h-19z"/><line x1="12" y1="9.5" x2="12" y2="14"/><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"/>',
    refresh: '<path d="M4 12a8 8 0 0 1 13.6-5.7L20 8"/><path d="M20 4v4h-4"/><path d="M20 12a8 8 0 0 1-13.6 5.7L4 16"/><path d="M4 20v-4h4"/>',
    menu: '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>',
    wallet: '<rect x="3.5" y="6.5" width="17" height="13" rx="2"/><path d="M3.5 10.5h17"/><circle cx="16.5" cy="14.5" r="1.3" fill="currentColor" stroke="none"/><path d="M6 6.5 15 4l2.5 2.5"/>'
  };

  function icon(name, cls) {
    const body = ICONS[name] || ICONS.grid;
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="${cls || ""}">${body}</svg>`;
  }

  function statTile({ label, value, sub, subClass, accent }) {
    return `<div class="stat-tile${accent ? " accent" : ""}">
      <div class="label">${U.escapeHtml(label)}</div>
      <div class="value tabular">${value}</div>
      ${sub ? `<div class="sub${subClass ? " " + subClass : ""}">${sub}</div>` : ""}
    </div>`;
  }

  const STATUS_MAP = {
    "OK": { cls: "pill-good", icon: "check" },
    "Raggiunto": { cls: "pill-good", icon: "check" },
    "In corso": { cls: "pill-neutral", icon: null },
    "In arrivo": { cls: "pill-warn", icon: "alert" },
    "ATTENZIONE": { cls: "pill-warn", icon: "alert" },
    "In ritardo": { cls: "pill-critical", icon: "alert" },
    "Scaduto": { cls: "pill-critical", icon: "alert" },
    "n/d": { cls: "pill-neutral", icon: null }
  };

  function pill(status, label) {
    const map = STATUS_MAP[status] || { cls: "pill-neutral", icon: null };
    const text = label != null ? label : status;
    return `<span class="pill ${map.cls}">${map.icon ? icon(map.icon) : ""}${U.escapeHtml(text)}</span>`;
  }

  function progress(pct, opts) {
    opts = opts || {};
    const color = opts.color || "var(--brand)";
    const w = U.clamp((pct || 0) * 100, 0, 100);
    return `<div class="progress-track" style="${opts.style || ""}"><div class="progress-fill" style="width:${w}%;background:${color}"></div></div>`;
  }

  function progressRow(labelLeft, labelRight, pct, opts) {
    return `<div class="progress-label"><span>${labelLeft}</span><span class="muted">${labelRight}</span></div>${progress(pct, opts)}`;
  }

  let toastContainer = null;
  function toast(message, type) {
    if (!toastContainer) {
      toastContainer = document.getElementById("toastContainer");
    }
    if (!toastContainer) return;
    const el = document.createElement("div");
    el.className = "toast" + (type ? " " + type : "");
    el.textContent = message;
    toastContainer.appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .25s"; setTimeout(() => el.remove(), 260); }, 2600);
  }

  function confirmDialog({ title, text, confirmLabel, danger }) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "modal-overlay";
      overlay.innerHTML = `<div class="modal">
        <h3>${U.escapeHtml(title || "Confermi?")}</h3>
        <p>${U.escapeHtml(text || "")}</p>
        <div class="modal-actions">
          <button class="btn" data-act="cancel">Annulla</button>
          <button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-act="ok">${U.escapeHtml(confirmLabel || "Conferma")}</button>
        </div>
      </div>`;
      document.body.appendChild(overlay);
      function close(result) { overlay.remove(); resolve(result); }
      overlay.addEventListener("click", (e) => { if (e.target === overlay) close(false); });
      overlay.querySelector('[data-act="cancel"]').addEventListener("click", () => close(false));
      overlay.querySelector('[data-act="ok"]').addEventListener("click", () => close(true));
    });
  }

  function optionsHtml(list, selected) {
    return list.map(v => `<option value="${U.escapeAttr(v)}"${v === selected ? " selected" : ""}>${U.escapeHtml(v)}</option>`).join("");
  }

  function on(root, event, selector, handler) {
    root.addEventListener(event, (e) => {
      const target = e.target.closest(selector);
      if (target && root.contains(target)) handler(e, target);
    });
  }

  global.UI = {
    icon, statTile, pill, progress, progressRow, toast, confirmDialog, optionsHtml, on
  };
})(window);
