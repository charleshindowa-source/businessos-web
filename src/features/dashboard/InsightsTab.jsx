import React from "react";
import { ChevronRight, TrendingUp, AlertTriangle } from "lucide-react";
import { Card } from "../../components/ui";
import { BRAND_BLUE, MOSS, BRICK } from "../../lib/constants";
import { money } from "../../lib/utils";

function lastMonths(n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({ value, label: d.toLocaleString("en-US", { month: "short" }) });
  }
  return out;
}

function TrendChart({ calc }) {
  const months = lastMonths(6);
  const rows = months.map(m => ({ ...m, pl: calc.plFor(m.value).combined }));
  const max = Math.max(1, ...rows.map(r => r.pl.revenue));
  return (
    <Card title="Revenue Trend — Last 6 Months">
      <div className="flex items-stretch gap-3 h-40">
        {rows.map(r => (
          <div key={r.value} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex-1 flex items-end">
              <div
                className="w-full rounded-t-md"
                style={{ height: `${Math.max(4, (r.pl.revenue / max) * 100)}%`, background: r.pl.netProfit < 0 ? BRICK : BRAND_BLUE }}
                title={`${r.label}: ${money(r.pl.revenue)} revenue`}
              />
            </div>
            <div className="text-[10px] text-[#8A9490]">{r.label}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[11px] text-[#8A9490]">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: BRAND_BLUE }} /> Profitable month</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: BRICK }} /> Loss month</span>
      </div>
    </Card>
  );
}

function TopProducts({ data, calc }) {
  const bySku = {};
  data.sales.forEach(s => {
    const rev = (Number(s.qty) || 0) * calc.sellingPrice(s.sku);
    bySku[s.sku] = (bySku[s.sku] || 0) + rev;
  });
  const top = Object.entries(bySku)
    .map(([sku, revenue]) => ({ sku, revenue, product: data.products.find(p => p.sku === sku) }))
    .filter(r => r.product)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  return (
    <Card title="Top Products by Revenue">
      {top.length === 0 ? <p className="text-sm text-[#8A9490]">No sales logged yet.</p> : (
        <div className="space-y-2.5">
          {top.map((r, i) => (
            <div key={r.sku} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-mono text-[#8A9490] w-4 shrink-0">{i + 1}</span>
                <span className="truncate">{r.product.name}</span>
              </div>
              <span className="font-mono font-medium shrink-0 ml-2">{money(r.revenue)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function LowStock({ calc, setTab }) {
  return (
    <Card title="Stock Alerts" right={<button onClick={() => setTab("products")} className="text-xs font-medium flex items-center" style={{ color: BRAND_BLUE }}>View all <ChevronRight size={13} /></button>}>
      {calc.reorderAlerts.length === 0 ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: MOSS }}><TrendingUp size={15} /> Stock levels healthy.</div>
      ) : (
        <div className="space-y-2">
          {calc.reorderAlerts.slice(0, 6).map(p => (
            <div key={p.sku} className="flex items-center gap-2 text-sm">
              <AlertTriangle size={14} style={{ color: BRICK }} className="shrink-0" />
              <span className="truncate flex-1">{p.name}</span>
              <span className="font-mono text-xs text-[#8A9490] shrink-0">{calc.closingStock(p)} left</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function InsightsTab({ data, calc, setTab }) {
  return (
    <div className="space-y-4 max-w-3xl">
      <TrendChart calc={calc} />
      <TopProducts data={data} calc={calc} />
      <LowStock calc={calc} setTab={setTab} />
    </div>
  );
}
