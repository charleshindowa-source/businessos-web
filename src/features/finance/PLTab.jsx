import React from "react";
import { Card, Th, Td } from "../../components/ui";
import { INK } from "../../lib/constants";
import { money, monthLabel } from "../../lib/utils";

export function PLTab({ calc, month }) {
  const pl = calc.plFor(month);
  const rowsDef = [
    ["Revenue (Sales)", "revenue"], ["Cost of Goods Sold", "cogs"], ["Gross Profit", "grossProfit"],
    ["Operating Expenses", "opex"], ["Other Income", "otherIncome"], ["Payroll Expense (50/50 split)", "payrollExpense"],
    ["NET PROFIT", "netProfit"],
  ];
  return (
    <Card title={`Profit & Loss — ${monthLabel(month)}`} className="max-w-4xl">
      <table className="w-full">
        <thead><tr><Th>Line Item</Th><Th className="text-right">Root & Rinse</Th><Th className="text-right">General Merchandise</Th><Th className="text-right">Combined</Th></tr></thead>
        <tbody>
          {rowsDef.map(([label, key]) => {
            const isNet = key === "netProfit"; const isGP = key === "grossProfit";
            return (
              <tr key={key} className="border-t border-black/5" style={isNet ? { background: INK } : isGP ? { background: "#F3F5F1" } : {}}>
                <Td className={isNet ? "text-white font-semibold" : isGP ? "font-semibold" : ""}>{label}</Td>
                <Td className={"text-right font-mono " + (isNet ? "text-white font-semibold" : "")}>{money(pl["Root & Rinse"][key])}</Td>
                <Td className={"text-right font-mono " + (isNet ? "text-white font-semibold" : "")}>{money(pl["General Merchandise"][key])}</Td>
                <Td className={"text-right font-mono " + (isNet ? "text-white font-semibold" : "")}>{money(pl.combined[key])}</Td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-[#8A9490] mt-4">Payroll is split 50/50 between businesses since all staff work across both.</p>
    </Card>
  );
}
