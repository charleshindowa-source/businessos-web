import React, { useState, useEffect } from "react";
import { INK, BRICK, PIN_MAX_ATTEMPTS, PIN_LOCKOUT_MS } from "../../lib/constants";
import { hashPin } from "../../lib/utils";

const LOCKOUT_KEY = "businessos.pinLockout";

function readLockout() {
  try { return JSON.parse(localStorage.getItem(LOCKOUT_KEY)) || { attempts: 0, lockedUntil: 0 }; }
  catch { return { attempts: 0, lockedUntil: 0 }; }
}
function writeLockout(v) { try { localStorage.setItem(LOCKOUT_KEY, JSON.stringify(v)); } catch {} }

export function Login({ data, onLogin }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [lockout, setLockout] = useState(readLockout);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!lockout.lockedUntil || lockout.lockedUntil <= Date.now()) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [lockout.lockedUntil]);

  const locked = lockout.lockedUntil > now;
  const secsLeft = Math.max(0, Math.ceil((lockout.lockedUntil - now) / 1000));

  function registerFailure() {
    const attempts = lockout.attempts + 1;
    const next = attempts >= PIN_MAX_ATTEMPTS
      ? { attempts: 0, lockedUntil: Date.now() + PIN_LOCKOUT_MS }
      : { attempts, lockedUntil: 0 };
    setLockout(next);
    writeLockout(next);
  }
  function clearFailures() {
    const next = { attempts: 0, lockedUntil: 0 };
    setLockout(next);
    writeLockout(next);
  }

  async function tryLogin() {
    if (locked || checking) return;
    if (!pin) { setError("Enter a PIN first."); return; }
    setChecking(true);
    setError("");
    try {
      const ownerHash = await hashPin(pin, data.settings.ownerPinSalt);
      if (ownerHash === data.settings.ownerPinHash) { clearFailures(); onLogin({ role: "owner" }); return; }
      for (const staff of data.staff) {
        if (staff.status !== "Active" || !staff.pinHash) continue;
        const h = await hashPin(pin, staff.pinSalt);
        if (h === staff.pinHash) { clearFailures(); onLogin({ role: "staff", staffId: staff.id }); return; }
      }
      registerFailure();
      setError("Incorrect PIN. Try again.");
      setPin("");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: INK }}>
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-xs">
        <img src="./logo.png" alt="Root & Rinse" className="w-full max-w-[180px] mx-auto mb-3" />
        <h1 className="text-lg font-semibold text-center">Root & Rinse OS</h1>
        <p className="text-xs text-[#8A9490] mb-5 text-center">Enter your PIN to continue.</p>
        <input
          autoFocus type="text" inputMode="numeric" maxLength={6} value={pin} disabled={locked || checking}
          onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }}
          onKeyDown={e => { if (e.key === "Enter") tryLogin(); }}
          className="w-full text-center text-2xl tracking-[0.5em] font-mono px-3 py-3 rounded-md border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C2410C]/30 disabled:opacity-50"
          placeholder="····"
        />
        {locked ? (
          <p className="text-xs mt-2" style={{ color: BRICK }}>Too many attempts. Try again in {secsLeft}s.</p>
        ) : error && <p className="text-xs mt-2" style={{ color: BRICK }}>{error}</p>}
        <button type="button" onClick={tryLogin} disabled={locked || checking} className="w-full mt-4 py-2 rounded-md text-white text-sm font-medium disabled:opacity-50" style={{ background: INK }}>
          {checking ? "Checking…" : "Log In"}
        </button>
        <p className="text-[10px] text-[#8A9490] mt-4 leading-relaxed">Owners get full access. Staff PINs unlock Dashboard, Attendance check-in, Stock lookup, and Sales entry only.</p>
      </div>
    </div>
  );
}
