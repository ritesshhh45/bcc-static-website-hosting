import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RestaurantCard } from "@/components/food/RestaurantCard";
import { Skeleton } from "@/components/food/bits";

export const Route = createFileRoute("/cafes")({
  head: () => ({
    meta: [
      { title: "Cafes in Chhatrapati Sambhajinagar — FoodieX" },
      { name: "description", content: "Order coffee, shakes, pasta, pizza and desserts from the best cafes in Chhatrapati Sambhajinagar." },
      { property: "og:title", content: "Cafes in Chhatrapati Sambhajinagar — FoodieX" },
      { property: "og:description", content: "Order from your favourite cafes with live tracking." },
    ],
  }),
  component: Cafes,
});

const isCafe = (r: unknown) => Boolean((r as { is_cafe?: boolean | null }).is_cafe);

const cafesQuery = {
  queryKey: ["cafes-with-menu"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*, menu_items(name, is_veg)")
      .eq("is_approved", true)
      .eq("is_blocked", false)
      .order("avg_rating", { ascending: false });
    if (error) throw error;
    return data;
  },
};

function Cafes() {
  const { data, isLoading } = useQuery(cafesQuery);
  const [q, setQ] = useState("");

  let list = (data ?? []).filter((r) => isCafe(r));
  const term = q.toLowerCase().trim();
  if (term) list = list.filter((r) => r.name.toLowerCase().includes(term) || r.menu_items.some((m) => m.name.toLowerCase().includes(term)));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-extrabold md:text-4xl">
        Cafes in Chhatrapati Sambhajinagar
      </motion.h1>
      <p className="mt-1 text-muted-foreground">Coffee, shakes, pasta, pizza and desserts from your favourite hangouts.</p>

      <div className="mt-5 flex items-center gap-2 rounded-2xl border bg-card p-2 shadow-soft">
        <Search className="ml-2 size-5 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cafes or dishes" className="h-10 flex-1 bg-transparent outline-none" />
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
        {list.map((r, i) => <RestaurantCard key={r.id} r={r} index={i} />)}
      </div>

      {!isLoading && list.length === 0 && (
        <p className="py-20 text-center text-muted-foreground">No cafes found.</p>
      )}
    </div>
  );
}