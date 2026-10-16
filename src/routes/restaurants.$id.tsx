import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock, Heart, MapPin, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { restaurantQuery } from "@/lib/queries";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { inr } from "@/lib/bill";
import { AddButton, flyToCart, RatingPill, Skeleton, VegIcon } from "@/components/food/bits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/restaurants/$id")({
  head: () => ({
    meta: [
      { title: "Restaurant menu — FoodieX" },
      { name: "description", content: "See the full menu, prices and ratings, and order online." },
      { property: "og:title", content: "Restaurant menu — FoodieX" },
      { property: "og:description", content: "See the full menu and order online with FoodieX." },
    ],
  }),
  component: RestaurantPage,
});

function RestaurantPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery(restaurantQuery(id));
  const cart = useCart();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [vegOnly, setVegOnly] = useState(false);

  const fav = useQuery({
    queryKey: ["fav", id, user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("favorites").select("restaurant_id").eq("restaurant_id", id).maybeSingle()).data,
  });
  const reviews = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => (await supabase.from("reviews").select("*").eq("restaurant_id", id).order("created_at", { ascending: false }).limit(10)).data ?? [],
  });

  const toggleFav = async () => {
    if (!user) { toast.info("Sign in to save favourites"); return; }
    if (fav.data) await supabase.from("favorites").delete().eq("restaurant_id", id).eq("user_id", user.id);
    else await supabase.from("favorites").insert({ restaurant_id: id, user_id: user.id });
    qc.invalidateQueries({ queryKey: ["fav"] });
    toast.success(fav.data ? "Removed from favourites" : "Added to favourites");
  };

  if (isLoading) return <div className="mx-auto max-w-5xl space-y-4 px-4 py-8"><Skeleton className="h-56" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>;
  if (!data?.restaurant) return <div className="py-24 text-center">Restaurant not found. <Link to="/restaurants" className="text-primary">Browse all</Link></div>;
  const r = data.restaurant;

  const menu = data.menu.filter((m) => !vegOnly || m.is_veg);
  const groups = menu.reduce<Record<string, typeof menu>>((acc, m) => {
    const k = m.categories?.name ?? "Menu";
    (acc[k] ||= []).push(m);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl shadow-lift">
        <img src={r.image_url ?? ""} alt={r.name} className="h-56 w-full object-cover md:h-72" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-6 text-background">
          <div>
            <h1 className="text-3xl font-extrabold md:text-5xl">{r.name}</h1>
            <p className="opacity-90">{r.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-medium">
              <RatingPill value={r.avg_rating} />
              <span className="flex items-center gap-1"><Clock className="size-4" />{r.eta_minutes}–{r.eta_minutes + 10} min</span>
              <span className="flex items-center gap-1"><MapPin className="size-4" />{r.address}</span>
              <span>{inr(r.cost_for_two)} for two</span>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.8 }} onClick={toggleFav} aria-label="Favourite" className="grid size-12 shrink-0 place-items-center rounded-full bg-background/20 backdrop-blur">
            <Heart className={cn("size-6", fav.data && "fill-primary text-primary")} />
          </motion.button>
        </div>
      </motion.div>

      {r.offer_text && <div className="mt-4 rounded-2xl border border-dashed border-primary bg-secondary px-4 py-3 text-sm font-bold text-secondary-foreground">🎉 {r.offer_text} · Use code WELCOME50 at checkout</div>}

      <label className="mt-6 flex w-fit cursor-pointer items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-semibold">
        <input type="checkbox" checked={vegOnly} onChange={(e) => setVegOnly(e.target.checked)} className="accent-[var(--veg)]" /> <VegIcon veg /> Veg only
      </label>

      {Object.entries(groups).map(([cat, items]) => (
        <section key={cat} className="mt-8">
          <h2 className="mb-3 text-2xl font-extrabold">{cat} <span className="text-base font-medium text-muted-foreground">({items.length})</span></h2>
          <div className="divide-y rounded-3xl border bg-card">
            {items.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className="flex gap-4 p-4 md:p-5">
                <div className="min-w-0 flex-1 space-y-1">
                  <VegIcon veg={m.is_veg} />
                  <h3 className="text-lg font-bold">{m.name}</h3>
                  <p className="font-semibold">{inr(m.price)}</p>
                  <p className="flex items-center gap-1 text-sm font-semibold text-success"><Star className="size-3.5 fill-current" />{Number(m.rating).toFixed(1)}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{m.description}</p>
                </div>
                <div className="relative flex shrink-0 flex-col items-center">
                  <img src={m.image_url ?? ""} alt={m.name} loading="lazy" className={cn("size-28 rounded-2xl object-cover md:size-36", !m.is_available && "grayscale")} />
                  <div className="-mt-5">
                    <AddButton
                      disabled={!m.is_available}
                      qty={cart.restaurant_id === r.id ? cart.qtyOf(m.id) : 0}
                      onAdd={(e) => {
                        flyToCart(e, m.image_url);
                        cart.add({ id: r.id, name: r.name }, { menu_item_id: m.id, name: m.name, price: Number(m.price), is_veg: m.is_veg, image_url: m.image_url });
                      }}
                      onChange={(n) => cart.setQty(m.id, n)}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-10">
        <h2 className="mb-3 text-2xl font-extrabold">Reviews</h2>
        {reviews.data?.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {reviews.data.map((rv) => (
              <div key={rv.id} className="rounded-2xl border bg-card p-4">
                <RatingPill value={rv.rating} />
                <p className="mt-2 text-sm">{rv.comment || "No comment"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(rv.created_at).toLocaleDateString("en-IN")}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-muted-foreground">No reviews yet — be the first after your order!</p>}
      </section>

      {cart.count > 0 && cart.restaurant_id === r.id && (
        <motion.button initial={{ y: 80 }} animate={{ y: 0 }} onClick={() => cart.setOpen(true)} className="fixed bottom-4 left-1/2 z-30 flex w-[92%] max-w-md -translate-x-1/2 items-center justify-between rounded-2xl bg-success px-5 py-4 font-bold text-success-foreground shadow-lift">
          <span>{cart.count} item{cart.count > 1 ? "s" : ""} · {inr(cart.subtotal)}</span><span>View cart →</span>
        </motion.button>
      )}
    </div>
  );
}
