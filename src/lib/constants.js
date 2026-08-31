/* ============================== DESIGN TOKENS ============================== */
export const INK = "#C2410C";
export const PAPER = "#F3F5F1";
export const TEAL = "#2E7D6B";
export const AMBER = "#C98A2C";
export const BRICK = "#A6402F";
export const MOSS = "#3C7A5A";

export const BUSINESSES = ["Root & Rinse", "General Merchandise"];
export const CATEGORIES_EXP = [
  "Rent", "Utilities", "Advertising/Marketing", "Transport/Logistics", "Packaging",
  "Loan Repayment", "Bank Charges", "Supplies", "Miscellaneous",
];
export const CATEGORIES_INC = ["Other Income", "Owner Contribution"];
export const CHECKIN_CUTOFF_MIN = 8 * 60; // 8:00 AM
export const CHECKOUT_OPEN_MIN = 16 * 60 + 30; // 4:30 PM

// Idle time before a shared/kiosk device is auto logged-out.
export const SESSION_IDLE_MS = 20 * 60 * 1000;
// PIN brute-force guard.
export const PIN_MAX_ATTEMPTS = 5;
export const PIN_LOCKOUT_MS = 30 * 1000;
