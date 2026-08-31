import React, { useEffect } from "react";
import { X, Printer } from "lucide-react";
import { INK, MOSS, BRICK } from "../../lib/constants";
import { money, nextInvoiceNumber, pushLog } from "../../lib/utils";

/* Printable invoice/receipt for a customer order. Assigns a stable invoice
   number the first time it's opened for a given order (stored on the order
   itself so re-opening it later doesn't burn a new number), then hands off
   to the browser's own print dialog — "Save as PDF" there is the export
   path, so no PDF library is needed. */
export function InvoiceModal({ order, data, patch, onClose, who }) {
  useEffect(() => {
    if (!order || order.invoiceNumber) return;
    patch(d => {
      const o = d.orders.find(x => x.id === order.id);
      if (!o || o.invoiceNumber) return d;
      const { number, next } = nextInvoiceNumber(d.settings, o.business);
      o.invoiceNumber = number;
      d.settings.nextInvoiceNumber = next;
      pushLog(d, who, `Generated invoice ${number} for ${o.customerName || "customer"}`);
      return d;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);

  if (!order) return null;
  const profile = data.settings.businessProfile || {};
  const items = order.items.map(it => {
    const p = data.products.find(x => x.sku === it.sku);
    const price = p?.sellingPrice || 0;
    return { name: p?.name || it.sku, qty: Number(it.qty) || 0, price, lineTotal: (Number(it.qty) || 0) * price };
  });
  const total = items.reduce((s, it) => s + it.lineTotal, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 no-print" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="no-print flex items-center justify-between px-5 py-3 border-b border-black/5 sticky top-0 bg-white z-10">
          <h3 className="font-semibold text-sm">Invoice {order.invoiceNumber || "…"}</h3>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white" style={{ background: INK }}><Printer size={14} /> Print / Save as PDF</button>
            <button onClick={onClose} className="text-[#8A9490] hover:text-black"><X size={18} /></button>
          </div>
        </div>

        <div className="invoice-print p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-lg font-bold" style={{ color: INK }}>{profile.legalName || "Root & Rinse / General Merchandise"}</div>
              {profile.address && <div className="text-xs text-[#5B6663]">{profile.address}</div>}
              <div className="text-xs text-[#5B6663]">{[profile.phone, profile.email].filter(Boolean).join(" · ")}</div>
              {profile.taxId && <div className="text-xs text-[#5B6663]">Tax ID: {profile.taxId}</div>}
            </div>
            <div className="text-right">
              <div className="text-xl font-bold uppercase tracking-wide text-[#5B6663]">Invoice</div>
              <div className="font-mono text-sm">{order.invoiceNumber || "—"}</div>
              <div className="text-xs text-[#8A9490]">{order.date}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#8A9490] mb-1">Bill To</div>
              <div className="font-medium">{order.customerName || "Walk-in customer"}</div>
              {order.customerPhone && <div className="text-[#5B6663]">{order.customerPhone}</div>}
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#8A9490] mb-1">Payment</div>
              <div>{order.paymentMethod}</div>
              <div className="font-semibold" style={{ color: order.paymentStatus === "Paid" ? MOSS : BRICK }}>{order.paymentStatus}</div>
            </div>
          </div>

          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b-2 border-black/10">
                <th className="text-left py-1.5 font-semibold text-[#5B6663]">Item</th>
                <th className="text-right py-1.5 font-semibold text-[#5B6663]">Qty</th>
                <th className="text-right py-1.5 font-semibold text-[#5B6663]">Unit Price</th>
                <th className="text-right py-1.5 font-semibold text-[#5B6663]">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-b border-black/5">
                  <td className="py-1.5">{it.name}</td>
                  <td className="py-1.5 text-right font-mono">{it.qty}</td>
                  <td className="py-1.5 text-right font-mono">{money(it.price)}</td>
                  <td className="py-1.5 text-right font-mono">{money(it.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-6">
            <div className="w-48">
              <div className="flex justify-between text-sm font-semibold pt-1 border-t-2 border-black/10">
                <span>Total</span><span className="font-mono">{money(total)}</span>
              </div>
            </div>
          </div>

          {profile.invoiceNote && <div className="text-xs text-center text-[#8A9490] pt-4 border-t border-black/5">{profile.invoiceNote}</div>}
        </div>
      </div>
    </div>
  );
}
