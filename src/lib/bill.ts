import { DELIVERY_FEE, FREE_DELIVERY_ABOVE, GST_RATE } from "./config";

export type Coupon = {
  code: string;
  discount_percent: number;
  max_discount: number;
  min_order: number;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Mirrors the SQL function public.calculate_order_total (the DB is the source of truth). */
export function calculateBill(subtotal: number, coupon?: Coupon | null) {
  let discount = 0;
  if (coupon && subtotal >= Number(coupon.min_order)) {
    discount = Math.min(r2((subtotal * coupon.discount_percent) / 100), Number(coupon.max_discount));
  }
  const delivery_fee = subtotal === 0 || subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  const gst = r2(subtotal * GST_RATE);
  const total = Math.max(r2(subtotal + gst + delivery_fee - discount), 0);
  return { subtotal, gst, delivery_fee, discount, total };
}

export const inr = (n: number) =>
  "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
