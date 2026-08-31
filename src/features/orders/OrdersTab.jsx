import React, { useState } from "react";
import { Plus, Trash2, X, MessageCircle, CheckCircle2, Search, FileText } from "lucide-react";
import { Field, BizTag, inputCls, selectCls, btnPrimary, btnGhost } from "../../components/ui";
import { InvoiceModal } from "../invoices/Invoice";
import { buildMessage } from "./buildMessage";
import { BUSINESSES, INK, MOSS, BRICK } from "../../lib/constants";
import { uid, money, pushLog, todayStr } from "../../lib/utils";

export function OrdersTab({ data, patch, calc, who }) {
  const [openMsg, setOpenMsg] = useState(null);
  const [invoiceOrderId, setInvoiceOrderId] = useState(null);
  const [view, setView] = useState("board");
  const [q, setQ] = useState("");

  function addOrder() {
    patch(d => { d.orders.push({ id: uid(), date: todayStr(), customerName: "", customerPhone: "", business: BUSINESSES[0], items: [{ sku: d.products[0]?.sku || "", qty: 1 }], status: "New", paymentMethod: "Orange Money", paymentStatus: "Pending", loggedToSales: false, invoiceNumber: "" }); pushLog(d, who, "Created a new customer order"); return d; });
  }
  function update(id, field, value) { patch(d => { const o = d.orders.find(x => x.id === id); if (o) o[field] = value; return d; }); }
  function remove(id) { patch(d => { d.orders = d.orders.filter(x => x.id !== id); return d; }); }
  function addItem(orderId) { patch(d => { const o = d.orders.find(x => x.id === orderId); if (o) o.items.push({ sku: d.products[0]?.sku || "", qty: 1 }); return d; }); }
  function updateItem(orderId, idx, field, value) { patch(d => { const o = d.orders.find(x => x.id === orderId); if (o) o.items[idx][field] = value; return d; }); }
  function removeItem(orderId, idx) { patch(d => { const o = d.orders.find(x => x.id === orderId); if (o) o.items = o.items.filter((_, i) => i !== idx); return d; }); }
  function orderTotal(order) { return order.items.reduce((sum, it) => sum + (Number(it.qty) || 0) * calc.sellingPrice(it.sku), 0); }
  function fulfillAndLog(order) {
    if (order.loggedToSales) return;
    patch(d => {
      const o = d.orders.find(x => x.id === order.id);
      o.items.forEach(it => {
        d.sales.push({ id: uid(), date: o.date, business: o.business, sku: it.sku, qty: Number(it.qty) || 0, staffId: "" });
        const p = d.products.find(x => x.sku === it.sku);
        if (p) p.stockOut = (Number(p.stockOut) || 0) + (Number(it.qty) || 0);
      });
      o.status = "Fulfilled"; o.loggedToSales = true;
      pushLog(d, who, `Fulfilled order for ${o.customerName || "customer"} (${money(orderTotal(o))})`);
      return d;
    });
  }

  const filtered = data.orders.filter(o => !q || `${o.customerName} ${o.customerPhone} ${o.date}`.toLowerCase().includes(q.toLowerCase()));
  const sorted = filtered.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const columns = ["New", "Confirmed", "Fulfilled"];
  const invoiceOrder = invoiceOrderId ? data.orders.find(o => o.id === invoiceOrderId) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#5B6663]">Customer Orders ({data.orders.length})</h3>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-black/10 overflow-hidden text-xs">
            <button type="button" onClick={() => setView("board")} className={"px-3 py-1.5 " + (view === "board" ? "text-white" : "text-[#5B6663] hover:bg-black/5")} style={view === "board" ? { background: INK } : {}}>Board</button>
            <button type="button" onClick={() => setView("list")} className={"px-3 py-1.5 " + (view === "list" ? "text-white" : "text-[#5B6663] hover:bg-black/5")} style={view === "list" ? { background: INK } : {}}>List</button>
          </div>
          <button type="button" onClick={addOrder} className={btnPrimary} style={{ background: INK }}><Plus size={14} /> New order</button>
        </div>
      </div>
      <p className="text-xs text-[#8A9490] max-w-2xl">Set Payment Status to Paid once confirmed, then "Mark Fulfilled" — it logs the sale and deducts stock automatically. Separate from manual Stock In/Out — don't double-count.</p>
      <div className="flex items-center gap-2">
        <Search size={16} className="text-[#8A9490]" />
        <input className={inputCls + " max-w-xs"} placeholder="Search customer, phone, date…" value={q} onChange={e => setQ(e.target.value)} />
        {q && <span className="text-xs text-[#8A9490]">{sorted.length} of {data.orders.length}</span>}
      </div>

      {view === "board" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map(col => {
            const colOrders = sorted.filter(o => o.status === col || (col === "Fulfilled" && o.loggedToSales));
            return (
              <div key={col}>
                <div className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#8A9490] mb-2 flex items-center justify-between"><span>{col}</span><span className="font-mono">{colOrders.length}</span></div>
                <div className="space-y-2">
                  {colOrders.map(o => {
                    const total = orderTotal(o);
                    return (
                      <div key={o.id} className="bg-white rounded-lg border border-black/5 shadow-sm p-3">
                        <div className="flex items-center justify-between mb-1"><span className="text-sm font-medium truncate">{o.customerName || "Unnamed customer"}</span><BizTag biz={o.business} /></div>
                        <div className="text-xs text-[#8A9490] mb-2">{o.date} · {o.items.length} item{o.items.length !== 1 ? "s" : ""}</div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-semibold">{money(total)}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: o.paymentStatus === "Paid" ? "#EAF3EE" : "#FBEEEC", color: o.paymentStatus === "Paid" ? MOSS : BRICK }}>{o.paymentStatus}</span>
                        </div>
                        {col !== "Fulfilled" && (
                          <div className="flex gap-1.5 mt-2">
                            {col === "New" && <button type="button" onClick={() => update(o.id, "status", "Confirmed")} className={btnGhost + " text-xs px-2 py-1"}>Confirm →</button>}
                            {col === "Confirmed" && <button type="button" onClick={() => fulfillAndLog(o)} disabled={o.paymentStatus !== "Paid"} className={"text-xs px-2 py-1 rounded-md " + (o.paymentStatus === "Paid" ? "text-white" : "text-[#8A9490] bg-black/5 cursor-not-allowed")} style={o.paymentStatus === "Paid" ? { background: MOSS } : {}}>Fulfill →</button>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {colOrders.length === 0 && <p className="text-xs text-[#8A9490]">Nothing here.</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sorted.length === 0 && <p className="text-sm text-[#8A9490] lg:col-span-2">No matching orders.</p>}
          {sorted.map(o => {
            const total = orderTotal(o);
            return (
              <div key={o.id} className="bg-white rounded-lg border border-black/5 shadow-sm p-4">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    <Field label="Customer Name"><input className={inputCls} value={o.customerName} onChange={e => update(o.id, "customerName", e.target.value)} /></Field>
                    <Field label="Phone"><input className={inputCls} value={o.customerPhone} onChange={e => update(o.id, "customerPhone", e.target.value)} /></Field>
                  </div>
                  <button type="button" onClick={() => remove(o.id)} className="text-[#8A9490] hover:text-[#A6402F] mt-5 shrink-0"><Trash2 size={14} /></button>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <Field label="Date"><input type="date" className={inputCls} value={o.date} onChange={e => update(o.id, "date", e.target.value)} /></Field>
                  <Field label="Business"><select className={selectCls} value={o.business} onChange={e => update(o.id, "business", e.target.value)}>{BUSINESSES.map(b => <option key={b}>{b}</option>)}</select></Field>
                  <Field label="Status"><select className={selectCls} value={o.status} onChange={e => update(o.id, "status", e.target.value)}><option>New</option><option>Confirmed</option><option>Fulfilled</option><option>Cancelled</option></select></Field>
                </div>
                <div className="mb-3">
                  <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#8A9490] mb-1.5">Items</div>
                  <div className="space-y-1.5">
                    {o.items.map((it, idx) => {
                      const p = data.products.find(x => x.sku === it.sku);
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <select className={selectCls + " flex-1"} value={it.sku} onChange={e => updateItem(o.id, idx, "sku", e.target.value)}>{data.products.map(pr => <option key={pr.sku} value={pr.sku}>{pr.sku} — {pr.name}</option>)}</select>
                          <input type="number" min="1" className={inputCls + " w-16 text-right"} value={it.qty} onChange={e => updateItem(o.id, idx, "qty", Number(e.target.value))} />
                          <span className="text-xs font-mono text-[#8A9490] w-20 text-right shrink-0">{money((Number(it.qty) || 0) * (p?.sellingPrice || 0))}</span>
                          <button type="button" onClick={() => removeItem(o.id, idx)} className="text-[#8A9490] hover:text-[#A6402F] shrink-0"><X size={14} /></button>
                        </div>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => addItem(o.id)} className={btnGhost + " mt-1.5 -ml-2.5"}><Plus size={13} /> Add item</button>
                </div>
                <div className="flex items-center justify-between mb-3 pt-2 border-t border-black/5"><span className="text-sm font-medium">Total</span><span className="font-mono font-semibold">{money(total)}</span></div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Field label="Payment Method"><select className={selectCls} value={o.paymentMethod} onChange={e => update(o.id, "paymentMethod", e.target.value)}><option>Orange Money</option><option>Monime</option><option>Cash</option><option>Afrimoney</option><option>Bank Transfer</option></select></Field>
                  <Field label="Payment Status"><select className={selectCls} value={o.paymentStatus} onChange={e => update(o.id, "paymentStatus", e.target.value)}><option>Pending</option><option>Paid</option></select></Field>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setOpenMsg(openMsg?.orderId === o.id && openMsg?.type === "confirm" ? null : { orderId: o.id, type: "confirm" })} className={btnGhost}><MessageCircle size={14} /> Confirm msg</button>
                  <button type="button" onClick={() => setOpenMsg(openMsg?.orderId === o.id && openMsg?.type === "payment" ? null : { orderId: o.id, type: "payment" })} className={btnGhost}><MessageCircle size={14} /> Payment msg</button>
                  <button type="button" onClick={() => setOpenMsg(openMsg?.orderId === o.id && openMsg?.type === "fulfilled" ? null : { orderId: o.id, type: "fulfilled" })} className={btnGhost}><MessageCircle size={14} /> Ready msg</button>
                  <button type="button" onClick={() => setInvoiceOrderId(o.id)} className={btnGhost}><FileText size={14} /> Invoice</button>
                  {o.loggedToSales ? <span className="inline-flex items-center gap-1 text-xs font-semibold ml-auto" style={{ color: MOSS }}><CheckCircle2 size={14} /> Logged to Sales</span> : (
                    <button type="button" onClick={() => fulfillAndLog(o)} disabled={o.paymentStatus !== "Paid"} className={btnPrimary + " ml-auto " + (o.paymentStatus !== "Paid" ? "opacity-40 cursor-not-allowed" : "")} style={{ background: o.paymentStatus === "Paid" ? MOSS : "#B9C0BC" }}><CheckCircle2 size={14} /> Mark Fulfilled & Log Sale</button>
                  )}
                </div>
                {openMsg?.orderId === o.id && (
                  <div className="mt-3">
                    <textarea readOnly value={buildMessage(openMsg.type, o, data)} onClick={e => e.target.select()} className="w-full text-xs font-mono p-2.5 rounded-md border border-black/10 bg-black/[0.02]" rows={6} />
                    <p className="text-[10px] text-[#8A9490] mt-1">Tap the text to select all, then copy and paste into WhatsApp.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {invoiceOrder && <InvoiceModal order={invoiceOrder} data={data} patch={patch} who={who} onClose={() => setInvoiceOrderId(null)} />}
    </div>
  );
}
