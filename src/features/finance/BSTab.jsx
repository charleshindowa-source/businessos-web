import React from "react";
import { Card, inputCls } from "../../components/ui";
import { INK, MOSS, BRICK } from "../../lib/constants";
import { money, monthLabel } from "../../lib/utils";

function BSRow({ label, value, onChange, editable, bold }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 ${bold ? "bg-black/[0.03] font-semibold" : ""}`}>
      <span className="text-sm">{label}</span>
      {editable ? <input type="number" className={inputCls + " text-right w-32"} value={value} onChange={e => onChange(e.target.value)} /> : <span className="font-mono text-sm">{money(value)}</span>}
    </div>
  );
}

export function BSTab({ data, patch, calc, month }) {
  const bs = data.balanceSheet;
  function setBS(field, value) { patch(d => { d.balanceSheet[field] = Number(value) || 0; return d; }); }
  const inventory = calc.inventoryValue();
  const totalAssets = bs.cash + bs.ar + inventory;
  const totalLiab = bs.ap + bs.loans;
  const ownerCapital = calc.ownerCapital();
  const retained = calc.lifetimePL();
  const totalEquity = ownerCapital + retained;
  const diff = totalAssets - (totalLiab + totalEquity);

  return (
    <Card title={`Balance Sheet — as of ${monthLabel(month)}`} className="max-w-2xl">
      <p className="text-xs text-[#8A9490] mb-4">Cash, Receivables, Payables and Loans are entered manually. Inventory and Retained Earnings calculate automatically.</p>
      <div className="space-y-5">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white px-3 py-1.5 rounded-t" style={{ background: INK }}>Assets</div>
          <div className="border border-t-0 border-black/5 rounded-b divide-y divide-black/5">
            <BSRow label="Cash & Bank" value={bs.cash} onChange={v => setBS("cash", v)} editable />
            <BSRow label="Accounts Receivable" value={bs.ar} onChange={v => setBS("ar", v)} editable />
            <BSRow label="Inventory Value" value={inventory} />
            <BSRow label="TOTAL ASSETS" value={totalAssets} bold />
          </div>
        </div>
        <div>
          <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white px-3 py-1.5 rounded-t" style={{ background: INK }}>Liabilities</div>
          <div className="border border-t-0 border-black/5 rounded-b divide-y divide-black/5">
            <BSRow label="Accounts Payable" value={bs.ap} onChange={v => setBS("ap", v)} editable />
            <BSRow label="Loans Payable" value={bs.loans} onChange={v => setBS("loans", v)} editable />
            <BSRow label="TOTAL LIABILITIES" value={totalLiab} bold />
          </div>
        </div>
        <div>
          <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white px-3 py-1.5 rounded-t" style={{ background: INK }}>Equity</div>
          <div className="border border-t-0 border-black/5 rounded-b divide-y divide-black/5">
            <BSRow label="Owner's Capital (cumulative)" value={ownerCapital} />
            <BSRow label="Retained Earnings (lifetime)" value={retained} />
            <BSRow label="TOTAL EQUITY" value={totalEquity} bold />
          </div>
        </div>
        <div className="flex items-center justify-between px-3 py-2 rounded" style={{ background: Math.abs(diff) < 0.01 ? "#EAF3EE" : "#FBEEEC" }}>
          <span className="text-sm font-medium">Balance Check</span>
          <span className="font-mono font-semibold" style={{ color: Math.abs(diff) < 0.01 ? MOSS : BRICK }}>{money(diff)}</span>
        </div>
      </div>
    </Card>
  );
}
