/* ============================== UTILITIES ============================== */
export function pad(n) { return String(n).padStart(2, "0"); }

export function genMonths() {
  const out = [];
  for (let y = 2026; y <= 2032; y++) {
    for (let m = 1; m <= 12; m++) {
      out.push({ value: `${y}-${pad(m)}`, label: new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" }) });
    }
  }
  return out;
}
export const MONTHS = genMonths();
export function monthLabel(v) { return MONTHS.find(m => m.value === v)?.label || v; }
export function daysInMonth(v) { const [y, m] = v.split("-").map(Number); return new Date(y, m, 0).getDate(); }
export function uid() { return Math.random().toString(36).slice(2, 10); }
export function money(n) { return (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " NLe"; }
export function initials(name) { return (name || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase(); }
export function timeAgo(iso) {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
export function calcPAYE(taxable) {
  if (taxable <= 600) return 0;
  if (taxable <= 1200) return (taxable - 600) * 0.15;
  if (taxable <= 1800) return 90 + (taxable - 1200) * 0.2;
  if (taxable <= 2400) return 210 + (taxable - 1800) * 0.25;
  return 360 + (taxable - 2400) * 0.3;
}
export function pushLog(d, who, action) {
  if (!d.activityLog) d.activityLog = [];
  d.activityLog.push({ id: uid(), ts: new Date().toISOString(), who, action });
  if (d.activityLog.length > 300) d.activityLog = d.activityLog.slice(-300);
}

/* ---- PIN hashing (client-side, salted SHA-256 via Web Crypto) ----
   Not a replacement for real per-user authentication, but it means a PIN
   is never stored or transmitted in the clear inside the shared Firestore
   document — see README's security notes. */
export async function hashPin(pin, salt) {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(`${salt}:${pin}`));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}
export function randomSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function nextInvoiceNumber(settings, business) {
  const prefix = business === "General Merchandise" ? "GM" : "RR";
  const n = Number(settings.nextInvoiceNumber) || 1001;
  return { number: `INV-${prefix}-${n}`, next: n + 1 };
}

export function todayStr() { return new Date().toISOString().slice(0, 10); }
