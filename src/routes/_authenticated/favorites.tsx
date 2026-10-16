import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RestaurantCard, type Restaurant } from "@/components/food/RestaurantCard";

export const Route = createFileRoute("/_authenticated/favorites")({
  head: () => ({ meta: [{ title: "Favourites — FoodieX" }, { name: "description", content: "Your favourite restaurants." }, { property: "og:title", content: "Favourites — FoodieX" }, { property: "og:description", content: "Your favourite restaurants." }] }),
  component: Favs,
});

function Favs() {
  const { data } = useQuery({ queryKey: ["favorites"], queryFn: async () => (await supabase.from("favorites").select("restaurants(*)")).data ?? [] });
  const list = (data ?? []).map((f) => f.restaurants).filter(Boolean) as Restaurant[];
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-extrabold">Favourites</h1>
      {list.length === 0 && <p className="text-muted-foreground">Tap the heart on a restaurant to save it here.</p>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{list.map((r, i) => <RestaurantCard key={r.id} r={r} index={i} />)}</div>
    </div>
  );
}
