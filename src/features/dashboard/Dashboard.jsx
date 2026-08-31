import React, { useState } from "react";
import { ChevronRight, Search, UserCircle2, CalendarCheck, ShoppingCart, Package } from "lucide-react";
import { Card, KPI, Th, Td, BizTag, btnGhost, btnPrimary, selectCls } from "../../components/ui";
import { BUSINESSES, INK, TEAL, AMBER, MOSS, BRICK } from "../../lib/constants";
import { money, monthLabel, daysInMonth, pushLog, todayStr } from "../../lib/utils";

/* ============================== TODAY AT A GLANCE ============================== */
function TodayGlance({ data, calc, setTab, patch, who }) {
  const today = todayStr();
  const activeStaff = data.staff.filter(s => s.status === "Active");
  const checkedInIds = new Set((data.checkTimes || []).filter(c => c.date === today && c.checkIn).map(c => c.staffId));
  const checkedInCount = activeStaff.filter(s => checkedInIds.has(s.id)).length;
  const notCheckedIn = activeStaff.filter(s => !checkedInIds.has(s.id));
  const unpaidOrders = (data.orders || []).filter(o => o.paymentStatus === "Pending" && o.status !== "Cancelled");
  const readyToFulfill = (data.orders || []).filter(o => o.paymentStatus === "Paid" && !o.loggedToSales && o.status !== "Cancelled");
  const ordersNeedingAction = unpaidOrders.length + readyToFulfill.length;
  const [closed, setClosed] = useState(false);

  function closeOutToday() {
    const month = today.slice(0, 7);
    const nDays = daysInMonth(month);
    const dayIdx = new Date().getDate() - 1;
    patch(d => {
      let count = 0;
      notCheckedIn.forEach(s => {
        let a = d.attendance.find(x => x.staffId === s.id && x.month === month);
        if (!a) { a = { staffId: s.id, month, days: Array(nDays).fill("") }; d.attendance.push(a); }
        while (a.days.length < nDays) a.days.push("");
        if (!a.days[dayIdx]) { a.days[dayIdx] = "A"; count++; }
      });
      pushLog(d, who, `Closed out today's attendance — marked ${count} staff Absent`);
      return d;
    });
    setClosed(true);
  }

  return (
    <Card title={`Today at a Glance — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#8A9490] mb-2">Staff Checked In</div>
          <div className="font-mono text-2xl font-semibold mb-2" style={{ color: activeStaff.length && checkedInCount === activeStaff.length ? MOSS : INK }}>{checkedInCount} / {activeStaff.length}</div>
          {notCheckedIn.length > 0 && !closed ? (
            <div className="space-y-1">
              {notCheckedIn.slice(0, 5).map(s => <div key={s.id} className="text-xs text-[#8A9490] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: BRICK }} />{s.name}</div>)}
              {notCheckedIn.length > 5 && <div className="text-xs text-[#8A9490]">+{notCheckedIn.length - 5} more not checked in</div>}
              <button onClick={closeOutToday} className={btnGhost + " -ml-2.5 mt-1"} title="Marks everyone not checked in as Absent for today">Close out today <ChevronRight size={13} /></button>
            </div>
          ) : <div className="text-xs" style={{ color: MOSS }}>{closed ? "Today closed out ✓" : "Everyone's checked in ✓"}</div>}
        </div>
        <div>
          <div className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#8A9490] mb-2">Stock Alerts</div>
          <div className="font-mono text-2xl font-semibold mb-2" style={{ color: calc.reorderAlerts.length ? BRICK : MOSS }}>{calc.reorderAlerts.length}</div>
          {calc.reorderAlerts.length > 0 ? (
            <div className="space-y-1">
              {calc.reorderAlerts.slice(0, 5).map(p => <div key={p.sku} className="text-xs text-[#8A9490]">{p.name} — {calc.closingStock(p)} left · suggest <span className="font-mono" style={{ color: INK }}>{calc.suggestedReorderQty(p)}</span></div>)}
              {calc.reorderAlerts.length > 5 && <div className="text-xs text-[#8A9490]">+{calc.reorderAlerts.length - 5} more</div>}
            </div>
          ) : <div className="text-xs" style={{ color: MOSS }}>Stock levels healthy</div>}
          <button onClick={() => setTab("products")} className={btnGhost + " -ml-2.5 mt-1"}>View stock <ChevronRight size={13} /></button>
        </div>
        <div>
          <div className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#8A9490] mb-2">Orders Needing Action</div>
          <div className="font-mono text-2xl font-semibold mb-2" style={{ color: ordersNeedingAction ? BRICK : MOSS }}>{ordersNeedingAction}</div>
          <div className="space-y-1">
            {unpaidOrders.length > 0 && <div className="text-xs text-[#8A9490]">{unpaidOrders.length} awaiting payment</div>}
            {readyToFulfill.length > 0 && <div className="text-xs text-[#8A9490]">{readyToFulfill.length} paid, not yet fulfilled</div>}
            {ordersNeedingAction === 0 && <div className="text-xs" style={{ color: MOSS }}>All orders handled</div>}
          </div>
          <button onClick={() => setTab("orders")} className={btnGhost + " -ml-2.5 mt-1"}>View orders <ChevronRight size={13} /></button>
        </div>
      </div>
    </Card>
  );
}

function RecentActivity({ data }) {
  const entries = (data.activityLog || []).slice().reverse().slice(0, 12);
  return (
    <Card title="Recent Activity">
      {entries.length === 0 ? <p className="text-sm text-[#8A9490]">Nothing logged yet.</p> : (
        <div className="space-y-2">
          {entries.map(e => (
            <div key={e.id} className="flex items-start justify-between gap-3 text-sm">
              <div><span className="font-medium">{e.who}</span> <span className="text-[#5B6663]">{e.action}</span></div>
              <div className="text-xs text-[#8A9490] font-mono shrink-0">{timeAgoLocal(e.ts)}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
function timeAgoLocal(iso) {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ============================== DASHBOARD (OWNER) ============================== */
export function Dashboard({ data, calc, month, setTab, setProfileStaff, patch, who }) {
  const pl = calc.plFor(month);
  const [search, setSearch] = useState(data.products[0]?.sku || "");
  const found = data.products.find(p => p.sku === search);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Revenue (Combined)" value={money(pl.combined.revenue)} sub={monthLabel(month)} />
        <KPI label="Net Profit (Combined)" value={money(pl.combined.netProfit)} tone={pl.combined.netProfit < 0 ? "alert" : "good"} />
        <KPI label="Active Staff" value={calc.activeStaffCount} sub={`of ${data.staff.length} on record`} />
        <KPI label="Stock Alerts" value={calc.reorderAlerts.length} tone={calc.reorderAlerts.length ? "alert" : "good"} />
      </div>

      <TodayGlance data={data} calc={calc} setTab={setTab} patch={patch} who={who} />
      <RecentActivity data={data} />

      <div className="grid md:grid-cols-2 gap-6">
        <Card title="Profit & Loss Split">
          <table className="w-full">
            <thead><tr><Th>Business</Th><Th className="text-right">Revenue</Th><Th className="text-right">Net Profit</Th></tr></thead>
            <tbody>
              {BUSINESSES.map(b => (
                <tr key={b} className="border-t border-black/5">
                  <Td><BizTag biz={b} /></Td>
                  <Td className="text-right font-mono">{money(pl[b].revenue)}</Td>
                  <Td className="text-right font-mono" style={{ color: pl[b].netProfit < 0 ? BRICK : MOSS }}>{money(pl[b].netProfit)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => setTab("pl")} className={btnGhost + " mt-3 -ml-2.5"}>Full statement <ChevronRight size={14} /></button>
        </Card>

        <Card title="Stock Search">
          <div className="flex items-center gap-2 mb-4">
            <Search size={16} className="text-[#8A9490]" />
            <select value={search} onChange={e => setSearch(e.target.value)} className={selectCls}>
              {data.products.map(p => <option key={p.sku} value={p.sku}>{p.sku} — {p.name}</option>)}
            </select>
          </div>
          {found && (
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div className="text-[#8A9490]">Product</div><div className="font-mono">{found.name}</div>
              <div className="text-[#8A9490]">Business</div><div><BizTag biz={found.business} /></div>
              <div className="text-[#8A9490]">Quantity in Stock</div>
              <div className="font-mono font-semibold" style={{ color: calc.closingStock(found) <= found.reorderLevel ? BRICK : INK }}>{calc.closingStock(found)}</div>
            </div>
          )}
        </Card>
      </div>

      <Card title="Staff" right={<button onClick={() => setTab("staff")} className={btnGhost}>View all <ChevronRight size={14} /></button>}>
        <div className="flex flex-wrap gap-2">
          {data.staff.map(s => (
            <button key={s.id} onClick={() => setProfileStaff(s.id)} className="flex items-center gap-2 px-3 py-2 rounded-md border border-black/10 hover:border-[#C2410C]/40 hover:bg-black/[0.02] transition text-left">
              <UserCircle2 size={20} className="text-[#8A9490]" />
              <div><div className="text-sm font-medium">{s.name}</div><div className="text-xs text-[#8A9490]">{s.role}</div></div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ============================== STAFF DASHBOARD (STAFF ROLE) ============================== */
export function StaffDashboard({ data, calc, month, staff, setTab }) {
  const att = calc.attendanceSummary(staff.id, month);
  const [search, setSearch] = useState(data.products[0]?.sku || "");
  const found = data.products.find(p => p.sku === search);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-lg border border-black/5 shadow-sm p-4">
        <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8A9490]">Welcome</div>
        <div className="text-lg font-semibold mt-0.5">{staff.name}</div>
        <div className="text-xs text-[#8A9490]">{staff.role} · {monthLabel(month)}</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPI label="Your Days Present" value={att.present} sub={monthLabel(month)} tone="good" />
        <KPI label="Your Days Absent" value={att.absent} tone={att.absent > 0 ? "alert" : "good"} />
        <KPI label="Stock Alerts" value={calc.reorderAlerts.length} tone={calc.reorderAlerts.length ? "alert" : "good"} />
      </div>
      <Card title="Quick Actions">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setTab("attendance")} className={btnPrimary} style={{ background: INK }}><CalendarCheck size={14} /> Check In / Attendance</button>
          <button onClick={() => setTab("sales")} className={btnPrimary} style={{ background: TEAL }}><ShoppingCart size={14} /> Log a Sale</button>
          <button onClick={() => setTab("products")} className={btnPrimary} style={{ background: AMBER }}><Package size={14} /> Check Stock</button>
        </div>
      </Card>
      <Card title="Stock Search">
        <div className="flex items-center gap-2 mb-4">
          <Search size={16} className="text-[#8A9490]" />
          <select value={search} onChange={e => setSearch(e.target.value)} className={selectCls}>
            {data.products.map(p => <option key={p.sku} value={p.sku}>{p.sku} — {p.name}</option>)}
          </select>
        </div>
        {found && (
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div className="text-[#8A9490]">Product</div><div className="font-mono">{found.name}</div>
            <div className="text-[#8A9490]">Business</div><div><BizTag biz={found.business} /></div>
            <div className="text-[#8A9490]">Quantity in Stock</div>
            <div className="font-mono font-semibold" style={{ color: calc.closingStock(found) <= found.reorderLevel ? BRICK : INK }}>{calc.closingStock(found)}</div>
          </div>
        )}
      </Card>
    </div>
  );
}
