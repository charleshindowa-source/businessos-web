import { money } from "../../lib/utils";

export function buildMessage(type, order, data) {
  const items = order.items.map(it => { const p = data.products.find(x => x.sku === it.sku); return `${it.qty} x ${p?.name || it.sku} @ ${money(p?.sellingPrice || 0)}`; }).join("\n");
  const total = order.items.reduce((sum, it) => { const p = data.products.find(x => x.sku === it.sku); return sum + (Number(it.qty) || 0) * (p?.sellingPrice || 0); }, 0);
  const name = order.customerName || "there";
  const omNumber = data.settings.orangeMoneyNumber || "076 210 742";
  if (type === "confirm") return `Hi ${name}! Thanks for your order:\n\n${items}\n\nTotal: ${money(total)}\n\nWe'll send payment instructions shortly.`;
  if (type === "payment") {
    if (order.paymentMethod === "Orange Money") return `Hi ${name}, please send ${money(total)} via Orange Money to:\n${omNumber}\n\nOnce sent, reply here with a screenshot or the confirmation SMS and we'll get your order ready!`;
    return `Hi ${name}, here's your payment request for ${money(total)}:\n[Paste your Monime payment link here]\n\nPay via Orange Money, Afrimoney, or card. Once paid, we'll get your order ready!`;
  }
  if (type === "fulfilled") return `Hi ${name}, your order is ready! ✅\n\n${items}\n\nTotal: ${money(total)} — Paid\nThank you for shopping with us!`;
  return "";
}
