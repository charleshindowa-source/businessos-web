import React, { useState } from "react";
import { Plus, CheckCircle2, Camera } from "lucide-react";
import { Card, Field, Th, Td, BizTag, inputCls, selectCls, btnPrimary } from "../../components/ui";
import { BarcodeScannerModal } from "../../components/BarcodeScannerModal";
import { BUSINESSES, INK, MOSS } from "../../lib/constants";
import { uid, money, pushLog, todayStr } from "../../lib/utils";

/* ============================== SALES (STAFF, quick entry) ============================== */
export function StaffSalesTab({ data, patch, calc, staff, who }) {
  const [form, setForm] = useState({ date: todayStr(), business: staff.business !== "Both" ? staff.business : BUSINESSES[0], sku: data.products[0]?.sku || "", qty: 1 });
  const [justLogged, setJustLogged] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanNotice, setScanNotice] = useState("");

  function submitSale() {
    if (!form.sku || !form.qty || Number(form.qty) <= 0) return;
    const product = data.products.find(p => p.sku === form.sku);
    patch(d => {
      d.sales.push({ id: uid(), date: form.date, business: form.business, sku: form.sku, qty: Number(form.qty) || 1, staffId: staff.id });
      pushLog(d, who || staff.name, `Logged a sale: ${form.qty} x ${product?.name || form.sku}`);
      return d;
    });
    setForm(f => ({ ...f, qty: 1 }));
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 1500);
  }
  function handleScanned(code) {
    setScannerOpen(false);
    const product = calc.findByCode(code);
    if (!product) { setScanNotice("No product matches this code."); setTimeout(() => setScanNotice(""), 2500); return; }
    setForm(f => ({ ...f, sku: product.sku, business: product.business === "Both" ? f.business : product.business }));
    setScanNotice(`Scanned: ${product.name} — review quantity, then Log Sale.`);
    setTimeout(() => setScanNotice(""), 3000);
  }

  const myRecentSales = data.sales.filter(s => s.staffId === staff.id).slice().sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 15);
  const product = data.products.find(p => p.sku === form.sku);

  return (
    <div className="space-y-4 max-w-2xl">
      <Card title="Log a Sale" right={<button type="button" onClick={() => setScannerOpen(true)} className="text-[#5B6663] hover:text-[#C2410C]" title="Scan a product"><Camera size={16} /></button>}>
        {scanNotice && <div className="text-xs mb-3" style={{ color: INK }}>{scanNotice}</div>}
        {scannerOpen && <BarcodeScannerModal title="Scan to Sell" hint="Scan a product's barcode to fill in the sale below." onDetected={handleScanned} onClose={() => setScannerOpen(false)} />}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><input type="date" className={inputCls} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Business"><select className={selectCls} value={form.business} onChange={e => setForm({ ...form, business: e.target.value })}>{BUSINESSES.map(b => <option key={b}>{b}</option>)}</select></Field>
          <Field label="Product"><select className={selectCls} value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })}>{data.products.map(p => <option key={p.sku} value={p.sku}>{p.sku} — {p.name}</option>)}</select></Field>
          <Field label="Quantity"><input type="number" min="1" className={inputCls} value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} /></Field>
          <div className="col-span-2 flex items-center justify-between pt-1">
            <span className="text-sm text-[#8A9490]">Total: <span className="font-mono font-semibold text-black">{money((Number(form.qty) || 0) * (product?.sellingPrice || 0))}</span></span>
            <button type="button" onClick={submitSale} className={btnPrimary} style={{ background: justLogged ? MOSS : INK }}>{justLogged ? <><CheckCircle2 size={14} /> Logged!</> : <><Plus size={14} /> Log Sale</>}</button>
          </div>
        </div>
      </Card>
      <Card title="Your Recent Sales">
        <table className="w-full">
          <thead><tr><Th>Date</Th><Th>Business</Th><Th>Product</Th><Th className="text-right">Qty</Th><Th className="text-right">Total</Th></tr></thead>
          <tbody>
            {myRecentSales.map(s => {
              const p = data.products.find(x => x.sku === s.sku);
              return (
                <tr key={s.id} className="border-t border-black/5">
                  <Td className="font-mono text-xs">{s.date}</Td><Td><BizTag biz={s.business} /></Td><Td>{p?.name || s.sku}</Td>
                  <Td className="text-right font-mono">{s.qty}</Td><Td className="text-right font-mono">{money((Number(s.qty) || 0) * (p?.sellingPrice || 0))}</Td>
                </tr>
              );
            })}
            {myRecentSales.length === 0 && <tr><Td colSpan={5} className="text-[#8A9490] text-center py-4">No sales logged yet.</Td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
