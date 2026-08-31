import React, { useState } from "react";
import { Download } from "lucide-react";
import { Card, btnPrimary } from "../../components/ui";
import { BUSINESSES, INK } from "../../lib/constants";
import { money } from "../../lib/utils";

export function CatalogTab({ data }) {
  const [downloadMsg, setDownloadMsg] = useState("");
  function buildCatalogText() {
    let out = "";
    for (const biz of BUSINESSES) {
      const items = data.products.filter(p => p.business === biz);
      if (!items.length) continue;
      out += `*${biz}*\n`;
      items.forEach(p => { out += `• ${p.name} — ${money(p.sellingPrice)} (SKU: ${p.sku})\n`; });
      out += "\n";
    }
    return out.trim() || "No products yet — add some on Stock & Prices first.";
  }
  function downloadCSV() {
    try {
      const header = "id,title,description,availability,condition,price,brand\n";
      const rows = data.products.map(p => {
        const price = `${Number(p.sellingPrice || 0).toFixed(2)} SLE`;
        const closing = (Number(p.opening) || 0) + (Number(p.stockIn) || 0) - (Number(p.stockOut) || 0);
        const avail = closing > 0 ? "in stock" : "out of stock";
        return `"${p.sku}","${(p.name || "").replace(/"/g, '""')}","${p.category || ""}","${avail}","new","${price}","${p.business}"`;
      }).join("\n");
      const blob = new Blob([header + rows], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "product-catalog.csv";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadMsg("Downloaded.");
    } catch { setDownloadMsg("Download isn't available here — copy the text list instead."); }
    setTimeout(() => setDownloadMsg(""), 2500);
  }
  const templates = [
    ["Order Confirmation", "Hi [Customer Name]! Thanks for your order:\n\n[item list]\n\nTotal: [amount] NLe\n\nWe'll send payment instructions shortly."],
    ["Payment Request", "Hi [Customer Name], please send [amount] NLe via Orange Money to [your number].\n\nOnce sent, reply with a screenshot or confirmation SMS and we'll get your order ready!"],
    ["Order Ready", "Hi [Customer Name], your order is ready! ✅\n\n[item list]\n\nTotal: [amount] NLe — Paid\nThank you for shopping with us!"],
  ];
  return (
    <div className="space-y-4 max-w-3xl">
      <Card title="WhatsApp Catalog — Product List">
        <p className="text-xs text-[#8A9490] mb-3">Copy into your WhatsApp Business catalog, or use as a checklist while adding items one by one.</p>
        <textarea readOnly value={buildCatalogText()} onClick={e => e.target.select()} className="w-full text-xs font-mono p-3 rounded-md border border-black/10 bg-black/[0.02]" rows={12} />
        <p className="text-[10px] text-[#8A9490] mt-1">Tap the text to select all, then copy. Updates automatically from Stock & Prices.</p>
        <div className="flex items-center gap-2 mt-3">
          <button type="button" onClick={downloadCSV} className={btnPrimary} style={{ background: INK }}><Download size={14} /> Download CSV</button>
          {downloadMsg && <span className="text-xs text-[#8A9490]">{downloadMsg}</span>}
        </div>
      </Card>
      <Card title="Message Templates">
        <div className="space-y-4">
          {templates.map(([label, text]) => (
            <div key={label}>
              <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#8A9490] mb-1">{label}</div>
              <textarea readOnly value={text} onClick={e => e.target.select()} className="w-full text-xs font-mono p-2.5 rounded-md border border-black/10 bg-black/[0.02]" rows={4} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
