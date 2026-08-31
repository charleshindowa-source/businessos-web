import React, { useState, useCallback } from "react";
import {
  LayoutDashboard, Users, CalendarCheck, Wallet, Package, ShoppingCart,
  Receipt, TrendingUp, Scale, Target, ChevronRight, Menu, LogOut,
  ClipboardList, BookOpen, Contact, Truck, Settings as SettingsIcon,
} from "lucide-react";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { SaveIndicator, MonthPicker } from "./components/ui";
import { useAppData } from "./lib/useAppData";
import { useIdleLogout } from "./lib/useIdleLogout";
import { makeCalcs } from "./lib/calcEngine";
import { pushLog, uid, money } from "./lib/utils";
import { PAPER, INK, TEAL, AMBER } from "./lib/constants";

import { Login } from "./features/auth/Login";
import { Dashboard, StaffDashboard } from "./features/dashboard/Dashboard";
import { StaffTab } from "./features/staff/StaffTab";
import { StaffProfile } from "./features/staff/StaffProfile";
import { AttendanceTab } from "./features/attendance/AttendanceTab";
import { StaffAttendanceTab } from "./features/attendance/StaffAttendanceTab";
import { PayrollTab } from "./features/payroll/PayrollTab";
import { ProductsTab } from "./features/products/ProductsTab";
import { SalesTab } from "./features/sales/SalesTab";
import { StaffSalesTab } from "./features/sales/StaffSalesTab";
import { OrdersTab } from "./features/orders/OrdersTab";
import { DirectoryTab } from "./features/directory/DirectoryTab";
import { CatalogTab } from "./features/catalog/CatalogTab";
import { IncExpTab } from "./features/finance/IncExpTab";
import { PLTab } from "./features/finance/PLTab";
import { BSTab } from "./features/finance/BSTab";
import { BudgetTab } from "./features/finance/BudgetTab";
import { SettingsTab } from "./features/settings/SettingsTab";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "staff", label: "Staff", icon: Users },
  { key: "attendance", label: "Attendance", icon: CalendarCheck },
  { key: "payroll", label: "Payroll", icon: Wallet },
  { key: "products", label: "Stock & Prices", icon: Package },
  { key: "sales", label: "Sales", icon: ShoppingCart },
  { key: "orders", label: "Customer Orders", icon: ClipboardList },
  { key: "customers", label: "Customers", icon: Contact },
  { key: "suppliers", label: "Suppliers", icon: Truck },
  { key: "catalog", label: "WhatsApp Catalog", icon: BookOpen },
  { key: "incexp", label: "Income & Expenses", icon: Receipt },
  { key: "pl", label: "Profit & Loss", icon: TrendingUp },
  { key: "bs", label: "Balance Sheet", icon: Scale },
  { key: "budget", label: "Budget vs Actual", icon: Target },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];
const STAFF_NAV_KEYS = ["dashboard", "attendance", "products", "sales"];

export default function Root() {
  return <ErrorBoundary><App /></ErrorBoundary>;
}

