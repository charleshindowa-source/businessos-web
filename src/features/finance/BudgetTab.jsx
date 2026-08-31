import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, Th, Td, MonthPicker, inputCls, selectCls, btnPrimary } from "../../components/ui";
import { BUSINESSES, CATEGORIES_EXP, INK, MOSS, BRICK } from "../../lib/constants";
import { uid, money } from "../../lib/utils";

export function BudgetTab({ data, patch, calc }) {
  function add() { patch(d => { d.budget.push({ id: uid(), month: "2026-08", business: "Root & Rinse", category: "Advertising/Marketing", amount: 0 }); return d; }); }
  function update(id, field, value) { patch(d => { const b = d.budget.find(x => x.id === id); if (b) b[field] = value; return d; }); }
  function remove(id) { patch(d => { d.budget = d.budget.filter(x => x.id !== id); return d; }); }
  function actualFor(b) {
    if (b.category === "Payroll") return calc.allPayrollFor(b.month).reduce((s, p) => s + p.employerCost, 0);
    return data.incomeExpenses.filter(e => e.type === "Expense" && e.date?.startsWith(b.month) && e.business === b.business && e.category === b.category).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }
  return (
    <Card title="Budget vs Actual" right={<button type="button" onClick={add} className={btnPrimary} style={{ background: INK }}><Plus size={14} /> Add line</button>}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr><Th>Month</Th><Th>Business</Th><Th>Category</Th><Th className="text-right">Budget</Th><Th className="text-right">Actual</Th><Th className="text-right">Variance</Th><Th></Th></tr></thead>
          <tbody>
            {data.budget.map(b => {
              const actual = actualFor(b);
              const variance = b.amount - actual;
              return (
                <tr key={b.id} className="border-t border-black/5" style={variance < 0 ? { background: "#FBEEEC" } : {}}>
                  <Td><MonthPicker value={b.month} onChange={v => update(b.id, "month", v)} small /></Td>
                  <Td><select className={selectCls} value={b.business} onChange={e => update(b.id, "business", e.target.value)}><option>Both</option>{BUSINESSES.map(x => <option key={x}>{x}</option>)}</select></Td>
                  <Td><select className={selectCls} value={b.category} onChange={e => update(b.id, "category", e.target.value)}><option>Payroll</option>{CATEGORIES_EXP.map(c => <option key={c}>{c}</option>)}</select></Td>
                  <Td><input type="number" className={inputCls + " text-right w-24"} value={b.amount} onChange={e => update(b.id, "amount", Number(e.target.value))} /></Td>
                  <Td className="text-right font-mono">{money(actual)}</Td>
                  <Td className="text-right font-mono font-semibold" style={{ color: variance < 0 ? BRICK : MOSS }}>{money(variance)}</Td>
                  <Td><button type="button" onClick={() => remove(b.id)} className="text-[#8A9490] hover:text-[#A6402F]"><Trash2 size={14} /></button></Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
