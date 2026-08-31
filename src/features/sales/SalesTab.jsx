import React, { useState } from "react";
import { Plus, Trash2, Search, Camera } from "lucide-react";
import { Card, Th, Td, inputCls, selectCls, btnPrimary } from "../../components/ui";
import { BarcodeScannerModal } from "../../components/BarcodeScannerModal";
import { BUSINESSES, INK } from "../../lib/constants";
import { uid, money, pushLog, todayStr } from "../../lib/utils";

/* ============================== SALES (OWNER) ============================== */
export function SalesTab({ data, patch, calc, who }) {
  const [q, setQ] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanNotice, setScanNotice] = useState("");

  function add(sku) {
    patch(d => { d.sales.push({ id: uid(), date: todayStr(), business: "Root & Rinse", sku: sku || d.products[0]?.sku || "", qty: 1, staffId: d.staff[0]?.id || "" }); pushLog(d, who, "Added a sale entry"); return d; });
  }
  function update(id, field, value) { patch(d => { const s = d.sales.find(x => x.id === id); if (s) s[field] = value; return d; }); }
  function remove(id) { patch(d => { d.sales = d.sales.filter(x => x.id !== id); return d; }); }
  function handleScanned(code) {
    setScannerOpen(false);
    const product = calc.findByCode(code);
    if (!product) { setScanNotice("No product matches this code."); setTimeout(() => setScanNotice(""), 2500); return; }
    add(product.sku);
    setScanNotice(`Added a sale line for ${product.name}.`);
    setTimeout(() => setScanNotice(""), 2500);
  }
  const filtered = data.sales.filter(s => {
    if (!q) return true;
    const p = data.products.find(x => x.sku === s.sku);
    const st = data.staff.find(x => x.id === s.staffId);
    return `${s.sku} ${p?.name || ""} ${st?.name || ""} ${s.date}`.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <Card title={`Sales Log (${data.sales.length} entries)`} right={
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setScannerOpen(true)} className="text-[#5B6663] hover:text-[#C2410C]" title="Scan a product to add a sale"><Camera size={16} /></button>
        <button type="button" onClick={() => add()} className={btnPrimary} style={{ background: INK }}><Plus size={14} /> Add sale</button>
      </div>
    }>
      <div className="flex items-center gap-2 mb-4">
        <Search size={16} className="text-[#8A9490]" />
        <input className={inputCls + " max-w-xs"} placeholder="Search product, staff, date…" value={q} onChange={e => setQ(e.target.value)} />
        {q && <span className="text-xs text-[#8A9490]">{filtered.length} of {data.sales.length}</span>}
      </div>
      {scanNotice && <div className="text-xs mb-3" style={{ color: INK }}>{scanNotice}</div>}
      {scannerOpen && <BarcodeScannerModal title="Scan to Sell" hint="Scan a product's barcode to add it to the sales log." onDetected={handleScanned} onClose={() => setScannerOpen(false)} />}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr><Th>Date</Th><Th>Business</Th><Th>SKU</Th><Th>Product</Th><Th className="text-right">Qty</Th><Th className="text-right">Total</Th><Th>Sold By</Th><Th></Th></tr></thead>
          <tbody>
            {filtered.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "")).map(s => {
              const product = data.products.find(p => p.sku === s.sku);
              const total = (Number(s.qty) || 0) * (product?.sellingPrice || 0);
              return (
                <tr key={s.id} className="border-t border-black/5">
                  <Td><input type="date" className={inputCls} value={s.date} onChange={e => update(s.id, "date", e.target.value)} /></Td>
                  <Td><select className={selectCls} value={s.business} onChange={e => update(s.id, "business", e.target.value)}>{BUSINESSES.map(b => <option key={b}>{b}</option>)}</select></Td>
                  <Td><select className={selectCls} value={s.sku} onChange={e => update(s.id, "sku", e.target.value)}>{data.products.map(p => <option key={p.sku} value={p.sku}>{p.sku}</option>)}</select></Td>
                  <Td className="text-[#8A9490]">{product?.name || "—"}</Td>
                  <Td><input type="number" className={inputCls + " text-right w-16"} value={s.qty} onChange={e => update(s.id, "qty", Number(e.target.value))} /></Td>
                  <Td className="text-right font-mono font-semibold">{money(total)}</Td>
                  <Td><select className={selectCls} value={s.staffId} onChange={e => update(s.id, "staffId", e.target.value)}><option value="">—</option>{data.staff.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}</select></Td>
                  <Td><button type="button" onClick={() => remove(s.id)} className="text-[#8A9490] hover:text-[#A6402F]"><Trash2 size={14} /></button></Td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><Td colSpan={8} className="text-[#8A9490] text-center py-4">No matching sales.</Td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
