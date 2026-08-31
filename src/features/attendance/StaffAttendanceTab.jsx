import React from "react";
import { CheckCircle2 } from "lucide-react";
import { Card, btnPrimary } from "../../components/ui";
import { INK, TEAL, MOSS, BRICK, AMBER, CHECKIN_CUTOFF_MIN, CHECKOUT_OPEN_MIN } from "../../lib/constants";
import { monthLabel, daysInMonth, pushLog, todayStr } from "../../lib/utils";

/* ============================== ATTENDANCE (STAFF, check-in/out) ============================== */
export function StaffAttendanceTab({ data, patch, month, staff, who }) {
  const nDays = daysInMonth(month);
  const entry = data.attendance.find(a => a.staffId === staff.id && a.month === month);
  const days = entry?.days || Array(nDays).fill("");
  const now = new Date();
  const todayString = todayStr();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const testing = !!data.settings.testingMode;
  const checkInOpen = testing || nowMin < CHECKIN_CUTOFF_MIN;
  const checkOutOpen = testing || nowMin >= CHECKOUT_OPEN_MIN;
  const todayIdx = (() => { const [y, m] = month.split("-").map(Number); return (now.getFullYear() === y && now.getMonth() + 1 === m) ? now.getDate() - 1 : null; })();
  const isCurrentMonth = todayIdx !== null;
  const todayCheck = data.checkTimes.find(c => c.staffId === staff.id && c.date === todayString);
  const checkedIn = !!todayCheck?.checkIn;
  const checkedOut = !!todayCheck?.checkOut;

  function doCheckIn() {
    if (!isCurrentMonth || !checkInOpen || checkedIn) return;
    const timeStr = now.toTimeString().slice(0, 5);
    patch(d => {
      let a = d.attendance.find(x => x.staffId === staff.id && x.month === month);
      if (!a) { a = { staffId: staff.id, month, days: Array(nDays).fill("") }; d.attendance.push(a); }
      while (a.days.length < nDays) a.days.push("");
      a.days[todayIdx] = "P";
      let ct = d.checkTimes.find(c => c.staffId === staff.id && c.date === todayString);
      if (!ct) { ct = { staffId: staff.id, date: todayString, checkIn: "", checkOut: "" }; d.checkTimes.push(ct); }
      ct.checkIn = timeStr;
      pushLog(d, who || staff.name, `Checked in at ${timeStr}`);
      return d;
    });
  }
  function doCheckOut() {
    if (!isCurrentMonth || !checkOutOpen || checkedOut) return;
    const timeStr = now.toTimeString().slice(0, 5);
    patch(d => {
      let ct = d.checkTimes.find(c => c.staffId === staff.id && c.date === todayString);
      if (!ct) { ct = { staffId: staff.id, date: todayString, checkIn: "", checkOut: "" }; d.checkTimes.push(ct); }
      ct.checkOut = timeStr;
      pushLog(d, who || staff.name, `Checked out at ${timeStr}`);
      return d;
    });
  }
  const codeColor = { P: MOSS, A: BRICK, L: "#8A9490", H: AMBER };
  const present = days.filter(d => d === "P").length + days.filter(d => d === "H").length * 0.5;
  const absent = days.filter(d => d === "A").length;
  const leave = days.filter(d => d === "L").length;

  return (
    <div className="space-y-4 max-w-xl">
      <Card>
        <div className="text-sm font-medium">Today — {now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</div>
        <div className="text-xs text-[#8A9490] mt-0.5 mb-4">{testing ? "Testing mode is on — check-in/out are open any time." : "Check-in closes at 8:00 AM · Check-out opens at 4:30 PM"}</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-black/10 rounded-lg p-3">
            <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#8A9490] mb-2">Check In</div>
            {checkedIn ? <div className="text-sm font-mono font-semibold flex items-center gap-1.5" style={{ color: MOSS }}><CheckCircle2 size={15} /> {todayCheck.checkIn}</div> : (
              <button type="button" onClick={doCheckIn} disabled={!checkInOpen || !isCurrentMonth} className={btnPrimary + " w-full justify-center " + (!checkInOpen ? "opacity-40 cursor-not-allowed" : "")} style={{ background: checkInOpen ? INK : "#B9C0BC" }}><CheckCircle2 size={15} /> Check In</button>
            )}
            {!checkInOpen && !checkedIn && <div className="text-[11px] mt-1.5" style={{ color: BRICK }}>Window closed for today</div>}
          </div>
          <div className="border border-black/10 rounded-lg p-3">
            <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#8A9490] mb-2">Check Out</div>
            {checkedOut ? <div className="text-sm font-mono font-semibold flex items-center gap-1.5" style={{ color: MOSS }}><CheckCircle2 size={15} /> {todayCheck.checkOut}</div> : (
              <button type="button" onClick={doCheckOut} disabled={!checkOutOpen || !isCurrentMonth} className={btnPrimary + " w-full justify-center " + (!checkOutOpen ? "opacity-40 cursor-not-allowed" : "")} style={{ background: checkOutOpen ? TEAL : "#B9C0BC" }}><CheckCircle2 size={15} /> Check Out</button>
            )}
            {!checkOutOpen && <div className="text-[11px] mt-1.5 text-[#8A9490]">Opens at 4:30 PM</div>}
          </div>
        </div>
      </Card>
      <Card title={`Your Attendance — ${monthLabel(month)}`}>
        <div className="flex gap-4 text-sm mb-3">
          <div><span className="font-mono font-semibold" style={{ color: MOSS }}>{present}</span> present</div>
          <div><span className="font-mono font-semibold" style={{ color: BRICK }}>{absent}</span> absent</div>
          <div><span className="font-mono font-semibold text-[#8A9490]">{leave}</span> leave</div>
        </div>
        <p className="text-xs text-[#8A9490] mb-3">View only — you can only check in/out for today, above.</p>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: nDays }, (_, i) => {
            const v = days[i] || ""; const isToday = isCurrentMonth && i === todayIdx;
            return <div key={i} className="w-9 h-9 rounded text-xs font-mono font-semibold flex items-center justify-center" style={{ background: v ? codeColor[v] + "22" : "transparent", color: v ? codeColor[v] : "#C7CDCA", border: isToday ? `2px solid ${INK}` : "1px solid rgba(0,0,0,0.05)" }}>{i + 1}</div>;
          })}
        </div>
      </Card>
    </div>
  );
}
