import React from "react";
import { Card, Th, Td } from "../../components/ui";
import { MOSS, BRICK, AMBER } from "../../lib/constants";
import { monthLabel, daysInMonth } from "../../lib/utils";

/* ============================== ATTENDANCE (OWNER, all staff) ============================== */
export function AttendanceTab({ data, patch, month }) {
  const nDays = daysInMonth(month);
  const activeStaff = data.staff.filter(s => s.status === "Active");
  function getEntry(staffId) { return data.attendance.find(a => a.staffId === staffId && a.month === month); }
  function setDay(staffId, dayIdx, value) {
    patch(d => {
      let a = d.attendance.find(x => x.staffId === staffId && x.month === month);
      if (!a) { a = { staffId, month, days: Array(nDays).fill("") }; d.attendance.push(a); }
      while (a.days.length < nDays) a.days.push("");
      a.days[dayIdx] = value;
      return d;
    });
  }
  const codes = ["", "P", "A", "L", "H"];
  const codeColor = { P: MOSS, A: BRICK, L: "#8A9490", H: AMBER };

  return (
    <Card title={`Attendance Grid — ${monthLabel(month)}`}>
      <p className="text-xs text-[#8A9490] mb-4">Click a day cell to cycle: P (Present) → A (Absent) → L (Leave) → H (Half day) → blank.</p>
      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead><tr>
            <Th className="sticky left-0 bg-white">Staff</Th>
            {Array.from({ length: nDays }, (_, i) => <Th key={i} className="text-center w-8">{i + 1}</Th>)}
            <Th className="text-right">Present</Th><Th className="text-right">Absent</Th><Th className="text-right">Leave</Th>
          </tr></thead>
          <tbody>
            {activeStaff.map(s => {
              const entry = getEntry(s.id);
              const days = entry?.days || Array(nDays).fill("");
              const present = days.filter(d => d === "P").length + days.filter(d => d === "H").length * 0.5;
              const absent = days.filter(d => d === "A").length;
              const leave = days.filter(d => d === "L").length;
              return (
                <tr key={s.id} className="border-t border-black/5">
                  <Td className="sticky left-0 bg-white font-medium whitespace-nowrap">{s.name}</Td>
                  {Array.from({ length: nDays }, (_, i) => {
                    const val = days[i] || "";
                    return (
                      <td key={i} className="p-0.5">
                        <button type="button" onClick={() => setDay(s.id, i, codes[(codes.indexOf(val) + 1) % codes.length])}
                          className="w-7 h-7 rounded text-[11px] font-mono font-semibold flex items-center justify-center border border-black/5 hover:border-black/20"
                          style={{ background: val ? (codeColor[val] + "22") : "transparent", color: val ? codeColor[val] : "#C7CDCA" }}>{val || "·"}</button>
                      </td>
                    );
                  })}
                  <Td className="text-right font-mono">{present}</Td><Td className="text-right font-mono">{absent}</Td><Td className="text-right font-mono">{leave}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
