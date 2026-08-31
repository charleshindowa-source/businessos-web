import React, { useState } from "react";
import { Sparkles, X, Send } from "lucide-react";
import { BRAND_NAVY_DARK, BRAND_BLUE } from "../lib/constants";
import { money, todayStr } from "../lib/utils";

const QUICK_PROMPTS = ["Today's sales", "Low stock items", "Who's checked in today", "This month's profit"];

/* A local, rule-based assistant — no network call, so it works offline and
   needs no API key. Answers are computed straight from calc/data; it isn't
   a general-purpose chat, just quick shortcuts into numbers already on
   screen elsewhere in the app. */
function answer(question, data, calc) {
  const q = question.toLowerCase();
  const today = todayStr();
  const month = today.slice(0, 7);

  if (q.includes("today") && q.includes("sale")) {
    const t = calc.periodTotals(today, today);
    return t.transactions === 0
      ? "No sales logged today yet."
      : `Today: ${money(t.revenue)} across ${t.transactions} transaction${t.transactions === 1 ? "" : "s"}.`;
  }
  if (q.includes("low stock") || q.includes("reorder") || q.includes("stock")) {
    if (calc.reorderAlerts.length === 0) return "Stock levels are healthy — nothing at or below its reorder level.";
    const names = calc.reorderAlerts.slice(0, 5).map(p => `${p.name} (${calc.closingStock(p)} left)`).join(", ");
    return `${calc.reorderAlerts.length} item${calc.reorderAlerts.length === 1 ? "" : "s"} need reordering: ${names}${calc.reorderAlerts.length > 5 ? "…" : ""}`;
  }
  if (q.includes("checked in") || q.includes("staff")) {
    const active = data.staff.filter(s => s.status === "Active");
    const checkedInIds = new Set((data.checkTimes || []).filter(c => c.date === today && c.checkIn).map(c => c.staffId));
    const count = active.filter(s => checkedInIds.has(s.id)).length;
    return `${count} of ${active.length} active staff checked in today.`;
  }
  if (q.includes("profit") || q.includes("this month")) {
    const pl = calc.plFor(month).combined;
    return `This month so far: ${money(pl.revenue)} revenue, ${money(pl.netProfit)} net profit.`;
  }
  return "I can answer quick questions about sales, stock, staff check-ins, and profit — try one of the shortcuts below, or ask e.g. \"today's sales\".";
}

export function AIAssistant({ data, calc, onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! Ask me about today's sales, low stock, staff check-ins, or this month's profit." },
  ]);
  const [input, setInput] = useState("");

  function ask(text) {
    if (!text.trim()) return;
    setMessages(m => [...m, { role: "user", text }, { role: "assistant", text: answer(text, data, calc) }]);
    setInput("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-sm flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-black/5 shrink-0">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Sparkles size={16} style={{ color: BRAND_BLUE }} /> AI Assistant</h3>
          <button onClick={onClose} className="text-[#8A9490] hover:text-black"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {messages.map((m, i) => (
            <div key={i} className={`text-sm max-w-[85%] px-3 py-2 rounded-xl ${m.role === "user" ? "ml-auto text-white" : "bg-black/5 text-[#111827]"}`} style={m.role === "user" ? { background: BRAND_NAVY_DARK } : undefined}>
              {m.text}
            </div>
          ))}
        </div>
        <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => ask(p)} className="text-[11px] px-2.5 py-1 rounded-full border border-black/10 text-[#5B6663] hover:border-black/20">{p}</button>
          ))}
        </div>
        <div className="p-3 border-t border-black/5 flex items-center gap-2 shrink-0">
          <input
            className="flex-1 px-3 py-2 rounded-md border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6FED]/30"
            placeholder="Ask a question…" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") ask(input); }}
          />
          <button onClick={() => ask(input)} className="w-9 h-9 rounded-md flex items-center justify-center text-white shrink-0" style={{ background: BRAND_BLUE }}><Send size={15} /></button>
        </div>
      </div>
    </div>
  );
}
