import React, { useState } from "react";
import { X, Download } from "lucide-react";
import { Card, Field, Th, Td, inputCls, btnPrimary } from "../../components/ui";
import { INK, MOSS } from "../../lib/constants";
import { money, monthLabel } from "../../lib/utils";

export function PayrollTab({ data, patch, month, calc }) {
  const rows = calc.allPayrollFor(month);
  const totals = rows.reduce((acc, r) => { ["gross", "nassitEmp", "nassitEmployer", "paye", "netPay", "employerCost"].forEach(k => acc[k] = (acc[k] || 0) + r[k]); return acc; }, {});
  const [payslipFor, setPayslipFor] = useState(null);

  function setOverride(staffId, field, value) {
    patch(d => {
      const key = `${staffId}|${month}`;
      const ov = d.payrollOverrides[key] || { allowances: 0, otherDeductions: 0 };
      ov[field] = Number(value) || 0;
      d.payrollOverrides[key] = ov;
      return d;
    });
  }
  function setStd(v) { patch(d => { d.settings.standardWorkingDays = Number(v) || 26; return d; }); }

  return (
    <div className="space-y-4 max-w-6xl">
      <Card title="Settings">
        <div className="flex items-center gap-3">
          <Field label="Standard Working Days / Month"><input type="number" className={inputCls + " w-24"} value={data.settings.standardWorkingDays} onChange={e => setStd(e.target.value)} /></Field>
          <p className="text-xs text-[#8A9490] max-w-md mt-4">Prorates salary by Days Present. NASSIT: 5%/10% on Basic Pay Earned. PAYE: progressive Sierra Leone bands. Verify current rates with NRA/NASSIT before filing.</p>
        </div>
      </Card>
      <Card title={`Payroll — ${monthLabel(month)}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <Th>Staff</Th><Th className="text-right">Days</Th><Th className="text-right">Basic Earned</Th><Th className="text-right">Allowances</Th>
              <Th className="text-right">Commission</Th><Th className="text-right">Gross</Th><Th className="text-right">NASSIT Emp 5%</Th>
              <Th className="text-right">NASSIT Empl 10%</Th><Th className="text-right">PAYE</Th><Th className="text-right">Other Ded.</Th>
              <Th className="text-right">Net Pay</Th><Th className="text-right">Employer Cost</Th><Th></Th>
            </tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.staff.id} className="border-t border-black/5">
                  <Td className="font-medium whitespace-nowrap">{r.staff.name}</Td>
                  <Td className="text-right font-mono">{r.present}</Td>
                  <Td className="text-right font-mono">{money(r.basicPayEarned)}</Td>
                  <Td className="text-right"><input type="number" className={inputCls + " text-right w-20"} value={r.allowances} onChange={e => setOverride(r.staff.id, "allowances", e.target.value)} /></Td>
                  <Td className="text-right font-mono">{money(r.commission)}</Td>
                  <Td className="text-right font-mono font-semibold">{money(r.gross)}</Td>
                  <Td className="text-right font-mono">{money(r.nassitEmp)}</Td>
                  <Td className="text-right font-mono">{money(r.nassitEmployer)}</Td>
                  <Td className="text-right font-mono">{money(r.paye)}</Td>
                  <Td className="text-right"><input type="number" className={inputCls + " text-right w-20"} value={r.otherDeductions} onChange={e => setOverride(r.staff.id, "otherDeductions", e.target.value)} /></Td>
                  <Td className="text-right font-mono font-semibold" style={{ color: MOSS }}>{money(r.netPay)}</Td>
                  <Td className="text-right font-mono">{money(r.employerCost)}</Td>
                  <Td><button type="button" onClick={() => setPayslipFor(r.staff.id)} className="text-xs font-medium text-[#5B6663] hover:bg-black/5 px-2.5 py-1.5 rounded-md">Payslip</button></Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black/10 font-semibold">
                <Td colSpan={5}>TOTAL</Td>
                <Td className="text-right font-mono">{money(totals.gross)}</Td>
                <Td className="text-right font-mono">{money(totals.nassitEmp)}</Td>
                <Td className="text-right font-mono">{money(totals.nassitEmployer)}</Td>
                <Td className="text-right font-mono">{money(totals.paye)}</Td>
                <Td></Td>
                <Td className="text-right font-mono">{money(totals.netPay)}</Td>
                <Td className="text-right font-mono">{money(totals.employerCost)}</Td>
                <Td></Td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
      {payslipFor && <PayslipModal staff={data.staff.find(s => s.id === payslipFor)} month={month} calc={calc} onClose={() => setPayslipFor(null)} />}
    </div>
  );
}

function PayslipModal({ staff, month, calc, onClose }) {
  if (!staff) return null;
  const p = calc.payrollFor(staff.id, month);
  const text = [
    "ROOT & RINSE / GENERAL MERCHANDISE — PAYSLIP", `Period: ${monthLabel(month)}`, "",
    `Staff: ${staff.name} (${staff.id})`, `Role: ${staff.role || "—"}`, "",
    "EARNINGS", `Days Present: ${p.present}`, `Basic Pay Earned: ${money(p.basicPayEarned)}`,
    `Allowances: ${money(p.allowances)}`, `Commission: ${money(p.commission)}`, `Gross Pay: ${money(p.gross)}`, "",
    "DEDUCTIONS", `NASSIT (Employee, 5%): ${money(p.nassitEmp)}`, `PAYE Tax: ${money(p.paye)}`,
    `Other Deductions: ${money(p.otherDeductions)}`, `Total Deductions: ${money(p.totalDeductions)}`, "",
    `NET PAY: ${money(p.netPay)}`, "",
    `Employer also contributed NASSIT (10%): ${money(p.nassitEmployer)}`, `Total Employer Cost: ${money(p.employerCost)}`,
  ].join("\n");
  function download() {
    try {
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `payslip-${staff.name.replace(/\s+/g, "-")}-${month}.txt`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Payslip — {staff.name}</h3><button onClick={onClose} className="text-[#8A9490] hover:text-black"><X size={18} /></button></div>
        <textarea readOnly value={text} onClick={e => e.target.select()} className="w-full text-xs font-mono p-3 rounded-md border border-black/10 bg-black/[0.02]" rows={20} />
        <p className="text-[10px] text-[#8A9490] mt-1 mb-3">Tap the text to select all, then copy — or download below and share via WhatsApp.</p>
        <button type="button" onClick={download} className={btnPrimary} style={{ background: INK }}><Download size={14} /> Download Payslip (.txt)</button>
      </div>
    </div>
  );
}
