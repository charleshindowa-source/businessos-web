import React, { useState, useEffect } from "react";
import { CheckCircle2, Plus, Trash2, UserCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Card, Field, Avatar, BizTag, inputCls, selectCls, btnPrimary, btnGhost } from "../../components/ui";
import { TEAL, AMBER, INK, MOSS } from "../../lib/constants";
import { uid, pushLog, hashPin, randomSalt } from "../../lib/utils";

/* Draft-then-save pattern: edits stay local (drafts) until you click Save,
   instead of writing to the database on every keystroke. A record stays
   untouched by incoming server updates while it has unsaved local edits,
   so a background sync from another device can't silently discard your
   in-progress typing — and nothing writes until you explicitly say so. */
export function StaffTab({ data, patch, onOpenProfile, who }) {
  const [drafts, setDrafts] = useState(() => Object.fromEntries(data.staff.map(s => [s.id, { ...s, newPin: "" }])));
  const [dirty, setDirty] = useState(() => new Set());
  const [savedFlash, setSavedFlash] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());
  const [newPinNotice, setNewPinNotice] = useState(null);

  useEffect(() => {
    setDrafts(prev => {
      const next = { ...prev };
      data.staff.forEach(s => { if (!dirty.has(s.id)) next[s.id] = { ...s, newPin: "" }; });
      Object.keys(next).forEach(id => { if (!data.staff.some(s => s.id === id) && !dirty.has(id)) delete next[id]; });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.staff]);

  async function addStaff() {
    const genPin = String(Math.floor(1000 + Math.random() * 9000));
    const pinSalt = randomSalt();
    const pinHash = await hashPin(genPin, pinSalt);
    const id = `ST${String(data.staff.length + 1).padStart(3, "0")}${uid().slice(0, 2)}`;
    patch(d => {
      d.staff.push({
        id, name: "New Staff", role: "", business: "Both", phone: "", startDate: "", payType: "Not decided",
        baseSalary: 0, commissionRate: 0, status: "Active", pinSalt, pinHash,
        idNumber: "", address: "", dateOfBirth: "", email: "", employmentType: "Full-time",
        emergencyContactName: "", emergencyContactPhone: "", bankName: "", bankAccountNumber: "", notes: "",
      });
      pushLog(d, who, "Added a new staff member");
      return d;
    });
    setNewPinNotice({ id, pin: genPin });
  }
  function updateDraft(id, field, value) {
    setDrafts(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    setDirty(prev => new Set(prev).add(id));
  }
  async function buildSavePayload(id) {
    const draft = drafts[id];
    if (!draft) return null;
    const { newPin, ...rest } = draft;
    if (newPin && newPin.length >= 4) {
      const pinSalt = randomSalt();
      const pinHash = await hashPin(newPin, pinSalt);
      return { ...rest, pinSalt, pinHash };
    }
    return rest;
  }
  async function saveOne(id) {
    const payload = await buildSavePayload(id);
    if (!payload) return;
    patch(d => { const idx = d.staff.findIndex(x => x.id === id); if (idx >= 0) d.staff[idx] = payload; pushLog(d, who, `Updated staff: ${payload.name}`); return d; });
    setDirty(prev => { const next = new Set(prev); next.delete(id); return next; });
    setDrafts(prev => ({ ...prev, [id]: { ...payload, newPin: "" } }));
    setSavedFlash(id);
    setTimeout(() => setSavedFlash(cur => (cur === id ? null : cur)), 1500);
  }
  async function saveAll() {
    if (dirty.size === 0) return;
    const ids = Array.from(dirty);
    const payloads = await Promise.all(ids.map(id => buildSavePayload(id)));
    patch(d => {
      ids.forEach((id, i) => { const idx = d.staff.findIndex(x => x.id === id); if (idx >= 0 && payloads[i]) d.staff[idx] = payloads[i]; });
      pushLog(d, who, `Saved changes for ${ids.length} staff record${ids.length !== 1 ? "s" : ""}`);
      return d;
    });
    setDrafts(prev => { const next = { ...prev }; ids.forEach((id, i) => { if (payloads[i]) next[id] = { ...payloads[i], newPin: "" }; }); return next; });
    setDirty(new Set());
  }
  function remove(id) { patch(d => { const s = d.staff.find(x => x.id === id); d.staff = d.staff.filter(x => x.id !== id); if (s) pushLog(d, who, `Removed staff: ${s.name}`); return d; }); }
  function toggleExpanded(id) { setExpanded(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }); }

  const avatarColor = { "Root & Rinse": TEAL, "General Merchandise": AMBER, "Both": "#8A9490" };

  return (
    <div className="space-y-4">
      {newPinNotice && (
        <div className="rounded-lg border p-3 text-sm flex items-center justify-between" style={{ borderColor: AMBER, background: "#FBF1E1" }}>
          <span>New staff PIN (write this down now — it can't be shown again): <span className="font-mono font-semibold">{newPinNotice.pin}</span></span>
          <button onClick={() => setNewPinNotice(null)} className={btnGhost}>Dismiss</button>
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#5B6663]">Staff Records ({data.staff.length} on record)</h3>
        <div className="flex items-center gap-2">
          {dirty.size > 0 && (
            <button type="button" onClick={saveAll} className={btnPrimary} style={{ background: MOSS }}>
              <CheckCircle2 size={14} /> Save {dirty.size} change{dirty.size !== 1 ? "s" : ""}
            </button>
          )}
          <button type="button" onClick={addStaff} className={btnPrimary} style={{ background: INK }}><Plus size={14} /> Add staff</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.staff.map(s => {
          const d = drafts[s.id] || { ...s, newPin: "" };
          const isDirty = dirty.has(s.id);
          const justSaved = savedFlash === s.id;
          const isExpanded = expanded.has(s.id);
          return (
            <div key={s.id} className="bg-white rounded-lg border shadow-sm p-4" style={{ borderColor: isDirty ? AMBER : "rgba(0,0,0,0.05)", borderWidth: isDirty ? 1.5 : 1 }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={d.name} color={avatarColor[d.business] || "#8A9490"} />
                  <div className="min-w-0">
                    <input className="font-semibold text-sm w-full bg-transparent border-b border-transparent hover:border-black/10 focus:border-[#C2410C] focus:outline-none" value={d.name} onChange={e => updateDraft(s.id, "name", e.target.value)} />
                    <div className="text-[11px] text-[#8A9490] font-mono">{s.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => onOpenProfile(s.id)} className="p-1.5 rounded text-[#8A9490] hover:text-[#C2410C] hover:bg-black/5" title="Full profile"><UserCircle2 size={16} /></button>
                  <button type="button" onClick={() => remove(s.id)} className="p-1.5 rounded text-[#8A9490] hover:text-[#A6402F] hover:bg-black/5" title="Remove"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                <Field label="Role"><input className={inputCls} value={d.role} onChange={e => updateDraft(s.id, "role", e.target.value)} /></Field>
                <Field label="Status"><select className={selectCls} value={d.status} onChange={e => updateDraft(s.id, "status", e.target.value)}><option>Active</option><option>Inactive</option></select></Field>
                <Field label="Business"><select className={selectCls} value={d.business} onChange={e => updateDraft(s.id, "business", e.target.value)}><option>Both</option><option>Root & Rinse</option><option>General Merchandise</option></select></Field>
                <Field label="Phone"><input className={inputCls} value={d.phone} onChange={e => updateDraft(s.id, "phone", e.target.value)} /></Field>
                <Field label="Start Date"><input type="date" className={inputCls} value={d.startDate} onChange={e => updateDraft(s.id, "startDate", e.target.value)} /></Field>
                <Field label="Pay Type"><select className={selectCls} value={d.payType} onChange={e => updateDraft(s.id, "payType", e.target.value)}><option>Salary</option><option>Commission</option><option>Mix</option><option>Not decided</option></select></Field>
                <Field label="Salary (NLe)"><input type="number" className={inputCls} value={d.baseSalary} onChange={e => updateDraft(s.id, "baseSalary", Number(e.target.value))} /></Field>
                <Field label="Commission %"><input type="number" className={inputCls} value={d.commissionRate} onChange={e => updateDraft(s.id, "commissionRate", Number(e.target.value))} /></Field>
                <Field label="Set New PIN"><input type="text" inputMode="numeric" maxLength={6} placeholder="Leave blank to keep" className={inputCls + " tracking-widest"} value={d.newPin} onChange={e => updateDraft(s.id, "newPin", e.target.value.replace(/\D/g, ""))} /></Field>
                <div className="flex items-end pb-1"><BizTag biz={d.business} /></div>
              </div>

              <button type="button" onClick={() => toggleExpanded(s.id)} className={btnGhost + " -ml-2.5 mt-3"}>
                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />} {isExpanded ? "Hide" : "More"} details
              </button>
              {isExpanded && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 mt-2 pt-3 border-t border-black/5">
                  <Field label="ID / NIN Number"><input className={inputCls} value={d.idNumber || ""} onChange={e => updateDraft(s.id, "idNumber", e.target.value)} /></Field>
                  <Field label="Date of Birth"><input type="date" className={inputCls} value={d.dateOfBirth || ""} onChange={e => updateDraft(s.id, "dateOfBirth", e.target.value)} /></Field>
                  <Field label="Email"><input type="email" className={inputCls} value={d.email || ""} onChange={e => updateDraft(s.id, "email", e.target.value)} /></Field>
                  <Field label="Employment Type"><select className={selectCls} value={d.employmentType || "Full-time"} onChange={e => updateDraft(s.id, "employmentType", e.target.value)}><option>Full-time</option><option>Part-time</option><option>Contract</option></select></Field>
                  <div className="col-span-2"><Field label="Address"><input className={inputCls} value={d.address || ""} onChange={e => updateDraft(s.id, "address", e.target.value)} /></Field></div>
                  <Field label="Emergency Contact Name"><input className={inputCls} value={d.emergencyContactName || ""} onChange={e => updateDraft(s.id, "emergencyContactName", e.target.value)} /></Field>
                  <Field label="Emergency Contact Phone"><input className={inputCls} value={d.emergencyContactPhone || ""} onChange={e => updateDraft(s.id, "emergencyContactPhone", e.target.value)} /></Field>
                  <Field label="Bank Name"><input className={inputCls} value={d.bankName || ""} onChange={e => updateDraft(s.id, "bankName", e.target.value)} /></Field>
                  <Field label="Bank Account Number"><input className={inputCls} value={d.bankAccountNumber || ""} onChange={e => updateDraft(s.id, "bankAccountNumber", e.target.value)} /></Field>
                  <div className="col-span-2"><Field label="Notes"><input className={inputCls} value={d.notes || ""} onChange={e => updateDraft(s.id, "notes", e.target.value)} /></Field></div>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between">
                {isDirty ? <span className="text-[11px] font-medium" style={{ color: AMBER }}>Unsaved changes</span>
                  : justSaved ? <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: MOSS }}><CheckCircle2 size={12} /> Saved</span>
                  : <span className="text-[11px] text-[#8A9490]">Up to date</span>}
                <button type="button" onClick={() => saveOne(s.id)} disabled={!isDirty}
                  className={"text-xs font-medium px-3 py-1.5 rounded-md " + (isDirty ? "text-white" : "text-[#8A9490] bg-black/5 cursor-not-allowed")}
                  style={isDirty ? { background: INK } : {}}>Save</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
