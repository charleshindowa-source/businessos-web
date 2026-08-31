import React, { useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import { Field, Avatar, inputCls, btnPrimary } from "../../components/ui";
import { BUSINESSES } from "../../lib/constants";

/* Generic directory used for both Customers and Suppliers — near-identical
   shape, one component instead of two copies. */
export function DirectoryTab({ title, items, fields, accentColor, statsFor, onAdd, onUpdate, onRemove }) {
  const [q, setQ] = useState("");
  const filtered = items.filter(it => !q || `${it.name} ${it.phone || ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#5B6663]">{title} ({items.length})</h3>
        <button type="button" onClick={onAdd} className={btnPrimary} style={{ background: "#C2410C" }}><Plus size={14} /> Add {title.slice(0, -1).toLowerCase()}</button>
      </div>
      <div className="flex items-center gap-2">
        <Search size={16} className="text-[#8A9490]" />
        <input className={inputCls + " max-w-xs"} placeholder="Search name or phone…" value={q} onChange={e => setQ(e.target.value)} />
        {q && <span className="text-xs text-[#8A9490]">{filtered.length} of {items.length}</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(item => (
          <div key={item.id} className="bg-white rounded-lg border border-black/5 shadow-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={item.name} color={accentColor} />
                <div className="min-w-0">
                  <input className="font-semibold text-sm w-full bg-transparent border-b border-transparent hover:border-black/10 focus:border-[#C2410C] focus:outline-none" value={item.name} onChange={e => onUpdate(item.id, "name", e.target.value)} />
                  {statsFor && <div className="text-[11px] text-[#8A9490] font-mono">{statsFor(item)}</div>}
                </div>
              </div>
              <button type="button" onClick={() => onRemove(item.id)} className="text-[#8A9490] hover:text-[#A6402F] shrink-0"><Trash2 size={14} /></button>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              {fields.map(f => (
                <div key={f.key} className={f.span === 2 ? "col-span-2" : ""}>
                  <Field label={f.label}>
                    {f.type === "business" ? (
                      <select className={inputCls + " appearance-none"} value={item[f.key]} onChange={e => onUpdate(item.id, f.key, e.target.value)}>
                        <option>Both</option>{BUSINESSES.map(b => <option key={b}>{b}</option>)}
                      </select>
                    ) : (
                      <input className={inputCls} value={item[f.key] || ""} placeholder={f.placeholder || ""} onChange={e => onUpdate(item.id, f.key, e.target.value)} />
                    )}
                  </Field>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-[#8A9490] md:col-span-2 xl:col-span-3">No {title.toLowerCase()} yet.</p>}
      </div>
    </div>
  );
}
