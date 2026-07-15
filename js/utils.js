/* Utility helpers: dates, formatting, ids, misc. Shared by every module. */
(function (global) {
  "use strict";

  function uid() {
    if (global.crypto && global.crypto.randomUUID) return global.crypto.randomUUID();
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function pad2(n) { return String(n).padStart(2, "0"); }

  /** Build a local (not UTC) Date at midnight from an ISO "YYYY-MM-DD" string. */
  function parseISODate(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  function toISODate(date) {
    if (!date) return "";
    return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
  }

  function todayISO() {
    return toISODate(new Date());
  }

  function firstOfMonthISO(iso) {
    const d = parseISODate(iso);
    if (!d) return iso;
    return toISODate(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  /** EDATE-equivalent: add n months to an ISO date, clamping the day to the target month's length. */
  function addMonthsISO(iso, n) {
    const d = parseISODate(iso);
    if (!d) return iso;
    const targetMonthIndex = d.getMonth() + n;
    const lastDayOfTarget = new Date(d.getFullYear(), targetMonthIndex + 1, 0).getDate();
    const day = Math.min(d.getDate(), lastDayOfTarget);
    return toISODate(new Date(d.getFullYear(), targetMonthIndex, day));
  }

  /** DATEDIF(d1,d2,"m")-equivalent: complete months between two ISO dates (d2 >= d1). */
  function completeMonthsBetween(iso1, iso2) {
    const d1 = parseISODate(iso1), d2 = parseISODate(iso2);
    if (!d1 || !d2) return 0;
    let months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
    if (d2.getDate() < d1.getDate()) months -= 1;
    return Math.max(0, months);
  }

  /** [startISO, endISOExclusive) covering the calendar month containing meseRifISO. */
  function monthRange(meseRifISO) {
    const start = firstOfMonthISO(meseRifISO);
    const end = addMonthsISO(start, 1);
    return { start, end };
  }

  function inRangeExclusive(iso, startISO, endISOExclusive) {
    return iso >= startISO && iso < endISOExclusive;
  }

  function daysBetween(iso1, iso2) {
    const d1 = parseISODate(iso1), d2 = parseISODate(iso2);
    if (!d1 || !d2) return null;
    return Math.round((d2 - d1) / 86400000);
  }

  const itCurrency = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
  const itCurrencyWhole = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const itNumber = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });

  function formatCurrency(n, whole) {
    const v = Number.isFinite(n) ? n : 0;
    return (whole ? itCurrencyWhole : itCurrency).format(v);
  }

  function formatSignedCurrency(n) {
    const v = Number.isFinite(n) ? n : 0;
    const s = formatCurrency(Math.abs(v));
    return v < 0 ? "-" + s : (v > 0 ? "+" + s : s);
  }

  function formatNumber(n) {
    return itNumber.format(Number.isFinite(n) ? n : 0);
  }

  function formatPercent(n, decimals) {
    const v = Number.isFinite(n) ? n : 0;
    return (v * 100).toFixed(decimals == null ? 0 : decimals) + "%";
  }

  function formatDateIt(iso) {
    if (!iso) return "";
    const d = parseISODate(iso);
    if (!d) return "";
    return pad2(d.getDate()) + "/" + pad2(d.getMonth() + 1) + "/" + d.getFullYear();
  }

  function formatMonthLabel(iso) {
    const d = parseISODate(iso);
    if (!d) return "";
    const s = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" }).format(d);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function formatMonthShort(iso) {
    const d = parseISODate(iso);
    if (!d) return "";
    return new Intl.DateTimeFormat("it-IT", { month: "short", year: "2-digit" }).format(d).replace(".", "");
  }

  function isoToMonthInput(iso) {
    return iso ? iso.slice(0, 7) : "";
  }

  function monthInputToISO(monthStr) {
    return monthStr ? monthStr + "-01" : "";
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function sum(arr, fn) {
    return arr.reduce((acc, item) => acc + (Number(fn(item)) || 0), 0);
  }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(str) {
    return escapeHtml(str);
  }

  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function downloadText(filename, text, mime) {
    const blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function csvEscape(v) {
    const s = v == null ? "" : String(v);
    if (/[",;\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function toCSV(rows) {
    return rows.map(r => r.map(csvEscape).join(";")).join("\r\n");
  }

  global.Utils = {
    uid, pad2,
    parseISODate, toISODate, todayISO, firstOfMonthISO, addMonthsISO,
    completeMonthsBetween, monthRange, inRangeExclusive, daysBetween,
    formatCurrency, formatSignedCurrency, formatNumber, formatPercent,
    formatDateIt, formatMonthLabel, formatMonthShort,
    isoToMonthInput, monthInputToISO,
    clamp, sum, escapeHtml, escapeAttr, debounce,
    downloadText, toCSV
  };
})(window);
