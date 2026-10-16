import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Clock, Tag } from "lucide-react";
import { inr } from "@/lib/bill";
import { RatingPill } from "./bits";

export type Restaurant = {
  id: string; name: string; cuisine: string; description: string | null; image_url: string | null;
  address: string; eta_minutes: number; cost_for_two: number; offer_text: string | null; avg_rating: number;
};

export function RestaurantCard({ r, index = 0 }: { r: Restaurant; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: (index % 8) * 0.06, duration: 0.45 }}
      whileHover={{ y: -6 }}
    >
      <Link to="/restaurants/$id" params={{ id: r.id }} className="group block overflow-hidden rounded-2xl border bg-card shadow-soft transition-shadow hover:shadow-lift">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img src={r.image_url ?? ""} alt={r.name} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-110" />
          {r.offer_text && (
            <span className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 bg-gradient-to-t from-foreground/85 to-transparent px-3 pb-2 pt-8 text-sm font-extrabold text-background">
              <Tag className="size-4" /> {r.offer_text}
            </span>
          )}
        </div>
        <div className="space-y-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-lg font-bold">{r.name}</h3>
            <RatingPill value={r.avg_rating} />
          </div>
          <p className="truncate text-sm text-muted-foreground">{r.cuisine} · {r.address}</p>
          <div className="flex items-center gap-3 pt-1 text-sm font-medium">
            <span className="flex items-center gap-1"><Clock className="size-4 text-primary" />{r.eta_minutes}–{r.eta_minutes + 10} min</span>
            <span className="text-muted-foreground">{inr(r.cost_for_two)} for two</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
