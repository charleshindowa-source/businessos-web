import React, { useState } from "react";
import { AlertTriangle, Download, Upload, AlertCircle, ShieldCheck } from "lucide-react";
import { Card, Field, inputCls, btnPrimary, btnGhost } from "../../components/ui";
import { INK, BRICK, MOSS, AMBER } from "../../lib/constants";
import { hashPin, randomSalt, pushLog } from "../../lib/utils";
import { migrateData } from "../../lib/dataSchema";

export function SettingsTab({ data, patch, who }) {
  return (
    <div className="space-y-4 max-w-3xl">
      {data.settings.ownerPinIsDefault && (
        <div className="rounded-lg border p-4 flex items-start gap-3" style={{ borderColor: BRICK, background: "#FBEEEC" }}>
          <AlertTriangle size={18} style={{ color: BRICK }} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium" style={{ color: BRICK }}>Still using the default Owner PIN (0000)</div>
            <div className="text-[#5B6663] mt-0.5">Change it below — anyone who knows the default can get full access.</div>
          </div>
        </div>
      )}
      <OwnerAccessCard data={data} patch={patch} />
      <PaymentCard data={data} patch={patch} />
      <BusinessProfileCard data={data} patch={patch} />
      <SecurityNotesCard />
      <BackupRestoreCard data={data} patch={patch} who={who} />
    </div>
  );
}

function OwnerAccessCard({ data, patch }) {
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [msg, setMsg] = useState("");
  const [testingMode, setTestingModeState] = useState(!!data.settings.testingMode);

  async function changePin() {
    setMsg("");
    if (newPin.length < 4) { setMsg("PIN must be at least 4 digits."); return; }
    if (newPin !== confirmPin) { setMsg("PINs don't match."); return; }
    const ownerPinSalt = randomSalt();
    const ownerPinHash = await hashPin(newPin, ownerPinSalt);
    patch(d => { d.settings.ownerPinSalt = ownerPinSalt; d.settings.ownerPinHash = ownerPinHash; d.settings.ownerPinIsDefault = newPin === "0000"; return d; });
    setNewPin(""); setConfirmPin("");
    setMsg("Owner PIN updated.");
    setTimeout(() => setMsg(""), 2500);
  }
  function setTestingMode(v) { setTestingModeState(v); patch(d => { d.settings.testingMode = v; return d; }); }

  function setOwnerName(v) { patch(d => { d.settings.ownerName = v; return d; }); }

  return (
    <Card title="Owner Access">
      <div className="mb-4 max-w-xs">
        <Field label="Your Name (shown on Home)">
          <input className={inputCls} defaultValue={data.settings.ownerName || "Owner"} onBlur={e => setOwnerName(e.target.value || "Owner")} />
        </Field>
      </div>
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <Field label="New Owner PIN"><input type="text" inputMode="numeric" maxLength={6} className={inputCls + " w-28 tracking-widest"} value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ""))} /></Field>
        <Field label="Confirm PIN"><input type="text" inputMode="numeric" maxLength={6} className={inputCls + " w-28 tracking-widest"} value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ""))} /></Field>
        <button type="button" onClick={changePin} className={btnPrimary} style={{ background: INK }}>Update PIN</button>
        {msg && <span className="text-xs" style={{ color: msg.includes("updated") ? MOSS : BRICK }}>{msg}</span>}
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={testingMode} onChange={e => setTestingMode(e.target.checked)} className="w-4 h-4 accent-[#C2410C]" />
        <span className="text-sm">Testing mode — check-in/check-out time restrictions off</span>
      </label>
      <p className="text-xs text-[#8A9490] mt-1">{testingMode ? "Currently OFF: staff can check in/out any time." : "Currently ON: 8:00 AM check-in cutoff, 4:30 PM check-out."}</p>
    </Card>
  );
}

function PaymentCard({ data, patch }) {
  function setOMNumber(v) { patch(d => { d.settings.orangeMoneyNumber = v; return d; }); }
  return (
    <Card title="Payment — Orange Money">
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Orange Money Number (shown to customers)">
          <input className={inputCls + " w-44"} value={data.settings.orangeMoneyNumber} onChange={e => setOMNumber(e.target.value)} />
        </Field>
        <p className="text-xs text-[#8A9490] max-w-md">Inserted automatically into the "Payment msg" on Customer Orders. Payments are confirmed manually.</p>
      </div>
    </Card>
  );
}

