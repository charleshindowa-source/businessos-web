import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Camera, X } from "lucide-react";
import { BRICK } from "../lib/constants";

/* The camera view itself, with no modal chrome of its own — for embedding
   inside a caller's own modal/sheet (see ScanActions.jsx). Remount it (a
   new `key`) to re-arm the camera for another scan after one is detected. */
export function ScannerView({ onDetected, hint = "Point your camera at the barcode. Allow camera permission when asked." }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState("");
  const elementId = useRef(`barcode-reader-${Math.random().toString(36).slice(2, 8)}`);

  useEffect(() => {
    let scanner;
    try {
      scanner = new Html5QrcodeScanner(elementId.current, { fps: 10, qrbox: { width: 260, height: 160 } }, false);
      scanner.render((decodedText) => { onDetected(decodedText); scanner.clear().catch(() => {}); }, () => {});
      scannerRef.current = scanner;
    } catch { setError("Couldn't start the camera. Your browser may not support camera access here, or permission was denied."); }
    return () => { if (scannerRef.current) scannerRef.current.clear().catch(() => {}); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <p className="text-xs" style={{ color: BRICK }}>{error}</p>;
  return <><div id={elementId.current} /><p className="text-xs text-[#8A9490] mt-2">{hint}</p></>;
}

/* Reusable camera barcode/QR scanner modal. Used from Stock & Prices (to
   look up or create a product by code) and from Sales (to scan a product
   straight into a sale line) — one implementation, two call sites. */
export function BarcodeScannerModal({ onDetected, onClose, title = "Scan Barcode", hint }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-4">
        <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-sm flex items-center gap-2"><Camera size={16} /> {title}</h3><button onClick={onClose} className="text-[#8A9490] hover:text-black"><X size={18} /></button></div>
        <ScannerView onDetected={onDetected} hint={hint} />
      </div>
    </div>
  );
}
