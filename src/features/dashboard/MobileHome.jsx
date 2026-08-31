import React, { useState } from "react";
import {
  TrendingUp, TrendingDown, ShoppingCart, FileText, Banknote, Wallet,
  ChevronRight, X, Package, BarChart3, Users, Receipt, ClipboardList,
  UserCircle2, Sparkles,
} from "lucide-react";
import { BRAND_NAVY_DARK, BRAND_NAVY, BRAND_BLUE, MOSS, BRICK } from "../../lib/constants";
import { money, moneyShort } from "../../lib/utils";

const PERIODS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

const PERIOD_NOUN = { daily: "today", weekly: "this week", monthly: "this month" };

const QUICK_ACTIONS = [
  { key: "sales", label: "Sales", icon: TrendingUp, color: BRAND_BLUE, desc: "Log a sale or scan a product to sell it." },
  { key: "suppliers", label: "Purchases", icon: ShoppingCart, color: "#C2410C", desc: "Track suppliers you buy stock from." },
  { key: "products", label: "Stock", icon: Package, color: "#2E7D6B", desc: "Check quantities, prices, and reorder alerts." },
  { key: "pl", label: "Reports", icon: BarChart3, color: "#7C3AED", desc: "Profit & Loss and other financial statements." },
  { key: "customers", label: "Customers", icon: Users, color: "#DB2777", desc: "Customer contacts and order history." },
  { key: "staff", label: "Staff", icon: UserCircle2, color: "#0EA5E9", desc: "Staff records, roles, and attendance." },
  { key: "incexp", label: "Expenses", icon: Receipt, color: "#C98A2C", desc: "Log income and expenses by business." },
  { key: "orders", label: "Orders", icon: ClipboardList, color: "#475569", desc: "Customer orders, invoices, and fulfillment." },
];

function StatTile({ icon: Icon, label, value, trend, unit = "money" }) {
  const trendColor = trend === "up" ? "#34D399" : trend === "down" ? "#F87171" : "rgba(255,255,255,0.5)";
  const TrendIcon = trend === "down" ? TrendingDown : TrendingUp;
  return (
    <div className="rounded-xl bg-white/95 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#5B6663] truncate">{label}</span>
        {trend && <TrendIcon size={13} className="shrink-0" color={trendColor === "rgba(255,255,255,0.5)" ? "#8A9490" : trendColor} />}
        {!trend && <Icon size={14} className="text-[#8A9490] shrink-0" />}
      </div>
      <div className="text-sm font-mono font-semibold mt-1" style={{ color: BRAND_NAVY_DARK }}>{unit === "count" ? value : moneyShort(value)}</div>
    </div>
  );
}

export function MobileHome({ data, calc, setTab, who, onOpenAssistant }) {
  const [period, setPeriod] = useState("monthly");
  const [tourOpen, setTourOpen] = useState(false);
  const range = calc.dateRangeFor(period);
  const t = calc.periodTotals(range.start, range.end);
  const ownerName = data.settings.ownerName || who || "Owner";

  return (
    <div className="space-y-6 pb-4">
      <div className="rounded-2xl p-5 text-white" style={{ background: `linear-gradient(160deg, ${BRAND_NAVY_DARK}, ${BRAND_NAVY} 60%, ${BRAND_BLUE})` }}>
        <div className="text-lg font-semibold">Welcome back, {ownerName}!</div>
        <div className="text-white/60 text-sm mt-0.5">Here's what's happening with your store today.</div>

        <div className="flex gap-1 mt-4 bg-white/10 rounded-full p-1 w-fit">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${period === p.key ? "bg-white text-[#0B1A3A]" : "text-white/70"}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          <div className="text-3xl font-bold font-mono">{money(t.revenue)}</div>
          <div className="text-white/50 text-xs mt-1">Total Sales {PERIOD_NOUN[period]}</div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mt-5">
          <StatTile icon={TrendingUp} label="Sales" value={t.revenue} trend="up" />
          <StatTile icon={TrendingUp} label="Profit" value={t.profit} trend={t.profit >= 0 ? "up" : "down"} />
          <StatTile icon={ShoppingCart} label="Purchases" value={t.purchases} />
          <StatTile icon={TrendingDown} label="Expenses" value={t.expenses} trend="down" />
          <StatTile icon={FileText} label="Transactions" value={t.transactions} unit="count" />
          <StatTile icon={Banknote} label="Other Income" value={t.otherIncome} />
        </div>

        <div className="rounded-xl bg-white/95 p-3 mt-2.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-[#5B6663]">Net Cashflow</div>
            <div className="text-lg font-mono font-semibold" style={{ color: t.netCashflow < 0 ? BRICK : MOSS }}>{money(t.netCashflow)}</div>
          </div>
          <Wallet size={20} className="text-[#8A9490]" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[#111827]">Quick Actions</h2>
          <button onClick={() => setTourOpen(true)} className="text-xs font-medium flex items-center gap-1" style={{ color: BRAND_BLUE }}>
            <ChevronRight size={13} /> Take a tour
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(a => (
            <button key={a.key} onClick={() => setTab(a.key)} className="bg-white rounded-xl border border-black/5 shadow-sm py-3.5 flex flex-col items-center gap-1.5 hover:border-black/10 transition">
              <a.icon size={20} style={{ color: a.color }} />
              <span className="text-[11px] text-[#374151] font-medium">{a.label}</span>
            </button>
          ))}
          <button onClick={onOpenAssistant} className="rounded-xl py-3.5 flex flex-col items-center gap-1.5 text-white" style={{ background: `linear-gradient(135deg, ${BRAND_NAVY_DARK}, ${BRAND_BLUE})` }}>
            <Sparkles size={20} />
            <span className="text-[11px] font-medium">AI Assistant</span>
          </button>
        </div>
      </div>

      {tourOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setTourOpen(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-sm max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-black/5">
              <h3 className="font-semibold text-sm">Quick Actions — what they do</h3>
              <button onClick={() => setTourOpen(false)} className="text-[#8A9490] hover:text-black"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              {QUICK_ACTIONS.map(a => (
                <div key={a.key} className="flex items-start gap-3">
                  <a.icon size={16} style={{ color: a.color }} className="mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm font-medium">{a.label}</div>
                    <div className="text-xs text-[#8A9490]">{a.desc}</div>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-3">
                <Sparkles size={16} className="mt-0.5 shrink-0" style={{ color: BRAND_BLUE }} />
                <div>
                  <div className="text-sm font-medium">AI Assistant</div>
                  <div className="text-xs text-[#8A9490]">Quick answers about today's sales, low stock, and staff — works offline.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
