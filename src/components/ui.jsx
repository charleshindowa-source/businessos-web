import React from "react";
import { INK, TEAL, AMBER, BRICK, MOSS } from "../lib/constants";
import { MONTHS, initials } from "../lib/utils";

export const inputCls = "w-full px-2.5 py-1.5 rounded-md border border-black/10 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C2410C]/30 focus:border-[#C2410C]";
export const selectCls = inputCls + " appearance-none";
export const btnPrimary = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white transition";
export const btnGhost = "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium text-[#5B6663] hover:bg-black/5 transition";

export function BizTag({ biz }) {
  const map = {
    "Root & Rinse": { bg: "#E8F2EF", fg: TEAL, dot: TEAL },
    "General Merchandise": { bg: "#FBF1E1", fg: "#8C6018", dot: AMBER },
    "Both": { bg: "#EEF0EE", fg: "#4B5754", dot: "#8A9490" },
  };
  const s = map[biz] || map["Both"];
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono" style={{ background: s.bg, color: s.fg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />{biz}
    </span>
  );
}

export function Card({ title, children, className = "", right = null }) {
  return (
    <div className={`bg-white rounded-lg border border-black/5 shadow-sm ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-black/5">
          <h3 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#5B6663]">{title}</h3>
          {right}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function KPI({ label, value, sub, tone = "ink" }) {
  const color = tone === "alert" ? BRICK : tone === "good" ? MOSS : INK;
  return (
    <div className="bg-white rounded-lg border border-black/5 shadow-sm p-4">
      <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8A9490]">{label}</div>
      <div className="font-mono text-2xl font-semibold mt-1" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-[#8A9490] mt-1">{sub}</div>}
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[#8A9490] mb-1">{label}</span>
      {children}
    </label>
  );
}

export function MonthPicker({ value, onChange, small }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={(small ? "text-xs px-2 py-1 " : "text-sm px-3 py-1.5 ") + "rounded-md border border-black/10 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#C2410C]/30"}>
      {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
    </select>
  );
}

export function Th({ children, className = "", ...rest }) { return <th className={`text-left text-[10px] font-semibold tracking-[0.08em] uppercase text-[#8A9490] px-3 py-2 whitespace-nowrap ${className}`} {...rest}>{children}</th>; }
export function Td({ children, className = "", ...rest }) { return <td className={`px-3 py-1.5 text-sm align-middle ${className}`} {...rest}>{children}</td>; }
export function Avatar({ name, color }) {
  return <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0" style={{ background: color }}>{initials(name)}</div>;
}

export function SaveIndicator({ state }) {
  if (state === "idle") return null;
  const map = {
    saving: { text: "Saving…", color: "#8A9490" },
    saved: { text: "All changes saved", color: MOSS },
    error: { text: "Save failed — check connection", color: BRICK },
  };
  const s = map[state] || map.saving;
  return <span className="text-[11px] font-mono flex items-center gap-1.5" style={{ color: s.color }}>
    <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />{s.text}
  </span>;
}
