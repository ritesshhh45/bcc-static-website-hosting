import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery } from "@/lib/queries";
import { RestaurantCard } from "@/components/food/RestaurantCard";
import { Skeleton } from "@/components/food/bits";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  q: z.string().optional(),
  cuisine: z.string().optional(),
  veg: z.boolean().optional(),
  rating: z.boolean().optional(),
  fast: z.boolean().optional(),
  budget: z.boolean().optional(),
  sort: z.enum(["rating", "eta", "cost_asc", "cost_desc"]).optional(),
});

export const Route = createFileRoute("/restaurants/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Restaurants near you — FoodieX" },
      { name: "description", content: "Browse Chhatrapati Sambhajinagar restaurants by cuisine, rating, delivery time and price." },
      { property: "og:title", content: "Restaurants near you — FoodieX" },
      { property: "og:description", content: "Filter by veg, rating, delivery time and price." },
    ],
  }),
  component: Listing,
});

// Cafes are shown on their own /cafes page, not in the restaurants list
const isCafe = (r: unknown) => Boolean((r as { is_cafe?: boolean | null }).is_cafe);

const listQuery = {
  queryKey: ["restaurants-with-menu"],
  queryFn: async () => {
    const { data, error } = await supabase.from("restaurants").select("*, menu_items(name, is_veg)").eq("is_approved", true).eq("is_blocked", false);
    if (error) throw error;
    return data;
  },
};

function Listing() {
  const s = Route.useSearch();
  const navigate = Route.useNavigate();
  const set = (patch: Partial<typeof s>) => navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });
  const { data, isLoading } = useQuery(listQuery);
  const { data: cats } = useQuery(categoriesQuery);

  let list = (data ?? []).filter((r) => !isCafe(r));
  const q = s.q?.toLowerCase().trim();
  if (q) list = list.filter((r) => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q) || r.menu_items.some((m) => m.name.toLowerCase().includes(q)));
  if (s.cuisine) list = list.filter((r) => r.cuisine === s.cuisine);
  if (s.veg) list = list.filter((r) => r.menu_items.length > 0 && r.menu_items.every((m) => m.is_veg));
  if (s.rating) list = list.filter((r) => r.avg_rating >= 4.5);
  if (s.fast) list = list.filter((r) => r.eta_minutes <= 25);
  if (s.budget) list = list.filter((r) => r.cost_for_two <= 300);
  const sort = s.sort ?? "rating";
  list = [...list].sort((a, b) =>
    sort === "eta" ? a.eta_minutes - b.eta_minutes : sort === "cost_asc" ? a.cost_for_two - b.cost_for_two : sort === "cost_desc" ? b.cost_for_two - a.cost_for_two : b.avg_rating - a.avg_rating,
  );

  const chip = (on: boolean) => cn("whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition", on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-extrabold md:text-4xl">
        {s.cuisine ? `${s.cuisine} near you` : "All restaurants"}
      </motion.h1>
      <div className="mt-5 flex items-center gap-2 rounded-2xl border bg-card p-2 shadow-soft">
        <Search className="ml-2 size-5 text-muted-foreground" />
        <input defaultValue={s.q} onChange={(e) => set({ q: e.target.value || undefined })} placeholder="Search restaurants or dishes" className="h-10 flex-1 bg-transparent outline-none" />
      </div>
      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2">
        <button className={chip(!s.cuisine)} onClick={() => set({ cuisine: undefined })}>All</button>
        {cats?.map((c) => <button key={c.id} className={chip(s.cuisine === c.name)} onClick={() => set({ cuisine: s.cuisine === c.name ? undefined : c.name })}>{c.name}</button>)}
        <Link to="/cafes" className={chip(false)}>☕ Cafes</Link>
      </div>
      <div className="-mx-4 mt-2 flex items-center gap-2 overflow-x-auto px-4 pb-2">
        <SlidersHorizontal className="size-4 shrink-0 text-muted-foreground" />
        <button className={chip(!!s.veg)} onClick={() => set({ veg: !s.veg || undefined })}>Pure veg</button>
        <button className={chip(!!s.rating)} onClick={() => set({ rating: !s.rating || undefined })}>Rating 4.5+</button>
        <button className={chip(!!s.fast)} onClick={() => set({ fast: !s.fast || undefined })}>Under 25 min</button>
        <button className={chip(!!s.budget)} onClick={() => set({ budget: !s.budget || undefined })}>Under ₹300 for two</button>
        <select value={sort} onChange={(e) => set({ sort: e.target.value as typeof s.sort })} className="h-10 rounded-full border bg-card px-3 text-sm font-semibold">
          <option value="rating">Sort: Rating</option>
          <option value="eta">Sort: Delivery time</option>
          <option value="cost_asc">Sort: Cost low → high</option>
          <option value="cost_desc">Sort: Cost high → low</option>
        </select>
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
        {list.map((r, i) => <RestaurantCard key={r.id} r={r} index={i} />)}
      </div>
      {!isLoading && list.length === 0 && <p className="py-20 text-center text-muted-foreground">No restaurants match these filters.</p>}
    </div>
  );
}