function BusinessProfileCard({ data, patch }) {
  const profile = data.settings.businessProfile || {};
  function set(field, value) { patch(d => { d.settings.businessProfile[field] = value; return d; }); }
  return (
    <Card title="Business Profile — used on Invoices">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Legal / Display Name"><input className={inputCls} value={profile.legalName || ""} onChange={e => set("legalName", e.target.value)} /></Field></div>
        <div className="col-span-2"><Field label="Address"><input className={inputCls} value={profile.address || ""} onChange={e => set("address", e.target.value)} /></Field></div>
        <Field label="Phone"><input className={inputCls} value={profile.phone || ""} onChange={e => set("phone", e.target.value)} /></Field>
        <Field label="Email"><input className={inputCls} value={profile.email || ""} onChange={e => set("email", e.target.value)} /></Field>
        <Field label="Tax ID (optional)"><input className={inputCls} value={profile.taxId || ""} onChange={e => set("taxId", e.target.value)} /></Field>
        <div className="col-span-2"><Field label="Invoice Footer Note"><input className={inputCls} value={profile.invoiceNote || ""} onChange={e => set("invoiceNote", e.target.value)} /></Field></div>
      </div>
    </Card>
  );
}

function SecurityNotesCard() {
  return (
    <Card title="Security Notes">
      <div className="flex items-start gap-3 text-sm text-[#5B6663]">
        <ShieldCheck size={18} style={{ color: MOSS }} className="shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <p>Staff and Owner PINs are stored as salted hashes, never in plain text — even someone with database access can't read them back.</p>
          <p>The app requires anonymous Firebase sign-in before it can read or write your data — set your Firestore/Storage rules to <code className="font-mono bg-black/5 px-1 rounded">request.auth != null</code> (see README) so a stranger who finds your project ID still can't get in.</p>
          <p>A device left idle for 20 minutes logs itself out automatically. Repeated wrong PINs lock login for 30 seconds.</p>
          <p>None of this is a substitute for per-person accounts — treat it as a meaningfully better baseline for a small shared-device team.</p>
        </div>
      </div>
    </Card>
  );
}

function BackupRestoreCard({ data, patch, who }) {
  const [msg, setMsg] = useState("");
  const [pending, setPending] = useState(null);
  const [importError, setImportError] = useState("");

  function exportBackup() {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `businessos-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMsg("Backup downloaded.");
    } catch { setMsg("Download isn't available in this environment."); }
    setTimeout(() => setMsg(""), 2500);
  }
  function handleFile(e) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setImportError("");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== "object") throw new Error("Not a valid backup.");
        setPending(parsed);
      } catch { setImportError("Couldn't read that file — make sure it's a BusinessOS backup JSON."); }
    };
    reader.readAsText(file);
  }
  async function confirmImport() {
    const migrated = await migrateData(pending);
    patch(d => { pushLog(migrated, who, "Restored data from backup"); return migrated; });
    setPending(null);
    setMsg("Data restored from backup.");
    setTimeout(() => setMsg(""), 2500);
  }

  return (
    <Card title="Backup & Restore">
      <p className="text-xs text-[#8A9490] mb-3">Download a backup regularly. Restoring replaces everything currently in the app.</p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={exportBackup} className={btnPrimary} style={{ background: INK }}><Download size={14} /> Download Backup</button>
        <label className={btnGhost + " cursor-pointer border border-black/10"}><Upload size={14} /> Restore from File
          <input type="file" accept="application/json" className="hidden" onChange={handleFile} />
        </label>
        {msg && <span className="text-xs" style={{ color: MOSS }}>{msg}</span>}
      </div>
      {importError && <p className="text-xs mt-2" style={{ color: BRICK }}>{importError}</p>}
      {pending && (
        <div className="mt-4 border rounded-lg p-4" style={{ borderColor: BRICK, background: "#FBEEEC" }}>
          <div className="flex items-start gap-2 mb-2"><AlertCircle size={16} style={{ color: BRICK }} className="shrink-0 mt-0.5" /><div className="text-sm font-medium">This will replace ALL current data</div></div>
          <div className="text-xs text-[#5B6663] mb-3 font-mono">
            {pending.staff?.length || 0} staff · {pending.products?.length || 0} products · {pending.sales?.length || 0} sales · {pending.orders?.length || 0} orders
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={confirmImport} className={btnPrimary} style={{ background: BRICK }}>Yes, replace everything</button>
            <button type="button" onClick={() => setPending(null)} className={btnGhost + " border border-black/10"}>Cancel</button>
          </div>
        </div>
      )}
    </Card>
  );
}
