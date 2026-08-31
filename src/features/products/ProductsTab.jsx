import React, { useState } from "react";
import {
  Plus, Trash2, Search, Camera, Star, Flame, Pencil, ImagePlus,
  Package, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { BarcodeScannerModal } from "../../components/BarcodeScannerModal";
import { BUSINESSES } from "../../lib/constants";
import { uid, money, pushLog } from "../../lib/utils";
import { storage, ref, uploadBytes, getDownloadURL } from "../../lib/firebase";

export function ProductsTab({ data, patch, readOnly = false, who }) {
  const [q, setQ] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [editingSku, setEditingSku] = useState(null);
  const [uploadingSku, setUploadingSku] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [scanNotice, setScanNotice] = useState("");

  function add() {
    patch(d => { d.products.push({ sku: `NEW-${uid().slice(0, 4).toUpperCase()}`, barcode: "", business: "Root & Rinse", name: "New Product", category: "", opening: 0, stockIn: 0, stockOut: 0, reorderLevel: 5, unitCost: 0, sellingPrice: 0, imageUrl: "", isPopular: false, isPriority: false }); pushLog(d, who, "Added a new product"); return d; });
  }
  function update(sku, field, value) { patch(d => { const p = d.products.find(x => x.sku === sku); if (p) p[field] = value; return d; }); }
  function remove(sku) { patch(d => { const p = d.products.find(x => x.sku === sku); d.products = d.products.filter(x => x.sku !== sku); if (p) pushLog(d, who, `Removed product: ${p.name}`); return d; }); }
  function handleScanned(code) {
    setScannerOpen(false); setQ(code);
    const existing = data.products.find(p => p.barcode === code || p.sku === code);
    if (existing) { setScanNotice(`Found: ${existing.name}`); setTimeout(() => setScanNotice(""), 2500); return; }
    if (readOnly) { setScanNotice("No product matches this code."); setTimeout(() => setScanNotice(""), 2500); return; }
    patch(d => { d.products.push({ sku: code, barcode: code, business: "Root & Rinse", name: "Scanned Product — edit me", category: "", opening: 0, stockIn: 0, stockOut: 0, reorderLevel: 5, unitCost: 0, sellingPrice: 0, imageUrl: "", isPopular: false, isPriority: false }); pushLog(d, who, `Added product via barcode scan: ${code}`); return d; });
    setEditingSku(code);
  }
  function handleImageFile(sku, file) {
    if (!file) return;
    setUploadError("");
    setUploadingSku(sku);
    const imgRef = ref(storage, `product-images/${sku}-${Date.now()}-${file.name}`);
    uploadBytes(imgRef, file)
      .then(() => getDownloadURL(imgRef))
      .then(url => { update(sku, "imageUrl", url); })
      .catch(err => { console.error("Image upload failed:", err); setUploadError("Upload failed — make sure Firebase Storage is enabled for your project (see README)."); })
      .finally(() => setUploadingSku(null));
  }

  const withClosing = data.products.map(p => ({ ...p, _closing: (Number(p.opening) || 0) + (Number(p.stockIn) || 0) - (Number(p.stockOut) || 0) }));
  const totalItems = withClosing.length;
  const inStockCount = withClosing.filter(p => p._closing > (Number(p.reorderLevel) || 0)).length;
  const lowStockCount = withClosing.filter(p => p._closing > 0 && p._closing <= (Number(p.reorderLevel) || 0)).length;
  const outOfStockCount = withClosing.filter(p => p._closing <= 0).length;
  const totalStockValue = withClosing.reduce((sum, p) => sum + p._closing * (Number(p.unitCost) || 0), 0);
  const filtered = data.products.filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()) || (p.barcode || "").toLowerCase().includes(q.toLowerCase()));

  const darkInputCls = "w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40";
  const darkSelectCls = darkInputCls + " appearance-none";

  return (
    <div className="bg-slate-900 rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-white text-2xl font-bold">{readOnly ? "Check Stock" : "Stock Management"}</h2>
          <p className="text-slate-400 text-sm mt-0.5">{readOnly ? "Look up quantities — view only" : "Manage and track your inventory"}</p>
        </div>
        {!readOnly && (
          <button type="button" onClick={add} className="w-11 h-11 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Plus size={22} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Items", value: totalItems, icon: Package, color: "blue" },
          { label: "In Stock", value: inStockCount, icon: CheckCircle2, color: "green" },
          { label: "Low Stock", value: lowStockCount, icon: AlertTriangle, color: "red" },
          { label: "Out of Stock", value: outOfStockCount, icon: Package, color: "orange" },
        ].map(k => {
          const Icon = k.icon;
          const colorMap = {
            blue: { bg: "bg-blue-500/15", text: "text-blue-400" },
            green: { bg: "bg-green-500/15", text: "text-green-400" },
            red: { bg: "bg-red-500/15", text: "text-red-400" },
            orange: { bg: "bg-orange-500/15", text: "text-orange-400" },
          }[k.color];
          return (
            <div key={k.label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorMap.bg} ${colorMap.text}`}><Icon size={18} /></div>
              <div className="text-white text-3xl font-bold">{k.value}</div>
              <div className="text-slate-400 text-sm mt-1">{k.label}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 mb-4">
        <Search size={16} className="text-slate-500 shrink-0" />
        <input className="bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none flex-1" placeholder="Search items by name, SKU, or barcode…" value={q} onChange={e => setQ(e.target.value)} />
        <button type="button" onClick={() => setScannerOpen(true)} className="text-slate-400 hover:text-white shrink-0" title="Scan barcode"><Camera size={16} /></button>
      </div>
      {q && <div className="text-xs text-slate-500 mb-3">{filtered.length} of {data.products.length}</div>}
      {scanNotice && <div className="text-xs text-blue-400 mb-3">{scanNotice}</div>}
      {scannerOpen && <BarcodeScannerModal onDetected={handleScanned} onClose={() => setScannerOpen(false)} />}

      {!readOnly && (
        <div className="flex items-center justify-between mb-5">
          <div><div className="text-slate-400 text-xs">Total Stock Value</div><div className="text-blue-400 text-xl font-bold font-mono">{money(totalStockValue)}</div></div>
        </div>
      )}
      {uploadError && <p className="text-xs text-red-400 mb-3">{uploadError}</p>}

      <div className="space-y-3">
        {filtered.map(p => {
          const closing = (Number(p.opening) || 0) + (Number(p.stockIn) || 0) - (Number(p.stockOut) || 0);
          const margin = p.sellingPrice > 0 ? (p.sellingPrice - p.unitCost) / p.sellingPrice : 0;
          const low = closing <= (Number(p.reorderLevel) || 0);
          const out = closing <= 0;
          const suggested = Math.max((Number(p.reorderLevel) || 0) * 2 - closing, Number(p.reorderLevel) || 0, 1);
          const stockPillColor = out ? "bg-red-500/15 text-red-400" : low ? "bg-orange-500/15 text-orange-400" : "bg-green-500/15 text-green-400";
          const isEditing = editingSku === p.sku;
          const isUploading = uploadingSku === p.sku;

          return (
            <div key={p.sku} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <label className="w-16 h-16 rounded-lg bg-slate-700 shrink-0 flex items-center justify-center overflow-hidden cursor-pointer relative">
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <ImagePlus size={20} className="text-slate-400" />}
                  {isUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-[10px] text-white">…</div>}
                  {!readOnly && <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleImageFile(p.sku, e.target.files?.[0])} />}
                </label>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {!readOnly ? (
                      <button type="button" onClick={() => update(p.sku, "isPopular", !p.isPopular)} title="Toggle popular">
                        <Star size={16} className={p.isPopular ? "text-amber-400 fill-amber-400" : "text-slate-600"} />
                      </button>
                    ) : (p.isPopular && <Star size={16} className="text-amber-400 fill-amber-400" />)}
                    <span className="text-white font-bold truncate">{p.name}</span>
                    {p.isPopular && <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-orange-500/40 text-orange-400 bg-orange-500/10"><Flame size={11} /> Popular</span>}
                  </div>
                  <div className="text-slate-400 text-sm mt-1">{p.category || "Uncategorized"}</div>
                  {p.barcode && <div className="text-slate-500 text-xs font-mono mt-0.5">Barcode: {p.barcode}</div>}
                  {p.isPriority && <div className="text-amber-400 text-sm font-medium">Priority</div>}
                </div>

                <div className={`rounded-xl px-3 py-2 text-center shrink-0 ${stockPillColor}`}>
                  <div className="font-bold text-lg leading-none">{closing}</div>
                  <div className="text-[10px] mt-0.5">{out ? "Out of Stock" : low ? "Low Stock" : "In Stock"}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3 bg-slate-900/60 rounded-lg p-3">
                <div><div className="text-slate-400 text-xs">Cost</div><div className="text-white font-bold font-mono">{money(p.unitCost)}</div></div>
                <div><div className="text-slate-400 text-xs">Selling</div><div className="text-white font-bold font-mono">{money(p.sellingPrice)}</div></div>
              </div>

              {!readOnly && (
                <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-slate-700">
                  <button type="button" onClick={() => setEditingSku(isEditing ? null : p.sku)} className="text-slate-400 hover:text-white"><Pencil size={16} /></button>
                  <button type="button" onClick={() => remove(p.sku)} className="text-red-500/80 hover:text-red-400"><Trash2 size={16} /></button>
                </div>
              )}

              {isEditing && !readOnly && (
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-700">
                  <label className="col-span-2 flex items-center gap-2 text-slate-300 text-sm"><input type="file" accept="image/*" onChange={e => handleImageFile(p.sku, e.target.files?.[0])} className="text-xs" /></label>
                  <div><label className="block text-[11px] text-slate-400 mb-1">SKU</label><input className={darkInputCls} value={p.sku} onChange={e => update(p.sku, "sku", e.target.value)} /></div>
                  <div><label className="block text-[11px] text-slate-400 mb-1">Barcode</label><input className={darkInputCls} value={p.barcode || ""} placeholder="Scan or type" onChange={e => update(p.sku, "barcode", e.target.value)} /></div>
                  <div><label className="block text-[11px] text-slate-400 mb-1">Name</label><input className={darkInputCls} value={p.name} onChange={e => update(p.sku, "name", e.target.value)} /></div>
                  <div><label className="block text-[11px] text-slate-400 mb-1">Business</label><select className={darkSelectCls} value={p.business} onChange={e => update(p.sku, "business", e.target.value)}>{BUSINESSES.map(b => <option key={b}>{b}</option>)}</select></div>
                  <div><label className="block text-[11px] text-slate-400 mb-1">Category</label><input className={darkInputCls} value={p.category} onChange={e => update(p.sku, "category", e.target.value)} /></div>
                  <div><label className="block text-[11px] text-slate-400 mb-1">Opening</label><input type="number" className={darkInputCls} value={p.opening} onChange={e => update(p.sku, "opening", Number(e.target.value))} /></div>
                  <div><label className="block text-[11px] text-slate-400 mb-1">Stock In</label><input type="number" className={darkInputCls} value={p.stockIn} onChange={e => update(p.sku, "stockIn", Number(e.target.value))} /></div>
                  <div><label className="block text-[11px] text-slate-400 mb-1">Stock Out</label><input type="number" className={darkInputCls} value={p.stockOut} onChange={e => update(p.sku, "stockOut", Number(e.target.value))} /></div>
                  <div><label className="block text-[11px] text-slate-400 mb-1">Reorder Level</label><input type="number" className={darkInputCls} value={p.reorderLevel} onChange={e => update(p.sku, "reorderLevel", Number(e.target.value))} /></div>
                  <div><label className="block text-[11px] text-slate-400 mb-1">Unit Cost</label><input type="number" className={darkInputCls} value={p.unitCost} onChange={e => update(p.sku, "unitCost", Number(e.target.value))} /></div>
                  <div><label className="block text-[11px] text-slate-400 mb-1">Selling Price</label><input type="number" className={darkInputCls} value={p.sellingPrice} onChange={e => update(p.sku, "sellingPrice", Number(e.target.value))} /></div>
                  <label className="flex items-center gap-2 text-slate-300 text-sm"><input type="checkbox" checked={!!p.isPopular} onChange={e => update(p.sku, "isPopular", e.target.checked)} /> Mark Popular</label>
                  <label className="flex items-center gap-2 text-slate-300 text-sm"><input type="checkbox" checked={!!p.isPriority} onChange={e => update(p.sku, "isPriority", e.target.checked)} /> Mark Priority</label>
                  {low && <div className="col-span-2 text-xs text-orange-400">Suggested reorder quantity: <span className="font-mono">{suggested}</span></div>}
                  <div className="col-span-2 text-xs text-slate-500">Margin: {(margin * 100).toFixed(1)}%</div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-slate-500 text-center py-6">No products found.</p>}
      </div>
    </div>
  );
}
