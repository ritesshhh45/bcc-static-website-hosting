import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const restaurantsQuery = queryOptions({
  queryKey: ["restaurants"],
  queryFn: async () => {
    const { data, error } = await supabase.from("restaurants").select("*").eq("is_approved", true).eq("is_blocked", false).order("avg_rating", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("*").order("sort_order");
    if (error) throw error;
    return data;
  },
});

export const bestSellersQuery = queryOptions({
  queryKey: ["best-sellers"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*, restaurants(id, name)")
      .order("rating", { ascending: false })
      .limit(12);
    if (error) throw error;
    return data;
  },
});

export const restaurantQuery = (id: string) =>
  queryOptions({
    queryKey: ["restaurant", id],
    queryFn: async () => {
      const [r, m] = await Promise.all([
        supabase.from("restaurants").select("*").eq("id", id).maybeSingle(),
        supabase.from("menu_items").select("*, categories(name)").eq("restaurant_id", id).order("rating", { ascending: false }),
      ]);
      if (r.error) throw r.error;
      if (m.error) throw m.error;
      return { restaurant: r.data, menu: m.data };
    },
  });

export const STATUS_STEPS = ["placed", "accepted", "preparing", "out_for_delivery", "delivered"] as const;
export const STATUS_LABEL: Record<string, string> = {
  placed: "Order placed", accepted: "Accepted", preparing: "Preparing", out_for_delivery: "Out for delivery",
  delivered: "Delivered", rejected: "Rejected", cancelled: "Cancelled",
};
