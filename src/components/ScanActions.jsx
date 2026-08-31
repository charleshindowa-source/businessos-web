import React, { useState } from "react";
import { X, Plus, Minus, ArrowRight, CheckCircle2 } from "lucide-react";
import { ScannerView } from "./BarcodeScannerModal";
import { BRAND_BLUE, MOSS, BRICK } from "../lib/constants";
import { money, uid, pushLog, todayStr } from "../lib/utils";

/* "Multi Scan" — keep the camera open across successive scans and add each
   matched product straight to the Sales log, showing a running list. */
export function MultiScanModal({ data, calc, patch, who, staffId = "", onClose }) {
  const [scanKey, setScanKey] = useState(0);
  const [added, setAdded] = useState([]);
  const [notice, setNotice] = useState("");

  function handleDetected(code) {
    const product = calc.findByCode(code);
    if (!product) {
      setNotice("No product matches this code.");
    } else {
      patch(d => {
        d.sales.push({ id: uid(), date: todayStr(), business: product.business, sku: product.sku, qty: 1, staffId });
        pushLog(d, who, `Added a sale entry via Multi Scan: ${product.name}`);
        return d;
      });
      setAdded(a => [{ id: uid(), name: product.name, price: product.sellingPrice }, ...a]);
      setNotice(`Added ${product.name}.`);
    }
    setTimeout(() => setNotice(""), 2000);
    setScanKey(k => k + 1); // remounts the scanner so it's ready for the next item
  }

  const total = added.reduce((s, a) => s + (a.price || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-sm max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-black/5 shrink-0">
          <h3 className="font-semibold text-sm">Multi Scan — Sell Items</h3>
          <button onClick={onClose} className="text-[#8A9490] hover:text-black"><X size={18} /></button>
        </div>
        <div className="p-4 overflow-y-auto">
          <ScannerView key={scanKey} onDetected={handleDetected} hint="Scan each item to add it to the sale. Keep scanning — this stays open." />
          {notice && <div className="text-xs mt-2" style={{ color: notice.startsWith("No product") ? BRICK : MOSS }}>{notice}</div>}
          {added.length > 0 && (
            <div className="mt-4 pt-3 border-t border-black/5">
              <div className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#8A9490] mb-2">Added this session</div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {added.map(a => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{a.name}</span>
                    <span className="font-mono text-[#8A9490] shrink-0 ml-2">{money(a.price)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm font-semibold mt-2 pt-2 border-t border-black/5">
                <span>Total</span><span className="font-mono">{money(total)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* "Stock Scan" — single lookup, then a quick +/- adjust on that product's
   stock without leaving the current screen. */
export function StockScanModal({ data, calc, patch, who, setTab, readOnly = false, onClose }) {
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);

  function handleDetected(code) {
    const p = calc.findByCode(code);
    if (p) { setProduct(p); setNotFound(false); }
    else setNotFound(true);
  }
  function adjust(field, delta) {
    patch(d => {
      const p = d.products.find(x => x.sku === product.sku);
      if (p) { p[field] = Math.max(0, (Number(p[field]) || 0) + delta); pushLog(d, who, `Adjusted ${field} for ${p.name} via Stock Scan`); }
      return d;
    });
    setProduct(prev => prev ? { ...prev, [field]: Math.max(0, (Number(prev[field]) || 0) + delta) } : prev);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-black/5">
          <h3 className="font-semibold text-sm">Stock Scan</h3>
          <button onClick={onClose} className="text-[#8A9490] hover:text-black"><X size={18} /></button>
        </div>
        <div className="p-4">
          {!product && (
            <ScannerView onDetected={handleDetected} hint="Scan a product's barcode to view and adjust its stock." />
          )}
          {notFound && !product && <p className="text-xs mt-3" style={{ color: BRICK }}>No product matches this code. <button className="underline" onClick={() => { onClose(); setTab("products"); }}>Add it in Stock &amp; Prices</button>.</p>}
          {product && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={16} style={{ color: MOSS }} />
                <span className="font-medium text-sm">{product.name}</span>
              </div>
              <div className="text-xs text-[#8A9490] mb-4">{product.sku} · {money(product.sellingPrice)}</div>
              {readOnly ? (
                <p className="text-xs text-[#8A9490]">You have view-only access to stock — ask an owner to adjust quantities.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-black/10 rounded-lg p-3 text-center">
                    <div className="text-[11px] text-[#8A9490] mb-2">Stock In</div>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => adjust("stockIn", -1)} className="w-7 h-7 rounded-full border border-black/10 flex items-center justify-center"><Minus size={14} /></button>
                      <span className="font-mono font-semibold w-6">{product.stockIn}</span>
                      <button onClick={() => adjust("stockIn", 1)} className="w-7 h-7 rounded-full border border-black/10 flex items-center justify-center"><Plus size={14} /></button>
                    </div>
                  </div>
                  <div className="border border-black/10 rounded-lg p-3 text-center">
                    <div className="text-[11px] text-[#8A9490] mb-2">Stock Out</div>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => adjust("stockOut", -1)} className="w-7 h-7 rounded-full border border-black/10 flex items-center justify-center"><Minus size={14} /></button>
                      <span className="font-mono font-semibold w-6">{product.stockOut}</span>
                      <button onClick={() => adjust("stockOut", 1)} className="w-7 h-7 rounded-full border border-black/10 flex items-center justify-center"><Plus size={14} /></button>
                    </div>
                  </div>
                </div>
              )}
              <div className="text-center text-sm mt-3">Current stock: <span className="font-mono font-semibold">{calc.closingStock(product)}</span></div>
              <button onClick={() => { onClose(); setTab("products"); }} className="w-full mt-4 py-2 rounded-md text-sm font-medium text-white flex items-center justify-center gap-1.5" style={{ background: BRAND_BLUE }}>
                View full details <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
