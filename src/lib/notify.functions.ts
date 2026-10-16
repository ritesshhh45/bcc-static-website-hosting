import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildOrderMessage } from "./orderMessage";

/**
 * Sends the full order details to the admin's Telegram chat right after an order is placed.
 * Runs as the signed-in customer, so RLS guarantees they can only notify about their own order.
 */
export const notifyNewOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: o, error } = await supabase
      .from("orders")
      .select("id, order_no, created_at, total, delivery_address, customer_id, restaurants(name), order_items(item_name, quantity, unit_price), payments(method)")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error || !o) return { sent: false, reason: "order not found" };
    const { data: p } = await supabase.from("profiles").select("full_name, phone").eq("id", o.customer_id).maybeSingle();

    const text = buildOrderMessage({
      id: o.id, order_no: o.order_no, created_at: o.created_at, total: o.total, delivery_address: o.delivery_address,
      customer_name: p?.full_name ?? "", customer_phone: p?.phone ?? null,
      restaurant_name: o.restaurants?.name ?? "", payment_method: (o.payments as unknown as { method: string } | null)?.method ?? "cod",
      items: o.order_items,
    });

    const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
    const TELEGRAM_API_KEY = process.env["TELEGRAM_API_KEY"];
    const CHAT_ID = process.env["TELEGRAM_CHAT_ID"];
    if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY || !CHAT_ID) {
      console.warn("Telegram not configured; skipping order notification");
      return { sent: false, reason: "telegram not configured" };
    }
    const res = await fetch("https://connector-gateway.lovable.dev/telegram/sendMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chat_id: CHAT_ID, text }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Telegram send failed [${res.status}]: ${body}`);
      return { sent: false, reason: `telegram ${res.status}` };
    }
    return { sent: true };
  });
