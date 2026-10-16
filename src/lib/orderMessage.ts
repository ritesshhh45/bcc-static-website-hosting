import { ADMIN_PHONE } from "./config";

export type OrderForMessage = {
  order_no: number;
  id: string;
  created_at: string;
  total: number;
  delivery_address: string;
  customer_name: string;
  customer_phone: string | null;
  restaurant_name: string;
  payment_method: string;
  items: { item_name: string; quantity: number; unit_price: number }[];
};

/** Plain-text order summary used for Telegram and WhatsApp. */
export function buildOrderMessage(o: OrderForMessage) {
  const items = o.items.map((i) => `• ${i.item_name} × ${i.quantity} = ₹${(i.unit_price * i.quantity).toFixed(0)}`).join("\n");
  return [
    `🍔 NEW FOODIEX ORDER #${o.order_no}`,
    `Restaurant: ${o.restaurant_name}`,
    `Customer: ${o.customer_name || "—"}`,
    `Phone: ${o.customer_phone || "—"}`,
    `Address: ${o.delivery_address}`,
    ``,
    items,
    ``,
    `Total: ₹${Number(o.total).toFixed(2)}`,
    `Payment: ${o.payment_method.toUpperCase()}`,
    `Time: ${new Date(o.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
    `Order ID: ${o.id}`,
  ].join("\n");
}

export const whatsappLink = (text: string) => `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(text)}`;
