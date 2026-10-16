import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Bike } from "lucide-react";
import confetti from "canvas-confetti";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/bill";
import { STATUS_LABEL, STATUS_STEPS } from "@/lib/queries";
import { buildOrderMessage, whatsappLink } from "@/lib/orderMessage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/food/bits";

export const Route = createFileRoute("/_authenticated/orders/$id")({
  validateSearch: z.object({ success: z.boolean().optional() }),
  head: () => ({ meta: [{ title: "Track order — FoodieX" }, { name: "description", content: "Live order tracking." }, { property: "og:title", content: "Track order — FoodieX" }, { property: "og:description", content: "Live order tracking." }] }),
  component: Track,
});

function Track() {
  const { id } = Route.useParams();
  const { success } = Route.useSearch();
  const q = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*, restaurants(name), order_items(item_name, quantity, unit_price), payments(method, status)").eq("id", id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (success) confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } });
  }, [success]);

  useEffect(() => {
    const ch = supabase
      .channel(`order-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, () => q.refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const o = q.data;
  if (q.isLoading) return <div className="mx-auto max-w-3xl p-8"><Skeleton className="h-64" /></div>;
  if (!o) return <p className="py-24 text-center">Order not found.</p>;

  const step = STATUS_STEPS.indexOf(o.status as (typeof STATUS_STEPS)[number]);
  const pct = step < 0 ? 0 : (step / (STATUS_STEPS.length - 1)) * 100;
  const payment = o.payments as unknown as { method: string; status: string } | null;
  const msg = buildOrderMessage({
    id: o.id, order_no: o.order_no, created_at: o.created_at, total: o.total, delivery_address: o.delivery_address,
    customer_name: "", customer_phone: null, restaurant_name: o.restaurants?.name ?? "", payment_method: payment?.method ?? "cod", items: o.order_items,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {success && <motion.h1 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center text-3xl font-extrabold">🎉 Order placed!</motion.h1>}
      <div className="rounded-3xl border bg-card p-6 shadow-soft">
        <p className="text-sm text-muted-foreground">Order #{o.order_no} · {o.restaurants?.name}</p>
        <h2 className="text-2xl font-extrabold">{STATUS_LABEL[o.status]}</h2>
        {o.status === "rejected" || o.status === "cancelled" ? null : (
          <div className="relative mt-10 mb-4">
            <div className="h-2 rounded-full bg-muted" />
            <motion.div className="absolute left-0 top-0 h-2 rounded-full bg-brand" animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
            <motion.div className="absolute -top-8 text-primary" animate={{ left: `calc(${pct}% - 14px)` }} transition={{ duration: 0.8 }}>
              <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6 }}><Bike className="size-7" /></motion.div>
            </motion.div>
            <div className="mt-3 flex justify-between text-xs font-semibold">
              {STATUS_STEPS.map((s, i) => <span key={s} className={i <= step ? "text-primary" : "text-muted-foreground"}>{STATUS_LABEL[s]}</span>)}
            </div>
          </div>
        )}
      </div>
      <div className="rounded-3xl border bg-card p-6 shadow-soft">
        <ul className="space-y-1 text-sm">
          {o.order_items.map((i, k) => <li key={k} className="flex justify-between"><span>{i.item_name} × {i.quantity}</span><span>{inr(i.unit_price * i.quantity)}</span></li>)}
        </ul>
        <div className="mt-3 flex justify-between border-t pt-3 font-bold"><span>Total ({payment?.method.toUpperCase()})</span><span>{inr(o.total)}</span></div>
        <p className="mt-2 text-sm text-muted-foreground">{o.delivery_address}</p>
      </div>
      <Button asChild variant="success" size="lg" className="w-full">
        <a href={whatsappLink(msg)} target="_blank" rel="noreferrer">Send on WhatsApp</a>
      </Button>
    </div>
  );
}
