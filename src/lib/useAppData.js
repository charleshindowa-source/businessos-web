import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { db, doc, setDoc, onSnapshot, getDoc, ensureSignedIn } from "./firebase";
import { migrateData, DEFAULT_STATE } from "./dataSchema";

/* ============================== FIRESTORE DATA HOOK ============================== */
export function useAppData() {
  const [data, setDataState] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const pendingWrites = useRef(0);
  const docRef = useMemo(() => doc(db, "businessos", "shared-data"), []);

  useEffect(() => {
    let unsub = () => {};
    let cancelled = false;
    ensureSignedIn()
      .then(() => {
        if (cancelled) return;
        unsub = onSnapshot(
          docRef,
          async (snap) => {
            if (snap.exists()) setDataState(await migrateData(snap.data()));
            else { const fresh = await migrateData(null); setDataState(fresh); setDoc(docRef, fresh).catch(() => {}); }
            setStatus("ready");
          },
          (err) => { console.error("Firestore error:", err); setStatus("error"); }
        );
      })
      .catch((err) => { console.error("Sign-in failed:", err); setStatus("error"); });
    return () => { cancelled = true; unsub(); };
  }, [docRef]);

  // Warn before closing/navigating away while a save is still in flight,
  // so an edit made seconds ago doesn't silently get lost.
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (pendingWrites.current > 0) { e.preventDefault(); e.returnValue = ""; }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // A backgrounded phone can sit for a while with an old copy of the data in memory.
  // The moment this tab/app becomes active again, pull the latest from the server
  // immediately — before the user can trigger a write based on stale data and
  // silently overwrite newer edits made elsewhere in the meantime.
  useEffect(() => {
    function handleVisible() {
      if (document.visibilityState === "visible") {
        getDoc(docRef).then(async (snap) => {
          if (snap.exists()) setDataState(await migrateData(snap.data()));
        }).catch(() => {});
      }
    }
    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("focus", handleVisible);
    return () => {
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("focus", handleVisible);
    };
  }, [docRef]);

  const setData = useCallback((updater) => {
    setDataState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      pendingWrites.current += 1;
      setSaveState("saving");
      setDoc(docRef, next)
        .then(() => { setSaveState("saved"); })
        .catch((err) => { console.error("Save failed:", err); setSaveState("error"); })
        .finally(() => { pendingWrites.current -= 1; });
      return next;
    });
  }, [docRef]);

  return [data, setData, status, saveState];
}

export { DEFAULT_STATE };