function App() {
  const [data, setData, status, saveState] = useAppData();
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [month, setMonth] = useState("2026-08");
  const [profileStaff, setProfileStaff] = useState(null);
  const [navOpen, setNavOpen] = useState(true);

  const patch = useCallback((fn) => setData(prev => {
    const next = fn(structuredClone(prev));
    next.updatedAt = new Date().toISOString();
    return next;
  }), [setData]);

  const logout = useCallback(() => setCurrentUser(null), []);
  useIdleLogout(!!currentUser, logout);

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: PAPER }}>
        <div className="max-w-sm bg-white rounded-lg border border-black/5 shadow-sm p-6 text-center">
          <div className="font-semibold mb-2" style={{ color: "#A6402F" }}>Can't connect to the database</div>
          <p className="text-sm text-[#5B6663]">Check your Firebase environment variables and that Firestore + Anonymous Auth are enabled. See README.md.</p>
        </div>
      </div>
    );
  }
  if (status === "loading" || !data) {
    return <div className="min-h-screen flex items-center justify-center font-mono text-[#8A9490]" style={{ background: PAPER }}>Loading…</div>;
  }
  if (!currentUser) {
    return <Login data={data} onLogin={(u) => {
      setCurrentUser(u); setTab("dashboard");
      const who = u.role === "owner" ? "Owner" : (data.staff.find(s => s.id === u.staffId)?.name || "Staff");
      patch(d => { pushLog(d, who, "Logged in"); return d; });
    }} />;
  }

  const isOwner = currentUser.role === "owner";
  const meStaff = !isOwner ? data.staff.find(s => s.id === currentUser.staffId) : null;
  const who = isOwner ? "Owner" : (meStaff?.name || "Staff");
  const nav = isOwner ? NAV : NAV.filter(n => STAFF_NAV_KEYS.includes(n.key));
  const activeTab = nav.some(n => n.key === tab) ? tab : "dashboard";
  const calc = makeCalcs(data);

  return (
    <div className="min-h-screen flex" style={{ background: PAPER }}>
      <aside className={`${navOpen ? "w-56" : "w-14"} shrink-0 transition-all duration-200 flex flex-col border-r border-black/5`} style={{ background: INK }}>
        <div className="h-14 flex items-center px-3 gap-2 border-b border-white/10">
          <button onClick={() => setNavOpen(o => !o)} className="text-white/70 hover:text-white shrink-0"><Menu size={18} /></button>
          <img src="./logomark.png" alt="" className="w-7 h-7 shrink-0" />
          {navOpen && <span className="text-white font-semibold text-sm tracking-wide truncate">Root & Rinse OS</span>}
        </div>
        <nav className="flex-1 py-3 flex flex-col gap-0.5 overflow-y-auto">
          {nav.map(n => {
            const Icon = n.icon; const active = activeTab === n.key;
            return (
              <button key={n.key} onClick={() => setTab(n.key)} className={`flex items-center gap-3 px-4 py-2 text-sm mx-2 rounded-md transition ${active ? "bg-white/15 text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
                <Icon size={16} className="shrink-0" />{navOpen && <span className="truncate">{n.label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-2">
          {navOpen && <div className="text-[10px] text-white/40 font-mono">{isOwner ? "Owner access" : `Staff · ${meStaff?.name || ""}`}</div>}
          <button onClick={logout} className="flex items-center gap-2 text-xs text-white/60 hover:text-white"><LogOut size={14} />{navOpen && "Log out"}</button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 border-b border-black/5 bg-white flex items-center justify-between px-6 shrink-0">
          <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#8A9490]">{nav.find(n => n.key === activeTab)?.label}</div>
          <div className="flex items-center gap-3">
            <SaveIndicator state={saveState} />
            <span className="text-xs text-[#8A9490] font-mono">Period</span><MonthPicker value={month} onChange={setMonth} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {isOwner && activeTab === "dashboard" && <Dashboard data={data} calc={calc} month={month} setTab={setTab} setProfileStaff={setProfileStaff} patch={patch} who={who} />}
          {isOwner && activeTab === "staff" && <StaffTab data={data} patch={patch} onOpenProfile={setProfileStaff} who={who} />}
          {isOwner && activeTab === "attendance" && <AttendanceTab data={data} patch={patch} month={month} />}
          {isOwner && activeTab === "payroll" && <PayrollTab data={data} patch={patch} month={month} calc={calc} />}
          {isOwner && activeTab === "products" && <ProductsTab data={data} patch={patch} who={who} />}
          {isOwner && activeTab === "sales" && <SalesTab data={data} patch={patch} calc={calc} who={who} />}
          {isOwner && activeTab === "orders" && <OrdersTab data={data} patch={patch} calc={calc} who={who} />}
          {isOwner && activeTab === "customers" && (
            <DirectoryTab
              title="Customers" items={data.customers} accentColor={TEAL}
              fields={[{ key: "phone", label: "Phone" }, { key: "business", label: "Business", type: "business" }, { key: "notes", label: "Notes", span: 2, placeholder: "Preferences, delivery address, etc." }]}
              statsFor={c => { const s = calc.customerStats(c); return `${s.orderCount} order${s.orderCount !== 1 ? "s" : ""} · ${money(s.totalSpent)}`; }}
              onAdd={() => patch(d => { d.customers.push({ id: uid(), name: "New Customer", phone: "", business: "Both", notes: "" }); pushLog(d, who, "Added a customer"); return d; })}
              onUpdate={(id, field, value) => patch(d => { const c = d.customers.find(x => x.id === id); if (c) c[field] = value; return d; })}
              onRemove={(id) => patch(d => { const c = d.customers.find(x => x.id === id); d.customers = d.customers.filter(x => x.id !== id); if (c) pushLog(d, who, `Removed customer: ${c.name}`); return d; })}
            />
          )}
          {isOwner && activeTab === "suppliers" && (
            <DirectoryTab
              title="Suppliers" items={data.suppliers} accentColor={AMBER}
              fields={[{ key: "phone", label: "Phone" }, { key: "business", label: "Business", type: "business" }, { key: "productsSupplied", label: "Products Supplied", span: 2, placeholder: "e.g. LED bulbs, storage bins" }, { key: "notes", label: "Notes", span: 2 }]}
              onAdd={() => patch(d => { d.suppliers.push({ id: uid(), name: "New Supplier", phone: "", business: "Both", productsSupplied: "", notes: "" }); pushLog(d, who, "Added a supplier"); return d; })}
              onUpdate={(id, field, value) => patch(d => { const s = d.suppliers.find(x => x.id === id); if (s) s[field] = value; return d; })}
              onRemove={(id) => patch(d => { const s = d.suppliers.find(x => x.id === id); d.suppliers = d.suppliers.filter(x => x.id !== id); if (s) pushLog(d, who, `Removed supplier: ${s.name}`); return d; })}
            />
          )}
          {isOwner && activeTab === "catalog" && <CatalogTab data={data} />}
          {isOwner && activeTab === "incexp" && <IncExpTab data={data} patch={patch} who={who} />}
          {isOwner && activeTab === "pl" && <PLTab calc={calc} month={month} />}
          {isOwner && activeTab === "bs" && <BSTab data={data} patch={patch} calc={calc} month={month} />}
          {isOwner && activeTab === "budget" && <BudgetTab data={data} patch={patch} calc={calc} />}
          {isOwner && activeTab === "settings" && <SettingsTab data={data} patch={patch} who={who} />}

          {!isOwner && meStaff && activeTab === "dashboard" && <StaffDashboard data={data} calc={calc} month={month} staff={meStaff} setTab={setTab} />}
          {!isOwner && meStaff && activeTab === "attendance" && <StaffAttendanceTab data={data} patch={patch} month={month} staff={meStaff} who={who} />}
          {!isOwner && meStaff && activeTab === "products" && <ProductsTab data={data} patch={patch} readOnly who={who} />}
          {!isOwner && meStaff && activeTab === "sales" && <StaffSalesTab data={data} patch={patch} calc={calc} staff={meStaff} who={who} />}
        </main>
      </div>

      {isOwner && profileStaff && (
        <StaffProfile staff={data.staff.find(s => s.id === profileStaff)} data={data} patch={patch} month={month} setMonth={setMonth} onClose={() => setProfileStaff(null)} calc={calc} />
      )}
    </div>
  );
}
