import { BUSINESSES } from "./constants";
import { calcPAYE } from "./utils";

/* ============================== CALCULATION ENGINE ============================== */
export function makeCalcs(data) {
  function attendanceFor(staffId, month) { return data.attendance.find(a => a.staffId === staffId && a.month === month); }
  function attendanceSummary(staffId, month) {
    const a = attendanceFor(staffId, month);
    const days = a?.days || [];
    return {
      present: days.filter(d => d === "P").length + days.filter(d => d === "H").length * 0.5,
      absent: days.filter(d => d === "A").length,
      leave: days.filter(d => d === "L").length,
      days,
    };
  }
  function sellingPrice(sku) { return data.products.find(p => p.sku === sku)?.sellingPrice || 0; }
  function unitCost(sku) { return data.products.find(p => p.sku === sku)?.unitCost || 0; }
  function closingStock(p) { return (Number(p.opening) || 0) + (Number(p.stockIn) || 0) - (Number(p.stockOut) || 0); }
  function findByCode(code) {
    if (!code) return null;
    const norm = String(code).trim();
    return data.products.find(p => p.barcode && p.barcode === norm) || data.products.find(p => p.sku === norm) || null;
  }

  function payrollFor(staffId, month) {
    const staff = data.staff.find(s => s.id === staffId);
    if (!staff) return null;
    const { present } = attendanceSummary(staffId, month);
    const std = data.settings.standardWorkingDays || 26;
    const basicPayEarned = staff.baseSalary > 0 ? Math.min(present, std) / std * staff.baseSalary : 0;
    const salesTotal = data.sales.filter(s => s.staffId === staffId && s.date?.startsWith(month))
      .reduce((sum, s) => sum + (Number(s.qty) || 0) * sellingPrice(s.sku), 0);
    const commission = salesTotal * ((staff.commissionRate || 0) / 100);
    const ov = data.payrollOverrides[`${staffId}|${month}`] || { allowances: 0, otherDeductions: 0 };
    const gross = basicPayEarned + (Number(ov.allowances) || 0) + commission;
    const nassitEmp = basicPayEarned * 0.05;
    const nassitEmployer = basicPayEarned * 0.10;
    const taxable = Math.max(0, gross - nassitEmp);
    const paye = calcPAYE(taxable);
    const totalDeductions = nassitEmp + paye + (Number(ov.otherDeductions) || 0);
    return {
      staff, present, basicPayEarned, salesTotal, commission,
      allowances: Number(ov.allowances) || 0, otherDeductions: Number(ov.otherDeductions) || 0,
      gross, nassitEmp, nassitEmployer, taxable, paye, totalDeductions,
      netPay: gross - totalDeductions, employerCost: gross + nassitEmployer,
    };
  }
  function allPayrollFor(month) { return data.staff.filter(s => s.status === "Active").map(s => payrollFor(s.id, month)); }

  function plFor(month) {
    const result = {};
    for (const biz of BUSINESSES) {
      const bizSales = data.sales.filter(s => s.business === biz && s.date?.startsWith(month));
      const revenue = bizSales.reduce((sum, s) => sum + (Number(s.qty) || 0) * sellingPrice(s.sku), 0);
      const cogs = bizSales.reduce((sum, s) => sum + (Number(s.qty) || 0) * unitCost(s.sku), 0);
      const bizExp = data.incomeExpenses.filter(e => e.type === "Expense" && e.date?.startsWith(month));
      const opex = bizExp.filter(e => e.business === biz).reduce((s, e) => s + (Number(e.amount) || 0), 0)
        + bizExp.filter(e => e.business === "Both").reduce((s, e) => s + (Number(e.amount) || 0), 0) / 2;
      const bizInc = data.incomeExpenses.filter(e => e.type === "Income" && e.date?.startsWith(month) && e.category !== "Owner Contribution");
      const otherIncome = bizInc.filter(e => e.business === biz).reduce((s, e) => s + (Number(e.amount) || 0), 0)
        + bizInc.filter(e => e.business === "Both").reduce((s, e) => s + (Number(e.amount) || 0), 0) / 2;
      const payrollExpense = allPayrollFor(month).reduce((s, p) => s + p.employerCost, 0) / 2;
      const grossProfit = revenue - cogs;
      result[biz] = { revenue, cogs, grossProfit, opex, otherIncome, payrollExpense, netProfit: grossProfit - opex + otherIncome - payrollExpense };
    }
    result.combined = Object.keys(result[BUSINESSES[0]]).reduce((acc, k) => { acc[k] = result[BUSINESSES[0]][k] + result[BUSINESSES[1]][k]; return acc; }, {});
    return result;
  }

  function lifetimePL() {
    const months = new Set([
      ...data.sales.map(s => s.date?.slice(0, 7)),
      ...data.incomeExpenses.map(e => e.date?.slice(0, 7)),
      ...data.attendance.map(a => a.month),
    ].filter(Boolean));
    let total = 0;
    months.forEach(m => { total += plFor(m).combined.netProfit; });
    return total;
  }

  function inventoryValue() { return data.products.reduce((sum, p) => sum + closingStock(p) * (Number(p.unitCost) || 0), 0); }
  function ownerCapital() {
    return data.incomeExpenses.filter(e => e.category === "Owner Contribution" && e.type === "Income").reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }
  function suggestedReorderQty(p) {
    const lvl = Number(p.reorderLevel) || 0;
    return Math.max(lvl * 2 - closingStock(p), lvl, 1);
  }
  function customerStats(customer) {
    const matching = data.orders.filter(o => o.customerPhone && customer.phone && o.customerPhone.replace(/\D/g, "") === customer.phone.replace(/\D/g, ""));
    const totalSpent = matching.reduce((sum, o) => sum + o.items.reduce((s, it) => s + (Number(it.qty) || 0) * sellingPrice(it.sku), 0), 0);
    return { orderCount: matching.length, totalSpent };
  }

  const reorderAlerts = data.products.filter(p => closingStock(p) <= (Number(p.reorderLevel) || 0));

  return {
    attendanceSummary, sellingPrice, unitCost, closingStock, findByCode, payrollFor, allPayrollFor,
    plFor, lifetimePL, inventoryValue, ownerCapital, reorderAlerts, suggestedReorderQty, customerStats,
    activeStaffCount: data.staff.filter(s => s.status === "Active").length,
  };
}
