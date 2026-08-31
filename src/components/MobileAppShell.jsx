import React, { useState } from "react";
import { Menu, X, HelpCircle, LogOut, ScanLine, Home as HomeIcon, WifiOff } from "lucide-react";
import { BRAND_NAVY_DARK } from "../lib/constants";
import { initials } from "../lib/utils";
import { SaveIndicator } from "./ui";

export function MobileAppShell({
  nav, activeTab, setTab, who, isOwner, logout, homeView, setHomeView,
  saveState, online, onMultiScan, onStockScan, children,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const showHomeToggle = isOwner && activeTab === "dashboard";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F3F5F1" }}>
      <header className="shrink-0 bg-white border-b border-black/5 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <button onClick={() => setDrawerOpen(true)} className="text-[#374151] shrink-0"><Menu size={22} /></button>
          <img src="./logomark.png" alt="" className="w-7 h-7 rounded-md shrink-0" />
          <span className="font-semibold text-sm text-[#111827] truncate">MiKish Store</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!online && <WifiOff size={16} className="text-[#8A9490]" title="Offline — showing cached data" />}
          <button onClick={() => setHelpOpen(true)} className="text-[#8A9490]"><HelpCircle size={20} /></button>
          <button onClick={() => setTab("settings")} className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ background: BRAND_NAVY_DARK }}>{initials(who)}</button>
        </div>
      </header>

      {showHomeToggle && (
        <div className="shrink-0 bg-white px-4 pb-3 pt-1 border-b border-black/5">
          <div className="flex bg-[#F1F3F5] rounded-full p-1">
            <button onClick={() => setHomeView("dashboard")} className={`flex-1 py-1.5 rounded-full text-sm font-medium transition ${homeView === "dashboard" ? "bg-[#0B1A3A] text-white" : "text-[#5B6663]"}`}>Dashboard</button>
            <button onClick={() => setHomeView("insights")} className={`flex-1 py-1.5 rounded-full text-sm font-medium transition ${homeView === "insights" ? "bg-[#0B1A3A] text-white" : "text-[#5B6663]"}`}>Insights</button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 pb-24">{children}</main>

      <nav className="shrink-0 border-t border-black/10 flex items-stretch h-16" style={{ background: BRAND_NAVY_DARK }}>
        <button onClick={() => { setTab("dashboard"); setHomeView("dashboard"); }} className={`flex-1 flex flex-col items-center justify-center gap-1 text-[11px] ${activeTab === "dashboard" ? "text-white" : "text-white/50"}`}>
          <HomeIcon size={20} /> Home
        </button>
        <button onClick={onMultiScan} className="flex-1 flex flex-col items-center justify-center gap-1 text-[11px] text-white/50">
          <ScanLine size={20} /> Multi Scan
        </button>
        <button onClick={onStockScan} className="flex-1 flex flex-col items-center justify-center gap-1 text-[11px] text-white/50">
          <ScanLine size={20} /> Stock Scan
        </button>
      </nav>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-72 max-w-[80%] bg-white h-full flex flex-col">
            <div className="h-14 flex items-center justify-between px-4 border-b border-black/5 shrink-0">
              <span className="font-semibold text-sm">Menu</span>
              <button onClick={() => setDrawerOpen(false)} className="text-[#8A9490] hover:text-black"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {nav.map(n => {
                const Icon = n.icon;
                const active = activeTab === n.key;
                return (
                  <button key={n.key} onClick={() => { setTab(n.key); setDrawerOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left ${active ? "bg-black/5 font-medium text-[#0B1A3A]" : "text-[#374151]"}`}>
                    <Icon size={17} /> {n.label}
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t border-black/5 shrink-0 space-y-2">
              <SaveIndicator state={saveState} />
              <button onClick={logout} className="flex items-center gap-2 text-sm text-[#5B6663]"><LogOut size={16} /> Log out</button>
            </div>
          </div>
        </div>
      )}

      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setHelpOpen(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Help</h3>
              <button onClick={() => setHelpOpen(false)} className="text-[#8A9490] hover:text-black"><X size={18} /></button>
            </div>
            <p className="text-sm text-[#5B6663] mb-2">MiKish Store works online and offline — data syncs automatically once you're back on the internet.</p>
            <p className="text-xs text-[#8A9490]">{online ? "Connected — changes save in real time." : "Offline — showing the last synced data. Changes you make now will sync once you're back online."}</p>
          </div>
        </div>
      )}
    </div>
  );
}
