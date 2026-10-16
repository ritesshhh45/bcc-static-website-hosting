import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/bill";
import { STATUS_LABEL } from "@/lib/queries";
import { Skeleton } from "@/components/food/bits";

export const Route = createFileRoute("/_authenticated/orders/")({
  head: () => ({ meta: [{ title: "My orders — FoodieX" }, { name: "description", content: "Your FoodieX order history." }, { property: "og:title", content: "My orders — FoodieX" }, { property: "og:description", content: "Your FoodieX order history." }] }),
  component: Orders,
});

function Orders() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => (await supabase.from("orders").select("id, order_no, total, status, created_at, restaurants(name)").order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-extrabold">My orders</h1>
      {isLoading && <Skeleton className="h-24" />}
      {data?.length === 0 && <p className="text-muted-foreground">No orders yet. <Link to="/restaurants" className="text-primary">Order something</Link></p>}
      <div className="space-y-3">
        {data?.map((o) => (
          <Link key={o.id} to="/orders/$id" params={{ id: o.id }} className="flex items-center justify-between rounded-2xl border bg-card p-4 shadow-soft hover:shadow-lift">
            <div>
              <p className="font-bold">{o.restaurants?.name} · #{o.order_no}</p>
              <p className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleString("en-IN")}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">{inr(o.total)}</p>
              <p className="text-sm text-primary">{STATUS_LABEL[o.status]}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
