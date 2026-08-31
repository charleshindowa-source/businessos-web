import { randomSalt, hashPin } from "./utils";

/* ============================== DEFAULT STATE ============================== */
export const DEFAULT_STATE = {
  staff: [
    { id: "ST001", name: "Staff 1 (Name)", role: "Operations / Fulfillment", business: "Both", phone: "", startDate: "2026-01-05", payType: "Salary", baseSalary: 1500, commissionRate: 0, status: "Active", pinSalt: "", pinHash: "", idNumber: "", address: "", dateOfBirth: "", email: "", employmentType: "Full-time", emergencyContactName: "", emergencyContactPhone: "", bankName: "", bankAccountNumber: "", notes: "" },
    { id: "ST002", name: "Staff 2 (Name)", role: "Marketing / Ads", business: "Both", phone: "", startDate: "2026-01-06", payType: "Salary", baseSalary: 1200, commissionRate: 0, status: "Active", pinSalt: "", pinHash: "", idNumber: "", address: "", dateOfBirth: "", email: "", employmentType: "Full-time", emergencyContactName: "", emergencyContactPhone: "", bankName: "", bankAccountNumber: "", notes: "" },
    { id: "ST003", name: "Staff 3 (Name)", role: "Customer Service", business: "Both", phone: "", startDate: "2026-01-07", payType: "Salary", baseSalary: 1000, commissionRate: 0, status: "Active", pinSalt: "", pinHash: "", idNumber: "", address: "", dateOfBirth: "", email: "", employmentType: "Full-time", emergencyContactName: "", emergencyContactPhone: "", bankName: "", bankAccountNumber: "", notes: "" },
    { id: "ST004", name: "Staff 4 (Name)", role: "Finance / Bookkeeping", business: "Both", phone: "", startDate: "2026-01-08", payType: "Salary", baseSalary: 1800, commissionRate: 0, status: "Active", pinSalt: "", pinHash: "", idNumber: "", address: "", dateOfBirth: "", email: "", employmentType: "Full-time", emergencyContactName: "", emergencyContactPhone: "", bankName: "", bankAccountNumber: "", notes: "" },
    { id: "ST005", name: "Staff 5 (Name)", role: "Supplier / Logistics", business: "Both", phone: "", startDate: "2026-01-09", payType: "Salary", baseSalary: 900, commissionRate: 0, status: "Active", pinSalt: "", pinHash: "", idNumber: "", address: "", dateOfBirth: "", email: "", employmentType: "Full-time", emergencyContactName: "", emergencyContactPhone: "", bankName: "", bankAccountNumber: "", notes: "" },
  ],
  attendance: [],
  checkTimes: [],
  products: [
    { sku: "RR-001", barcode: "", business: "Root & Rinse", name: "Bamboo Dish Brush", category: "Kitchen", opening: 50, stockIn: 20, stockOut: 15, reorderLevel: 10, unitCost: 20, sellingPrice: 45, imageUrl: "", isPopular: false, isPriority: false },
    { sku: "RR-002", barcode: "", business: "Root & Rinse", name: "Reusable Produce Bags (Set)", category: "Kitchen", opening: 40, stockIn: 30, stockOut: 25, reorderLevel: 10, unitCost: 15, sellingPrice: 30, imageUrl: "", isPopular: false, isPriority: false },
    { sku: "GM-001", barcode: "", business: "General Merchandise", name: "LED Bulb 9W", category: "Electrical", opening: 100, stockIn: 50, stockOut: 40, reorderLevel: 20, unitCost: 60, sellingPrice: 120, imageUrl: "", isPopular: false, isPriority: false },
    { sku: "GM-002", barcode: "", business: "General Merchandise", name: "Plastic Storage Bin", category: "Household", opening: 30, stockIn: 10, stockOut: 8, reorderLevel: 10, unitCost: 35, sellingPrice: 60, imageUrl: "", isPopular: false, isPriority: false },
  ],
  sales: [],
  orders: [],
  customers: [],
  suppliers: [],
  incomeExpenses: [],
  budget: [],
  recurringExpenses: [],
  payrollOverrides: {},
  balanceSheet: { cash: 3000, ar: 0, ap: 200, loans: 0 },
  activityLog: [],
  settings: {
    standardWorkingDays: 26,
    ownerName: "Owner",
    ownerPinSalt: "",
    ownerPinHash: "",
    ownerPinIsDefault: true,
    testingMode: true,
    orangeMoneyNumber: "076 210 742",
    nextInvoiceNumber: 1001,
    businessProfile: {
      legalName: "Root & Rinse / General Merchandise",
      address: "",
      phone: "",
      email: "",
      taxId: "",
      invoiceNote: "Thank you for your business!",
    },
  },
};

/* One-way client-side migration: any legacy plaintext `pin` on a staff
   record is converted to a salted hash and the plaintext is dropped from
   the object shape going forward. */
async function migrateStaffPin(s, index) {
  if (s.pinHash) return s;
  const plaintextPin = s.pin || String(1001 + index);
  const pinSalt = randomSalt();
  const pinHash = await hashPin(plaintextPin, pinSalt);
  const { pin, ...rest } = s;
  return { ...rest, pinSalt, pinHash };
}

async function migrateOwnerPin(settings) {
  if (settings.ownerPinHash) return settings;
  const plaintextPin = settings.ownerPin || "0000";
  const ownerPinSalt = randomSalt();
  const ownerPinHash = await hashPin(plaintextPin, ownerPinSalt);
  const { ownerPin, ...rest } = settings;
  return { ...rest, ownerPinSalt, ownerPinHash, ownerPinIsDefault: plaintextPin === "0000" };
}

export async function migrateData(loaded) {
  if (!loaded) {
    const fresh = structuredClone(DEFAULT_STATE);
    fresh.settings = await migrateOwnerPin(fresh.settings);
    fresh.staff = await Promise.all(fresh.staff.map((s, i) => migrateStaffPin(s, i)));
    return fresh;
  }
  const d = structuredClone(loaded);
  d.settings = { ...DEFAULT_STATE.settings, ...(d.settings || {}), businessProfile: { ...DEFAULT_STATE.settings.businessProfile, ...(d.settings?.businessProfile || {}) } };
  d.settings = await migrateOwnerPin(d.settings);
  d.staff = await Promise.all((d.staff && d.staff.length ? d.staff : DEFAULT_STATE.staff).map((s, i) => migrateStaffPin({
    idNumber: "", address: "", dateOfBirth: "", email: "", employmentType: "Full-time",
    emergencyContactName: "", emergencyContactPhone: "", bankName: "", bankAccountNumber: "", notes: "",
    ...s,
  }, i)));
  d.attendance = d.attendance || [];
  d.checkTimes = d.checkTimes || [];
  d.products = (d.products && d.products.length ? d.products : DEFAULT_STATE.products).map(p => ({ imageUrl: "", isPopular: false, isPriority: false, barcode: "", ...p }));
  d.sales = d.sales || [];
  d.orders = (d.orders || []).map(o => ({ invoiceNumber: "", ...o }));
  d.customers = d.customers || [];
  d.suppliers = d.suppliers || [];
  d.incomeExpenses = d.incomeExpenses || [];
  d.budget = d.budget || [];
  d.recurringExpenses = d.recurringExpenses || [];
  d.payrollOverrides = d.payrollOverrides || {};
  d.balanceSheet = { ...DEFAULT_STATE.balanceSheet, ...(d.balanceSheet || {}) };
  d.activityLog = d.activityLog || [];
  d.updatedAt = d.updatedAt || new Date(0).toISOString();
  return d;
}
