import React from "react";
import { X } from "lucide-react";
import { MonthPicker, BizTag } from "../../components/ui";
import { MOSS, BRICK, AMBER } from "../../lib/constants";
import { money, monthLabel, daysInMonth } from "../../lib/utils";

export function StaffProfile({ staff, data, patch, month, setMonth, onClose, calc }) {
  if (!staff) return null;
  const att = calc.attendanceSummary(staff.id, month);
  const pay = calc.payrollFor(staff.id, month);
  const nDays = daysInMonth(month);
  const codeColor = { P: MOSS, A: BRICK, L: "#8A9490", H: AMBER };

  function renameStaff(v) { patch(d => { const s = d.staff.find(x => x.id === staff.id); if (s) s.name = v; return d; }); }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-black/5 px-5 py-4 flex items-start justify-between z-10">
          <div className="min-w-0 flex-1 mr-3">
            <div className="text-xs text-[#8A9490] font-mono">{staff.id}</div>
            <input className="text-lg font-semibold w-full bg-transparent border-b border-transparent hover:border-black/10 focus:border-[#C2410C] focus:outline-none" value={staff.name} onChange={e => renameStaff(e.target.value)} />
            <div className="text-sm text-[#8A9490]">{staff.role}</div>
          </div>
          <button onClick={onClose} className="text-[#8A9490] hover:text-black shrink-0"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-2"><span className="text-xs text-[#8A9490]">Month:</span><MonthPicker value={month} onChange={setMonth} small /></div>
          <div>
            <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8A9490] mb-2">Details</div>
            <div className="grid grid-cols-2 gap-y-1.5 text-sm">
              <div className="text-[#8A9490]">Business</div><div><BizTag biz={staff.business} /></div>
              <div className="text-[#8A9490]">Phone</div><div className="font-mono">{staff.phone || "—"}</div>
              <div className="text-[#8A9490]">Email</div><div className="font-mono">{staff.email || "—"}</div>
              <div className="text-[#8A9490]">Start Date</div><div className="font-mono">{staff.startDate || "—"}</div>
              <div className="text-[#8A9490]">Employment Type</div><div>{staff.employmentType || "—"}</div>
              <div className="text-[#8A9490]">Pay Type</div><div>{staff.payType}</div>
              <div className="text-[#8A9490]">Base Salary</div><div className="font-mono">{money(staff.baseSalary)}</div>
              <div className="text-[#8A9490]">Status</div><div>{staff.status}</div>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8A9490] mb-2">Personal & Emergency</div>
            <div className="grid grid-cols-2 gap-y-1.5 text-sm">
              <div className="text-[#8A9490]">ID / NIN Number</div><div className="font-mono">{staff.idNumber || "—"}</div>
              <div className="text-[#8A9490]">Date of Birth</div><div className="font-mono">{staff.dateOfBirth || "—"}</div>
              <div className="text-[#8A9490]">Address</div><div>{staff.address || "—"}</div>
              <div className="text-[#8A9490]">Emergency Contact</div><div>{staff.emergencyContactName || "—"}</div>
              <div className="text-[#8A9490]">Emergency Phone</div><div className="font-mono">{staff.emergencyContactPhone || "—"}</div>
              <div className="text-[#8A9490]">Bank</div><div>{staff.bankName || "—"}</div>
              <div className="text-[#8A9490]">Bank Account No.</div><div className="font-mono">{staff.bankAccountNumber || "—"}</div>
              {staff.notes && (<><div className="text-[#8A9490]">Notes</div><div>{staff.notes}</div></>)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8A9490] mb-2">Attendance — {monthLabel(month)}</div>
            <div className="flex gap-4 text-sm mb-3">
              <div><span className="font-mono font-semibold" style={{ color: MOSS }}>{att.present}</span> present</div>
              <div><span className="font-mono font-semibold" style={{ color: BRICK }}>{att.absent}</span> absent</div>
              <div><span className="font-mono font-semibold text-[#8A9490]">{att.leave}</span> leave</div>
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: nDays }, (_, i) => {
                const v = att.days[i] || "";
                return <div key={i} title={`Day ${i + 1}`} className="w-6 h-6 rounded text-[10px] font-mono flex items-center justify-center" style={{ background: v ? codeColor[v] + "22" : "#F3F5F1", color: v ? codeColor[v] : "#C7CDCA" }}>{i + 1}</div>;
              })}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8A9490] mb-2">Payroll — {monthLabel(month)}</div>
            <div className="grid grid-cols-2 gap-y-1.5 text-sm">
              <div className="text-[#8A9490]">Basic Pay Earned</div><div className="font-mono">{money(pay.basicPayEarned)}</div>
              <div className="text-[#8A9490]">Commission</div><div className="font-mono">{money(pay.commission)}</div>
              <div className="text-[#8A9490]">Gross Pay</div><div className="font-mono font-semibold">{money(pay.gross)}</div>
              <div className="text-[#8A9490]">NASSIT (Employee)</div><div className="font-mono">{money(pay.nassitEmp)}</div>
              <div className="text-[#8A9490]">PAYE Tax</div><div className="font-mono">{money(pay.paye)}</div>
              <div className="text-[#8A9490]">Net Pay</div><div className="font-mono font-semibold" style={{ color: MOSS }}>{money(pay.netPay)}</div>
              <div className="text-[#8A9490]">Employer Cost</div><div className="font-mono">{money(pay.employerCost)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
