import { useEffect, useRef } from "react";
import { SESSION_IDLE_MS } from "./constants";

/* Auto logs out after a period of inactivity — the app runs on shared/kiosk
   devices, so a session left open on the counter is a real exposure. Any
   pointer/keyboard/touch activity resets the timer. */
export function useIdleLogout(active, onIdle) {
  const timer = useRef(null);

  useEffect(() => {
    if (!active) return;
    function reset() {
      clearTimeout(timer.current);
      timer.current = setTimeout(onIdle, SESSION_IDLE_MS);
    }
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach(ev => window.addEventListener(ev, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer.current);
      events.forEach(ev => window.removeEventListener(ev, reset));
    };
  }, [active, onIdle]);
}
