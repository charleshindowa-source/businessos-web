import React, { useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import { Card, Th, Td, inputCls, selectCls, btnPrimary } from "../../components/ui";
import { BUSINESSES, CATEGORIES_EXP, CATEGORIES_INC, INK, TEAL } from "../../lib/constants";
import { uid, money, pushLog, todayStr } from "../../lib/utils";

export function IncExpTab({ data, patch, who }) {
  const [q, setQ] = useState("");
  function add() { patch(d => { d.incomeExpenses.push({ id: uid(), date: todayStr(), business: "Both", type: "Expense", category: "Miscellaneous", description: "", amount: 0, paymentMethod: "Cash" }); return d; }); }
  function update(id, field, value) { patch(d => { const e = d.incomeExpenses.find(x => x.id === id); if (e) e[field] = value; return d; }); }
  function remove(id) { patch(d => { d.incomeExpenses = d.incomeExpenses.filter(x => x.id !== id); return d; }); }
  function addTemplate() { patch(d => { d.recurringExpenses.push({ id: uid(), business: "Both", category: "Rent", description: "", amount: 0 }); return d; }); }
  function updateTemplate(id, field, value) { patch(d => { const t = d.recurringExpenses.find(x => x.id === id); if (t) t[field] = value; return d; }); }
  function removeTemplate(id) { patch(d => { d.recurringExpenses = d.recurringExpenses.filter(x => x.id !== id); return d; }); }
  function applyTemplate(t) {
    patch(d => { d.incomeExpenses.push({ id: uid(), date: todayStr(), business: t.business, type: "Expense", category: t.category, description: t.description, amount: t.amount, paymentMethod: "Cash" }); pushLog(d, who, `Added recurring expense: ${t.description || t.category} (${money(t.amount)})`); return d; });
  }
  const filtered = data.incomeExpenses.filter(e => !q || `${e.description} ${e.category} ${e.business} ${e.date}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <Card title="Recurring Expenses">
        <p className="text-xs text-[#8A9490] mb-3">Set up templates for expenses that repeat monthly — click "Add This Month" instead of retyping.</p>
        <div className="space-y-2 mb-3">
          {data.recurringExpenses.map(t => (
            <div key={t.id} className="flex flex-wrap items-center gap-2">
              <select className={selectCls + " w-32"} value={t.business} onChange={e => updateTemplate(t.id, "business", e.target.value)}><option>Both</option>{BUSINESSES.map(b => <option key={b}>{b}</option>)}</select>
              <select className={selectCls + " w-40"} value={t.category} onChange={e => updateTemplate(t.id, "category", e.target.value)}>{CATEGORIES_EXP.map(c => <option key={c}>{c}</option>)}</select>
              <input className={inputCls + " flex-1 min-w-[120px]"} placeholder="Description" value={t.description} onChange={e => updateTemplate(t.id, "description", e.target.value)} />
              <input type="number" className={inputCls + " w-24 text-right"} value={t.amount} onChange={e => updateTemplate(t.id, "amount", Number(e.target.value))} />
              <button type="button" onClick={() => applyTemplate(t)} className={btnPrimary} style={{ background: TEAL }}>Add This Month</button>
              <button type="button" onClick={() => removeTemplate(t.id)} className="text-[#8A9490] hover:text-[#A6402F]"><Trash2 size={14} /></button>
            </div>
          ))}
          {data.recurringExpenses.length === 0 && <p className="text-xs text-[#8A9490]">No templates yet.</p>}
        </div>
        <button type="button" onClick={addTemplate} className="inline-flex items-center gap-1.5 -ml-2.5 px-2.5 py-1.5 rounded-md text-sm font-medium text-[#5B6663] hover:bg-black/5"><Plus size={14} /> New template</button>
      </Card>
      <Card title={`Income & Expenses (${data.incomeExpenses.length} entries)`} right={<button type="button" onClick={add} className={btnPrimary} style={{ background: INK }}><Plus size={14} /> Add entry</button>}>
        <div className="flex items-center gap-2 mb-4">
          <Search size={16} className="text-[#8A9490]" />
          <input className={inputCls + " max-w-xs"} placeholder="Search description, category, date…" value={q} onChange={e => setQ(e.target.value)} />
          {q && <span className="text-xs text-[#8A9490]">{filtered.length} of {data.incomeExpenses.length}</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><Th>Date</Th><Th>Business</Th><Th>Type</Th><Th>Category</Th><Th>Description</Th><Th className="text-right">Amount</Th><Th>Payment</Th><Th></Th></tr></thead>
            <tbody>
              {filtered.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "")).map(e => (
                <tr key={e.id} className="border-t border-black/5">
                  <Td><input type="date" className={inputCls} value={e.date} onChange={ev => update(e.id, "date", ev.target.value)} /></Td>
                  <Td><select className={selectCls} value={e.business} onChange={ev => update(e.id, "business", ev.target.value)}><option>Both</option>{BUSINESSES.map(b => <option key={b}>{b}</option>)}</select></Td>
                  <Td><select className={selectCls} value={e.type} onChange={ev => update(e.id, "type", ev.target.value)}><option>Expense</option><option>Income</option></select></Td>
                  <Td><select className={selectCls} value={e.category} onChange={ev => update(e.id, "category", ev.target.value)}>{(e.type === "Expense" ? CATEGORIES_EXP : CATEGORIES_INC).map(c => <option key={c}>{c}</option>)}</select></Td>
                  <Td><input className={inputCls} value={e.description} onChange={ev => update(e.id, "description", ev.target.value)} /></Td>
                  <Td><input type="number" className={inputCls + " text-right w-24"} value={e.amount} onChange={ev => update(e.id, "amount", Number(ev.target.value))} /></Td>
                  <Td><select className={selectCls} value={e.paymentMethod} onChange={ev => update(e.id, "paymentMethod", ev.target.value)}><option>Cash</option><option>Bank Transfer</option><option>Mobile Money</option><option>Card</option></select></Td>
                  <Td><button type="button" onClick={() => remove(e.id)} className="text-[#8A9490] hover:text-[#A6402F]"><Trash2 size={14} /></button></Td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><Td colSpan={8} className="text-[#8A9490] text-center py-4">No matching entries.</Td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
